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
          <html>
            <head>${baseStyles}</head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Booking Confirmed!</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.parentName || 'there'},</p>

                  <p>Your swim lesson for <strong>${data.childName}</strong> has been confirmed!</p>

                  <div class="highlight">
                    <div class="info-row"><span class="label">📅 Date:</span> <strong>${data.customData?.date || 'TBD'}</strong></div>
                    <div class="info-row"><span class="label">🕐 Time:</span> <strong>${data.customData?.time || 'TBD'}</strong></div>
                    <div class="info-row"><span class="label">📍 Location:</span> <strong>${data.customData?.location || 'TBD'}</strong></div>
                    <div class="info-row"><span class="label">👨‍🏫 Instructor:</span> <strong>${data.customData?.instructor || 'TBD'}</strong></div>
                  </div>

                  <p><strong>Please remember:</strong></p>
                  <ul>
                    <li>Arrive 10 minutes early</li>
                    <li>Bring swimsuit, towel, and goggles (optional)</li>
                    <li>24-hour cancellation policy applies</li>
                  </ul>

                  <p style="text-align: center;">
                    <a href="${APP_URL}/dashboard" class="button">View My Bookings</a>
                  </p>

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

    case 'assessment_booking':
      return {
        subject: `Assessment Confirmed for ${data.childName} - I Can Swim 🏊`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>${baseStyles}</head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🏊 Assessment Confirmed!</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.parentName},</p>

                  <p>Thanks for booking <strong>${data.childName}'s</strong> Initial Assessment with I Can Swim! We're excited to meet you both and learn more about your child's comfort and confidence in the water.</p>

                  <div class="highlight">
                    <h3 style="margin-top: 0;">📋 Details</h3>
                    <p><strong>📅 Date:</strong> ${data.customData?.date || 'TBD'}</p>
                    <p><strong>🕐 Time:</strong> ${data.customData?.time || 'TBD'}</p>
                    <p><strong>📍 Location:</strong> ${data.customData?.location || '1212 Kansas Ave, Modesto, CA 95351'}</p>
                    <p><strong>🏊‍♀️ Instructor:</strong> ${data.customData?.instructor || 'TBD'}</p>
                  </div>

                  <h3>🎒 Here's what to bring:</h3>
                  <ul>
                    <li>🩱🩳 A towel and swimsuit</li>
                    <li>🚨 A swim diaper if your swimmer is not toilet trained</li>
                    <li>😁 A positive attitude!</li>
                  </ul>

                  <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b;">
                    <strong>🚫 Please avoid food 30 minutes before the assessment.</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">We recommend water only to keep your swimmer hydrated.</p>
                  </div>

                  <h3>🏊‍♀️ What to expect during the assessment:</h3>
                  <p><strong>${data.customData?.instructor || 'Our instructor'}</strong> will gently guide <strong>${data.childName}</strong> through a series of water comfort and movement checks.</p>
                  <p>→ We'll assess communication preferences, learning style, safety awareness, and basic swim readiness to help create tailored swim lessons moving forward, based on ${data.childName}'s needs.</p>

                  <h3>✅ After the assessment:</h3>
                  <ul>
                    <li>We'll update ${data.childName}'s profile in the app to include <strong>assessment results</strong></li>
                    <li>We'll notify you when <strong>it's time to book recurring lessons</strong></li>
                  </ul>

                  <p>If you have any questions or need to reschedule, just reply to this email—we're happy to help!</p>

                  <p style="margin-top: 30px;">See you at the pool! 🌊</p>

                  <p><strong>Sutton Lucas</strong><br/>I Can Swim</p>

                  <div class="footer">
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

    case 'recurring_lesson_booking':
      // Format multiple session dates
      const sessionsList = data.customData?.sessions?.map((s: any) =>
        `<li>${s.date} at ${s.time}</li>`
      ).join('') || '<li>Dates to be confirmed</li>'

      return {
        subject: `Recurring Lessons Confirmed for ${data.childName} - I Can Swim 🏊`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>${baseStyles}</head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Recurring Lessons Booked!</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.parentName},</p>

                  <p>Thank you for booking <strong>recurring swim sessions</strong>! Below are the details for ${data.childName}'s lessons:</p>

                  <div class="highlight">
                    <h3 style="margin-top: 0;">📋 Details</h3>
                    <p><strong>🏊‍♀️ Instructor:</strong> ${data.customData?.instructor || 'TBD'}</p>
                    <p><strong>📍 Location:</strong> ${data.customData?.location || 'TBD'}</p>
                    <p><strong>📅 Schedule:</strong></p>
                    <ul style="margin: 5px 0;">
                      ${sessionsList}
                    </ul>
                  </div>

                  <p>If anything changes and you need to cancel or reschedule, you can do that directly in your <a href="${APP_URL}/parent/sessions" style="color: #2a5e84;">parent portal</a> on the app or online.</p>

                  <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b;">
                    <strong>⏰ Need to cancel?</strong>
                    <p style="margin: 10px 0 0 0; font-size: 14px;">Please cancel at least <strong>24 hours in advance</strong> to give us time to offer the spot to another swimmer.</p>
                    <p style="margin: 10px 0 0 0; font-size: 14px;">Life happens—we totally understand! But when we don't receive notice, that session goes unused and another child misses the chance to swim.</p>
                    <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Late cancellations (less than 24 hours' notice)</strong> will result in your swimmer not being able to sign up for recurring lessons.</p>
                  </div>

                  <p>Looking forward to seeing you at the pool! 🌊</p>

                  <p><strong>Sutton Lucas</strong><br/>I Can Swim</p>

                  <div class="footer">
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

    case 'single_lesson_booking':
      return {
        subject: `Lesson Confirmed for ${data.childName} - I Can Swim 🏊`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>${baseStyles}</head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Lesson Confirmed!</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.parentName},</p>

                  <p>Your swim lesson for <strong>${data.childName}</strong> has been confirmed!</p>

                  <div class="highlight">
                    <h3 style="margin-top: 0;">📋 Details</h3>
                    <p><strong>📅 Date:</strong> ${data.customData?.date || 'TBD'}</p>
                    <p><strong>🕐 Time:</strong> ${data.customData?.time || 'TBD'}</p>
                    <p><strong>🏊‍♀️ Instructor:</strong> ${data.customData?.instructor || 'TBD'}</p>
                    <p><strong>📍 Location:</strong> ${data.customData?.location || 'TBD'}</p>
                  </div>

                  <p>If anything changes and you need to cancel or reschedule, you can do that directly in your <a href="${APP_URL}/parent/sessions" style="color: #2a5e84;">parent portal</a>.</p>

                  <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b;">
                    <strong>⏰ Need to cancel?</strong>
                    <p style="margin: 10px 0 0 0; font-size: 14px;">Please cancel at least <strong>24 hours in advance</strong> to give us time to offer the spot to another swimmer.</p>
                  </div>

                  <p>See you at the pool! 🌊</p>

                  <p><strong>Sutton Lucas</strong><br/>I Can Swim</p>

                  <div class="footer">
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