const { createClient } = require('@supabase/supabase-js');

// Test instructor login with anon key
const supabaseUrl = 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzkzODcsImV4cCI6MjA4MDAxNTM4N30.52ZlN5oL7O9nbdm8yFZVvLbe6aHgh0JOESs-oGIWUM0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInstructorLogin() {
  console.log('Testing instructor login...\n');

  const instructorEmail = 'instructor@test.com';
  const instructorPassword = 'TestPassword123!';

  try {
    // 1. Test sign in
    console.log('1. Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: instructorEmail,
      password: instructorPassword
    });

    if (signInError) {
      console.log(`❌ Sign in failed: ${signInError.message}`);

      if (signInError.message.includes('Invalid login credentials')) {
        console.log('\nPossible issues:');
        console.log('- User may not exist in auth system');
        console.log('- Password may be incorrect');
        console.log('- Email may not be confirmed');

        // Check if user exists
        console.log('\nChecking if user exists...');
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const userExists = existingUsers?.users?.some((u) => u.email === instructorEmail);

        if (userExists) {
          console.log('✅ User exists in auth system');
          console.log('⚠️  Password may be incorrect or email not confirmed');
        } else {
          console.log('❌ User does not exist in auth system');
          console.log('Please run create-instructor-user.js first');
        }
      }
      return;
    }

    console.log('✅ Sign in successful!');
    console.log(`User ID: ${signInData.user.id}`);
    console.log(`Email: ${signInData.user.email}`);

    // 2. Check user profile
    console.log('\n2. Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError) {
      console.log(`❌ Error fetching profile: ${profileError.message}`);
    } else {
      console.log('✅ Profile found:');
      console.log(`   Name: ${profile.full_name}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Phone: ${profile.phone || 'Not set'}`);
      console.log(`   Title: ${profile.title || 'Not set'}`);
      console.log(`   Bio: ${profile.bio ? 'Set' : 'Not set'}`);
      console.log(`   Active: ${profile.is_active ? 'Yes' : 'No'}`);
    }

    // 3. Check user roles
    console.log('\n3. Checking user roles...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', signInData.user.id);

    if (rolesError) {
      console.log(`❌ Error fetching roles: ${rolesError.message}`);
    } else if (!roles || roles.length === 0) {
      console.log('❌ No roles assigned to user');
    } else {
      console.log('✅ User roles:');
      roles.forEach((role, index) => {
        console.log(`   ${index + 1}. ${role.role}`);
      });

      const isInstructor = roles.some((r) => r.role === 'instructor');
      if (isInstructor) {
        console.log('✅ User has instructor role!');
      } else {
        console.log('❌ User does NOT have instructor role');
      }
    }

    // 4. Test getting session data (instructor-specific)
    console.log('\n4. Testing instructor session access...');

    // First, get user's sessions as instructor
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('instructor_id', signInData.user.id)
      .limit(5);

    if (sessionsError) {
      console.log(`❌ Error fetching sessions: ${sessionsError.message}`);
    } else if (!sessions || sessions.length === 0) {
      console.log('⚠️  No sessions found for this instructor');
      console.log('   (This is expected if no sessions have been assigned)');
    } else {
      console.log(`✅ Found ${sessions.length} session(s) for instructor:`);
      sessions.forEach((session, index) => {
        const startTime = new Date(session.start_time).toLocaleString();
        console.log(`   ${index + 1}. ${startTime} - ${session.location} (${session.status})`);
      });
    }

    // 5. Test progress notes access
    console.log('\n5. Testing progress notes access...');
    const { data: progressNotes, error: notesError } = await supabase
      .from('progress_notes')
      .select('*')
      .eq('instructor_id', signInData.user.id)
      .limit(5);

    if (notesError) {
      console.log(`❌ Error fetching progress notes: ${notesError.message}`);
    } else if (!progressNotes || progressNotes.length === 0) {
      console.log('⚠️  No progress notes found for this instructor');
      console.log('   (Run create-simple-progress-test.js to create test data)');
    } else {
      console.log(`✅ Found ${progressNotes.length} progress note(s):`);
      progressNotes.forEach((note, index) => {
        console.log(`   ${index + 1}. ${note.lesson_summary?.substring(0, 60)}...`);
      });
    }

    // 6. Sign out
    console.log('\n6. Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.log(`❌ Error signing out: ${signOutError.message}`);
    } else {
      console.log('✅ Signed out successfully');
    }

    console.log('\n========================================');
    console.log('INSTRUCTOR LOGIN TEST COMPLETE');
    console.log('========================================');
    console.log('\nSummary:');
    console.log(`- Authentication: ${signInData ? '✅ Working' : '❌ Failed'}`);
    console.log(`- Profile: ${profile ? '✅ Found' : '❌ Missing'}`);
    console.log(`- Instructor Role: ${roles?.some(r => r.role === 'instructor') ? '✅ Assigned' : '❌ Not assigned'}`);
    console.log(`- Test Data: ${sessions?.length > 0 ? '✅ Available' : '⚠️  Run create-simple-progress-test.js'}`);
    console.log('\nNext steps:');
    console.log('1. Log in to the web app at http://localhost:3000 (or your dev port)');
    console.log('2. Navigate to /instructor/progress');
    console.log('3. You should see your sessions and progress notes');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testInstructorLogin();