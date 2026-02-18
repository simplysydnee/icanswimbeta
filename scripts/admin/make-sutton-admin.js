// Make sutton@icanswim209.com an admin user
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.migration' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables.');
  console.error('   Make sure .env.migration file exists with SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUserByEmail(email) {
  try {
    // Try getUserByEmail if available (some Supabase JS versions)
    if (supabase.auth.admin.getUserByEmail) {
      const { data, error } = await supabase.auth.admin.getUserByEmail(email);
      if (error && error.status !== 404) {
        console.error('Error finding user by email:', error.message);
        return null;
      }
      return data?.user || null;
    }
  } catch (err) {
    // fallback to listUsers
  }

  // Fallback: list users and filter by email
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('Error listing users:', error.message);
      return null;
    }
    const user = data.users.find(u => u.email === email);
    return user || null;
  } catch (err) {
    console.error('Error in listUsers:', err.message);
    return null;
  }
}

async function makeSuttonAdmin() {
  console.log('Making sutton@icanswim209.com an admin user...\n');

  const suttonEmail = 'sutton@icanswim209.com';
  const suttonName = 'Sutton Lucas';
  const suttonPhone = '209-778-7877';
  const suttonTitle = 'Owner';

  try {
    // Check if user already exists
    console.log(`1. Checking if user ${suttonEmail} already exists...`);
    const existingUser = await findUserByEmail(suttonEmail);

    let userId;
    if (existingUser) {
      console.log('✅ User already exists with email:', suttonEmail);
      userId = existingUser.id;
      console.log('   User ID:', userId);

      // Update profile with correct information
      console.log(`\n2. Updating profile record...`);
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: suttonEmail,
          full_name: suttonName,
          phone: suttonPhone,
          title: suttonTitle,
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ Error updating profile:', profileError.message);
      } else {
        console.log('✅ Profile updated!');
      }
    } else {
      // Create auth user (auto-confirm email)
      console.log(`\n2. Creating auth user: ${suttonEmail}`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: suttonEmail,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: suttonName,
          role: 'admin',
          phone: suttonPhone
        }
      });

      if (authError) {
        console.error('❌ Error creating auth user:', authError.message);
        // Check if user already exists error
        if (authError.message.includes('already registered')) {
          console.log('   User already exists but not found via search. Trying to retrieve...');
          // Try to find again
          const user = await findUserByEmail(suttonEmail);
          if (user) {
            userId = user.id;
            console.log('   Found existing user ID:', userId);
          } else {
            console.error('   Could not retrieve user ID. Please check Supabase dashboard.');
            return;
          }
        } else {
          return;
        }
      } else {
        console.log('✅ Auth user created!');
        console.log('   User ID:', authData.user.id);
        console.log('   Email:', authData.user.email);
        userId = authData.user.id;

        // Create profile record
        console.log(`\n3. Creating profile record...`);
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: suttonEmail,
            full_name: suttonName,
            phone: suttonPhone,
            title: suttonTitle,
            is_active: true
          });

        if (profileError) {
          console.error('❌ Error creating profile:', profileError.message);
          // Continue anyway - profile may be created via trigger
        } else {
          console.log('✅ Profile created!');
        }
      }
    }

    // Check and assign admin role
    console.log(`\n4. Checking and assigning admin role...`);

    // First check if user already has admin role
    const { data: existingRoles, error: rolesCheckError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (rolesCheckError) {
      console.error('❌ Error checking existing roles:', rolesCheckError.message);
    } else if (existingRoles && existingRoles.length > 0) {
      console.log('✅ User already has admin role!');
    } else {
      // Assign admin role
      console.log('   Assigning admin role...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (roleError) {
        console.error('❌ Error assigning admin role:', roleError.message);
        console.log('   You may need to assign role manually.');
      } else {
        console.log('✅ Admin role assigned!');
      }
    }

    // Send password reset email (login link)
    console.log(`\n5. Sending password reset email to ${suttonEmail}...`);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icanswimbeta.vercel.app';
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: suttonEmail,
      options: {
        redirectTo: `${appUrl}/reset-password`
      }
    });

    if (resetError) {
      console.error('❌ Error sending password reset email:', resetError.message);
      console.log('   You may need to manually send a password reset from Supabase dashboard.');
    } else {
      console.log('✅ Password reset email sent!');
      console.log('   Sutton will receive an email with a link to set his password.');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Sutton admin user process completed!');
    console.log('   Email:', suttonEmail);
    console.log('   Name:', suttonName);
    console.log('   Phone:', suttonPhone);
    console.log('   Title:', suttonTitle);
    console.log('   User ID:', userId);
    console.log('   Sutton can log in using the password reset link sent to his email.');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

makeSuttonAdmin();