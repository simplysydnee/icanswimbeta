/**
 * PO Renewal Coordinator Email — rich HTML template
 *
 * Renders with {{placeholder}} replacement (NOT template literals)
 * so the HTML can stay as-is from the design file.
 */

export interface PO_renewalTemplateData {
  coordinatorName: string
  swimmerName: string
  sessionsAuthorized: number
  uciNumber: string
  neededByDate: string
  startDate: string
  endDate: string
  masteredCount: number
  targetsMastered: number
  targetsTotal: number
  approveUrl: string
  masteredSkillsHtml: string
  upcomingSkillsHtml: string
  targetsHtml: string
}

export function renderPORenewalCoordinatorEmail(data: PO_renewalTemplateData): string {
  let html = TEMPLATE

  const replacements: Record<string, string> = {
    '{{coordinator_name}}': escapeHtml(data.coordinatorName),
    '{{swimmer_name}}': escapeHtml(data.swimmerName),
    '{{sessions_authorized}}': String(data.sessionsAuthorized),
    '{{uci_number}}': escapeHtml(data.uciNumber),
    '{{needed_by_date}}': escapeHtml(data.neededByDate),
    '{{start_date}}': escapeHtml(data.startDate),
    '{{end_date}}': escapeHtml(data.endDate),
    '{{mastered_count}}': String(data.masteredCount),
    '{{targets_mastered}}': String(data.targetsMastered),
    '{{targets_total}}': String(data.targetsTotal),
    '{{approve_url}}': data.approveUrl,
    '{{{RESEND_UNSUBSCRIBE_URL}}}': '{{{RESEND_UNSUBSCRIBE_URL}}}',
  }

  // Insert dynamic table rows
  html = html.replace(
    '<!-- MASTERED SKILLS ROWS — insert dynamically -->',
    data.masteredSkillsHtml || '<tr><td style="padding:8px 10px;color:#8a9eb0;text-align:center;" colspan="3">No skills mastered yet</td></tr>'
  )
  html = html.replace(
    '<!-- UPCOMING SKILLS ROWS — insert dynamically -->',
    data.upcomingSkillsHtml || '<tr><td style="padding:8px 10px;color:#8a9eb0;text-align:center;" colspan="2">All skills completed — great work!</td></tr>'
  )

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(key, value)
  }

  return html
}

const LEVEL_BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  white: { bg: '#E1F5EE', color: '#085041' },
  red: { bg: '#FAECE7', color: '#712B13' },
  orange: { bg: '#faeeda', color: '#633806' },
  yellow: { bg: '#faeeda', color: '#633806' },
  green: { bg: '#E6F1FB', color: '#0C447C' },
  blue: { bg: '#EEEDFE', color: '#3C3489' },
  purple: { bg: '#EEEDFE', color: '#3C3489' },
}

function levelBadgeStyle(levelName: string): { bg: string; color: string } {
  const key = levelName.toLowerCase()
  return LEVEL_BADGE_STYLES[key] ?? { bg: '#E2E8F0', color: '#334155' }
}

export function buildMasteredSkillRow(
  levelName: string,
  skillName: string,
  dateMet: string,
): string {
  const style = levelBadgeStyle(levelName)
  return `<tr><td style="padding:5px 10px;border-bottom:1px solid #f0f5f8;"><span style="background:${style.bg};color:${style.color};padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;">${escapeHtml(levelName)}</span></td><td style="padding:5px 10px;color:#1a3347;border-bottom:1px solid #f0f5f8;">${escapeHtml(skillName)}</td><td style="padding:5px 10px;color:#8a9eb0;border-bottom:1px solid #f0f5f8;text-align:right;white-space:nowrap;">${escapeHtml(dateMet)}</td></tr>`
}

