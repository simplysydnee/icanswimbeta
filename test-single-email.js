// Test sending a single email to info@icanswim209.com
const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

// Configuration
const RESEND_API_KEY = 're_hxnG4f8p_NVkeqWfhsR79pumLCcEYpWCT';
const FROM_EMAIL     = 'onboarding@resend.dev'; // Test domain
const FROM_NAME      = 'I Can Swim Test';
const REPLY_TO       = 'info@icanswim209.com';
const TEST_EMAIL     = 'sydnee@icanswim209.com'; // Only allowed recipient for test domain

// Initialize Resend
const resend = new Resend(RESEND_API_KEY);

async function sendTestEmail() {
  console.log('='.repeat(60));
  console.log('TEST EMAIL TO VERIFY RESEND CONNECTION');
  console.log('='.repeat(60));
  console.log(`Resend API Key: ${RESEND_API_KEY ? 'Set' : 'NOT SET!'}`);
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`To: ${TEST_EMAIL}`);
  console.log('='.repeat(60));

  if (!RESEND_API_KEY) {
    console.error('❌ ERROR: RESEND_API_KEY is not set!');
    process.exit(1);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      reply_to: REPLY_TO,
      to: [TEST_EMAIL],
      subject: 'Test: Urgent Assessment Waiver Email Script',
      html: `
        <!DOCTYPE html>
        <html>
        <head><title>Test Email</title></head>
        <body>
          <h1>Test Email from I Can Swim Assessment Script</h1>
          <p>This is a test email to verify the Resend connection works.</p>
          <p>If you receive this, the script is working correctly.</p>
          <p>Next step: Verify your domain at <a href="https://resend.com/domains">resend.com/domains</a></p>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Resend error:', JSON.stringify(error, null, 2));
      console.log('\nPossible solutions:');
      console.log('1. Verify your domain at https://resend.com/domains');
      console.log('2. Use a different email service');
      console.log('3. Contact Resend support');
    } else {
      console.log('✅ Test email sent successfully!');
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('\n📧 Check your inbox at info@icanswim209.com');
      console.log('\nNext steps:');
      console.log('1. Verify your icanswim209.com domain at https://resend.com/domains');
      console.log('2. Once verified, update FROM_EMAIL to use your domain');
      console.log('3. Run the full assessment email script');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  }
}

sendTestEmail().catch(console.error);