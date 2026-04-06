// ============================================================
// I Can Swim — Urgent Assessment Waiver Email
// Standalone Node.js version
// ============================================================

const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

// Configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_UN5Q8h3z_QAqccbfAM7gHx6yeGWUmQUDJ';
const FROM_EMAIL     = process.env.FROM_EMAIL || 'noreply@icanswim209.com';
const FROM_NAME      = 'I Can Swim';
const REPLY_TO       = 'info@icanswim209.com';
const PORTAL_URL     = 'https://app.icanswim209.com/waivers';
const DRY_RUN        = true; // Set to false for live mode

// Initialize Resend
const resend = new Resend(RESEND_API_KEY);

// ---- MOCK DATA FOR TESTING ----
// In a real implementation, you would fetch this from Airtable API
// For now, using mock data to test the email functionality
const mockRecords = [
  {
    id: '1',
    fields: {
      'Client Name (from Client)': 'John Smith',
      'Parent Name (from Client)': 'Jane Smith',
      'Email (from Client)': 'jane@example.com',
      'Signature to LLC Liability (from Client)': null,
      'Start Date/Time for Email': 'Tomorrow at 10:00 AM',
      'Address (from Session Group)': '1212 Kansas Ave, Modesto, CA 95351',
      'Booking Status': 'Confirmed'
    }
  },
  {
    id: '2',
    fields: {
      'Client Name (from Client)': 'Sarah Smith',
      'Parent Name (from Client)': 'Jane Smith',
      'Email (from Client)': 'jane@example.com',
      'Signature to LLC Liability (from Client)': null,
      'Start Date/Time for Email': 'Tomorrow at 10:30 AM',
      'Address (from Session Group)': '1212 Kansas Ave, Modesto, CA 95351',
      'Booking Status': 'Confirmed'
    }
  },
  {
    id: '3',
    fields: {
      'Client Name (from Client)': 'Mike Johnson',
      'Parent Name (from Client)': 'Mary Johnson',
      'Email (from Client)': 'mary@example.com',
      'Signature to LLC Liability (from Client)': null,
      'Start Date/Time for Email': 'Tomorrow at 11:00 AM',
      'Address (from Session Group)': '1212 Kansas Ave, Modesto, CA 95351',
      'Booking Status': 'Confirmed'
    }
  }
];

// Helper function to get cell value (mimicking Airtable's API)
function getCellValue(record, fieldName) {
  return record.fields[fieldName];
}

// ---- FILTER TO MISSING WAIVER ONLY ----
const allRecords = mockRecords;
console.log(`📋 Total assessment records: ${allRecords.length}`);

const missing = allRecords.filter(r => {
  const sig = getCellValue(r, 'Signature to LLC Liability (from Client)');
  return !sig;
});

console.log(`⚠️  Missing waiver signature: ${missing.length}`);
console.log(`✅ Already have signature: ${allRecords.length - missing.length}`);

if (missing.length === 0) {
  console.log('\n✅ All assessment families have signed waivers — nothing to send.');
  process.exit(0);
}

// ---- GROUP BY PARENT EMAIL ----
const byEmail = {};
for (const r of missing) {
  const emailRaw = getCellValue(r, 'Email (from Client)');
  const email = (emailRaw || '').trim().toLowerCase();
  if (!email) continue;
  if (!byEmail[email]) byEmail[email] = [];
  byEmail[email].push(r);
}

const groups = Object.entries(byEmail);
console.log(`\n📧 Unique families to email: ${groups.length}\n`);

