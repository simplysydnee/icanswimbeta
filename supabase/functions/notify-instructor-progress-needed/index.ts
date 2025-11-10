import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  swimmerId?: string; // Optional - if not provided, will check all swimmers
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

    const { swimmerId }: NotificationRequest = await req.json();

    console.log("Checking for swimmers needing progress updates...");

    // Query swimmers who need progress updates
    let query = supabaseClient
      .from("swimmers")
      .select(`
        *,
        swim_levels (
          display_name
        )
      `)
      .eq("is_vmrc_client", true)
      .gte("vmrc_sessions_used", 11);

    if (swimmerId) {
      query = query.eq("id", swimmerId);
    }

    const { data: swimmers, error: swimmersError } = await query;

    if (swimmersError) {
      throw swimmersError;
    }

    if (!swimmers || swimmers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No swimmers need progress updates" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${swimmers.length} swimmer(s) needing progress updates`);

    // Fetch all instructors
    const { data: instructors } = await supabaseClient
      .from("user_roles")
      .select(`
        user_id,
        profiles (
          email,
          full_name
        )
      `)
      .eq("role", "instructor");

    const instructorEmails = instructors
      ?.map((i) => i.profiles?.email)
      .filter(Boolean) as string[];

    if (!instructorEmails || instructorEmails.length === 0) {
      console.warn("No instructor emails found");
      return new Response(
        JSON.stringify({ message: "No instructors to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create notifications in database and send emails
    const notifications = [];
    
    for (const swimmer of swimmers) {
      // Create notification in database
      const { data: notification, error: notifError } = await supabaseClient
        .from("instructor_notifications")
        .insert({
          swimmer_id: swimmer.id,
          notification_type: "progress_update_needed",
          message: `${swimmer.first_name} ${swimmer.last_name} has used ${swimmer.vmrc_sessions_used}/${swimmer.vmrc_sessions_authorized} sessions and needs a progress update for POS renewal`,
          metadata: {
            sessions_used: swimmer.vmrc_sessions_used,
            sessions_authorized: swimmer.vmrc_sessions_authorized,
            pos_number: swimmer.vmrc_current_pos_number,
            current_level: swimmer.swim_levels?.display_name,
          },
        })
        .select()
        .single();

      if (!notifError) {
        notifications.push(notification);
      }

      // Send email to all instructors
      const emailHtml = `
        <h2>Progress Update Required</h2>
        <p>The following swimmer needs a progress update for POS renewal:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Swimmer:</strong> ${swimmer.first_name} ${swimmer.last_name}</p>
          <p><strong>Current Level:</strong> ${swimmer.swim_levels?.display_name || "Not Assigned"}</p>
          <p><strong>POS Number:</strong> ${swimmer.vmrc_current_pos_number || "N/A"}</p>
          <p><strong>Sessions Used:</strong> ${swimmer.vmrc_sessions_used}/${swimmer.vmrc_sessions_authorized}</p>
          <p><strong>Coordinator:</strong> ${swimmer.vmrc_coordinator_name || "N/A"}</p>
          <p><strong>Coordinator Email:</strong> ${swimmer.vmrc_coordinator_email || "N/A"}</p>
        </div>

        <p><strong>Action Required:</strong></p>
        <ol>
          <li>Review the swimmer's progress and recent lesson notes</li>
          <li>Prepare a comprehensive progress summary</li>
          <li>Submit the progress update to request a new POS authorization</li>
        </ol>

        <p>Please complete the progress update as soon as possible to ensure continuity of lessons.</p>

        <hr />
        <p style="font-size: 12px; color: #666;">
          This is an automated notification from I CAN SWIM.
        </p>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "I CAN SWIM Notifications <onboarding@resend.dev>",
          to: instructorEmails,
          subject: `Progress Update Needed - ${swimmer.first_name} ${swimmer.last_name}`,
          html: emailHtml,
        });

        console.log(`Email sent for swimmer ${swimmer.id}:`, emailResponse);
      } catch (emailError) {
        console.error(`Failed to send email for swimmer ${swimmer.id}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notified instructors about ${swimmers.length} swimmer(s) needing progress updates`,
        notifications: notifications.length,
        swimmersNotified: swimmers.map((s) => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          sessionsUsed: s.vmrc_sessions_used,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-instructor-progress-needed:", error);
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