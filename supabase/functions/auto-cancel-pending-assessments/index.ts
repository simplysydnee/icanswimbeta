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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Running auto-cancel pending assessments cron job");

    // Find all pending assessments past their deadline
    const { data: expiredAssessments, error: fetchError } = await supabaseClient
      .from("assessments")
      .select("id, swimmer_id, scheduled_date, approval_deadline")
      .eq("approval_status", "pending")
      .lt("approval_deadline", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching expired assessments:", fetchError);
      throw fetchError;
    }

    if (!expiredAssessments || expiredAssessments.length === 0) {
      console.log("No expired pending assessments found");
      return new Response(
        JSON.stringify({ message: "No expired assessments to cancel", count: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${expiredAssessments.length} expired assessments to cancel`);

    // Cancel all expired assessments
    const assessmentIds = expiredAssessments.map((a) => a.id);
    const { error: updateError } = await supabaseClient
      .from("assessments")
      .update({
        approval_status: "cancelled",
        approval_notes: "Automatically cancelled - coordinator did not respond within 24 hours",
      })
      .in("id", assessmentIds);

    if (updateError) {
      console.error("Error cancelling assessments:", updateError);
      throw updateError;
    }

    console.log(`Successfully cancelled ${assessmentIds.length} expired assessments`);

    return new Response(
      JSON.stringify({
        message: "Successfully cancelled expired assessments",
        count: assessmentIds.length,
        assessmentIds,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in auto-cancel-pending-assessments:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
