import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  requestId: string;
  newPosNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { requestId, newPosNumber }: ApprovalRequest = await req.json();

    console.log("Processing POS approval:", { requestId, newPosNumber });

    // Fetch the request
    const { data: request, error: requestError } = await supabaseClient
      .from("progress_update_requests")
      .select("*, swimmers(*)")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      throw new Error("POS request not found");
    }

    if (request.status === "approved") {
      throw new Error("POS request has already been approved");
    }

    // Update the request
    const { error: updateRequestError } = await supabaseClient
      .from("progress_update_requests")
      .update({
        status: "approved",
        new_pos_number: newPosNumber,
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateRequestError) {
      console.error("Error updating request:", updateRequestError);
      throw updateRequestError;
    }

    // Update swimmer with new POS info
    const { error: swimmerError } = await supabaseClient
      .from("swimmers")
      .update({
        vmrc_current_pos_number: newPosNumber,
        vmrc_sessions_authorized: 12,
        vmrc_sessions_used: 0,
        assessment_status: "complete", // Reset to complete so they can book
        last_status_update: new Date().toISOString(),
      })
      .eq("id", request.swimmer_id);

    if (swimmerError) {
      console.error("Error updating swimmer:", swimmerError);
      throw swimmerError;
    }

    // Create a new POS record
    const { error: posError } = await supabaseClient
      .from("purchase_orders")
      .insert({
        swimmer_id: request.swimmer_id,
        coordinator_id: request.swimmers.created_by,
        po_type: "lessons",
        authorization_number: newPosNumber,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        allowed_lessons: 12,
        lessons_used: 0,
        lessons_booked: 0,
        status: "approved",
      });

    if (posError) {
      console.error("Error creating POS:", posError);
      // Don't throw - this is not critical to the approval process
    }

    console.log("POS approval completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "POS request approved successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in approve-pos-request:", error);
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
