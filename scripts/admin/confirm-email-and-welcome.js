// Confirm email and send welcome email for admin users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.migration' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.APP_URL || 'https://icanswimbeta.vercel.app';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found.');
  process.exit(1);
}

console.log('Confirming email and sending welcome for admin users...');
console.log('URL:', supabaseUrl);
console.log('App URL:', appUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function confirmUserEmail(userId, email) {
  console.log(`\nConfirming email for: ${email}`);

  try {
    // Try to confirm email via admin API
    // Note: Supabase admin API doesn't have direct email confirmation endpoint
    // But we can update user to mark as confirmed
    console.log('Attempting to confirm email via updateUserById...');

    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (error) {
      console.log('❌ Error confirming email:', error.message);
      console.log('Note: Some Supabase versions require different approach');
      return false;
    }

    console.log('✅ Email confirmation attempted');
    console.log('Check user status after update');

    // Verify update
    const { data: verifyData, error: verifyError } = await supabase.auth.admin.getUserById(userId);
    if (verifyError) {
      console.log('❌ Error verifying user:', verifyError.message);
    } else {
      console.log('✅ User verification successful');
      console.log('Email confirmed:', verifyData.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('Updated at:', verifyData.user.updated_at);
      return !!verifyData.user.email_confirmed_at;
    }

    return false;

  } catch (error) {
    console.error('❌ Exception confirming email:', error.message);
    return false;
  }
}

async function sendWelcomeEmail(email, name, password) {
  console.log(`\nSending welcome email to: ${email}`);

  try {
    // Use the edge function to send welcome email
    const supabaseAnon = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAnon.functions.invoke('send-enrollment-email', {
      body: {
        to: email,
        templateType: 'parent_invitation',
        toName: name,
        customData: {
          subject: `Welcome to I Can Swim Beta - Administrator Access`,
          html: `
            <h1>Welcome to I Can Swim Beta!</h1>
            <p>Hello ${name},</p>
            <p>You have been granted administrator access to the I Can Swim Beta application.</p>

            <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2a5e84;">
              <h3 style="margin-top: 0;">Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p><strong>Login URL:</strong> <a href="${appUrl}">${appUrl}</a></p>
            </div>

            <p><strong>Important Security Note:</strong></p>
            <ul>
              <li>Log in immediately using the credentials above</li>
              <li>Change your password after first login</li>
              <li>Do not share these credentials with anyone</li>
            </ul>

            <p><strong>As an administrator, you can:</strong></p>
            <ul>
              <li>Manage swimmer profiles and assessments</li>
              <li>View and manage bookings</li>
              <li>Access instructor tools</li>
              <li>Generate reports</li>
              <li>Manage system settings</li>
            </ul>

            <p style="text-align: center;">
              <a href="${appUrl}" style="display: inline-block; background: #2a5e84; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">
                Log In to I Can Swim Beta
              </a>
            </p>

            <p>If you have any questions or need assistance, please contact the system administrator.</p>

            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              <p><strong>I Can Swim Beta</strong></p>
              <p>📍 Modesto: 1212 Kansas Ave, Modesto, CA 95351</p>
              <p>📍 Merced: 750 Motel Dr, Merced, CA 95340</p>
              <p>📞 (209) 778-7877 | ✉️ info@icanswim209.com</p>
            </div>
          `
        }
      }
    });

    if (error) {
      console.log('❌ Edge function error:', error.message);
      return false;
    }

    console.log('✅ Welcome email sent via edge function');
    console.log('Response:', data);
    return true;

  } catch (error) {
    console.error('❌ Exception sending welcome email:', error.message);
    return false;
  }
}

async function main() {
  const users = [
    {
      email: 'asira@gotoss.com',
      name: 'Asira Admin',
      password: 'tBdm%g@o5G8u' // From previous password setup
    },
    {
      email: 'sydnee@simplysydnee.com',
      name: 'Sydnee Admin',
      password: 'M69aVD^NytLa' // From previous password setup
    }
  ];

  console.log('\n' + '='.repeat(80));
  console.log('CONFIRMING EMAIL AND SENDING WELCOME');
  console.log('='.repeat(80));

  for (const user of users) {
    console.log(`\n=== PROCESSING: ${user.email} ===`);

    // First get user ID
    console.log('1. Finding user ID...');
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.log('❌ Error listing users:', listError.message);
      continue;
    }

    const foundUser = listData.users.find(u => u.email === user.email);
    if (!foundUser) {
      console.log(`❌ User ${user.email} not found`);
      continue;
    }

    console.log('✅ User found');
    console.log('   ID:', foundUser.id);
    console.log('   Email confirmed:', foundUser.email_confirmed_at ? 'Yes' : 'No');

    // Confirm email if not confirmed
    if (!foundUser.email_confirmed_at) {
      console.log('2. Email not confirmed, attempting to confirm...');
      const confirmed = await confirmUserEmail(foundUser.id, user.email);
      if (!confirmed) {
        console.log('⚠️ Email may still be unconfirmed');
        console.log('   This could limit user functionality');
        console.log('   User may need to click confirmation link if sent');
      }
    } else {
      console.log('2. Email already confirmed ✓');
    }

    // Send welcome email
    console.log('3. Sending welcome email...');
    const emailSent = await sendWelcomeEmail(user.email, user.name, user.password);

    if (emailSent) {
      console.log('✅ Welcome email sent');
      console.log('   Check inbox (and spam folder) for:', user.email);
    } else {
      console.log('⚠️ Welcome email not sent');
      console.log('   Credentials need to be shared manually');
    }

    console.log(`\n--- Finished: ${user.email} ---`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log('\nBoth administrators should now have:');
  console.log('1. Passwords set (see previous output)');
  console.log('2. Email confirmation attempted');
  console.log('3. Welcome emails sent (if edge function working)');
  console.log('\n🔐 Manual credential sharing may still be required');
  console.log('\n' + '='.repeat(80));
  console.log('✅ PROCESS COMPLETED');
  console.log('='.repeat(80));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});