// Debug script to test email delivery for admin invitations
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_EMAIL_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://icanswimbeta.vercel.app';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SECRET_KEY not found in .env.local');
  process.exit(1);
}

console.log('Debugging email delivery for admin invitations...');
console.log('Supabase URL:', supabaseUrl);
console.log('App URL:', appUrl);

// Create Supabase client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSupabaseAuthConfiguration() {
  console.log('\n=== CHECKING SUPABASE AUTH CONFIGURATION ===');

  try {
    // Try to get auth settings or test email sending
    console.log('1. Checking if we can fetch auth config...');

    // Note: There's no direct API to get auth config, but we can check email logs
    console.log('   Supabase Auth dashboard should show email logs at:');
    console.log('   https://supabase.com/dashboard/project/jtqlamkrhdfwtmaubfrc/auth/logs');

    console.log('\n2. Testing password reset link generation...');
    const testEmail = 'test@example.com'; // Using test email

    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: testEmail,
      options: {
        redirectTo: `${appUrl}/reset-password`
      }
    });

    if (resetError) {
      console.log('   ❌ Error generating reset link:', resetError.message);
      console.log('   This could indicate:');
      console.log('   - Site URL not configured in Supabase Auth');
      console.log('   - Email provider not configured');
      console.log('   - Service role key permissions issue');
    } else {
      console.log('   ✅ Reset link generation succeeded');
      console.log('   Check Supabase Auth logs for email sending status');
    }

  } catch (error) {
    console.error('❌ Error checking auth config:', error.message);
  }
}

async function testEdgeFunctionEmail() {
  console.log('\n=== TESTING EDGE FUNCTION EMAIL ===');

  try {
    console.log('1. Checking send-enrollment-email edge function...');

    // Create a regular Supabase client (not admin) to call edge function
    const supabaseAnon = createClient(supabaseUrl, supabaseServiceKey);

    const testEmail = 'sydnee@simplysydnee.com'; // Use Sydnee's email for testing

    console.log('2. Attempting to send test email via edge function...');
    console.log('   To:', testEmail);
    console.log('   Template: parent_invitation');

    const { data, error } = await supabaseAnon.functions.invoke('send-enrollment-email', {
      body: {
        to: testEmail,
        templateType: 'parent_invitation',
        toName: 'Sydnee Admin',
        customData: {
          subject: 'Test Admin Invitation - I Can Swim Beta',
          html: `
            <h1>Test Admin Invitation</h1>
            <p>Hello Sydnee Admin,</p>
            <p>This is a test email from the edge function to verify email delivery.</p>
            <p>If you receive this, the Gmail SMTP configuration is working.</p>
            <p><a href="${appUrl}">Login to I Can Swim Beta</a></p>
          `
        }
      }
    });

    if (error) {
      console.log('   ❌ Edge function error:', error.message);
      console.log('   Possible issues:');
      console.log('   - Edge function requires JWT authentication (verify_jwt: true)');
      console.log('   - Edge function not properly configured');
      console.log('   - Gmail credentials not set in edge function environment');
    } else {
      console.log('   ✅ Edge function response:', data);
      console.log('   Check if Sydnee received the email');
    }

  } catch (error) {
    console.error('❌ Error testing edge function:', error.message);
  }
}

async function checkUserEmailConfirmationStatus() {
  console.log('\n=== CHECKING USER EMAIL STATUS ===');

  try {
    const users = [
      { email: 'asira@gotoss.com', name: 'Asira Admin' },
      { email: 'sydnee@simplysydnee.com', name: 'Sydnee Admin' }
    ];

    for (const user of users) {
      console.log(`\nChecking ${user.email}:`);

      // Try to get user by email
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.log('   ❌ Error listing users:', error.message);
        continue;
      }

      const foundUser = data.users.find(u => u.email === user.email);
      if (foundUser) {
        console.log('   ✅ User found in auth system');
        console.log('   User ID:', foundUser.id);
        console.log('   Email confirmed:', foundUser.email_confirmed_at ? 'Yes' : 'No');
        console.log('   Confirmation sent at:', foundUser.confirmation_sent_at || 'Never');
        console.log('   Last sign in:', foundUser.last_sign_in_at || 'Never');

        if (!foundUser.email_confirmed_at) {
          console.log('   ⚠️ Email not confirmed - invitation may not have been sent');
        }
      } else {
        console.log('   ❌ User not found in auth system');
      }
    }

  } catch (error) {
    console.error('❌ Error checking user status:', error.message);
  }
}

async function manualPasswordResetTest() {
  console.log('\n=== MANUAL PASSWORD RESET TEST ===');

  try {
    console.log('Testing password reset for Sydnee (new user)...');
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: 'sydnee@simplysydnee.com',
      options: {
        redirectTo: `${appUrl}/reset-password`
      }
    });

    if (resetError) {
      console.log('❌ Password reset failed:', resetError.message);
    } else {
      console.log('✅ Password reset link generated');
      console.log('Check Supabase Auth logs for email sending');
    }

  } catch (error) {
    console.error('❌ Manual reset test error:', error.message);
  }
}

async function main() {
  console.log('Starting email delivery debugging...\n');

  await checkSupabaseAuthConfiguration();
  await checkUserEmailConfirmationStatus();
  await testEdgeFunctionEmail();
  await manualPasswordResetTest();

  console.log('\n' + '='.repeat(80));
  console.log('📋 DEBUGGING SUMMARY');
  console.log('='.repeat(80));
  console.log('\n🔍 Next steps to investigate:');
  console.log('1. Check Supabase Auth dashboard → Email Logs');
  console.log('   URL: https://supabase.com/dashboard/project/jtqlamkrhdfwtmaubfrc/auth/logs');
  console.log('\n2. Verify Site URL configuration:');
  console.log('   - Go to Authentication → URL Configuration');
  console.log('   - Set Site URL to: https://icanswimbeta.vercel.app');
  console.log('   - Add redirect URLs as needed');
  console.log('\n3. Check email provider configuration:');
  console.log('   - Supabase default provider has low rate limits');
  console.log('   - Consider configuring custom SMTP in Auth → Providers → Email');
  console.log('\n4. If using edge function for emails:');
  console.log('   - Verify GMAIL_USER and GMAIL_APP_PASSWORD env vars are set');
  console.log('   - Check edge function logs for errors');
  console.log('\n5. Emergency workaround:');
  console.log('   - Use scripts/admin/set-asira-password.js to manually set passwords');
  console.log('   - Share credentials securely with administrators');
  console.log('\n6. Check spam folders and email filters');
  console.log('='.repeat(80));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});