import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyCoordinatorRequest {
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

    const { assessmentId, swimmerId, scheduledDate }: NotifyCoordinatorRequest =
      await req.json();

    console.log("Notifying coordinator for assessment:", assessmentId);

    // Fetch swimmer and coordinator details
    const { data: swimmer, error: swimmerError } = await supabaseClient
      .from("swimmers")
      .select("first_name, last_name, vmrc_coordinator_name, vmrc_coordinator_email, enrollment_status, payment_type")
      .eq("id", swimmerId)
      .single();

    if (swimmerError || !swimmer) {
      console.error("Error fetching swimmer:", swimmerError);
      throw new Error("Swimmer not found");
    }

    // Check if this requires coordinator approval
    const requiresApproval =
      swimmer.payment_type === "vmrc" || swimmer.enrollment_status === "waitlist";

    if (!requiresApproval) {
      console.log("Assessment does not require coordinator approval");
      return new Response(
        JSON.stringify({ message: "No approval required" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!swimmer.vmrc_coordinator_email) {
      console.error("No coordinator email found for swimmer");
      throw new Error("Coordinator email not configured");
    }

    // Generate approval/rejection links
    const baseUrl = Deno.env.get("SUPABASE_URL");
    const approveUrl = `${baseUrl}/functions/v1/handle-assessment-approval?action=approve&assessmentId=${assessmentId}`;
    const rejectUrl = `${baseUrl}/functions/v1/handle-assessment-approval?action=reject&assessmentId=${assessmentId}`;

    const formattedDate = new Date(scheduledDate).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send email to coordinator
    const emailResponse = await resend.emails.send({
      from: "Swim Lessons <onboarding@resend.dev>",
      to: [swimmer.vmrc_coordinator_email],
      subject: `Initial Assessment Approval Needed - ${swimmer.first_name} ${swimmer.last_name}`,
      html: `
        <h2>Initial Assessment Booking Requires Your Approval</h2>
        <p>Dear ${swimmer.vmrc_coordinator_name || "Coordinator"},</p>
        
        <p>An initial assessment has been requested for:</p>
        <ul>
          <li><strong>Student:</strong> ${swimmer.first_name} ${swimmer.last_name}</li>
          <li><strong>Scheduled Date:</strong> ${formattedDate}</li>
          <li><strong>Status:</strong> ${swimmer.payment_type === "vmrc" ? "VMRC Client" : "Waitlisted"}</li>
        </ul>
        
        <p><strong>Please respond within 24 hours</strong> or this booking will be automatically cancelled.</p>
        
        <div style="margin: 30px 0;">
          <a href="${approveUrl}" 
             style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            ✓ Approve Assessment
          </a>
          <a href="${rejectUrl}" 
             style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ✗ Reject Assessment
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you have questions, please contact us at your earliest convenience.
        </p>
        
        <p>Thank you,<br>Swim Lessons Team</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-coordinator-assessment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
