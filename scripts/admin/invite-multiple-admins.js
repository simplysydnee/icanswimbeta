// Invite multiple admin users using proper Supabase client secrets
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' }); // Use .env.local for proper app configuration

// Use environment variables from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY; // Service role key from .env.local
const appUrl = process.env.NEXT_PUBLIC_EMAIL_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://icanswimbeta.vercel.app';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SECRET_KEY not found in .env.local');
  console.error('   Make sure .env.local file exists with proper Supabase configuration.');
  process.exit(1);
}

console.log('Inviting multiple admin users using proper Supabase client configuration...');
console.log('Supabase URL:', supabaseUrl);
console.log('Service key starts with:', supabaseServiceKey.substring(0, 20) + '...');
console.log('App URL:', appUrl);

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Define users to invite
const usersToInvite = [
  {
    email: 'asira@gotoss.com',
    name: 'Asira Admin',
    title: 'System Administrator'
  },
  {
    email: 'sydnee@simplysydnee.com',
    name: 'Sydnee Admin',
    title: 'Administrator'
  }
];

async function inviteUser(user) {
  console.log(`\n=== Processing: ${user.email} ===`);

  try {
    // 1. Check if user already exists
    console.log('1. Checking if user exists...');

    let userId = null;
    let userExists = false;

    // Try to get user by email using admin API
    if (supabaseAdmin.auth.admin.getUserByEmail) {
      const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(user.email);
      if (error && error.status !== 404) {
        console.error('❌ Error finding user by email:', error.message);
      } else if (data?.user) {
        userId = data.user.id;
        userExists = true;
        console.log('✅ User already exists in auth system');
        console.log('   User ID:', userId);
        console.log('   Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      }
    }

    // Fallback to listUsers
    if (!userId) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) {
        console.error('❌ Error listing users:', error.message);
      } else {
        const foundUser = data.users.find(u => u.email === user.email);
        if (foundUser) {
          userId = foundUser.id;
          userExists = true;
          console.log('✅ User found via listUsers');
          console.log('   User ID:', userId);
        } else {
          console.log('ℹ️ User not found in auth system - will create invite');
        }
      }
    }

    // 2. Check profile
    console.log('\n2. Checking profile in database...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, title, is_active')
      .eq('email', user.email)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error checking profile:', profileError.message);
    } else if (profile) {
      console.log('✅ Profile found:');
      console.log('   Name:', profile.full_name);
      console.log('   Title:', profile.title);
      console.log('   Active:', profile.is_active ? 'Yes' : 'No');
    } else {
      console.log('ℹ️ Profile not found in database');
    }

    // 3. Send invitation based on user existence
    console.log('\n3. Sending invitation...');

    let inviteSent = false;
    let inviteMethod = '';

    if (userExists) {
      // User exists - send password reset
      console.log('   User exists, sending password reset link...');
      inviteMethod = 'password reset';

      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
        options: {
          redirectTo: `${appUrl}/reset-password`
        }
      });

      if (resetError) {
        console.error('❌ Error sending password reset:', resetError.message);

        // Try invite type as fallback
        console.log('   Trying invite link as fallback...');
        inviteMethod = 'invite (fallback)';

        const { error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email: user.email,
          options: {
            redirectTo: `${appUrl}/reset-password`
          }
        });

        if (inviteError) {
          console.error('❌ Invite link also failed:', inviteError.message);
          inviteSent = false;
        } else {
          console.log('✅ Invite link generated!');
          inviteSent = true;
        }
      } else {
        console.log('✅ Password reset link generated!');
        inviteSent = true;
      }
    } else {
      // User doesn't exist - create with invite
      console.log('   User does not exist, creating with invitation...');
      inviteMethod = 'new user invitation';

      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        email_confirm: false, // Don't auto-confirm, let invite email confirm
        user_metadata: {
          full_name: user.name,
          role: 'admin'
        }
      });

      if (createError) {
        console.error('❌ Error creating user:', createError.message);
        inviteSent = false;
      } else {
        userId = createData.user.id;
        console.log('✅ User created successfully!');
        console.log('   User ID:', userId);
        inviteSent = true;

        // Create profile if needed
        if (!profile) {
          console.log('   Creating profile...');
          const { error: profileInsertError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: userId,
              email: user.email,
              full_name: user.name,
              title: user.title,
              is_active: true
            });

          if (profileInsertError) {
            console.error('   Profile creation error:', profileInsertError.message);
            console.log('   Profile may be created automatically by trigger');
          } else {
            console.log('   Profile created!');
          }
        }

        // Assign admin role
        console.log('   Checking/assigning admin role...');
        const { data: existingRoles, error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (rolesError) {
          console.error('   Error checking roles:', rolesError.message);
        } else if (!existingRoles || existingRoles.length === 0) {
          const { error: roleInsertError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'admin'
            });

          if (roleInsertError) {
            console.error('   Error assigning admin role:', roleInsertError.message);
          } else {
            console.log('   Admin role assigned!');
          }
        } else {
          console.log('   Admin role already assigned');
        }
      }
    }

    // 4. Return result
    return {
      email: user.email,
      name: user.name,
      userId,
      userExists,
      profileExists: !!profile,
      inviteSent,
      inviteMethod,
      success: inviteSent
    };

  } catch (error) {
    console.error(`❌ Error processing ${user.email}:`, error.message);
    return {
      email: user.email,
      name: user.name,
      userId: null,
      userExists: false,
      profileExists: false,
      inviteSent: false,
      inviteMethod: 'error',
      success: false,
      error: error.message
    };
  }
}