export function buildUpcomingSkillRow(
  levelName: string,
  skillName: string,
): string {
  const style = levelBadgeStyle(levelName)
  return `<tr style="background:#fafcfd;"><td style="padding:5px 10px;border-bottom:1px solid #f0f5f8;width:80px;"><span style="background:${style.bg};color:${style.color};padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;">${escapeHtml(levelName)}</span></td><td style="padding:5px 10px;color:#1a3347;border-bottom:1px solid #f0f5f8;">${escapeHtml(skillName)}</td></tr>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#f0f6fa;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f6fa;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.12);">

  <!-- Red alert banner -->
  <tr><td style="background:#c0392b;padding:18px 28px;text-align:center;">
    <div style="font-size:14px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.4);">🚨 Action Required — New POS Authorization Needed 🚨</div>
  </td></tr>

  <!-- Hero -->
  <tr><td style="background:linear-gradient(135deg,#2A5E84 0%,#23A1C0 100%);padding:24px 36px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><div style="font-family:'DM Serif Display',Georgia,serif;color:#fff;font-size:21px;line-height:1.2;">
        <span style="display:block;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-bottom:4px;">I Can Swim Adaptive Aquatics</span>
        POS Renewal — Progress Report
      </div></td>
      <td style="text-align:right;font-size:44px;">🏊</td>
    </tr></table>
  </td></tr>

  <!-- Warning badge -->
  <tr><td style="background:#fff8e1;padding:12px 28px;border-bottom:1px solid #ffe082;">
    <div style="display:inline-flex;align-items:center;gap:10px;background:#fff3cd;border:2px solid #f9a825;border-radius:50px;padding:7px 16px;">
      <div style="width:10px;height:10px;border-radius:50%;background:#e65100;flex-shrink:0;display:inline-block;"></div>
      <span style="font-size:12px;font-weight:700;color:#bf360c;letter-spacing:.04em;text-transform:uppercase;">⚠️ &nbsp;Immediate Attention Needed</span>
    </div>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:26px 36px 20px;">
    <p style="margin:0 0 14px;font-size:17px;font-weight:600;color:#1a3347;">Hi {{coordinator_name}},</p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#3d5a6e;">I hope you're doing well! I'm reaching out regarding <strong style="color:#1a3347;">{{swimmer_name}}</strong> — they have <strong>completed their {{sessions_authorized}} authorized sessions</strong> at I Can Swim and a new Purchase of Service authorization is required to continue services.</p>

    <!-- Sessions row -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 18px;background:linear-gradient(135deg,#e8f4fb,#f0fdf4);border-left:4px solid #23A1C0;border-radius:0 8px 8px 0;">
    <tr><td style="padding:13px 16px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:20px;padding-right:12px;">✅</td>
        <td><div style="font-size:14px;font-weight:600;color:#1a4a5e;line-height:1.4;">{{sessions_authorized}} of {{sessions_authorized}} Authorized Sessions Completed
          <span style="display:block;font-size:12px;font-weight:500;color:#5a8a9e;margin-top:2px;">Service: Adaptive Swim Lessons (Code 102) · UCI: {{uci_number}}</span>
        </div></td>
      </tr></table>
    </td></tr></table>

    <!-- Deadline box -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;background:#fff;border:2px solid #c0392b;border-radius:10px;">
    <tr><td style="padding:16px 18px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#c0392b;margin-bottom:5px;">🔴 Needed by — Next Scheduled Lesson</div>
      <div style="font-size:18px;font-weight:600;color:#1a1a1a;">{{needed_by_date}}</div>
      <div style="font-size:13px;color:#8a5050;margin-top:5px;font-weight:500;">By clicking Approve below, you confirm that lessons may resume and that you have submitted a POS request to your billing department for processing.</div>
    </td></tr></table>

    <!-- PO details -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;background:#f7fbfd;border-radius:8px;border:1px solid #e2eef5;">
    <tr><td style="padding:14px 18px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
        <tr>
          <td style="padding:4px 8px 4px 0;color:#5a7a8e;width:50%;">Requested start date</td>
          <td style="padding:4px 0;font-weight:600;color:#1a3347;">{{start_date}}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px 4px 0;color:#5a7a8e;">Requested end date</td>
          <td style="padding:4px 0;font-weight:600;color:#1a3347;">{{end_date}}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px 4px 0;color:#5a7a8e;">Sessions requested</td>
          <td style="padding:4px 0;font-weight:600;color:#1a3347;">12 lessons</td>
        </tr>
        <tr>
          <td style="padding:4px 8px 4px 0;color:#5a7a8e;">Service code</td>
          <td style="padding:4px 0;font-weight:600;color:#1a3347;">102</td>
        </tr>
      </table>
    </td></tr></table>

    <!-- Progress report heading -->
    <div style="font-size:13px;font-weight:700;color:#1a3347;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #e2eef5;">Progress Report</div>

    <!-- Skills mastered -->
    <div style="margin:0 0 6px;display:flex;align-items:center;gap:7px;">
      <span style="color:#1D9E75;">✅</span>
      <span style="font-size:13px;font-weight:600;color:#1a3347;">Skills mastered ({{mastered_count}})</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;border-collapse:collapse;margin:0 0 4px;">
      <thead>
        <tr style="background:#f7fbfd;">
          <th style="text-align:left;padding:5px 10px;font-weight:600;color:#3d5a6e;border-bottom:1px solid #e2eef5;width:80px;">Level</th>
          <th style="text-align:left;padding:5px 10px;font-weight:600;color:#3d5a6e;border-bottom:1px solid #e2eef5;">Skill</th>
          <th style="text-align:right;padding:5px 10px;font-weight:600;color:#3d5a6e;border-bottom:1px solid #e2eef5;white-space:nowrap;">Date met</th>
        </tr>
      </thead>
      <tbody>
        <!-- MASTERED SKILLS ROWS — insert dynamically -->
      </tbody>
    </table>
    <div style="font-size:11px;color:#8a9eb0;margin:0 0 16px;padding-left:2px;">+ additional skills mastered. Full list attached in PDF.</div>

    <!-- Upcoming skills -->
    <div style="margin:0 0 6px;display:flex;align-items:center;gap:7px;">
      <span>🎯</span>
      <span style="font-size:13px;font-weight:600;color:#1a3347;">Next skills to work toward</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;border-collapse:collapse;margin:0 0 16px;">
      <tbody>
        <!-- UPCOMING SKILLS ROWS — insert dynamically -->
      </tbody>
    </table>

    <!-- Targets -->
    <div style="margin:0 0 6px;display:flex;align-items:center;gap:7px;">
      <span>📋</span>
      <span style="font-size:13px;font-weight:600;color:#1a3347;">Program targets — {{targets_mastered}} of {{targets_total}} met</span>
    </div>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;background:#f0fdf4;border-radius:8px;border:1px solid #9FE1CB;">
    <tr><td style="padding:10px 14px;font-size:12px;color:#085041;line-height:1.6;">
      All {{targets_mastered}} individual program targets have been met this authorization period. New targets will be established at the start of the next period.
    </td></tr></table>

    <!-- Divider -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 22px;">
    <tr><td style="height:1px;background:linear-gradient(90deg,transparent,#d4e8f5,transparent);"></td></tr></table>

    <!-- Approve CTA -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 16px;">
    <tr><td style="text-align:center;">
      <a href="{{approve_url}}" style="display:inline-block;background:#1D9E75;color:#fff;text-decoration:none;padding:16px 48px;border-radius:50px;font-size:15px;font-weight:700;letter-spacing:.02em;">
        ✅ Approve — I've submitted this request to billing
      </a>
      <div style="font-size:12px;color:#a0b8c8;margin-top:10px;">No login required. By clicking you confirm you've submitted a POS request to VMRC billing on behalf of this client.</div>
    </td></tr></table>

    <p style="margin:0;font-size:14px;color:#5a7a8e;line-height:1.7;">Progress reports and start/end dates are attached as a PDF — please let us know if you need us to resend.<br><br>Thank you,<br><strong style="color:#1a3347;">The I Can Swim Team 🏊</strong></p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f7fbfd;border-top:1px solid #e2eef5;padding:18px 36px;text-align:center;">
    <div style="font-family:'DM Serif Display',Georgia,serif;font-size:15px;color:#2A5E84;margin-bottom:5px;">The I Can Swim Team</div>
    <div style="font-size:12px;color:#8fa8bc;margin-bottom:8px;">Serving families in Modesto &amp; Turlock, CA</div>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
      <td style="padding:0 10px;"><a href="sms:2096437969" style="font-size:12px;color:#23A1C0;text-decoration:none;">💬 (209) 643-7969</a></td>
      <td style="padding:0 10px;"><a href="tel:2097787877" style="font-size:12px;color:#23A1C0;text-decoration:none;">📞 (209) 778-7877</a></td>
      <td style="padding:0 10px;"><a href="mailto:info@icanswim209.com" style="font-size:12px;color:#23A1C0;text-decoration:none;">✉️ info@icanswim209.com</a></td>
    </tr></table>
    <div style="margin-top:10px;font-size:11px;"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#b0c8d8;font-size:11px;">Unsubscribe</a></div>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`
