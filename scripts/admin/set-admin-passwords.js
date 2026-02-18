// Set passwords directly for admin users when email delivery fails
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.migration' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.APP_URL || 'https://icanswimbeta.vercel.app';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables.');
  console.error('   Make sure .env.migration file exists with SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

console.log('Setting passwords for admin users...');
console.log('URL:', supabaseUrl);
console.log('Service key starts with:', supabaseServiceKey.substring(0, 20) + '...');
console.log('App URL:', appUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a random password
function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function setPasswordForUser(email, name) {
  console.log(`\n=== SETTING PASSWORD FOR: ${email} ===`);

  const newPassword = generateRandomPassword(12);

  try {
    // First, get the user ID
    console.log('1. Finding user by email...');

    let userId = null;
    let user = null;

    // Try to find user via auth.admin.getUserByEmail if available
    if (supabase.auth.admin.getUserByEmail) {
      const { data, error } = await supabase.auth.admin.getUserByEmail(email);
      if (error) {
        console.error('   ❌ Error finding user by email:', error.message);
      } else if (data?.user) {
        user = data.user;
        userId = user.id;
        console.log('   ✅ User found via getUserByEmail');
        console.log('      ID:', userId);
        console.log('      Email:', user.email);
        console.log('      Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      }
    }

    // Fallback to listUsers if needed
    if (!userId) {
      console.log('   Falling back to listUsers...');
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.error('   ❌ Error listing users:', error.message);
        return { success: false, error: error.message };
      }
      const foundUser = data.users.find(u => u.email === email);
      if (foundUser) {
        user = foundUser;
        userId = foundUser.id;
        console.log('   ✅ User found via listUsers');
        console.log('      ID:', userId);
        console.log('      Email:', user.email);
        console.log('      Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      } else {
        console.error('   ❌ User not found in auth system.');
        return { success: false, error: 'User not found' };
      }
    }

    // Update user password
    console.log('\n2. Updating user password...');
    console.log('   New password:', newPassword);

    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('   ❌ Error updating password:', updateError.message);

      // Try alternative method
      console.log('   Trying alternative update method...');
      const { error: updateError2 } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError2) {
        console.error('   ❌ Alternative method also failed:', updateError2.message);
        return { success: false, error: updateError2.message };
      }
    }

    console.log('   ✅ Password updated successfully!');
    console.log('      User ID:', userId);

    // Verify update
    console.log('\n3. Verifying update...');
    const { data: verifyData, error: verifyError } = await supabase.auth.admin.getUserById(userId);
    if (verifyError) {
      console.error('   ❌ Error verifying user:', verifyError.message);
    } else {
      console.log('   ✅ User verified');
      console.log('      Email:', verifyData.user.email);
      console.log('      Updated at:', verifyData.user.updated_at);
    }

    // Check profile
    console.log('\n4. Checking profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, title, is_active')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.error('   ❌ Error checking profile:', profileError.message);
    } else if (profile) {
      console.log('   ✅ Profile found:');
      console.log('      Name:', profile.full_name);
      console.log('      Title:', profile.title);
      console.log('      Active:', profile.is_active ? 'Yes' : 'No');
    } else {
      console.log('   ℹ️ Profile not found in database');
    }

    // Check admin role
    console.log('\n5. Checking admin role...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('   ❌ Error checking roles:', rolesError.message);
    } else if (roles && roles.length > 0) {
      console.log('   ✅ User roles:');
      roles.forEach((role, index) => {
        console.log(`      ${index + 1}. ${role.role}`);
      });

      const hasAdminRole = roles.some(r => r.role === 'admin');
      if (hasAdminRole) {
        console.log('   ✅ User has admin role!');
      } else {
        console.log('   ⚠️ User does not have admin role');

        // Assign admin role
        console.log('   Assigning admin role...');
        const { error: assignError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });

        if (assignError) {
          console.error('   ❌ Error assigning admin role:', assignError.message);
        } else {
          console.log('   ✅ Admin role assigned!');
        }
      }
    } else {
      console.log('   ⚠️ No roles found, assigning admin role...');

      const { error: assignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (assignError) {
        console.error('   ❌ Error assigning admin role:', assignError.message);
      } else {
        console.log('   ✅ Admin role assigned!');
      }
    }

    return {
      success: true,
      email,
      name,
      userId,
      password: newPassword,
      userConfirmed: !!user?.email_confirmed_at
    };

  } catch (error) {
    console.error(`❌ Error setting password for ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  const users = [
    { email: 'asira@gotoss.com', name: 'Asira Admin' },
    { email: 'sydnee@simplysydnee.com', name: 'Sydnee Admin' }
  ];

  console.log('\n' + '='.repeat(80));
  console.log('SETTING PASSWORDS FOR ADMIN USERS');
  console.log('='.repeat(80));
  console.log(`Processing ${users.length} users...\n`);

  const results = [];

  for (const user of users) {
    const result = await setPasswordForUser(user.email, user.name);
    results.push(result);
    console.log(`\n--- Finished: ${user.email} ---\n`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 PASSWORD SETUP SUMMARY');
  console.log('='.repeat(80));

  let successCount = 0;
  let failureCount = 0;

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.email}`);
    console.log('   Name:', users[index].name);

    if (result.success) {
      successCount++;
      console.log('   Status: ✅ SUCCESS');
      console.log('   User ID:', result.userId);
      console.log('   Password:', result.password);
      console.log('   Email confirmed:', result.userConfirmed ? 'Yes' : 'No');
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
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failureCount}`);

  if (successCount > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 CREDENTIALS FOR MANUAL SHARING');
    console.log('='.repeat(80));

    results.filter(r => r.success).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.email}`);
      console.log('   Name:', users.find(u => u.email === result.email)?.name);
      console.log('   Password:', result.password);
      console.log('   Login URL:', appUrl);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📝 IMPORTANT INSTRUCTIONS');
    console.log('='.repeat(80));
    console.log('\n1. Share passwords securely with each administrator');
    console.log('2. Users should log in at:', appUrl);
    console.log('3. Users MUST change their password after first login');
    console.log('4. Check spam folders if any login emails are not received');
    console.log('\n5. If users cannot log in:');
    console.log('   - Verify password is correct (case-sensitive)');
    console.log('   - Check that email is typed correctly');
    console.log('   - Try password reset at:', `${appUrl}/reset-password`);
    console.log('   - Contact support if issues persist');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ PASSWORD SETUP COMPLETED');
  console.log('='.repeat(80));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});