async function inviteAllUsers() {
  console.log('=== STARTING MULTIPLE ADMIN INVITATIONS ===');
  console.log(`Inviting ${usersToInvite.length} users...\n`);

  const results = [];

  for (const user of usersToInvite) {
    const result = await inviteUser(user);
    results.push(result);
    console.log(`\n--- Finished: ${user.email} ---\n`);
  }

  // Summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 INVITATION SUMMARY REPORT');
  console.log('='.repeat(80));

  let successCount = 0;
  let failureCount = 0;

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.email}`);
    console.log('   Name:', result.name);
    console.log('   User ID:', result.userId || 'Not created');
    console.log('   User existed:', result.userExists ? 'Yes' : 'No');
    console.log('   Profile existed:', result.profileExists ? 'Yes' : 'No');
    console.log('   Invite sent:', result.inviteSent ? '✅ Yes' : '❌ No');
    console.log('   Method:', result.inviteMethod);

    if (result.success) {
      successCount++;
      console.log('   Status: ✅ SUCCESS');
    } else {
      failureCount++;
      console.log('   Status: ❌ FAILED');
      if (result.error) {
        console.log('   Error:', result.error);
      }
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('📈 SUMMARY STATISTICS');
  console.log('='.repeat(80));
  console.log(`Total users: ${results.length}`);
  console.log(`Successful invites: ${successCount}`);
  console.log(`Failed invites: ${failureCount}`);
  console.log(`Success rate: ${Math.round((successCount / results.length) * 100)}%`);

  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Check Supabase Auth dashboard for email sending logs');
  console.log('2. Check spam folders for invitation emails');
  console.log('3. If emails not received:');
  console.log('   - Configure custom SMTP in Supabase Auth → Providers → Email');
  console.log('   - Use the edge function send-enrollment-email directly');
  console.log('   - Manually set passwords using set-asira-password.js approach');
  console.log('4. Users should log in at:', appUrl);
  console.log('5. Users should change passwords after first login');

  console.log('\n📋 For testing email delivery:');
  console.log('- sydnee@simplysydnee.com can be used to verify if emails are working');
  console.log('- If Sydnee receives email, Asira should also receive');
  console.log('- If neither receives, check Supabase email configuration');

  console.log('\n' + '='.repeat(80));
  console.log('✅ INVITATION PROCESS COMPLETED');
  console.log('='.repeat(80));

  return results;
}

// Run the function
inviteAllUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});