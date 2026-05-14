// Late cancel warning email notifications
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { emailService } from '@/lib/email-service'
import { wrapEmailWithHeader, BRAND_MAIN } from '@/lib/emails/email-wrapper'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('Missing Supabase env (service role)')
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const CONTACT_BOX = `
  <div style="background:#f0f6fa;border:1px solid #dde8f0;border-radius:8px;padding:14px 18px;margin:18px 0;">
    <div style="font-size:14px;font-weight:600;color:#1a3347;margin-bottom:8px;">Contact us:</div>
    <div style="font-size:13px;color:#3d5a6e;line-height:1.8;">
      💬 Text: <a href="sms:2096437969" style="color:#23a1c0;">209-643-7969</a><br>
      📞 Call: <a href="tel:2097787877" style="color:#23a1c0;">(209) 778-7877</a><br>
      ✉️ <a href="mailto:info@icanswim209.com" style="color:#23a1c0;">info@icanswim209.com</a>
    </div>
  </div>
`

const BRANDED_FOOTER = `
  <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:16px;text-align:center;">
    <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;">I Can Swim Adaptive Aquatics</p>
    <p style="font-size:12px;color:#9ca3af;margin:0;">Modesto &amp; Merced, CA</p>
  </div>
`

function buildWarning1Email(swimmerName: string, parentName: string, sessionDate: string): string {
  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Late Cancellation Notice</h2>

    <p>Hi ${parentName},</p>

    <p>We wanted to let you know that <strong>${swimmerName}</strong>'s lesson on <strong>${sessionDate}</strong> was recorded as a late cancellation.</p>

    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px 18px;margin:18px 0;">
      <div style="font-size:14px;font-weight:600;color:#7a5000;margin-bottom:6px;">⚠️ Late Cancellation Recorded</div>
      <p style="font-size:13px;color:#5a4a00;line-height:1.6;margin:0;">
        Our cancellation policy requires 24 hours notice. Please be aware that cancelling less than 24 hours prior to your scheduled lesson may result in being dropped from the program.
      </p>
      <p style="font-size:13px;color:#5a4a00;line-height:1.6;margin:8px 0 0;">
        Late cancellations affect our ability to offer that spot to other families on our waitlist.
      </p>
    </div>

    <p>Please remember to cancel at least 24 hours before your scheduled lesson. You can reach us at:</p>

    ${CONTACT_BOX}

    <p>We understand that unexpected things happen. If this was due to an emergency or illness, please reach out and we are happy to discuss.</p>

    <p>Thank you,<br><strong>I Can Swim</strong></p>
    ${BRANDED_FOOTER}
  `
  return wrapEmailWithHeader(content)
}

function buildWarning2Email(swimmerName: string, parentName: string): string {
  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Second Late Cancellation — Action Required</h2>

    <p>Hi ${parentName},</p>

    <p>This is a follow-up regarding <strong>${swimmerName}</strong>'s attendance record.</p>

    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px 18px;margin:18px 0;">
      <div style="font-size:14px;font-weight:600;color:#991b1b;margin-bottom:6px;">🚨 Second Late Cancellation — Action Required</div>
      <p style="font-size:13px;color:#7f1d1d;line-height:1.6;margin:0;">
        This is <strong>${swimmerName}</strong>'s second late cancellation. Per our program policy, continued late cancellations put your child's spot in the program at risk.
      </p>
    </div>

    <p>We have a waitlist of families who are eager to participate. We want to keep <strong>${swimmerName}</strong> in the program and ask that you please prioritize giving us 24 hours notice for any cancellations.</p>

    <p>If you are experiencing scheduling challenges, please contact us directly — we want to work with you.</p>

    ${CONTACT_BOX}

    <p>If you believe this cancellation should be excused, please reach out to us as soon as possible.</p>

    <p>Thank you,<br><strong>I Can Swim</strong></p>
    ${BRANDED_FOOTER}
  `
  return wrapEmailWithHeader(content)
}

