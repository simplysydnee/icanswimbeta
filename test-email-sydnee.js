// Send test email to sydneesmerchant@gmail.com
const { Resend } = require('resend');

// Configuration
const RESEND_API_KEY = 're_hxnG4f8p_NVkeqWfhsR79pumLCcEYpWCT';
const FROM_EMAIL = 'noreply@icanswim209.com';
const FROM_NAME = 'I Can Swim';
const REPLY_TO = 'info@icanswim209.com';
const TEST_EMAIL = 'sydneesmerchant@gmail.com';
const PORTAL_URL = 'https://app.icanswim209.com/waivers';

// Initialize Resend
const resend = new Resend(RESEND_API_KEY);

async function sendTestEmail() {
  console.log('='.repeat(60));
  console.log('SENDING TEST EMAIL TO SYDNEE');
  console.log('='.repeat(60));
  console.log(`Resend API Key: ${RESEND_API_KEY ? 'Set' : 'NOT SET!'}`);
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`To: ${TEST_EMAIL}`);
  console.log(`Subject: Test — Sign Updated Documents`);
  console.log('='.repeat(60));

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      reply_to: REPLY_TO,
      to: [TEST_EMAIL],
      subject: 'Test — Sign Updated Documents',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Test — Sign Updated Documents</title>
</head>
<body style="margin:0;padding:0;background:#f0f6fa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f6fa;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr>
    <td style="background:#2A5E84;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
      <h1 style="color:white;font-size:24px;font-weight:700;margin:0 0 6px;letter-spacing:-0.3px;">
        I Can Swim Test Email
      </h1>
      <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">Test — Sign Updated Documents</p>
    </td>
  </tr>

  <tr>
    <td style="background:white;padding:32px 40px;">
      <p style="font-size:16px;color:#1a2e3b;margin:0 0 14px;">Hi there,</p>
      <p style="font-size:15px;color:#4a6070;line-height:1.75;margin:0 0 20px;">
        This is a test email to verify the email delivery system is working correctly.
      </p>

      <p style="font-size:15px;color:#4a6070;line-height:1.75;margin:0 0 24px;">
        Please click the button below to access the waiver portal:
      </p>

      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <a href="${PORTAL_URL}"
               style="display:inline-block;background:#2A5E84;color:white;text-decoration:none;
                      font-size:16px;font-weight:700;padding:16px 44px;border-radius:8px;">
              Access Waiver Portal →
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
</html>`
    });

    if (error) {
      console.error('❌ Resend error:', JSON.stringify(error, null, 2));
      console.log('\nPossible issues:');
      console.log('1. API key may not have permission for this domain');
      console.log('2. Domain may need verification with this API key');
      console.log('3. Email address may not be allowed');
    } else {
      console.log('✅ Test email sent successfully!');
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log(`\n📧 Check your inbox at ${TEST_EMAIL}`);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

sendTestEmail().catch(console.error);