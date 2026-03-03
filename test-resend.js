// Test Resend connection
const { Resend } = require('resend');

// Check if RESEND_API_KEY is set
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('❌ RESEND_API_KEY environment variable is not set');
  console.log('Please set RESEND_API_KEY in your environment or .env.local file');
  console.log('Example: RESEND_API_KEY=re_xxxxxxxxxxxx');
  process.exit(1);
}

console.log('✅ RESEND_API_KEY is set (length:', resendApiKey.length, 'characters)');

// Initialize Resend
const resend = new Resend(resendApiKey);

async function testResend() {
  console.log('\nTesting Resend connection...');

  try {
    // Test 1: Check API key validity by trying to send a test email
    const testEmail = 'test@example.com'; // Change to a real email for testing
    const fromEmail = process.env.FROM_EMAIL || 'I Can Swim <noreply@icanswim209.com>';

    console.log('Sending test email to:', testEmail);
    console.log('From:', fromEmail);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [testEmail],
      subject: 'Test Email from I Can Swim',
      html: '<p>This is a test email from the I Can Swim application.</p>',
    });

    if (error) {
      console.error('❌ Resend error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Resend test successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('Error stack:', error.stack);
  }
}

// Also check current environment
console.log('\nCurrent environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'not set');

testResend();