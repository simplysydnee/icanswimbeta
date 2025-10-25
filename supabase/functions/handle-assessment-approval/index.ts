import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const assessmentId = url.searchParams.get("assessmentId");

    if (!action || !assessmentId) {
      throw new Error("Missing required parameters");
    }

    if (action !== "approve" && action !== "reject") {
      throw new Error("Invalid action");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log(`${action === "approve" ? "Approving" : "Rejecting"} assessment:`, assessmentId);

    // Get assessment details
    const { data: assessment, error: fetchError } = await supabaseClient
      .from("assessments")
      .select("*, swimmers(first_name, last_name, vmrc_coordinator_name)")
      .eq("id", assessmentId)
      .single();

    if (fetchError || !assessment) {
      console.error("Assessment not found:", fetchError);
      throw new Error("Assessment not found");
    }

    // Check if already processed
    if (assessment.approval_status !== "pending") {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Already Processed</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              .warning { color: #f59e0b; font-size: 18px; }
            </style>
          </head>
          <body>
            <h1 class="warning">⚠️ Already Processed</h1>
            <p>This assessment has already been ${assessment.approval_status}.</p>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: { "Content-Type": "text/html", ...corsHeaders },
        }
      );
    }

    // Update assessment status
    const newStatus = action === "approve" ? "approved" : "rejected";
    const { error: updateError } = await supabaseClient
      .from("assessments")
      .update({
        approval_status: newStatus,
        approved_by: assessment.swimmers?.vmrc_coordinator_name || "Coordinator",
        approval_notes: `${action === "approve" ? "Approved" : "Rejected"} via email link`,
      })
      .eq("id", assessmentId);

    if (updateError) {
      console.error("Error updating assessment:", updateError);
      throw updateError;
    }

    console.log(`Assessment ${assessmentId} ${newStatus} successfully`);

    // Return success page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${action === "approve" ? "Approved" : "Rejected"}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px; 
              text-align: center; 
            }
            .success { color: #10b981; font-size: 48px; }
            .error { color: #ef4444; font-size: 48px; }
            h1 { margin-top: 20px; }
            p { font-size: 18px; color: #666; }
          </style>
        </head>
        <body>
          <div class="${action === "approve" ? "success" : "error"}">
            ${action === "approve" ? "✓" : "✗"}
          </div>
          <h1>Assessment ${action === "approve" ? "Approved" : "Rejected"}</h1>
          <p>
            The initial assessment for ${assessment.swimmers?.first_name} ${assessment.swimmers?.last_name} 
            has been ${newStatus}.
          </p>
          ${action === "approve" 
            ? "<p>The family will be notified and the session will proceed as scheduled.</p>"
            : "<p>The family will be notified and the booking has been cancelled.</p>"
          }
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in handle-assessment-approval:", error);
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1 class="error">Error Processing Request</h1>
          <p>${error.message}</p>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      }
    );
  }
};

serve(handler);
