import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
// Using Resend SMTP: smtp.resend.com:587 with username 'resend' and API key as password

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject?: string
  parentName?: string
  childName?: string
  coordinatorName?: string
  toName?: string
  html?: string
  templateType: 'enrollment_invite' | 'approval_notification' | 'booking_confirmation' | 'assessment_booking' | 'recurring_lesson_booking' | 'single_lesson_booking' | 'assessment_completion' | 'welcome_enrollment' | 'account_created' | 'instructor_change' | 'referral_request' | 'parent_invitation' | 'custom'
  customData?: Record<string, any>
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'I Can Swim <noreply@icanswim209.com>'
const APP_URL = Deno.env.get('APP_URL') || 'https://icanswim209.com'
const TEST_MODE = Deno.env.get('TEST_MODE') === 'true'

// Email templates
const getEmailTemplate = (type: string, data: any): { subject: string; html: string } => {
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #2a5e84; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 24px; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      .button { display: inline-block; background: #2a5e84; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
      .highlight { background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2a5e84; }
      .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
      .info-row { margin: 8px 0; }
      .label { color: #666; }
    </style>
  `

  switch (type) {
    case 'enrollment_invite':
      const signupUrl = `${APP_URL}/signup?email=${encodeURIComponent(data.to)}&child=${encodeURIComponent(data.childName)}`
      return {
        subject: `Complete Enrollment for ${data.childName} - I Can Swim`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>${baseStyles}</head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🏊 Welcome to I Can Swim!</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.parentName || 'there'},</p>

                  <p>Great news! <strong>${data.childName}</strong> has been referred for swim lessons by <strong>${data.coordinatorName}</strong>.</p>

                  <div class="highlight">
                    <strong>Next Step:</strong> Create your account to complete enrollment and get started with swim lessons!
                  </div>

                  <p style="text-align: center;">
                    <a href="${signupUrl}" class="button">Create Your Account</a>
                  </p>

                  <p>After creating your account, you'll complete a short enrollment form with:</p>
                  <ul>
                    <li>Your child's swim goals</li>
                    <li>Your availability for lessons</li>
                    <li>Required consent forms</li>
                  </ul>

                  <p>Once submitted, our team will review and contact you to schedule ${data.childName}'s swim assessment.</p>

                  <div class="footer">
                    <p><strong>I Can Swim</strong></p>
                    <p>📍 Modesto: 1212 Kansas Ave, Modesto, CA 95351</p>
                    <p>📍 Merced: 750 Motel Dr, Merced, CA 95340</p>
                    <p>📞 (209) 778-7877 | ✉️ info@icanswim209.com</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `
      }

    case 'approval_notification':
      const bookingUrl = `${APP_URL}/booking`
      return {
        subject: `${data.childName} is Approved for Swim Lessons! 🎉`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>${baseStyles}</head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 You're Approved!</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.parentName || 'there'},</p>

                  <p>Great news! <strong>${data.childName}</strong> has been approved for swim lessons at I Can Swim!</p>

                  <div class="highlight">
                    <strong>Next Step:</strong> Schedule ${data.childName}'s swim assessment. This 30-minute session helps us create a personalized learning plan.
                  </div>

                  <p style="text-align: center;">
                    <a href="${bookingUrl}" class="button">Schedule Assessment</a>
                  </p>

                  <p><strong>What to expect:</strong></p>
                  <ul>
                    <li>30-minute one-on-one assessment</li>
                    <li>Evaluation of current swim abilities</li>
                    <li>Personalized lesson plan created</li>
                    <li>Meet your instructor</li>
                  </ul>

                  <p>We're excited to meet ${data.childName} and start their swimming journey!</p>

                  <div class="footer">
                    <p><strong>I Can Swim</strong></p>
                    <p>📍 Modesto: 1212 Kansas Ave, Modesto, CA 95351</p>
                    <p>📍 Merced: 750 Motel Dr, Merced, CA 95340</p>
                    <p>📞 (209) 778-7877 | ✉️ info@icanswim209.com</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `
      }

    case 'booking_confirmation':
      return {
        subject: `Booking Confirmed: ${data.childName}'s Swim Lesson`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed – I Can Swim</title>
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
                ✅ Booking Confirmed!
              </h2>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Hi ${data.parentName || 'there'},
              </p>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Your swim lesson for <strong>${data.childName}</strong> has been scheduled!
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
                    <a href="${APP_URL}/login?redirect=/parent/sessions"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:0.5px;">
                      View My Sessions ›
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Additional info -->
              <p style="margin:0 0 4px;font-size:13px;color:#8aa0ae;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.5;">
                From your sessions page you can:
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;font-size:13px;color:#4a6070;line-height:1.6;">
                <li>View all upcoming sessions</li>
                <li>Cancel or reschedule if needed</li>
                <li>See past and cancelled sessions</li>
              </ul>

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
        `
      }

    case 'assessment_booking':
      return {
        subject: `Assessment Confirmed for ${data.childName} - I Can Swim 🏊`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Assessment Confirmed – I Can Swim</title>
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
                🏊 Assessment Confirmed!
              </h2>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Hi ${data.parentName},
              </p>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Thanks for booking <strong>${data.childName}'s</strong> Initial Assessment with I Can Swim! We're excited to meet you both and learn more about your child's comfort and confidence in the water.
              </p>

              <!-- Important Note Box -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;background-color:#fff8f0;border-radius:8px;border:1px solid #fde8cc;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:12px;color:#8a6a4a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;">
                      ⚠️ <strong>Important:</strong> Assessment details may be updated by our staff. For the most current information, always check your sessions page.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background-color:#2aacc8;border-radius:8px;text-align:center;">
                    <a href="${APP_URL}/login?redirect=/parent/sessions"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:0.5px;">
                      View My Sessions ›
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What to expect -->
              <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1a3a4f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                🎒 Here's what to bring:
              </h3>
              <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#4a6070;line-height:1.6;">
                <li>🩱🩳 A towel and swimsuit</li>
                <li>🚨 A swim diaper if your swimmer is not toilet trained</li>
                <li>😁 A positive attitude!</li>
              </ul>

              <!-- Food warning -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;background-color:#fef3c7;border-radius:8px;border:1px solid #fde68a;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:12px;color:#92400e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;">
                      🚫 <strong>Please avoid food 30 minutes before the assessment.</strong> We recommend water only to keep your swimmer hydrated.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- What to expect -->
              <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1a3a4f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                🏊‍♀️ What to expect during the assessment:
              </h3>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Our instructor will gently guide <strong>${data.childName}</strong> through a series of water comfort and movement checks. We'll assess communication preferences, learning style, safety awareness, and basic swim readiness to help create tailored swim lessons moving forward.
              </p>

              <!-- After assessment -->
              <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1a3a4f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                ✅ After the assessment:
              </h3>
              <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#4a6070;line-height:1.6;">
                <li>We'll update ${data.childName}'s profile in the app to include <strong>assessment results</strong></li>
                <li>We'll notify you when <strong>it's time to book recurring lessons</strong></li>
              </ul>

              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                If you have any questions or need to reschedule, just reply to this email—we're happy to help!
              </p>

              <p style="margin:0;font-size:14px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                See you at the pool! 🌊<br/>
                <strong>Sutton Lucas</strong><br/>I Can Swim
              </p>

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
        `
      }

    case 'recurring_lesson_booking':
      return {
        subject: `Recurring Lessons Confirmed for ${data.childName} - I Can Swim 🏊`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recurring Lessons Confirmed – I Can Swim</title>
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
                🎉 Recurring Lessons Booked!
              </h2>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Hi ${data.parentName},
              </p>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Thank you for booking <strong>recurring swim sessions</strong> for <strong>${data.childName}</strong>! We're excited to continue their swimming journey with you.
              </p>

              <!-- Important Note Box -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;background-color:#fff8f0;border-radius:8px;border:1px solid #fde8cc;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:12px;color:#8a6a4a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;">
                      ⚠️ <strong>Important:</strong> Session details may be updated by our staff. For the most current schedule and information, always check your sessions page.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background-color:#2aacc8;border-radius:8px;text-align:center;">
                    <a href="${APP_URL}/login?redirect=/parent/sessions"
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
                <li>View your complete recurring schedule</li>
                <li>Cancel individual sessions if needed</li>
                <li>Cancel the entire recurring block</li>
                <li>See all upcoming and past sessions</li>
              </ul>

              <!-- Cancellation Policy -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;background-color:#fef3c7;border-radius:8px;border:1px solid #fde68a;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:12px;color:#92400e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;">
                      ⏰ <strong>Need to cancel?</strong> Please cancel at least <strong>24 hours in advance</strong> to give us time to offer the spot to another swimmer.
                    </p>
                    <p style="margin:8px 0 0;font-size:11px;color:#92400e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.5;">
                      Life happens—we totally understand! But when we don't receive notice, that session goes unused and another child misses the chance to swim.
                    </p>
                    <p style="margin:8px 0 0;font-size:11px;color:#92400e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.5;">
                      <strong>Late cancellations (less than 24 hours' notice)</strong> may affect your ability to book recurring lessons.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Looking forward to seeing you at the pool! 🌊<br/>
                <strong>Sutton Lucas</strong><br/>I Can Swim
              </p>

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
        `
      }

    case 'single_lesson_booking':
      return {
        subject: `Lesson Confirmed for ${data.childName} - I Can Swim 🏊`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lesson Confirmed – I Can Swim</title>
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
                ✅ Lesson Confirmed!
              </h2>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Hi ${data.parentName},
              </p>

              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Your swim lesson for <strong>${data.childName}</strong> has been scheduled!
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
                    <a href="${APP_URL}/login?redirect=/parent/sessions"
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

              <!-- Cancellation Policy -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;background-color:#fef3c7;border-radius:8px;border:1px solid #fde68a;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:12px;color:#92400e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;">
                      ⏰ <strong>Need to cancel?</strong> Please cancel at least <strong>24 hours in advance</strong> to give us time to offer the spot to another swimmer.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;line-height:1.6;color:#4a6070;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                See you at the pool! 🌊<br/>
                <strong>Sutton Lucas</strong><br/>I Can Swim
              </p>

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
        `
      }

    case 'assessment_completion':
      // For assessment completion, we expect customData to contain the HTML and subject
      return {
        subject: data.customData?.subject || 'Assessment Results - I Can Swim',
        html: data.customData?.html || '<p>Assessment results are available in your portal.</p>'
      }

    case 'welcome_enrollment':
    case 'account_created':
    case 'instructor_change':
    case 'referral_request':
    case 'parent_invitation':
      // These use pre-generated HTML from TypeScript templates
      // Check both top-level subject/html and customData subject/html
      const templateSubject = data.subject || data.customData?.subject || 'I Can Swim Notification'
      const templateHtml = data.html || data.customData?.html || '<p>No content provided</p>'
      return {
        subject: templateSubject,
        html: templateHtml
      }

    case 'custom':
      // For custom emails, check both direct parameters and customData
      const customSubject = data.subject || data.customData?.subject || 'Message from I Can Swim'
      const customHtml = data.html || data.customData?.html || '<p>You have a message from I Can Swim.</p>'
      return {
        subject: customSubject,
        html: customHtml
      }

    default:
      return {
        subject: 'I Can Swim Notification',
        html: '<p>You have a notification from I Can Swim.</p>'
      }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData: EmailRequest = await req.json()
    const { to, templateType, parentName, childName, coordinatorName, toName, subject, html, customData } = requestData

    // Log request details for monitoring
    console.log(`Email function called: ${templateType} to ${to}`)
    console.log('Template type:', templateType)
    console.log('CustomData received:', customData ? 'Yes' : 'No')
    console.log('CustomData.subject:', customData?.subject)
    console.log('CustomData.html length:', customData?.html?.length || 0)
    console.log('Top-level subject:', subject)
    console.log('Top-level html length:', html?.length || 0)

    // Get email template
    const template = getEmailTemplate(templateType, {
      to,
      parentName,
      childName,
      coordinatorName,
      toName,
      subject,
      html,
      customData
    })

    // Test mode - log instead of sending
    if (TEST_MODE) {
      console.log('TEST MODE - Would send email:')
      console.log('To:', to)
      console.log('To Name:', toName)
      console.log('Subject:', template.subject)
      console.log('Template:', templateType)
      console.log('Parent:', parentName)
      console.log('Child:', childName)
      console.log('Coordinator:', coordinatorName)
      return new Response(
        JSON.stringify({ success: true, message: 'Test mode - email logged' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate Resend credentials
    if (!RESEND_API_KEY) {
      throw new Error('Resend credentials not configured. Set RESEND_API_KEY environment variable.')
    }

    // Create SMTP client for Resend
    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.resend.com',
        port: 587,
        tls: true,
        auth: {
          username: 'resend',
          password: RESEND_API_KEY,
        },
      },
    })

    // Send email
    await client.send({
      from: FROM_EMAIL,
      to: to,
      subject: template.subject,
      html: template.html,
    })

    await client.close()

    console.log(`Email sent successfully to ${to} (${templateType})`)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})