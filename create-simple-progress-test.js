const { createClient } = require('@supabase/supabase-js');

// Use service role key for bypassing RLS policies
const supabaseUrl = 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzOTM4NywiZXhwIjoyMDgwMDE1Mzg3fQ.WZwib9oB_xAG8NUEK5DbQMopGcVcKwLsXHnblmXUgvc';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSimpleProgressTest() {
  console.log('Creating simple progress test data...\n');

  try {
    // 1. First, let's check what tables and columns exist
    console.log('1. Checking database schema...');

    // Get instructor user ID from auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const instructorUser = existingUsers?.users?.find((u) => u.email === 'instructor@test.com');

    if (!instructorUser) {
      console.log('❌ Instructor user not found. Please run create-instructor-user.js first');
      return;
    }

    const instructorId = instructorUser.id;
    console.log(`✅ Instructor ID: ${instructorId}`);

    // 2. Create a simple swimmer with minimal required fields
    console.log('\n2. Creating simple test swimmer...');

    // First, get White level ID
    const { data: whiteLevel, error: levelError } = await supabase
      .from('swim_levels')
      .select('id')
      .eq('name', 'white')
      .single();

    if (levelError || !whiteLevel) {
      console.error('❌ Error getting swim level:', levelError?.message || 'White level not found');
      // Try to create levels if they don't exist
      console.log('Attempting to create swim levels...');
      const { error: createLevelsError } = await supabase
        .from('swim_levels')
        .insert([
          { name: 'white', display_name: 'White', description: 'Water Readiness', color: '#f1f5f9', sequence: 1 },
          { name: 'red', display_name: 'Red', description: 'Body Position', color: '#fee2e2', sequence: 2 },
          { name: 'yellow', display_name: 'Yellow', description: 'Forward Movement', color: '#fef9c3', sequence: 3 },
          { name: 'green', display_name: 'Green', description: 'Water Competency', color: '#dcfce7', sequence: 4 },
          { name: 'blue', display_name: 'Blue', description: 'Streamlines', color: '#dbeafe', sequence: 5 }
        ]);

      if (createLevelsError) {
        console.error('❌ Error creating swim levels:', createLevelsError.message);
        return;
      }

      // Get White level again
      const { data: newWhiteLevel } = await supabase
        .from('swim_levels')
        .select('id')
        .eq('name', 'white')
        .single();

      if (!newWhiteLevel) {
        console.error('❌ Still cannot get White level');
        return;
      }

      whiteLevel.id = newWhiteLevel.id;
    }

    // Create swimmer with only required fields
    const simpleSwimmer = {
      first_name: 'Test',
      last_name: 'Swimmer',
      date_of_birth: '2020-01-01',
      current_level_id: whiteLevel.id,
      enrollment_status: 'enrolled',
      assessment_status: 'completed',
      approval_status: 'approved'
    };

    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .insert(simpleSwimmer)
      .select()
      .single();

    if (swimmerError) {
      console.error('❌ Error creating swimmer:', swimmerError.message);
      console.log('Trying with even simpler data...');

      // Try without current_level_id
      const simplerSwimmer = {
        first_name: 'Test',
        last_name: 'Swimmer',
        date_of_birth: '2020-01-01',
        enrollment_status: 'enrolled'
      };

      const { data: simplerSwimmerData, error: simplerError } = await supabase
        .from('swimmers')
        .insert(simplerSwimmer)
        .select()
        .single();

      if (simplerError) {
        console.error('❌ Still cannot create swimmer:', simplerError.message);
        console.log('Checking swimmers table structure...');

        // Try to get table info
        const { data: tableInfo, error: tableError } = await supabase
          .from('swimmers')
          .select('*')
          .limit(1);

        if (tableError) {
          console.error('❌ Cannot access swimmers table:', tableError.message);
        } else {
          console.log('Swimmers table exists, sample row:', tableInfo);
        }
        return;
      }

      console.log(`✅ Simple swimmer created with ID: ${simplerSwimmerData.id}`);
      var swimmerId = simplerSwimmerData.id;
    } else {
      console.log(`✅ Swimmer created with ID: ${swimmer.id}`);
      var swimmerId = swimmer.id;
    }

    // 3. Create a simple session
    console.log('\n3. Creating test session...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const sessionEnd = new Date(tomorrow);
    sessionEnd.setHours(tomorrow.getHours() + 1);

    const simpleSession = {
      instructor_id: instructorId,
      start_time: tomorrow.toISOString(),
      end_time: sessionEnd.toISOString(),
      location: 'Test Location',
      session_type: 'lesson',
      status: 'available',
      max_capacity: 1
    };

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert(simpleSession)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError.message);
      return;
    }

    console.log(`✅ Session created with ID: ${session.id}`);

    // 4. Create a simple booking
    console.log('\n4. Creating test booking...');

    // We need a parent ID, but we can use the instructor as parent for testing
    const simpleBooking = {
      session_id: session.id,
      swimmer_id: swimmerId,
      parent_id: instructorId, // Using instructor as parent for simplicity
      status: 'confirmed'
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(simpleBooking)
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Error creating booking:', bookingError.message);
      return;
    }

    console.log(`✅ Booking created with ID: ${booking.id}`);

    // 5. Create a simple progress note
    console.log('\n5. Creating test progress note...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const simpleProgressNote = {
      session_id: session.id,
      booking_id: booking.id,
      swimmer_id: swimmerId,
      instructor_id: instructorId,
      lesson_summary: 'Great lesson! Test Swimmer showed good progress with water comfort.',
      shared_with_parent: false
    };

    const { data: progressNote, error: progressNoteError } = await supabase
      .from('progress_notes')
      .insert(simpleProgressNote)
      .select()
      .single();

    if (progressNoteError) {
      console.error('❌ Error creating progress note:', progressNoteError.message);
      console.log('Trying without optional fields...');

      // Try without optional fields
      const simplerProgressNote = {
        swimmer_id: swimmerId,
        instructor_id: instructorId,
        lesson_summary: 'Test progress note'
      };

      const { data: simplerNote, error: simplerNoteError } = await supabase
        .from('progress_notes')
        .insert(simplerProgressNote)
        .select()
        .single();

      if (simplerNoteError) {
        console.error('❌ Still cannot create progress note:', simplerNoteError.message);
      } else {
        console.log(`✅ Simple progress note created with ID: ${simplerNote.id}`);
      }
    } else {
      console.log(`✅ Progress note created with ID: ${progressNote.id}`);
    }

    // 6. Summary
    console.log('\n========================================');
    console.log('SIMPLE PROGRESS TEST DATA CREATED!');
    console.log('========================================');
    console.log('\nTest Data Created:');
    console.log(`- Swimmer: Test Swimmer (ID: ${swimmerId})`);
    console.log(`- Session: Tomorrow at 10 AM (ID: ${session.id})`);
    console.log(`- Booking: Linked swimmer to session (ID: ${booking.id})`);
    console.log(`- Progress Note: Sample note created`);
    console.log('\nTo test:');
    console.log('1. Log in as instructor@test.com / TestPassword123!');
    console.log('2. Navigate to /instructor/progress');
    console.log('3. You should see the session with Test Swimmer');
    console.log('4. Test the progress update functionality');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createSimpleProgressTest();