function buildAdminAlertEmail(swimmerName: string, parentName: string, parentEmail: string, swimmerId: string): string {
  const adminUrl = `https://icanswimbeta.vercel.app/admin/swimmers/${swimmerId}`
  return `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Late Cancellation Alert — Review Needed</h2>

    <p><strong>${swimmerName}</strong> has reached 2 unexcused late cancellations and requires review.</p>

    <div style="background:#f7fbfd;border:1px solid #e2eef5;border-radius:8px;padding:16px 18px;margin:18px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
        <tr><td style="padding:3px 8px 3px 0;color:#5a7a8e;width:30%;">Swimmer</td><td style="padding:3px 0;font-weight:600;color:#1a3347;">${swimmerName}</td></tr>
        <tr><td style="padding:3px 8px 3px 0;color:#5a7a8e;">Parent</td><td style="padding:3px 0;font-weight:600;color:#1a3347;">${parentName}</td></tr>
        <tr><td style="padding:3px 8px 3px 0;color:#5a7a8e;">Parent Email</td><td style="padding:3px 0;font-weight:600;color:#1a3347;"><a href="mailto:${parentEmail}" style="color:#23a1c0;">${parentEmail}</a></td></tr>
        <tr><td style="padding:3px 8px 3px 0;color:#5a7a8e;">Late Cancels</td><td style="padding:3px 0;"><span style="background:#fef2f2;color:#991b1b;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">2 unexcused</span></td></tr>
      </table>
    </div>

    <p style="text-align:center;margin:20px 0;">
      <a href="${adminUrl}" style="display:inline-block;background:${BRAND_MAIN};color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;">
        View Swimmer in Admin →
      </a>
    </p>
  `
}

/**
 * Send a late cancel warning email to the parent.
 * warningNumber=1 → first warning (firm but kind)
 * warningNumber=2 → second warning (risk of being dropped)
 */
export async function notifyParentLateCancelWarning(bookingId: string, warningNumber: 1 | 2) {
  const serviceSupabase = getServiceSupabase()

  try {
    // Fetch booking with related data
    const { data: booking, error: bookingErr } = await serviceSupabase
      .from('bookings')
      .select(`
        id,
        swimmer_id,
        parent_id,
        session:sessions (
          start_time
        ),
        swimmer:swimmers (
          id,
          first_name,
          last_name
        ),
        parent:profiles!parent_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingErr || !booking) {
      console.error('notifyParentLateCancelWarning: booking not found', { bookingId, error: bookingErr })
      return
    }

    const sessionData = Array.isArray(booking.session) ? booking.session[0] : booking.session
    const swimmerData = Array.isArray(booking.swimmer) ? booking.swimmer[0] : booking.swimmer
    const parentData = Array.isArray(booking.parent) ? booking.parent[0] : booking.parent

    if (!parentData?.email) {
      console.warn('notifyParentLateCancelWarning: no parent email', { bookingId })
      return
    }

    const swimmerName = `${swimmerData?.first_name ?? ''} ${swimmerData?.last_name ?? ''}`.trim() || 'Your swimmer'
    const parentName = parentData.full_name?.trim() || 'Parent'
    const sessionDate = sessionData?.start_time ? formatDate(sessionData.start_time) : 'recently'

    const subject = warningNumber === 1
      ? `Important: Late Cancellation Notice for ${swimmerName}`
      : `⚠️ Second Late Cancellation — ${swimmerName}`

    const html = warningNumber === 1
      ? buildWarning1Email(swimmerName, parentName, sessionDate)
      : buildWarning2Email(swimmerName, parentName)

    await emailService.sendEmail({
      to: parentData.email,
      toName: parentData.full_name || undefined,
      templateType: 'custom',
      customData: { subject, html },
    })

    console.log(`Late cancel warning ${warningNumber} sent to ${parentData.email} for booking ${bookingId}`)
  } catch (error) {
    console.error('Failed to send late cancel warning:', error)
  }
}

/**
 * Notify admin when a swimmer reaches 2 unexcused late cancellations.
 */
export async function notifyAdminLateCancelWarning(
  swimmerId: string,
  swimmerName: string,
  parentName: string,
  parentEmail: string
) {
  try {
    const subject = `⚠️ ${swimmerName} has 2 late cancellations — review needed`
    const html = buildAdminAlertEmail(swimmerName, parentName, parentEmail, swimmerId)
    const wrappedHtml = wrapEmailWithHeader(html)

    await emailService.sendEmail({
      to: 'info@icanswim209.com',
      templateType: 'custom',
      customData: { subject, html: wrappedHtml },
    })

    console.log(`Admin late cancel alert sent for swimmer ${swimmerId} (${swimmerName})`)
  } catch (error) {
    console.error('Failed to send admin late cancel alert:', error)
  }
}
