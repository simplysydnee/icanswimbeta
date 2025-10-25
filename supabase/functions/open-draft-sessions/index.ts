import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    console.log("Checking for sessions to open...");

    // Call database function to get sessions that should open
    const { data: sessionsToOpen, error: queryError } = await supabaseClient
      .rpc("should_sessions_open");

    if (queryError) {
      console.error("Error querying sessions:", queryError);
      throw queryError;
    }

    if (!sessionsToOpen || sessionsToOpen.length === 0) {
      console.log("No sessions to open at this time");
      return new Response(
        JSON.stringify({ success: true, opened: 0, message: "No sessions to open" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const sessionIds = sessionsToOpen.map((s: any) => s.session_id);
    console.log(`Opening ${sessionIds.length} sessions`);

    // Update sessions to Open status
    const { error: updateError } = await supabaseClient
      .from("sessions")
      .update({
        status: "available",
        open_at: new Date().toISOString(),
      })
      .in("id", sessionIds);

    if (updateError) {
      console.error("Error updating sessions:", updateError);
      throw updateError;
    }

    console.log(`Successfully opened ${sessionIds.length} sessions`);

    return new Response(
      JSON.stringify({
        success: true,
        opened: sessionIds.length,
        sessionIds,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in open-draft-sessions:", error);
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
