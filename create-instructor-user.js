const { createClient } = require('@supabase/supabase-js');

// Use anon key for user creation (same as create-admin-user.js)
const supabaseUrl = 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzkzODcsImV4cCI6MjA4MDAxNTM4N30.52ZlN5oL7O9nbdm8yFZVvLbe6aHgh0JOESs-oGIWUM0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createInstructorUser() {
  console.log('Creating instructor user...');

  const instructorEmail = 'instructor@test.com';
  const instructorPassword = 'TestPassword123!'; // Stronger password
  const instructorName = 'Test Instructor';
  const phone = '555-123-4567';
  const title = 'Senior Swim Instructor';
  const bio = 'Certified swim instructor with 5+ years of experience teaching adaptive swim lessons for children with special needs. Specializes in water safety and building confidence in the water.';

  try {
    // Step 1: Create user in Supabase Auth
    console.log(`\n1. Creating auth user: ${instructorEmail}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: instructorEmail,
      password: instructorPassword,
      options: {
        data: {
          full_name: instructorName
        }
      }
    });

    if (authError) {
      console.log('❌ Auth signup error:', authError.message);

      // If user already exists, try signing in to get the user ID
      if (authError.message.includes('already registered')) {
        console.log('User already exists, trying to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: instructorEmail,
          password: instructorPassword
        });

        if (signInError) {
          console.log('❌ Sign in failed:', signInError.message);
          console.log('Please reset the password for instructor@test.com in Supabase Dashboard');
          return;
        }

        console.log('✅ Signed in to existing user');
        console.log('User ID:', signInData.user.id);
        await assignInstructorRole(signInData.user.id);
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

    // Step 2: Assign instructor role and create profile
    await assignInstructorRole(authData.user.id);

    console.log('\n✅ Instructor user creation complete!');
    console.log('Email:', instructorEmail);
    console.log('Password:', instructorPassword);
    console.log('Title:', title);
    console.log('\nYou can now log in with these credentials');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function assignInstructorRole(userId) {
  console.log(`\n2. Assigning instructor role to user ${userId}...`);

  // First, create the profile (this should work with the anon key)
  console.log(`\n3. Creating instructor profile...`);
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: 'instructor@test.com',
      full_name: 'Test Instructor',
      phone: '555-123-4567',
      title: 'Senior Swim Instructor',
      bio: 'Certified swim instructor with 5+ years of experience teaching adaptive swim lessons for children with special needs. Specializes in water safety and building confidence in the water.',
      is_active: true
      // Note: Not including 'role' column as it doesn't exist in profiles table
      // Roles are managed in user_roles table
    })
    .select();

  if (profileError) {
    console.log('❌ Error updating profiles:', profileError.message);
    console.log('This is expected due to RLS policies. The profile may need to be created manually.');
    console.log(`Manual SQL for profile:`);
    console.log(`INSERT INTO profiles (id, email, full_name, phone, title, bio, is_active) VALUES ('${userId}', 'instructor@test.com', 'Test Instructor', '555-123-4567', 'Senior Swim Instructor', 'Certified swim instructor with 5+ years of experience teaching adaptive swim lessons for children with special needs. Specializes in water safety and building confidence in the water.', true) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, title = EXCLUDED.title, bio = EXCLUDED.bio, is_active = EXCLUDED.is_active;`);
  } else {
    console.log('✅ Profiles table updated with instructor details!');
  }

  // Try to insert into user_roles table
  console.log(`\n4. Assigning instructor role in user_roles table...`);
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .insert([
      {
        user_id: userId,
        role: 'instructor'
      }
    ])
    .select();

  if (roleError) {
    console.log('❌ Error assigning instructor role:', roleError.message);
    console.log('This is expected due to RLS policies. The role needs to be assigned manually.');
    console.log(`Manual SQL for user_roles:`);
    console.log(`INSERT INTO user_roles (user_id, role) VALUES ('${userId}', 'instructor') ON CONFLICT DO NOTHING;`);
  } else {
    console.log('✅ Instructor role assigned successfully!');
  }
}

createInstructorUser();