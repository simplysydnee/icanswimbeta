import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  parentEmail: string;
  invitationLink: string;
  swimmers: Array<{ first_name: string; last_name: string }>;
  customMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { parentEmail, invitationLink, swimmers, customMessage }: InvitationRequest = await req.json();

    console.log("Sending parent invitation to:", parentEmail);

    const swimmerList = swimmers.map((s) => `${s.first_name} ${s.last_name}`).join(", ");

    const emailResponse = await resend.emails.send({
      from: "I CAN SWIM <onboarding@resend.dev>",
      to: [parentEmail],
      subject: "Welcome to I CAN SWIM - Create Your Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0ea5e9; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🏊 Welcome to I CAN SWIM!</h2>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
            <p>Hello,</p>
            
            <p>Your swimmer(s) have been enrolled in I CAN SWIM adaptive swim lessons! We're excited to begin this journey with your family.</p>
            
            ${customMessage ? `
              <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
                <p style="margin: 0; color: #0c4a6e; font-style: italic;">${customMessage}</p>
              </div>
            ` : ''}
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Your Enrolled Swimmer(s)</h3>
              <p style="margin: 5px 0;"><strong>${swimmerList}</strong></p>
            </div>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Get Started in 3 Easy Steps:</h3>
              <ol style="color: #1e40af; line-height: 1.8; margin: 0;">
                <li>Click the button below to create your account</li>
                <li>Set up your password and complete your profile</li>
                <li>Access your dashboard to view progress and book sessions</li>
              </ol>
            </div>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${invitationLink}" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Create My Account
              </a>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⏰ Important:</strong> This invitation link expires in 30 days and can only be used once. Please create your account as soon as possible.
              </p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h4 style="margin-top: 0; color: #1f2937;">What You'll Be Able to Do:</h4>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>📊 Track your swimmer's progress and achievements</li>
                <li>📅 Book and manage swim sessions</li>
                <li>📹 View progress videos and instructor feedback</li>
                <li>💬 Communicate with instructors</li>
                <li>📝 Complete assessments and enrollment forms</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you have any questions or need assistance, please don't hesitate to reach out. We're here to help!
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Best regards,<br>
              The I CAN SWIM Team
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <span style="color: #0ea5e9; word-break: break-all;">${invitationLink}</span>
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Parent invitation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation email sent successfully",
        emailId: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-parent-invitation:", error);
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
