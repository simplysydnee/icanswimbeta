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
          funding_coordinator_name, funding_coordinator_email
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

    const coordinatorEmail = swimmer.funding_coordinator_email?.trim();
    const coordinatorName = swimmer.funding_coordinator_name?.trim();

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


    // 7. Format dates
    const startDate = formatDate(po.start_date);
    const endDate = formatDate(po.end_date);

    // 8. Build the rich HTML email
    const html = renderPORenewalCoordinatorEmail({
      coordinatorName: coordinatorName || 'Coordinator',
      swimmerName,
      sessionsAuthorized: po.sessions_authorized ?? 12,
      uciNumber: swimmer.uci_number || 'Pending',
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
    const subject = `New POS Authorization Needed — ${swimmerName} (New Fiscal Year)`;

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
export function calcExtensionEndDate(fromDate: string, addMonths: number = 3): string {
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + addMonths);

  // Fiscal year ends June 30
  const year = d.getFullYear();
  const fiscalYearEnd = new Date(year, 5, 30);

  if (d <= fiscalYearEnd) {
    return d.toISOString().split('T')[0];
  }

  // If the extended date is past June 30, check whether we're already past this fiscal year
  const today = new Date();
  if (today > fiscalYearEnd) {
    // Already in the next fiscal year — cap at following June 30
    const nextFiscalYearEnd = new Date(year + 1, 5, 30);
    return nextFiscalYearEnd.toISOString().split('T')[0];
  }

  return fiscalYearEnd.toISOString().split('T')[0];
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

/**
 * notifyCoordinatorPOExtension — sends a date extension email to the coordinator
 * Used when a PO's end_date has passed but sessions remain (different from renewal).
 * Uses the same po-approve edge function for the approval button.
 *
 * Email format follows the spec: short, no progress report, prominent new end date box.
 */
export async function notifyCoordinatorPOExtension(poId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('notifyCoordinatorPOExtension: missing Supabase service role config');
    return;
  }
  const serviceSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Fetch PO + swimmer + coordinator details
    const { data: po, error: poErr } = await serviceSupabase
      .from('purchase_orders')
      .select(`
        id, swimmer_id, sessions_authorized, sessions_used, end_date, original_end_date, authorization_number,
        swimmer:swimmers(
          id, first_name, last_name, uci_number,
          funding_coordinator_name, funding_coordinator_email, coordinator_email, coordinator_name
        )
      `)
      .eq('id', poId)
      .single();

    if (poErr || !po) {
      console.error('notifyCoordinatorPOExtension: PO not found', { poId, error: poErr });
      return;
    }

    const swimmer = Array.isArray(po.swimmer) ? po.swimmer[0] : po.swimmer;
    if (!swimmer) {
      console.error('notifyCoordinatorPOExtension: swimmer not found for PO', { poId });
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
        'notifyCoordinatorPOExtension: no coordinator email on file; skipping email',
        { poId, swimmerId: swimmer.id }
      );
      return;
    }

    const swimmerName = `${swimmer.first_name ?? ''} ${swimmer.last_name ?? ''}`.trim();
    const sessionsRemaining = (po.sessions_authorized ?? 0) - (po.sessions_used ?? 0);
    const newEndDate = calcExtensionEndDate(po.end_date, 3);
    const originalEndDateFormatted = formatDate(po.original_end_date || po.end_date);

    // 2. Generate approve token + 30-day expiry
    const token = generateApproveToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 3. Store approve token on PO
    const { error: updateErr } = await serviceSupabase
      .from('purchase_orders')
      .update({
        approve_token: token,
        approve_token_expires_at: expiresAt,
      })
      .eq('id', poId);

    if (updateErr) {
      console.error('notifyCoordinatorPOExtension: failed to store approve_token', updateErr);
    }

    const approveUrl = getApproveUrl(token);

    // 4. Build extension email (short — no progress report per spec)
    const subject = `POS Date Extension Needed — ${swimmerName} (${sessionsRemaining} sessions remaining)`;

    const content = `
      <div style="background:linear-gradient(135deg,#2A5E84 0%,#23A1C0 100%);padding:28px 36px;border-radius:8px 8px 0 0;">
        <div style="font-family:'DM Serif Display',Georgia,serif;color:#fff;font-size:20px;line-height:1.3;">
          <span style="display:block;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-bottom:4px;">I Can Swim Adaptive Aquatics</span>
          POS Date Extension Needed
        </div>
      </div>
      <div style="padding:24px 28px;">
        <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#1a3347;">Hi ${coordinatorName || 'Coordinator'},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#3d5a6e;">
          I hope you're doing well! We're reaching out regarding <strong style="color:#1a3347;">${swimmerName}</strong> —
          their current authorization has expired by date but they still have
          <strong>${sessionsRemaining} sessions remaining</strong>. We are requesting a date
          extension so their lessons can continue without interruption.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fbfd;border-radius:8px;border:1px solid #e2eef5;margin:0 0 20px;">
          <tr><td style="padding:14px 18px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;width:45%;">Client</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${swimmerName}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">UCI Number</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${swimmer.uci_number || 'Pending'}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">Auth Number</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${po.authorization_number || 'Pending'}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">Sessions remaining</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${sessionsRemaining} of ${po.sessions_authorized}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">Original end date</td><td style="padding:4px 0;font-weight:600;color:#c0392b;">${originalEndDateFormatted} (expired)</td></tr>
            </table>
          </td></tr>
        </table>

        <!-- New end date box — prominent teal/green background -->
        <div style="background:#e8f8f2;border:2px solid #1D9E75;border-radius:10px;padding:18px 20px;margin:0 0 20px;text-align:center;">
          <div style="font-size:13px;font-weight:600;color:#0F6E56;letter-spacing:.02em;margin-bottom:4px;">📅 Requested New End Date</div>
          <div style="font-size:24px;font-weight:700;color:#085041;">${formatDate(newEndDate)}</div>
          <div style="font-size:12px;color:#1D9E75;margin-top:6px;">
            This is a date extension only. The existing authorization number
            <strong>${po.authorization_number || 'Pending'}</strong> remains valid — no new authorization number is needed.
          </div>
        </div>

        <div style="text-align:center;margin:0 0 8px;">
          <a href="${approveUrl}" style="display:block;background:#1D9E75;color:#fff;text-decoration:none;padding:16px 24px;border-radius:50px;font-size:15px;font-weight:700;letter-spacing:.02em;">
            ✅ Approve Extension — I've submitted this to billing
          </a>
          <div style="font-size:12px;color:#a0b8c8;margin-top:10px;line-height:1.5;">
            By clicking Approve, you confirm the date extension has been submitted to your billing department.
            The authorization number remains the same.
          </div>
        </div>
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

/**
 * notifyCoordinatorNewFiscalYearPO — sends a new fiscal year PO notification to the coordinator.
 * Used when a booking crosses into a new fiscal year and a brand new PO is needed.
 * This requires a new authorization number (unlike a date extension).
 */
export async function notifyCoordinatorNewFiscalYearPO(poId: string, sessionsRemaining: number) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('notifyCoordinatorNewFiscalYearPO: missing Supabase service role config');
    return;
  }
  const serviceSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Fetch PO + swimmer + coordinator details
    const { data: po, error: poErr } = await serviceSupabase
      .from('purchase_orders')
      .select(`
        id, swimmer_id, sessions_authorized, sessions_used, start_date, end_date,
        swimmer:swimmers(
          id, first_name, last_name, uci_number,
          funding_coordinator_name, funding_coordinator_email, coordinator_email, coordinator_name
        )
      `)
      .eq('id', poId)
      .single();

    if (poErr || !po) {
      console.error('notifyCoordinatorNewFiscalYearPO: PO not found', { poId, error: poErr });
      return;
    }

    const swimmer = Array.isArray(po.swimmer) ? po.swimmer[0] : po.swimmer;
    if (!swimmer) {
      console.error('notifyCoordinatorNewFiscalYearPO: swimmer not found for PO', { poId });
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
        'notifyCoordinatorNewFiscalYearPO: no coordinator email on file; skipping email',
        { poId, swimmerId: swimmer.id }
      );
      return;
    }

    const swimmerName = `${swimmer.first_name ?? ''} ${swimmer.last_name ?? ''}`.trim();
    const startDateFormatted = formatDate(po.start_date);
    const endDateFormatted = formatDate(po.end_date);

    // 2. Generate approve token + 30-day expiry
    const token = generateApproveToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 3. Store approve token on PO
    const { error: updateErr } = await serviceSupabase
      .from('purchase_orders')
      .update({
        approve_token: token,
        approve_token_expires_at: expiresAt,
      })
      .eq('id', poId);

    if (updateErr) {
      console.error('notifyCoordinatorNewFiscalYearPO: failed to store approve_token', updateErr);
    }

    const approveUrl = getApproveUrl(token);

    // 4. Build new fiscal year PO email
    const subject = `New POS Authorization Needed — ${swimmerName} (New Fiscal Year)`;

    const content = `
      <div style="background:linear-gradient(135deg,#2A5E84 0%,#23A1C0 100%);padding:28px 36px;border-radius:8px 8px 0 0;">
        <div style="font-family:'DM Serif Display',Georgia,serif;color:#fff;font-size:20px;line-height:1.3;">
          <span style="display:block;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-bottom:4px;">I Can Swim Adaptive Aquatics</span>
          New POS Authorization Needed — New Fiscal Year
        </div>
      </div>
      <div style="background:#fff3e0;padding:12px 24px;border-bottom:1px solid #ffcc80;text-align:center;">
        <span style="font-size:12px;font-weight:700;color:#bf360c;letter-spacing:.04em;text-transform:uppercase;">⚠️ New Authorization Number Required</span>
      </div>
      <div style="padding:24px 28px;">
        <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#1a3347;">Hi ${coordinatorName || 'Coordinator'},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#3d5a6e;">
          A parent has requested a lesson for <strong style="color:#1a3347;">${swimmerName}</strong>, but this lesson
          falls in a <strong>new fiscal year</strong>. A brand new Purchase of Service authorization is needed
          with a new authorization number.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fbfd;border-radius:8px;border:1px solid #e2eef5;margin:0 0 20px;">
          <tr><td style="padding:14px 18px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;width:45%;">Client</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${swimmerName}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">UCI Number</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${swimmer.uci_number || 'Pending'}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">Sessions remaining (carried over)</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${sessionsRemaining}</td></tr>
              <tr><td style="padding:4px 8px 4px 0;color:#5a7a8e;">New PO period</td><td style="padding:4px 0;font-weight:600;color:#1a3347;">${startDateFormatted} — ${endDateFormatted}</td></tr>
            </table>
          </td></tr>
        </table>

        <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:18px 20px;margin:0 0 20px;">
          <div style="font-size:13px;font-weight:600;color:#7a5000;margin-bottom:6px;">⚠️ New Authorization Number Required</div>
          <p style="font-size:13px;color:#5a4a00;line-height:1.6;margin:0;">
            This is a new fiscal year PO and requires a <strong>new authorization number</strong> from VMRC/CVRC.
            Please submit a new POS request to your billing department.
          </p>
        </div>

        <div style="text-align:center;margin:0 0 8px;">
          <a href="${approveUrl}" style="display:block;background:#1D9E75;color:#fff;text-decoration:none;padding:16px 24px;border-radius:50px;font-size:15px;font-weight:700;letter-spacing:.02em;">
            ✅ Approve — I've submitted this to billing
          </a>
          <div style="font-size:12px;color:#a0b8c8;margin-top:10px;line-height:1.5;">
            By clicking Approve, you confirm a new POS request has been submitted to your billing department.
            A new authorization number will be required.
          </div>
        </div>
      </div>
    `;

    const html = wrapEmailWithHeader(content);

    await emailService.sendPOSNotification({
      to: coordinatorEmail,
      toName: coordinatorName || undefined,
      subject,
      html,
    });

    console.log(`Coordinator new fiscal year PO notification sent to ${coordinatorEmail} for PO ${poId}`);
  } catch (error) {
    console.error('Failed to send coordinator new fiscal year PO notification:', error);
  }
}

export interface RolloverClient {
  poId: string;
  swimmerName: string;
  uciNumber: string | null;
  sessionsRemaining: number;
  approveToken: string;
  approveUrl: string;
}

function buildRolloverClientRow(client: RolloverClient, isAlt: boolean): string {
  return `<tr style="${isAlt ? 'background:#fafcfd;' : ''}">
    <td style="padding:7px 8px;border-bottom:1px solid #f0f5f8;color:#1a3347;font-weight:500">${client.swimmerName}</td>
    <td style="padding:7px 8px;border-bottom:1px solid #f0f5f8;color:#5a7a8e">${client.uciNumber || 'Pending'}</td>
    <td style="padding:7px 8px;border-bottom:1px solid #f0f5f8;text-align:center">
      <span style="background:#e8f4fb;color:#0c447c;padding:2px 6px;border-radius:4px;font-weight:600">${client.sessionsRemaining}</span>
    </td>
    <td style="padding:7px 8px;border-bottom:1px solid #f0f5f8;color:#1a3347">Jul 1 – Oct 1, ${new Date().getFullYear()}</td>
    <td style="padding:7px 8px;border-bottom:1px solid #f0f5f8;text-align:center">
      <span style="background:#fff3cd;color:#7a5000;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">Pending Auth</span>
    </td>
    <td style="padding:7px 8px;border-bottom:1px solid #f0f5f8;text-align:center">
      <a href="${client.approveUrl}" style="display:inline-block;background:#1D9E75;color:#fff;text-decoration:none;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700">✓ Approve</a>
    </td>
  </tr>`;
}

/**
 * notifyCoordinatorFiscalYearRollover — sends a batch rollover email to a coordinator
 * covering ALL their clients who need new fiscal year POs. One email per coordinator
 * with per-row Approve buttons.
 */
export async function notifyCoordinatorFiscalYearRollover(
  coordinatorEmail: string,
  coordinatorName: string,
  clients: RolloverClient[]
) {
  if (clients.length === 0) return;

  const currentYear = new Date().getFullYear();
  const clientRows = clients.map((c, i) => buildRolloverClientRow(c, i % 2 === 1)).join('\n');

  const subject = `New Fiscal Year POS Required — ${clients.length} clients (July 1, ${currentYear})`;

  const content = `
    <div style="background:linear-gradient(135deg,#2A5E84 0%,#23A1C0 100%);padding:28px 36px;border-radius:8px 8px 0 0;">
      <div style="font-family:'DM Serif Display',Georgia,serif;color:#fff;font-size:20px;line-height:1.3;">
        <span style="display:block;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-bottom:4px;">I Can Swim Adaptive Aquatics</span>
        New Fiscal Year POS Required
      </div>
    </div>
    <div style="background:#fff8e1;padding:12px 24px;border-bottom:1px solid #ffe082;text-align:center;">
      <span style="font-size:12px;font-weight:700;color:#bf360c;letter-spacing:.04em;text-transform:uppercase;">⚠️ New Fiscal Year — New Authorization Required</span>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#1a3347;">Hi ${coordinatorName || 'Coordinator'},</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#3d5a6e;">
        The new fiscal year (July 1 – June 30) has begun. The following <strong>${clients.length} client${clients.length === 1 ? '' : 's'}</strong> require new Purchase of Service authorizations to continue their swim lessons. Each client has sessions remaining from their previous authorization.
      </p>

      <div style="background:#e8f4fd;border:1px solid #c5dff0;border-radius:8px;padding:12px 18px;margin:0 0 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#3a718e;padding:7px 8px;border-bottom:2px solid #c5dff0;">Client</td>
            <td style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#3a718e;padding:7px 8px;border-bottom:2px solid #c5dff0;">UCI</td>
            <td style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#3a718e;padding:7px 8px;border-bottom:2px solid #c5dff0;text-align:center;">Sessions</td>
            <td style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#3a718e;padding:7px 8px;border-bottom:2px solid #c5dff0;">New Period</td>
            <td style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#3a718e;padding:7px 8px;border-bottom:2px solid #c5dff0;text-align:center;">Status</td>
            <td style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#3a718e;padding:7px 8px;border-bottom:2px solid #c5dff0;text-align:center;">Approve</td>
          </tr>
          ${clientRows}
        </table>
      </div>

      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:16px 20px;margin:0 0 20px;">
        <div style="font-size:13px;font-weight:600;color:#7a5000;margin-bottom:6px;">⚠️ New Authorization Number Required</div>
        <p style="font-size:13px;color:#5a4a00;line-height:1.6;margin:0;">
          These are new fiscal year POs and require <strong>new authorization numbers</strong> from VMRC/CVRC. Please submit a new POS request to your billing department for each client and click Approve once submitted.
        </p>
      </div>

      <p style="margin:16px 0 0;font-size:13px;color:#8a9eb0;line-height:1.6;">
        This is an automated notification. If you have questions, please contact I Can Swim at (209) 778-7877 or info@icanswim209.com.
      </p>
    </div>
  `;

  const html = wrapEmailWithHeader(content);

  try {
    await emailService.sendPOSNotification({
      to: coordinatorEmail,
      toName: coordinatorName || undefined,
      subject,
      html,
    });
    console.log(`Fiscal year rollover email sent to ${coordinatorEmail} (${clients.length} clients)`);
  } catch (error) {
    console.error('Failed to send fiscal year rollover email:', error);
  }
}

/**
 * notifyParentPendingAuth — sends a pending auth summary email to the parent.
 * Used when a reminder is sent at day 7 to inform the parent about pending lessons.
 */
export async function notifyParentPendingAuth(swimmerId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('notifyParentPendingAuth: missing Supabase service role config');
    return;
  }
  const serviceSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Fetch swimmer + parent info
    const { data: swimmer, error: swimmerErr } = await serviceSupabase
      .from('swimmers')
      .select('id, first_name, last_name, parent_id')
      .eq('id', swimmerId)
      .single();

    if (swimmerErr || !swimmer) {
      console.error('notifyParentPendingAuth: swimmer not found', { swimmerId, error: swimmerErr });
      return;
    }

    const { data: parentProfile } = await serviceSupabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', swimmer.parent_id)
      .single();

    if (!parentProfile?.email) {
      console.warn('notifyParentPendingAuth: no parent email on file', { swimmerId });
      return;
    }

    const swimmerName = `${swimmer.first_name ?? ''} ${swimmer.last_name ?? ''}`.trim();

    // 2. Fetch pending_auth bookings with future session dates
    const { data: pendingBookings } = await serviceSupabase
      .from('bookings')
      .select('session_date')
      .eq('swimmer_id', swimmerId)
      .eq('status', 'pending_auth')
      .gte('session_date', new Date().toISOString().split('T')[0])
      .order('session_date', { ascending: true });

    // 3. Build email content
    const formattedDate = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    const pendingLessonsHtml = pendingBookings && pendingBookings.length > 0
      ? `
        <div style="background:#e8f4fd;border:1px solid #b8d8f0;border-radius:8px;padding:14px 18px;margin:18px 0;">
          <div style="font-size:14px;font-weight:600;color:#1a5a7a;margin-bottom:8px;">📅 Pending lessons — these will be confirmed once authorization is approved:</div>
          ${pendingBookings.map((b: { session_date: string }) =>
            `<div style="font-size:13px;color:#1a5a7a;padding:3px 0;">📅 ${formattedDate(b.session_date)}</div>`
          ).join('\n')}
        </div>`
      : '';

    const subject = `Update on ${swimmerName}'s upcoming lessons`;

    const content = `
      <h2 style="color: #2a5e84; margin-top: 0;">Lesson Update</h2>

      <p>Hi ${parentProfile.full_name || 'Parent'},</p>

      <p>We wanted to keep you updated on <strong>${swimmerName}</strong>'s upcoming lessons.</p>

      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px 18px;margin:18px 0;">
        <div style="font-size:14px;font-weight:600;color:#7a5000;margin-bottom:6px;">📋 Lessons Pending Authorization</div>
        <p style="font-size:13px;color:#5a4a00;line-height:1.6;margin:0;">
          We have reached out to your coordinator to request continued services for <strong>${swimmerName}</strong>. Please follow up with your coordinator directly to see if there is anything additional needed to complete the approval process.
        </p>
      </div>

      ${pendingLessonsHtml}

      <div style="background:#f0f6fa;border:1px solid #dde8f0;border-radius:8px;padding:14px 18px;margin:18px 0;">
        <div style="font-size:14px;font-weight:600;color:#1a3347;margin-bottom:6px;">Questions? We're here to help:</div>
        <div style="font-size:13px;color:#3d5a6e;line-height:1.8;">
          💬 Text: <a href="sms:2096437969" style="color:#23a1c0;">209-643-7969</a><br>
          📞 Call: <a href="tel:2097787877" style="color:#23a1c0;">(209) 778-7877</a><br>
          ✉️ <a href="mailto:info@icanswim209.com" style="color:#23a1c0;">info@icanswim209.com</a>
        </div>
      </div>

      <p style="font-size:13px;color:#5a7a8e;line-height:1.5;">
        Thank you for your patience while we work to get this resolved.<br>
        <strong>The I Can Swim Team 🏊</strong>
      </p>
    `;

    const html = wrapEmailWithHeader(content);

    await emailService.sendEmail({
      to: parentProfile.email,
      toName: parentProfile.full_name || undefined,
      templateType: 'custom',
      customData: { subject, html },
    });

    console.log(`Parent pending auth notification sent to ${parentProfile.email} for swimmer ${swimmerId}`);
  } catch (error) {
    console.error('Failed to send parent pending auth notification:', error);
  }
}

