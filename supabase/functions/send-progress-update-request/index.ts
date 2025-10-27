import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProgressUpdateRequest {
  swimmerId: string;
  swimmerName: string;
  currentLevel: string;
  progressNotes: string;
  coordinatorEmail: string | null;
  coordinatorName: string | null;
  currentPosNumber: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      swimmerId,
      swimmerName,
      currentLevel,
      progressNotes,
      coordinatorEmail,
      coordinatorName,
      currentPosNumber,
    }: ProgressUpdateRequest = await req.json();

    console.log("Sending progress update request for:", swimmerName);

    if (!coordinatorEmail) {
      throw new Error("Coordinator email is required");
    }

    // Send email to VMRC coordinator
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .swimmer-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; color: #4b5563; }
            .progress-notes { background: #fff; border-left: 4px solid #0EA5E9; padding: 15px; margin: 20px 0; white-space: pre-wrap; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🏊 Progress Update Request</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">I CAN SWIM - VMRC Client</p>
            </div>
            
            <div class="content">
              <p>Dear ${coordinatorName || "VMRC Coordinator"},</p>
              
              <p>An instructor has submitted a progress update request for one of your VMRC clients who has completed their authorized sessions.</p>
              
              <div class="swimmer-info">
                <h3 style="margin-top: 0; color: #0EA5E9;">Swimmer Information</h3>
                <div class="info-row">
                  <span class="label">Name:</span>
                  <span>${swimmerName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Current Level:</span>
                  <span>${currentLevel}</span>
                </div>
                <div class="info-row">
                  <span class="label">Current POS:</span>
                  <span>${currentPosNumber || "N/A"}</span>
                </div>
                <div class="info-row">
                  <span class="label">Sessions Completed:</span>
                  <span>12 / 12</span>
                </div>
              </div>
              
              <div class="alert">
                <strong>⚠️ Action Required:</strong> This swimmer has used all 12 authorized sessions and needs a new POS authorization to continue lessons.
              </div>
              
              <h3 style="color: #0EA5E9;">Progress Summary from Instructor</h3>
              <div class="progress-notes">${progressNotes}</div>
              
              <p style="margin-top: 30px;">
                <strong>Next Steps:</strong>
              </p>
              <ol>
                <li>Review the progress notes above</li>
                <li>Process a new POS authorization for the next 12 sessions</li>
                <li>Contact the swim program to provide the new POS number</li>
              </ol>
              
              <p style="margin-top: 30px;">If you have any questions or need additional information, please contact the swim program directly.</p>
              
              <p style="margin-top: 30px;">Thank you for your continued support!</p>
              
              <p style="margin-top: 20px;">
                Best regards,<br>
                <strong>I CAN SWIM Team</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from the I CAN SWIM management system.</p>
              <p>Swimmer ID: ${swimmerId}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "I CAN SWIM <onboarding@resend.dev>",
        to: [coordinatorEmail],
        subject: `Progress Update Request - ${swimmerName} (12 Sessions Completed)`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Progress update request sent successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in send-progress-update-request:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "An unexpected error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