// ---- EMAIL TEMPLATE ----
function buildEmail(parentName, swimmers) {
  const firstName = (parentName || 'there').split(' ')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const multi = swimmers.length > 1;

  const swimmerCards = swimmers.map(s => `
        <tr>
          <td style="padding:0 0 10px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#fff8e6;border:1.5px solid #f5a623;border-radius:8px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#7a4f00;">${s.name}</p>
                  <p style="margin:0 0 3px;font-size:13px;color:#9a6200;">${s.datetime}</p>
                  <p style="margin:0;font-size:13px;color:#9a6200;">📍 ${s.address}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join('');

  const subheading = multi
    ? `Urgent: documents required before tomorrow's assessments`
    : `Urgent: documents required before ${swimmers[0].name}'s assessment`;

  const intro = multi
    ? `Your swimmers have initial assessments scheduled for <strong>tomorrow</strong>. We're missing signed documents for:`
    : `<strong>${swimmers[0].name}</strong> has an initial assessment scheduled for <strong>${swimmers[0].datetime}</strong>. We are missing signed documents required before we can proceed.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Urgent: Documents Required — I Can Swim</title>
</head>
<body style="margin:0;padding:0;background:#f0f6fa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f6fa;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr>
    <td style="background:#c0392b;border-radius:12px 12px 0 0;padding:10px 24px;text-align:center;">
      <p style="color:white;font-size:13px;font-weight:700;margin:0;letter-spacing:0.5px;text-transform:uppercase;">
        ⚠️ Action Required Before Tomorrow's Assessment
      </p>
    </td>
  </tr>

  <tr>
    <td align="center" style="background:#2A5E84;padding:28px 40px;">
      <h1 style="color:white;font-size:24px;font-weight:700;margin:0 0 6px;letter-spacing:-0.3px;">
        Documents Required
      </h1>
      <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">${subheading}</p>
    </td>
  </tr>

  <tr>
    <td style="background:white;padding:32px 40px;">
      <p style="font-size:16px;color:#1a2e3b;margin:0 0 14px;">Hi ${displayName},</p>
      <p style="font-size:15px;color:#4a6070;line-height:1.75;margin:0 0 20px;">${intro}</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        ${swimmerCards}
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background:#f0f6fa;border-left:4px solid #2A5E84;border-radius:0 8px 8px 0;padding:16px 18px;">
            <p style="font-size:13px;font-weight:700;color:#2A5E84;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;">Documents needed</p>
            <p style="font-size:14px;color:#1a2e3b;margin:0 0 6px;">📄 Waiver &amp; Release of Liability</p>
            <p style="font-size:14px;color:#1a2e3b;margin:0 0 6px;">📄 Terms of Service</p>
            <p style="font-size:14px;color:#1a2e3b;margin:0;">📄 Privacy Policy</p>
          </td>
        </tr>
      </table>

      <p style="font-size:15px;color:#4a6070;line-height:1.75;margin:0 0 8px;">
        <strong style="color:#c0392b;">Please complete these before your appointment.</strong>
        It only takes a few minutes through your parent portal.
      </p>
      <p style="font-size:14px;color:#4a6070;line-height:1.75;margin:0 0 28px;">
        If documents are not completed prior to the assessment, we may need to pause until they are on file.
      </p>

      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <a href="${PORTAL_URL}"
               style="display:inline-block;background:#c0392b;color:white;text-decoration:none;
                      font-size:16px;font-weight:700;padding:16px 44px;border-radius:8px;">
              Complete Documents Now →
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:#9ab0bf;text-align:center;margin:14px 0 0;">
        Or visit: <a href="${PORTAL_URL}" style="color:#23A1C0;">${PORTAL_URL}</a>
      </p>
    </td>
  </tr>

  <tr>
    <td style="background:#f8fbfd;border-top:1px solid #d0e4ed;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
      <p style="font-size:13px;color:#6b8899;margin:0 0 4px;">
        Questions? Reply to this email or text us at
        <a href="sms:2096437969" style="color:#23A1C0;">209-643-7969</a>
      </p>
      <p style="font-size:12px;color:#9ab0bf;margin:0;">
        I Can Swim Adaptive Aquatics &nbsp;·&nbsp; icanswim209.com
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ---- SEND VIA RESEND ----
async function sendEmail(to, subject, html) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would send email to: ${to}`);
    console.log(`Subject: ${subject}`);
    return { id: 'dry-run-mock-id' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      reply_to: REPLY_TO,
      to: [to],
      subject: subject,
      html: html
    });

    if (error) {
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// ---- MAIN EXECUTION ----
async function main() {
  console.log('='.repeat(60));
  console.log('I CAN SWIM - URGENT ASSESSMENT WAIVER EMAIL SCRIPT');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no emails will be sent)' : 'LIVE MODE (emails will be sent)'}`);
  console.log(`Resend API Key: ${RESEND_API_KEY ? 'Set' : 'NOT SET!'}`);
  console.log(`From Email: ${FROM_EMAIL}`);
  console.log('='.repeat(60));

  if (!RESEND_API_KEY) {
    console.error('❌ ERROR: RESEND_API_KEY is not set!');
    console.error('Please set it in your .env.local file or environment variables.');
    process.exit(1);
  }

  let sent = 0;
  let failed = 0;

  for (const [email, records] of groups) {
    const parentNameRaw = getCellValue(records[0], 'Parent Name (from Client)');
    const parentName = parentNameRaw || '';

    const swimmers = records.map(r => {
      const nameRaw = getCellValue(r, 'Client Name (from Client)');
      const datetimeRaw = getCellValue(r, 'Start Date/Time for Email');
      const addressRaw = getCellValue(r, 'Address (from Session Group)');
      return {
        name: (nameRaw || 'your swimmer').trim(),
        datetime: datetimeRaw || 'tomorrow morning',
        address: addressRaw || '1212 Kansas Ave, Modesto, CA 95351',
      };
    });

    const swimmerNames = swimmers.map(s => s.name).join(' & ');
    const subject = swimmers.length > 1
      ? `⚠️ Urgent: documents required before tomorrow's assessments`
      : `⚠️ Urgent: documents required before ${swimmers[0].name}'s assessment tomorrow`;

    if (DRY_RUN) {
      console.log(`\n[DRY RUN] Would send to: ${email} (${parentName})`);
      swimmers.forEach(s => console.log(`  • ${s.name} — ${s.datetime} — ${s.address}`));
      sent++;
      continue;
    }

    try {
      const html = buildEmail(parentName, swimmers);
      await sendEmail(email, subject, html);
      console.log(`✅ Sent → ${email} (${parentName}) — ${swimmerNames}`);
      sent++;
    } catch (e) {
      console.log(`❌ Failed: ${email} — ${e.message}`);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Done!  Sent: ${sent}  |  Failed: ${failed}`);
  console.log(`${'='.repeat(50)}`);
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});