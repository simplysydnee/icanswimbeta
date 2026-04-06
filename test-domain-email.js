// Test sending with actual domain email
const { Resend } = require('resend');

// Configuration - using the new API key you provided
const RESEND_API_KEY = 're_hxnG4f8p_NVkeqWfhsR79pumLCcEYpWCT';
const FROM_EMAIL     = 'noreply@icanswim209.com'; // Try actual domain
const FROM_NAME      = 'I Can Swim';
const REPLY_TO       = 'info@icanswim209.com';
const TEST_EMAIL     = 'sydnee@icanswim209.com'; // Send to verified email

// Initialize Resend
const resend = new Resend(RESEND_API_KEY);

async function sendTestEmail() {
  console.log('='.repeat(60));
  console.log('TEST WITH ACTUAL DOMAIN EMAIL');
  console.log('='.repeat(60));
  console.log(`Resend API Key: ${RESEND_API_KEY ? 'Set' : 'NOT SET!'}`);
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`To: ${TEST_EMAIL}`);
  console.log('='.repeat(60));

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      reply_to: REPLY_TO,
      to: [TEST_EMAIL],
      subject: 'Test: Using noreply@icanswim209.com',
      html: `
        <!DOCTYPE html>
        <html>
        <head><title>Domain Test Email</title></head>
        <body>
          <h1>Test Email from I Can Swim using noreply@icanswim209.com</h1>
          <p>This tests if the icanswim209.com domain is verified in Resend.</p>
          <p>If this works, we can send to assessment families.</p>
          <p>If it fails, domain needs verification.</p>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Resend error:', JSON.stringify(error, null, 2));
      if (error.message && error.message.includes('domain is not verified')) {
        console.log('\n🔧 ACTION REQUIRED:');
        console.log('1. Go to https://resend.com/domains');
        console.log('2. Add and verify icanswim209.com domain');
        console.log('3. Add DNS records provided by Resend to your domain');
        console.log('4. Wait for verification (usually 5-15 minutes)');
      }
    } else {
      console.log('✅ SUCCESS! Domain is verified!');
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('\n🎉 You can now send assessment waiver emails!');
      console.log('\nNext: Run the full assessment email script.');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

sendTestEmail().catch(console.error);