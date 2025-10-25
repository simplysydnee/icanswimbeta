import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FloatingSessionNotificationRequest {
  floatingSessionId: string;
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

    const { floatingSessionId }: FloatingSessionNotificationRequest = await req.json();

    console.log("Processing notification for floating session:", floatingSessionId);

    // Get floating session details with session info
    const { data: floatingSession, error: sessionError } = await supabaseClient
      .from("floating_sessions")
      .select(`
        id,
        available_until,
        sessions (
          id,
          start_time,
          end_time,
          session_type,
          session_type_detail,
          price_cents,
          location,
          profiles!sessions_instructor_id_fkey (
            full_name
          )
        )
      `)
      .eq("id", floatingSessionId)
      .single();

    if (sessionError || !floatingSession) {
      console.error("Error fetching floating session:", sessionError);
      throw new Error("Floating session not found");
    }

    // Get all users who have notifications enabled and are enrolled
    const { data: notificationPrefs, error: prefsError } = await supabaseClient
      .from("floating_session_notification_preferences")
      .select(`
        user_id,
        profiles!floating_session_notification_preferences_user_id_fkey (
          email,
          full_name
        )
      `)
      .eq("enabled", true);

    if (prefsError) {
      console.error("Error fetching notification preferences:", prefsError);
      throw prefsError;
    }

    if (!notificationPrefs || notificationPrefs.length === 0) {
      console.log("No users with notifications enabled");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No users to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format session details
    const session = Array.isArray(floatingSession.sessions) 
      ? floatingSession.sessions[0] 
      : floatingSession.sessions;
    
    if (!session) {
      throw new Error("Session data not found");
    }

    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const formattedDate = startTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = `${startTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })} - ${endTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
    
    const instructorProfile = Array.isArray(session.profiles) 
      ? session.profiles[0] 
      : session.profiles;
    const instructorName = instructorProfile?.full_name || "TBD";
    const price = (session.price_cents / 100).toFixed(2);

    // Send emails to all users with notifications enabled
    const emailPromises = notificationPrefs.map(async (pref) => {
      const userProfile = Array.isArray(pref.profiles) 
        ? pref.profiles[0] 
        : pref.profiles;
      const userEmail = userProfile?.email;
      const userName = userProfile?.full_name || "Swimmer";

      if (!userEmail) {
        console.log("Skipping user with no email");
        return null;
      }

      try {
        const emailResponse = await resend.emails.send({
          from: "I CAN Swim <info@icanswim209.com>",
          to: [userEmail],
          subject: "🏊‍♂️ New Drop-In Session Available!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">New Swimming Session Available!</h1>
              
              <p>Hi ${userName},</p>
              
              <p>Great news! A drop-in swimming session just opened up:</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #1f2937;">${session.session_type}${session.session_type_detail ? ` - ${session.session_type_detail}` : ""}</h2>
                <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                <p style="margin: 10px 0;"><strong>🕐 Time:</strong> ${formattedTime}</p>
                <p style="margin: 10px 0;"><strong>👨‍🏫 Instructor:</strong> ${instructorName}</p>
                <p style="margin: 10px 0;"><strong>📍 Location:</strong> ${session.location}</p>
                <p style="margin: 10px 0;"><strong>💵 Price:</strong> $${price}</p>
              </div>
              
              <p style="color: #dc2626; font-weight: bold;">⏰ This session is available until ${new Date(floatingSession.available_until).toLocaleString("en-US")}. Book it before it's gone!</p>
              
              <div style="margin: 30px 0;">
                <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace(/\/+$/, "")}/booking" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Book Now
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                You're receiving this because you've enabled notifications for drop-in sessions. 
                You can manage your notification preferences in your account settings.
              </p>
              
              <p style="margin-top: 20px;">
                Happy Swimming!<br>
                <strong>I CAN Swim Team</strong>
              </p>
            </div>
          `,
        });

        console.log(`Email sent to ${userEmail}:`, emailResponse);
        return emailResponse;
      } catch (error) {
        console.error(`Error sending email to ${userEmail}:`, error);
        return null;
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r !== null).length;

    console.log(`Successfully sent ${successCount} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: notificationPrefs.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-floating-session function:", error);
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
