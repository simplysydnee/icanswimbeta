import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://esm.sh/zod@3.22.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Validation schema
const approvalParamsSchema = z.object({
  action: z.enum(["approve", "reject"]),
  assessmentId: z.string().uuid(),
  token: z.string().min(32),
});

// HMAC token generation and validation
async function generateToken(assessmentId: string, action: string): Promise<string> {
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

async function validateToken(assessmentId: string, action: string, token: string): Promise<boolean> {
  const expectedToken = await generateToken(assessmentId, action);
  return token === expectedToken;
}

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const assessmentId = url.searchParams.get("assessmentId");
    const token = url.searchParams.get("token");

    // Validate input parameters
    const params = approvalParamsSchema.safeParse({ action, assessmentId, token });
    
    if (!params.success) {
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1>Invalid Request</h1>
          <p>The approval link is invalid or has been tampered with.</p>
        </body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    const { action: validAction, assessmentId: validAssessmentId, token: validToken } = params.data;

    // Validate token
    const isValidToken = await validateToken(validAssessmentId, validAction, validToken);
    if (!isValidToken) {
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1>Invalid Token</h1>
          <p>The approval link is invalid or has expired. Please request a new approval link.</p>
        </body></html>`,
        { status: 403, headers: { "Content-Type": "text/html" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log(`Processing ${validAction} for assessment ${validAssessmentId}`);

    // Fetch assessment with swimmer details
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from("assessments")
      .select(`
        *,
        swimmers (
          first_name,
          last_name,
          parent_id
        )
      `)
      .eq("id", validAssessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.error("Error fetching assessment:", assessmentError);
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1>Error</h1>
          <p>Assessment not found.</p>
        </body></html>`,
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    // Check if assessment is still pending
    if (assessment.approval_status !== "pending") {
      const statusMessage = assessment.approval_status === "approved" 
        ? "This assessment has already been approved." 
        : "This assessment is no longer pending approval.";
      
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #6b7280;">Already Processed</h1>
          <p>${statusMessage}</p>
        </body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    // Get parent email
    const { data: parentProfile } = await supabaseClient
      .from("profiles")
      .select("email, full_name")
      .eq("id", assessment.swimmers.parent_id)
      .single();

    const swimmer = assessment.swimmers;
    const newStatus = validAction === "approve" ? "approved" : "rejected";

    // Update assessment status
    const { error: updateError } = await supabaseClient
      .from("assessments")
      .update({
        approval_status: newStatus,
        approved_by: `Coordinator via email at ${new Date().toISOString()}`,
        status: validAction === "approve" ? "scheduled" : "cancelled",
      })
      .eq("id", validAssessmentId);

    if (updateError) {
      console.error("Error updating assessment:", updateError);
      throw new Error("Failed to update assessment status");
    }

    // Send confirmation email to parent
    if (parentProfile?.email) {
      const formattedDate = new Date(assessment.scheduled_date).toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const emailSubject = validAction === "approve" 
        ? `✓ Assessment Confirmed - ${swimmer.first_name} ${swimmer.last_name}`
        : `Assessment Cancelled - ${swimmer.first_name} ${swimmer.last_name}`;

      const emailContent = validAction === "approve"
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">✓ Assessment Confirmed!</h2>
            </div>
            
            <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p>Good news! Your child's initial assessment has been approved by the coordinator.</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">Assessment Details</h3>
                <p><strong>Swimmer:</strong> ${swimmer.first_name} ${swimmer.last_name}</p>
                <p><strong>Date & Time:</strong> ${formattedDate}</p>
              </div>
              
              <p>Please arrive 10 minutes early for check-in.</p>
            </div>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">Assessment Not Approved</h2>
            </div>
            
            <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p>Unfortunately, your child's initial assessment scheduled for <strong>${formattedDate}</strong> could not be approved at this time.</p>
              
              <p>Please contact your coordinator to discuss alternative arrangements.</p>
            </div>
          </div>
        `;

      await resend.emails.send({
        from: "Swim School <onboarding@resend.dev>",
        to: [parentProfile.email],
        subject: emailSubject,
        html: emailContent,
      });

      console.log("Confirmation email sent to parent");
    }

    const successMessage = validAction === "approve" 
      ? "The assessment has been approved and the parent has been notified."
      : "The assessment has been rejected and the parent has been notified.";

    const successColor = validAction === "approve" ? "#10b981" : "#ef4444";

    return new Response(
      `<html>
        <head>
          <title>Assessment ${validAction === "approve" ? "Approved" : "Rejected"}</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center; background-color: #f9fafb;">
          <div style="max-width: 500px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="width: 80px; height: 80px; background-color: ${successColor}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 40px; color: white;">
              ${validAction === "approve" ? "✓" : "✗"}
            </div>
            <h1 style="color: ${successColor}; margin-bottom: 20px;">
              ${validAction === "approve" ? "Assessment Approved!" : "Assessment Rejected"}
            </h1>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              ${successMessage}
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
              You can now close this window.
            </p>
          </div>
        </body>
      </html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error: any) {
    console.error("Error in handle-assessment-approval:", error);
    return new Response(
      `<html><body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
        <h1>Error</h1>
        <p>An error occurred while processing your request.</p>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
};

serve(handler);