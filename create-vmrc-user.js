const { createClient } = require('@supabase/supabase-js');

// Use anon key for user creation (same as create-instructor-user.js)
const supabaseUrl = 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzkzODcsImV4cCI6MjA4MDAxNTM4N30.52ZlN5oL7O9nbdm8yFZVvLbe6aHgh0JOESs-oGIWUM0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createVMRCCoordinator() {
  console.log('Creating VMRC coordinator user...');

  const vmrcEmail = 'vmrc-coordinator@test.com';
  const vmrcPassword = 'TestPassword123!';
  const vmrcName = 'Test VMRC Coordinator';
  const phone = '555-987-6543';

  try {
    // Step 1: Create user in Supabase Auth
    console.log(`\n1. Creating auth user: ${vmrcEmail}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: vmrcEmail,
      password: vmrcPassword,
      options: {
        data: {
          full_name: vmrcName
        }
      }
    });

    if (authError) {
      console.log('❌ Auth signup error:', authError.message);

      // If user already exists, try signing in to get the user ID
      if (authError.message.includes('already registered')) {
        console.log('User already exists, trying to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: vmrcEmail,
          password: vmrcPassword
        });

        if (signInError) {
          console.log('❌ Sign in failed:', signInError.message);
          console.log('Please reset the password for vmrc-coordinator@test.com in Supabase Dashboard');
          return;
        }

        console.log('✅ Signed in to existing user');
        console.log('User ID:', signInData.user.id);
        await assignVMRCRole(signInData.user.id);
        return;
      }
      return;
    }

    console.log('✅ Auth user created!');
    console.log('User ID:', authData.user?.id);
    console.log('Email:', authData.user?.email);

    if (!authData.user) {
      console.log('❌ No user object returned');
      return;
    }

    // Step 2: Assign VMRC coordinator role and create profile
    await assignVMRCRole(authData.user.id);

    console.log('\n✅ VMRC coordinator user creation complete!');
    console.log('Email:', vmrcEmail);
    console.log('Password:', vmrcPassword);
    console.log('\nYou can now log in with these credentials');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function assignVMRCRole(userId) {
  console.log(`\n2. Assigning vmrc_coordinator role to user ${userId}...`);

  // First, create the profile
  console.log(`\n3. Creating VMRC coordinator profile...`);
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: 'vmrc-coordinator@test.com',
      full_name: 'Test VMRC Coordinator',
      phone: '555-987-6543',
      is_active: true
    })
    .select();

  if (profileError) {
    console.log('❌ Error updating profiles:', profileError.message);
    console.log('This is expected due to RLS policies. The profile may need to be created manually.');
    console.log(`Manual SQL for profile:`);
    console.log(`INSERT INTO profiles (id, email, full_name, phone, is_active) VALUES ('${userId}', 'vmrc-coordinator@test.com', 'Test VMRC Coordinator', '555-987-6543', true) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, is_active = EXCLUDED.is_active;`);
  } else {
    console.log('✅ Profiles table updated with VMRC coordinator details!');
  }

  // Try to insert into user_roles table
  console.log(`\n4. Assigning vmrc_coordinator role in user_roles table...`);
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .insert([
      {
        user_id: userId,
        role: 'vmrc_coordinator'
      }
    ])
    .select();

  if (roleError) {
    console.log('❌ Error assigning vmrc_coordinator role:', roleError.message);
    console.log('This is expected due to RLS policies. The role needs to be assigned manually.');
    console.log(`Manual SQL for user_roles:`);
    console.log(`INSERT INTO user_roles (user_id, role) VALUES ('${userId}', 'vmrc_coordinator') ON CONFLICT DO NOTHING;`);
  } else {
    console.log('✅ VMRC coordinator role assigned successfully!');
  }
}

createVMRCCoordinator();