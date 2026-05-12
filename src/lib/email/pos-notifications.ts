// Email notifications for POS (Purchase Order System)
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { emailService } from '../email-service'
import { wrapEmailWithHeader, createButton, BRAND_MAIN } from '../emails/email-wrapper'
import { emailUrls } from '../emails/url-helpers'
import {
  renderPORenewalCoordinatorEmail,
  buildMasteredSkillRow,
  buildUpcomingSkillRow,
} from '../emails/po-renewal-coordinator'
import { generateApproveToken, getApproveUrl } from '../po-utils'

interface POSEmailData {
  swimmerName: string;
  swimmerDOB: string;
  parentName: string;
  parentEmail: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
  fundingSource: string;
  poType: 'assessment' | 'lessons';
  sessionsAuthorized: number;
  startDate: string;
  endDate: string;
  authorizationNumber?: string;
}


export async function notifyParentPOSApproved(data: POSEmailData) {
  const subject = `POS Approved - ${data.swimmerName}'s Swim Lessons`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Purchase Order Approved!</h2>

    <p>Hi ${data.parentName},</p>

    <p>Great news! The purchase order for <strong>${data.swimmerName}'s</strong> swim lessons has been approved!</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Swimmer:</strong> ${data.swimmerName}</p>
      <p style="margin: 5px 0;"><strong>Type:</strong> ${data.poType === 'assessment' ? 'Initial Assessment' : 'Swim Lessons'}</p>
      <p style="margin: 5px 0;"><strong>Sessions Authorized:</strong> ${data.sessionsAuthorized}</p>
      <p style="margin: 5px 0;"><strong>Authorization Period:</strong> ${data.startDate} to ${data.endDate}</p>
      <p style="margin: 5px 0;"><strong>Funding Source:</strong> ${data.fundingSource}</p>
      ${data.authorizationNumber ? `<p style="margin: 5px 0;"><strong>Authorization #:</strong> ${data.authorizationNumber}</p>` : ''}
    </div>

    <p>You can now book swim sessions for ${data.swimmerName} through your parent portal:</p>

    ${createButton('Book Your Lessons', emailUrls.parentBook(data.parentEmail))}

    <p>Thank you,<br><strong>I Can Swim</strong></p>
  `

  const html = wrapEmailWithHeader(content)

  try {
    await emailService.sendEmail({
      to: data.parentEmail,
      templateType: 'custom',
      customData: { subject, html }
    })
    console.log(`POS approval notification sent to parent: ${data.parentEmail}`)
  } catch (error) {
    console.error('Failed to send POS approval notification:', error)
    // Don't throw - email failure shouldn't block the main flow
  }
}

export async function notifyParentPOSDeclined(data: POSEmailData & { reason?: string }) {
  const subject = `POS Update - ${data.swimmerName}'s Swim Lessons`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Purchase Order Update</h2>

    <p>Hi ${data.parentName},</p>

    <p>We wanted to inform you about an update regarding the purchase order for <strong>${data.swimmerName}'s</strong> swim lessons.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Swimmer:</strong> ${data.swimmerName}</p>
      <p style="margin: 5px 0;"><strong>Type:</strong> ${data.poType === 'assessment' ? 'Initial Assessment' : 'Swim Lessons'}</p>
      <p style="margin: 5px 0;"><strong>Funding Source:</strong> ${data.fundingSource}</p>
      ${data.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
    </div>

    <p>If you have questions about this decision or would like to discuss alternative options, please contact your coordinator:</p>
    <p><strong>${data.coordinatorName || 'Coordinator'}</strong><br>
    ${data.coordinatorEmail ? `Email: ${data.coordinatorEmail}<br>` : ''}
    Phone: (209) 778-7877</p>

    ${createButton('Contact Us', 'mailto:info@icanswim209.com')}

    <p>Thank you,<br><strong>I Can Swim</strong></p>
  `

  const html = wrapEmailWithHeader(content)

  try {
    await emailService.sendEmail({
      to: data.parentEmail,
      templateType: 'custom',
      customData: { subject, html }
    })
    console.log(`POS decline notification sent to parent: ${data.parentEmail}`)
  } catch (error) {
    console.error('Failed to send POS decline notification:', error)
    // Don't throw - email failure shouldn't block the main flow
  }
}


export async function notifyCoordinatorPendingRenewalPO(poId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('notifyCoordinatorPendingRenewalPO: missing Supabase service role config');
    return;
  }
  const serviceSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Look up PO with swimmer details
    const { data: po, error: poErr } = await serviceSupabase
      .from('purchase_orders')
      .select(`
        id, swimmer_id, sessions_authorized, start_date, end_date, status,
        swimmer:swimmers(
          id, first_name, last_name, uci_number,
          funding_coordinator_name, funding_coordinator_email, coordinator_email, coordinator_name
        )
      `)
      .eq('id', poId)
      .single();

    if (poErr || !po) {
      console.error('notifyCoordinatorPendingRenewalPO: PO not found', { poId, error: poErr });
      return;
    }

    const swimmer = Array.isArray(po.swimmer) ? po.swimmer[0] : po.swimmer;
    if (!swimmer) {
      console.error('notifyCoordinatorPendingRenewalPO: swimmer not found for PO', { poId });
      return;
    }

    const coordinatorEmail =
      swimmer.funding_coordinator_email?.trim() ||
      swimmer.coordinator_email?.trim();
    const coordinatorName =
      swimmer.funding_coordinator_name?.trim() ||
      swimmer.coordinator_name?.trim();

    if (!coordinatorEmail) {
      console.warn(
        'notifyCoordinatorPendingRenewalPO: no coordinator email on file; skipping email',
        { poId, swimmerId: swimmer.id }
      );
      return;
    }

    const swimmerName = `${swimmer.first_name ?? ''} ${swimmer.last_name ?? ''}`.trim();

    // 2. Generate approve token + 30-day expiry
    const token = generateApproveToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 3. Store on PO
    const { error: updateErr } = await serviceSupabase
      .from('purchase_orders')
      .update({
        approve_token: token,
        approve_token_expires_at: expiresAt,
      })
      .eq('id', poId);

    if (updateErr) {
      console.error('notifyCoordinatorPendingRenewalPO: failed to store approve_token', updateErr);
      // Continue — partial failure shouldn't block the email
    }

    const approveUrl = getApproveUrl(token);

    // 4. Look up skills — mastered and upcoming
    const { data: allSkills } = await serviceSupabase
      .from('swimmer_skills')
      .select(`
        status, date_mastered, date_started,
        skill:skills(id, name, sequence, level_id, level:swim_levels(id, name, display_name, sequence))
      `)
      .eq('swimmer_id', swimmer.id)
      .order('skill_id', { ascending: true });

    const masteredSkills = (allSkills ?? [])
      .filter((s: any) => s.status === 'mastered' && s.date_mastered)
      .sort((a: any, b: any) => {
        const aSeq = a.skill?.level?.sequence ?? 0;
        const bSeq = b.skill?.level?.sequence ?? 0;
        if (aSeq !== bSeq) return aSeq - bSeq;
        return (a.skill?.sequence ?? 0) - (b.skill?.sequence ?? 0);
      });

    const notStartedSkills = (allSkills ?? [])
      .filter((s: any) => s.status === 'not_started')
      .sort((a: any, b: any) => {
        const aSeq = a.skill?.level?.sequence ?? 0;
        const bSeq = b.skill?.level?.sequence ?? 0;
        if (aSeq !== bSeq) return aSeq - bSeq;
        return (a.skill?.sequence ?? 0) - (b.skill?.sequence ?? 0);
      });

    const masteredRows = masteredSkills
      .slice(0, 7)
      .map((s: any) => {
        const dateMet = s.date_mastered
          ? new Date(s.date_mastered).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '';
        const levelName = s.skill?.level?.display_name || s.skill?.level?.name || '';
        return buildMasteredSkillRow(levelName, s.skill?.name ?? '', dateMet);
      })
      .join('\n');

    const upcomingRows = notStartedSkills
      .slice(0, 4)
      .map((s: any) => {
        const levelName = s.skill?.level?.display_name || s.skill?.level?.name || '';
        return buildUpcomingSkillRow(levelName, s.skill?.name ?? '');
      })
      .join('\n');

    // 5. Look up targets
    const { data: targets } = await serviceSupabase
      .from('swimmer_targets')
      .select('status')
      .eq('swimmer_id', swimmer.id);

    const targetsTotal = targets?.length ?? 0;
    const targetsMastered = targets?.filter((t: any) => t.status === 'completed').length ?? 0;

    // 6. Find next future booking for needed_by_date
    let neededByDate = formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()); // fallback
    const { data: nextBooking } = await serviceSupabase
      .from('bookings')
      .select('session_date')
      .eq('swimmer_id', swimmer.id)
      .eq('status', 'confirmed')
      .gte('session_date', new Date().toISOString().split('T')[0])
      .order('session_date', { ascending: true })
      .limit(1)
      .single();

    if (nextBooking?.session_date) {
      neededByDate = formatDate(nextBooking.session_date);
    }

    // 7. Format dates
    const startDate = formatDate(po.start_date);
    const endDate = formatDate(po.end_date);

    // 8. Build the rich HTML email
    const html = renderPORenewalCoordinatorEmail({
      coordinatorName: coordinatorName || 'Coordinator',
      swimmerName,
      sessionsAuthorized: po.sessions_authorized ?? 12,
      uciNumber: swimmer.uci_number || 'Pending',
      neededByDate,
      startDate,
      endDate,
      masteredCount: masteredSkills.length,
      targetsMastered,
      targetsTotal,
      approveUrl,
      masteredSkillsHtml: masteredRows,
      upcomingSkillsHtml: upcomingRows,
      targetsHtml: '',
    });

    const subject = `New POS Authorization Needed — ${swimmerName} (needed by ${neededByDate})`;

    // 9. Send email
    await emailService.sendPOSNotification({
      to: coordinatorEmail,
      toName: coordinatorName || undefined,
      subject,
      html,
    });

    console.log(`Coordinator renewal PO notification sent to ${coordinatorEmail} for PO ${poId}`);
  } catch (error) {
    console.error('Failed to send coordinator renewal PO notification:', error);
  }
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Calculate a new end date by adding months, capped at June 30 of the current fiscal year.
 * Fiscal year ends June 30 — any end date past that is capped.
 */
function calcExtensionEndDate(fromDate: string, addMonths: number = 3): string {
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + addMonths);

  // Fiscal year end is June 30 of the year the extended date falls in
  const year = d.getFullYear();
  const fiscalYearEnd = new Date(year, 5, 30); // June 30

  return d <= fiscalYearEnd
    ? d.toISOString().split('T')[0]
    : fiscalYearEnd.toISOString().split('T')[0];
}

export async function notifyCoordinatorExpiredPO(poId: string, requestedDate: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('notifyCoordinatorExpiredPO: missing Supabase service role config');
    return;
  }
  const serviceSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Look up PO with swimmer details
    const { data: po, error: poErr } = await serviceSupabase
      .from('purchase_orders')
      .select(`
        id, swimmer_id, sessions_authorized, sessions_used, end_date, authorization_number,
        swimmer:swimmers(
          id, first_name, last_name, uci_number,
          funding_coordinator_name, funding_coordinator_email, coordinator_email, coordinator_name
        )
      `)
      .eq('id', poId)
      .single();

    if (poErr || !po) {
      console.error('notifyCoordinatorExpiredPO: PO not found', { poId, error: poErr });
      return;
    }

    const swimmer = Array.isArray(po.swimmer) ? po.swimmer[0] : po.swimmer;
    if (!swimmer) {
      console.error('notifyCoordinatorExpiredPO: swimmer not found for PO', { poId });
      return;
    }

    const coordinatorEmail =
      swimmer.funding_coordinator_email?.trim() ||
      swimmer.coordinator_email?.trim();
    const coordinatorName =
      swimmer.funding_coordinator_name?.trim() ||
      swimmer.coordinator_name?.trim();

    if (!coordinatorEmail) {
      console.warn(
        'notifyCoordinatorExpiredPO: no coordinator email on file; skipping email',
        { poId, swimmerId: swimmer.id }
      );
      return;
    }

    const swimmerName = `${swimmer.first_name ?? ''} ${swimmer.last_name ?? ''}`.trim();
    const sessionsRemaining = (po.sessions_authorized ?? 0) - (po.sessions_used ?? 0);
    const newEndDate = calcExtensionEndDate(po.end_date, 3);
    const requestedDateFormatted = formatDate(requestedDate);
    const currentEndDateFormatted = formatDate(po.end_date);

    // 2. Generate approve token + 14-day expiry (shorter window for extension)
    const token = generateApproveToken();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // 3. Store on PO
    const { error: updateErr } = await serviceSupabase
      .from('purchase_orders')
      .update({
        approve_token: token,
        approve_token_expires_at: expiresAt,
      })
      .eq('id', poId);

    if (updateErr) {
      console.error('notifyCoordinatorExpiredPO: failed to store approve_token', updateErr);
    }

    const approveUrl = getApproveUrl(token);

    // 4. Build extension email
    const subject = `PO Extension Needed — ${swimmerName} (booking requested for ${requestedDateFormatted})`;

    const content = `
      <div style="background:linear-gradient(135deg,#2A5E84 0%,#23A1C0 100%);padding:28px 36px;border-radius:8px 8px 0 0;">
        <div style="font-family:'DM Serif Display',Georgia,serif;color:#fff;font-size:20px;line-height:1.3;">
          <span style="display:block;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-bottom:4px;">I Can Swim Adaptive Aquatics</span>
          PO Extension Request
        </div>
      </div>
      <div style="background:#fff8e1;padding:12px 24px;border-bottom:1px solid #ffe082;text-align:center;">
        <span style="font-size:12px;font-weight:700;color:#bf360c;letter-spacing:.04em;text-transform:uppercase;">⚠️ Purchase of Service Authorization Has Expired</span>
      </div>
      <div style="padding:24px 28px;">
        <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#1a3347;">Hi ${coordinatorName || 'Coordinator'},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#3d5a6e;">
          A parent is trying to book a lesson for <strong style="color:#1a3347;">${swimmerName}</strong>, but their
          current Purchase of Service authorization has expired. There are still
          <strong>${sessionsRemaining} of ${po.sessions_authorized} sessions remaining</strong> on this authorization.
          Please extend the end date to continue services.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fbfd;border-radius:8px;border:1px solid #e2eef5;margin:0 0 20px;">
          <tr><td style="padding:14px 18px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;width:45%;">Client</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${swimmerName}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">UCI #</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${swimmer.uci_number || 'Pending'}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">Auth #</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${po.authorization_number || 'Pending'}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">Current end date</td><td style="padding:4px 0;font-weight:600;color:#c0392b;">${currentEndDateFormatted} (expired)</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">Sessions remaining</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${sessionsRemaining} of ${po.sessions_authorized}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">Requested lesson date</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${requestedDateFormatted}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">Proposed new end date</td><td style="padding:4px 0;font-weight:600;color:#1D9E75;">${formatDate(newEndDate)}</td></tr>
            </table>
          </td></tr>
        </table>

        <div style="text-align:center;margin:0 0 8px;">
          <a href="${approveUrl}" style="display:inline-block;background:#1D9E75;color:#fff;text-decoration:none;padding:16px 48px;border-radius:50px;font-size:15px;font-weight:700;letter-spacing:.02em;">
            ✅ Approve Extension — Extend end date to ${formatDate(newEndDate)}
          </a>
          <div style="font-size:12px;color:#a0b8c8;margin-top:10px;">By clicking Approve, you confirm this extension and that you've submitted a POS request to billing.</div>
        </div>

        <p style="margin:16px 0 0;font-size:13px;color:#8a9eb0;line-height:1.6;">
          The new end date is calculated as current end date + 3 months,
          capped at June 30 of the current fiscal year per VMRC/CVRC guidelines.
        </p>
      </div>
    `;

    const html = wrapEmailWithHeader(content);

    await emailService.sendPOSNotification({
      to: coordinatorEmail,
      toName: coordinatorName || undefined,
      subject,
      html,
    });

    console.log(`Coordinator PO extension notification sent to ${coordinatorEmail} for PO ${poId}`);
  } catch (error) {
    console.error('Failed to send coordinator PO extension notification:', error);
  }
}

export async function notifyInstructorProgressNeeded(data: {
  instructorEmail: string;
  instructorName: string;
  swimmerName: string;
  parentName: string;
  sessionsCompleted: number;
  sessionsRemaining: number;
  expiryDate: string;
  progressSummary?: string;
}) {
  const subject = `Progress Report Needed - ${data.swimmerName}`

  const content = `
    <h2 style="color: ${BRAND_MAIN}; margin-top: 0;">Progress Report Request</h2>

    <p>Hi ${data.instructorName},</p>

    <p>We need a progress report for <strong>${data.swimmerName}</strong> to support renewal of their swim lesson authorization.</p>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Swimmer:</strong> ${data.swimmerName}</p>
      <p style="margin: 5px 0;"><strong>Parent:</strong> ${data.parentName}</p>
      <p style="margin: 5px 0;"><strong>Sessions Completed:</strong> ${data.sessionsCompleted}</p>
      <p style="margin: 5px 0;"><strong>Sessions Remaining:</strong> ${data.sessionsRemaining}</p>
      <p style="margin: 5px 0;"><strong>Authorization Expires:</strong> ${data.expiryDate}</p>
    </div>

    <p>Please submit a progress report through your instructor portal that includes:</p>
    <ul>
      <li>Current skill level and progress</li>
      <li>Goals achieved</li>
      <li>Recommendations for continued instruction</li>
      <li>Any behavioral or safety notes</li>
    </ul>

    ${createButton('Submit Progress Notes', emailUrls.instructorProgress(data.instructorEmail))}

    <p>Thank you,<br><strong>I Can Swim</strong></p>
  `

  const html = wrapEmailWithHeader(content)

  try {
    await emailService.sendEmail({
      to: data.instructorEmail,
      templateType: 'custom',
      customData: { subject, html }
    })
    console.log(`Progress report request sent to instructor: ${data.instructorEmail}`)
  } catch (error) {
    console.error('Failed to send progress report request:', error)
    // Don't throw - email failure shouldn't block the main flow
  }
}