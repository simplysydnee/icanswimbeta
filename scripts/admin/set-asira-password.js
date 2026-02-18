// Set a password directly for asira@gotoss.com
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.migration' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables.');
  console.error('   Make sure .env.migration file exists with SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

console.log('Setting password for asira@gotoss.com...');
console.log('URL:', supabaseUrl);
console.log('Service key starts with:', supabaseServiceKey.substring(0, 20) + '...');

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

async function setPasswordForAsira() {
  console.log('\nSetting password for asira@gotoss.com...\n');

  const asiraEmail = 'asira@gotoss.com';
  const newPassword = generateRandomPassword(12);

  try {
    // First, get the user ID
    console.log('1. Finding user by email...');

    // Try to find user via auth.admin.getUserByEmail if available
    let userId = null;
    let user = null;

    if (supabase.auth.admin.getUserByEmail) {
      const { data, error } = await supabase.auth.admin.getUserByEmail(asiraEmail);
      if (error) {
        console.error('❌ Error finding user by email:', error.message);
      } else if (data?.user) {
        user = data.user;
        userId = user.id;
        console.log('✅ User found via getUserByEmail');
        console.log('   ID:', userId);
        console.log('   Email:', user.email);
        console.log('   Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      }
    }

    // Fallback to listUsers if needed
    if (!userId) {
      console.log('   Falling back to listUsers...');
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.error('❌ Error listing users:', error.message);
        return;
      }
      const foundUser = data.users.find(u => u.email === asiraEmail);
      if (foundUser) {
        user = foundUser;
        userId = foundUser.id;
        console.log('✅ User found via listUsers');
        console.log('   ID:', userId);
        console.log('   Email:', user.email);
        console.log('   Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      } else {
        console.error('❌ User not found in auth system.');
        return;
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
      console.error('❌ Error updating password:', updateError.message);
      console.error('   Full error:', updateError);

      // Try alternative method with updateUser (some versions)
      console.log('\n3. Trying alternative update method...');
      const { error: updateError2 } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError2) {
        console.error('❌ Alternative method also failed:', updateError2.message);
        console.log('\nPossible solutions:');
        console.log('1. Check Supabase Auth admin API documentation');
        console.log('2. Manually set password in Supabase dashboard');
        console.log('3. Use generateLink with invite type');
        return;
      }
    } else {
      console.log('✅ Password updated successfully!');
      console.log('   User ID:', updateData?.user?.id || userId);
    }

    // Verify the update by trying to get user again
    console.log('\n4. Verifying update...');
    const { data: verifyData, error: verifyError } = await supabase.auth.admin.getUserById(userId);
    if (verifyError) {
      console.error('❌ Error verifying user:', verifyError.message);
    } else {
      console.log('✅ User verified');
      console.log('   Email:', verifyData.user.email);
      console.log('   Updated at:', verifyData.user.updated_at);
    }

    // Check profile
    console.log('\n5. Checking profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, title')
      .eq('email', asiraEmail)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error checking profile:', profileError.message);
    } else if (profile) {
      console.log('✅ Profile found:');
      console.log('   Name:', profile.full_name);
      console.log('   Title:', profile.title);
    } else {
      console.log('❌ Profile not found (user may exist only in auth system)');
    }

    // Check admin role
    console.log('\n6. Checking admin role...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('❌ Error checking roles:', rolesError.message);
    } else if (roles && roles.length > 0) {
      console.log('✅ User roles:');
      roles.forEach((role, index) => {
        console.log(`   ${index + 1}. ${role.role}`);
      });

      const isAdmin = roles.some(r => r.role === 'admin');
      if (isAdmin) {
        console.log('   ✅ User has admin role!');
      } else {
        console.log('   ❌ User does NOT have admin role.');
        console.log('   Consider running make-sutton-admin.js script for admin assignment.');
      }
    } else {
      console.log('❌ No roles assigned to user.');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ PASSWORD SET SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('Email:', asiraEmail);
    console.log('Password:', newPassword);
    console.log('User ID:', userId);
    console.log('\n📝 IMPORTANT:');
    console.log('1. Share this password with Asira securely');
    console.log('2. Asira should log in at:', process.env.NEXT_PUBLIC_APP_URL || 'https://icanswimbeta.vercel.app');
    console.log('3. Asira should change password after first login');
    console.log('4. Check spam folder if login email is not received');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the function
setPasswordForAsira();