import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { bookingId } = await req.json();

    if (!bookingId) {
      throw new Error("bookingId is required");
    }

    // Fetch booking with all related data in one query
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        swimmer_id,
        parent_id,
        session_id,
        swimmers (
          first_name,
          last_name,
          payment_type,
          funding_source_id,
          funding_sources (
            name,
            requires_authorization
          )
        ),
        sessions (
          start_time,
          end_time,
          location,
          price_cents,
          session_type,
          instructor_id,
          profiles!sessions_instructor_id_fkey (
            full_name
          )
        ),
        profiles!bookings_parent_id_fkey (
          full_name,
          email
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message}`);
    }

    const swimmer = booking.swimmers as any;
    const session = booking.sessions as any;
    const parent = booking.profiles as any;
    const fundingSource = swimmer.funding_sources as any;

    if (!parent?.email) {
      throw new Error("Parent email not found");
    }

    // Only send invoice email for private pay and SD clients (requires_authorization = false)
    // VMRC/CVRC are billed via PO — no invoice email needed
    if (fundingSource?.requires_authorization === true) {
      console.log(
        `Skipping invoice email for funded client (${fundingSource.name}) — billed via PO`
      );
      return new Response(
        JSON.stringify({ skipped: true, reason: "funded_client_billed_via_po" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sessionDate = new Date(session.start_time);
    const formattedDate = sessionDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Los_Angeles",
    });
    const formattedTime = sessionDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    });

    const isAssessment = session.session_type === "assessment";
    const priceDollars = session.price_cents
      ? (session.price_cents / 100).toFixed(2)
      : "0.00";

    const instructorName =
      session.profiles?.full_name ?? "Your Instructor";
    const swimmerName = `${swimmer.first_name} ${swimmer.last_name}`;
    const parentName = parent.full_name ?? "there";

    const subject = isAssessment
      ? `Assessment Booked for ${swimmerName} — I Can Swim`
      : `Lesson Booked for ${swimmerName} — I Can Swim`;

    const sessionTypeLabel = isAssessment ? "Assessment" : "Lesson";

    // Get APP_URL from environment or use default
    const APP_URL = Deno.env.get("APP_URL") || "https://icanswim.app";

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f6fa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f6fa;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header with logo -->
          <tr>
            <td style="background-color:#1a3a4f;padding:36px 40px;text-align:center;">
              <img src="https://jtqlamkrhdfwtmaubfrc.supabase.co/storage/v1/object/public/public-assets/Horizontal%20White%20Logo"
                   width="260" alt="I Can Swim – Adaptive Swim Lessons"
                   style="display:block;margin:0 auto;border:0;max-width:100%;height:auto;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#1a3a4f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                ✅ ${isAssessment ? "Assessment" : "Lesson"} Confirmed!
              </h2>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Hi ${parentName},
              </p>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Your ${sessionTypeLabel.toLowerCase()} for <strong>${swimmerName}</strong> has been scheduled!
              </p>

              <!-- Important Note Box -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;background-color:#fff8f0;border-radius:8px;border:1px solid #fde8cc;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:12px;color:#8a6a4a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;">
                      ⚠️ <strong>Important:</strong> Session details may be updated by our staff. For the most current information, always check your sessions page.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background-color:#2aacc8;border-radius:8px;text-align:center;">
                    <a href="${APP_URL}/login?redirect=/dashboard"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:0.5px;">
                      View My Sessions ›
                    </a>
                  </td>
                </tr>
              </table>

              <!-- From your sessions page -->
              <p style="margin:0 0 4px;font-size:13px;color:#8aa0ae;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.5;">
                From your sessions page you can:
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;font-size:13px;color:#4a6070;line-height:1.6;">
                <li>View all upcoming sessions</li>
                <li>Cancel or reschedule if needed</li>
                <li>See past and cancelled sessions</li>
              </ul>

              <!-- Invoice Notice -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;background-color:#fefce8;border-radius:8px;border:1px solid #fde68a;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:12px;color:#92400e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;">
                      💰 <strong>Invoice Notice:</strong> This ${sessionTypeLabel.toLowerCase()} is <strong>$${priceDollars}</strong>. No payment is due today — you will receive a monthly invoice through QuickBooks for all lessons attended that month.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Cancellation Policy -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;background-color:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:12px;color:#0c4a6e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;">
                      📝 <strong>Cancellation policy:</strong> Please cancel at least 24 hours before your session. Late cancellations may affect your booking privileges.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="border-top:1px solid #e8f0f5;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">

              <!-- Contact options -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
                <tr valign="top">
                  <td style="padding:0 16px;text-align:center;border-right:1px solid #e0eaf0;">
                    <div style="font-size:10px;font-weight:700;color:#8aa0ae;letter-spacing:1px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin-bottom:5px;">Email Us</div>
                    <a href="mailto:info@icanswim209.com" style="font-size:12px;color:#2aacc8;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">info@icanswim209.com</a>
                  </td>
                  <td style="padding:0 16px;text-align:center;border-right:1px solid #e0eaf0;">
                    <div style="font-size:10px;font-weight:700;color:#8aa0ae;letter-spacing:1px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin-bottom:5px;">Text Us</div>
                    <a href="sms:2096437969" style="font-size:12px;color:#2aacc8;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">209-643-7969</a>
                    <div style="font-size:10px;color:#b0c4ce;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin-top:3px;">Fastest response</div>
                  </td>
                  <td style="padding:0 16px;text-align:center;">
                    <div style="font-size:10px;font-weight:700;color:#8aa0ae;letter-spacing:1px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin-bottom:5px;">Call Us</div>
                    <a href="tel:2097787877" style="font-size:12px;color:#2aacc8;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">(209) 778-7877</a>
                    <div style="font-size:10px;color:#b0c4ce;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin-top:3px;">Mon–Fri, 9am–5pm</div>
                  </td>
                </tr>
              </table>

              <!-- Instagram -->
              <div style="margin-bottom:20px;">
                <a href="https://instagram.com/icanswim209" style="display:inline-block;text-decoration:none;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr valign="middle">
                      <td style="padding-right:7px;">
                        <img src="https://jtqlamkrhdfwtmaubfrc.supabase.co/storage/v1/object/public/public-assets/IG%20logo%20i%20canswim.svg"
                             width="18" height="18" alt="Instagram"
                             style="display:block;border:0;" />
                      </td>
                      <td>
                        <span style="font-size:12px;color:#8aa0ae;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Follow us on Instagram</span>
                        <span style="font-size:12px;font-weight:700;color:#2aacc8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin-left:3px;">@icanswim209</span>
                      </td>
                    </tr>
                  </table>
                </a>
              </div>

              <!-- Business info -->
              <div>
                <span style="font-size:11px;color:#bdd0d9;letter-spacing:2px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-transform:uppercase;">I CAN SWIM, LLC</span><br/>
                <span style="font-size:11px;color:#bdd0d9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Turlock &amp; Modesto, California</span>
              </div>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `.trim();

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "I Can Swim <info@icanswim209.com>",
        to: parent.email,
        subject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      throw new Error(`Resend error: ${resendError}`);
    }

    const resendData = await resendResponse.json();
    console.log(`Booking confirmation sent to ${parent.email}`, resendData.id);

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-booking-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});