/**
 * notifyCoordinatorEnterAuthNumber — sends a follow-up email to the coordinator
 * asking them to enter the authorization number from VMRC/CVRC billing.
 * Triggered when PO has been approved_pending_auth for 3+ days with no auth number.
 */
export async function notifyCoordinatorEnterAuthNumber(poId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('notifyCoordinatorEnterAuthNumber: missing Supabase service role config');
    return;
  }
  const serviceSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Fetch PO + swimmer + coordinator details
    const { data: po, error: poErr } = await serviceSupabase
      .from('purchase_orders')
      .select(`
        id, swimmer_id, approved_at,
        swimmer:swimmers(
          id, first_name, last_name, uci_number,
          funding_coordinator_name, funding_coordinator_email, coordinator_email, coordinator_name
        )
      `)
      .eq('id', poId)
      .single();

    if (poErr || !po) {
      console.error('notifyCoordinatorEnterAuthNumber: PO not found', { poId, error: poErr });
      return;
    }

    const swimmer = Array.isArray(po.swimmer) ? po.swimmer[0] : po.swimmer;
    if (!swimmer) {
      console.error('notifyCoordinatorEnterAuthNumber: swimmer not found for PO', { poId });
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
        'notifyCoordinatorEnterAuthNumber: no coordinator email on file; skipping email',
        { poId, swimmerId: swimmer.id }
      );
      return;
    }

    const swimmerName = `${swimmer.first_name ?? ''} ${swimmer.last_name ?? ''}`.trim();
    const approvedDateFormatted = po.approved_at
      ? new Date(po.approved_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'N/A';

    const enterAuthUrl = `https://icanswimbeta.vercel.app/coordinator/pos/${poId}?action=enter-auth`;

    const subject = `Auth Number Needed — ${swimmerName} (approved, awaiting number)`;

    const content = `
      <h2 style="color: #2a5e84; margin-top: 0;">Authorization Number Needed</h2>

      <p>Hi ${coordinatorName || 'Coordinator'},</p>

      <p>Thank you for approving <strong>${swimmerName}</strong>'s POS request! We're following up because we haven't yet received the authorization number from billing.</p>

      <div style="background:#f7fbfd;border:1px solid #e2eef5;border-radius:8px;padding:16px 18px;margin:18px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
          <tr><td style="padding:3px 8px 3px 0;color:#5a7a8e;width:40%;">Client</td><td style="padding:3px 0;font-weight:600;color:#1a3347;">${swimmerName}</td></tr>
          <tr><td style="padding:3px 8px 3px 0;color:#5a7a8e;">UCI</td><td style="padding:3px 0;font-weight:600;color:#1a3347;">${swimmer.uci_number || 'Pending'}</td></tr>
          <tr><td style="padding:3px 8px 3px 0;color:#5a7a8e;">Approved on</td><td style="padding:3px 0;font-weight:600;color:#1a3347;">${approvedDateFormatted}</td></tr>
          <tr><td style="padding:3px 8px 3px 0;color:#5a7a8e;">Status</td><td style="padding:3px 0;"><span style="background:#fff3cd;color:#7a5000;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">Approved — Pending Auth Number</span></td></tr>
        </table>
      </div>

      <div style="background:#e8f8f2;border:2px solid #1D9E75;border-radius:10px;padding:18px 20px;margin:18px 0;text-align:center;">
        <div style="font-size:14px;font-weight:600;color:#0F6E56;margin-bottom:8px;">📋 Once you receive the authorization number from VMRC billing, please enter it in your portal to activate the purchase order.</div>
        <a href="${enterAuthUrl}" style="display:inline-block;background:#2A5E84;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;margin-top:8px;">
          Enter Auth Number in Portal →
        </a>
      </div>

      <p style="font-size:13px;color:#5a7a8e;line-height:1.5;">
        Authorization numbers typically arrive within 5–7 business days of submission.
      </p>
    `;

    const html = wrapEmailWithHeader(content);

    await emailService.sendPOSNotification({
      to: coordinatorEmail,
      toName: coordinatorName || undefined,
      subject,
      html,
    });

    console.log(`Enter auth number notification sent to ${coordinatorEmail} for PO ${poId}`);
  } catch (error) {
    console.error('Failed to send enter auth number notification:', error);
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