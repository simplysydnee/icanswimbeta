import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Running auto-cancel job for pending assessments");

    const now = new Date().toISOString();

    // Find all pending assessments that have passed their deadline
    const { data: expiredAssessments, error: fetchError } = await supabaseClient
      .from("assessments")
      .select(`
        *,
        swimmers (
          first_name,
          last_name,
          parent_id
        )
      `)
      .eq("approval_status", "pending")
      .lt("approval_deadline", now);

    if (fetchError) {
      console.error("Error fetching expired assessments:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredAssessments?.length || 0} expired assessments`);

    if (!expiredAssessments || expiredAssessments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, cancelledCount: 0, message: "No expired assessments found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let cancelledCount = 0;
    let emailsSent = 0;

    // Cancel each expired assessment
    for (const assessment of expiredAssessments) {
      const { error: updateError } = await supabaseClient
        .from("assessments")
        .update({
          approval_status: "cancelled",
          status: "cancelled",
          approval_notes: "Automatically cancelled - approval deadline exceeded (24 hours)",
        })
        .eq("id", assessment.id);

      if (updateError) {
        console.error(`Error cancelling assessment ${assessment.id}:`, updateError);
        continue;
      }

      cancelledCount++;

      // Send cancellation email to parent
      const swimmer = assessment.swimmers;
      
      // Fetch parent profile separately
      const { data: parentProfile } = await supabaseClient
        .from("profiles")
        .select("email, full_name")
        .eq("id", swimmer?.parent_id)
        .single();

      const parentEmail = parentProfile?.email;

      if (parentEmail) {
        try {
          const formattedDate = new Date(assessment.scheduled_date).toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          await resend.emails.send({
            from: "Swim School <onboarding@resend.dev>",
            to: [parentEmail],
            subject: `Assessment Cancelled - ${swimmer.first_name} ${swimmer.last_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h2 style="margin: 0;">⏰ Assessment Automatically Cancelled</h2>
                </div>
                
                <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
                  <p>We're writing to inform you that the initial assessment for <strong>${swimmer.first_name} ${swimmer.last_name}</strong> has been automatically cancelled.</p>
                  
                  <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Scheduled Date:</strong> ${formattedDate}</p>
                    <p><strong>Reason:</strong> The 24-hour approval deadline was not met</p>
                  </div>
                  
                  <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <p style="margin: 0; color: #92400e;">
                      This assessment required coordinator approval within 24 hours. Since approval was not received in time, the booking has been cancelled automatically.
                    </p>
                  </div>
                  
                  <p>If you would still like to schedule an assessment, please:</p>
                  <ul style="color: #4b5563; line-height: 1.8;">
                    <li>Contact your coordinator to ensure approval can be granted</li>
                    <li>Book a new assessment appointment</li>
                  </ul>
                  
                  <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">We apologize for any inconvenience. If you have questions, please don't hesitate to reach out.</p>
                </div>
              </div>
            `,
          });

          emailsSent++;
          console.log(`Cancellation email sent to ${parentEmail}`);
        } catch (emailError) {
          console.error(`Error sending cancellation email for assessment ${assessment.id}:`, emailError);
        }
      }
    }

    console.log(`Auto-cancel job completed: ${cancelledCount} assessments cancelled, ${emailsSent} emails sent`);

    return new Response(
      JSON.stringify({
        success: true,
        cancelledCount,
        emailsSent,
        message: `Successfully cancelled ${cancelledCount} expired assessments`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in auto-cancel-pending-assessments:", error);
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
