import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

// Generate secure token for approval links
async function generateSecureToken(assessmentId: string, action: string): Promise<string> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const message = `${assessmentId}:${action}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AssessmentApprovalRequest {
  assessmentId: string;
  swimmerId: string;
  scheduledDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { assessmentId, swimmerId, scheduledDate }: AssessmentApprovalRequest = await req.json();

    console.log("Processing approval request for assessment:", assessmentId);

    // Fetch swimmer and parent details
    const { data: swimmer, error: swimmerError } = await supabaseClient
      .from("swimmers")
      .select(`
        *,
        profiles:parent_id (
          full_name,
          email,
          phone
        )
      `)
      .eq("id", swimmerId)
      .single();

    if (swimmerError || !swimmer) {
      console.error("Error fetching swimmer:", swimmerError);
      throw new Error("Swimmer not found");
    }

    // Check if this is a VMRC client or waitlisted
    const requiresApproval = swimmer.payment_type === "vmrc" || swimmer.enrollment_status === "waitlist";

    if (!requiresApproval) {
      console.log("Assessment does not require approval");
      return new Response(
        JSON.stringify({ success: true, requiresApproval: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Set approval deadline to 24 hours from now
    const approvalDeadline = new Date();
    approvalDeadline.setHours(approvalDeadline.getHours() + 24);

    // Update assessment status to pending
    const { error: updateError } = await supabaseClient
      .from("assessments")
      .update({
        approval_status: "pending",
        approval_deadline: approvalDeadline.toISOString(),
      })
      .eq("id", assessmentId);

    if (updateError) {
      console.error("Error updating assessment:", updateError);
      throw new Error("Failed to update assessment status");
    }

    // Determine coordinator email
    let coordinatorEmail = swimmer.vmrc_coordinator_email;
    let coordinatorName = swimmer.vmrc_coordinator_name || "Coordinator";
    let emailSubject = "";
    let clientType = "";

    if (swimmer.payment_type === "vmrc") {
      if (!coordinatorEmail) {
        throw new Error("VMRC coordinator email not found for swimmer");
      }
      clientType = "VMRC";
      emailSubject = `VMRC Assessment Approval Required - ${swimmer.first_name} ${swimmer.last_name}`;
    } else {
      // For waitlisted clients, send to admin/default coordinator
      coordinatorEmail = "coordinator@swimschool.com"; // TODO: Replace with actual admin email
      clientType = "Waitlisted";
      emailSubject = `Waitlist Assessment Approval Required - ${swimmer.first_name} ${swimmer.last_name}`;
    }

    const formattedDate = new Date(scheduledDate).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Generate secure tokens for approval URLs
    const approveToken = await generateSecureToken(assessmentId, "approve");
    const rejectToken = await generateSecureToken(assessmentId, "reject");
    
    const approvalUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-assessment-approval?action=approve&assessmentId=${assessmentId}&token=${approveToken}`;
    const rejectionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-assessment-approval?action=reject&assessmentId=${assessmentId}&token=${rejectToken}`;

    // Send email to coordinator
    const emailResponse = await resend.emails.send({
      from: "Swim School <onboarding@resend.dev>",
      to: [coordinatorEmail],
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Assessment Approval Required</h2>
          
          <p>Hello ${coordinatorName},</p>
          
          <p>A new initial assessment has been booked for a ${clientType} client and requires your approval within 24 hours.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Assessment Details</h3>
            <p><strong>Swimmer:</strong> ${swimmer.first_name} ${swimmer.last_name}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Parent:</strong> ${swimmer.profiles?.full_name || 'N/A'}</p>
            <p><strong>Parent Email:</strong> ${swimmer.profiles?.email || 'N/A'}</p>
            <p><strong>Parent Phone:</strong> ${swimmer.profiles?.phone || 'N/A'}</p>
            ${swimmer.payment_type === "vmrc" ? `<p><strong>PO Number:</strong> ${swimmer.vmrc_current_pos_number || 'Pending'}</p>` : ''}
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>⏰ Action Required:</strong> Please approve or cancel this assessment within 24 hours. If no action is taken, the booking will be automatically cancelled.</p>
            <p style="margin: 10px 0 0 0; color: #92400e;"><strong>Deadline:</strong> ${approvalDeadline.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}</p>
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${approvalUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">✓ Approve Assessment</a>
            <a href="${rejectionUrl}" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">✗ Reject Assessment</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you have any questions, please contact us directly.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            This is an automated message from your Swim School management system.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        requiresApproval: true,
        approvalDeadline: approvalDeadline.toISOString(),
        emailId: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-assessment-approval-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
