import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to add days to a date
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Demo accounts to create
    const demoAccounts = [
      {
        email: 'parent@icanswim209.com',
        password: 'Demo2024!Parent',
        role: 'parent',
        fullName: 'Sarah Thompson',
        phone: '(209) 555-0101'
      },
      {
        email: 'parent2@icanswim209.com',
        password: 'Demo2024!Parent',
        role: 'parent',
        fullName: 'Michael Chen',
        phone: '(209) 555-0102'
      },
      {
        email: 'instructor@icanswim209.com',
        password: 'Demo2024!Instructor',
        role: 'instructor',
        fullName: 'Coach Emily Rodriguez',
        phone: '(209) 555-0201'
      },
      {
        email: 'instructor2@icanswim209.com',
        password: 'Demo2024!Instructor',
        role: 'instructor',
        fullName: 'Coach James Wilson',
        phone: '(209) 555-0202'
      },
      {
        email: 'admin@icanswim209.com',
        password: 'Demo2024!Admin',
        role: 'admin',
        fullName: 'Admin Lisa Garcia',
        phone: '(209) 555-0301'
      },
      {
        email: 'coordinator@icanswim209.com',
        password: 'Demo2024!Coordinator',
        role: 'vmrc_coordinator',
        fullName: 'VMRC Coordinator David Martinez',
        phone: '(209) 555-0401'
      }
    ];

    const results = [];
    const userIds: Record<string, string> = {};

    for (const account of demoAccounts) {
      console.log(`Creating demo account: ${account.email}`);
      
      // Create user with admin client
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.fullName
        }
      });

      if (userError) {
        console.error(`Error creating ${account.email}:`, userError);
        results.push({
          email: account.email,
          success: false,
          error: userError.message
        });
        continue;
      }

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userData.user.id,
          email: account.email,
          full_name: account.fullName,
          phone: account.phone
        });

      if (profileError) {
        console.error(`Error creating profile for ${account.email}:`, profileError);
      }

      // Store user ID for later use
      userIds[account.role === 'parent' ? (account.email === 'parent@icanswim209.com' ? 'parent1' : 'parent2') : account.role] = userData.user.id;

      // Assign role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: userData.user.id,
          role: account.role
        });

      if (roleError) {
        console.error(`Error assigning role for ${account.email}:`, roleError);
        results.push({
          email: account.email,
          success: false,
          error: roleError.message
        });
        continue;
      }

      results.push({
        email: account.email,
        password: account.password,
        role: account.role,
        success: true
      });

      console.log(`Successfully created ${account.email} with role ${account.role}`);
    }

    // Step 2: Create swim levels if they don't exist
    console.log('Creating swim levels...');
    const swimLevels = [
      { name: 'level_1', display_name: 'Level 1 - Water Adjustment', sequence: 1 },
      { name: 'level_2', display_name: 'Level 2 - Water Movement', sequence: 2 },
      { name: 'level_3', display_name: 'Level 3 - Water Stamina', sequence: 3 },
      { name: 'level_4', display_name: 'Level 4 - Stroke Introduction', sequence: 4 },
      { name: 'level_5', display_name: 'Level 5 - Stroke Development', sequence: 5 },
    ];

    const levelIds: Record<string, string> = {};
    for (const level of swimLevels) {
      const { data, error } = await supabaseAdmin
        .from('swim_levels')
        .upsert(level, { onConflict: 'name' })
        .select()
        .single();
      
      if (!error && data) {
        levelIds[level.name] = data.id;
      }
    }

    // Step 3: Create swimmers for parent accounts
    console.log('Creating swimmers...');
    const today = new Date();
    
    const swimmers = [
      // Parent 1 swimmers
      {
        parent_id: userIds.parent1,
        first_name: 'Emma',
        last_name: 'Thompson',
        date_of_birth: '2015-03-15',
        gender: 'Female',
        enrollment_status: 'enrolled',
        approval_status: 'approved',
        payment_type: 'private_pay',
        current_level_id: levelIds['level_2'],
        signed_waiver: true,
        photo_release: true,
        agreed_to_cancellation_policy: true,
        parent_phone: '(209) 555-0101',
        approved_at: new Date().toISOString(),
        approved_by: userIds.admin
      },
      {
        parent_id: userIds.parent1,
        first_name: 'Noah',
        last_name: 'Thompson',
        date_of_birth: '2017-07-22',
        gender: 'Male',
        enrollment_status: 'waitlist',
        approval_status: 'pending',
        payment_type: 'private_pay',
        current_level_id: levelIds['level_1'],
        signed_waiver: false,
        photo_release: false,
        agreed_to_cancellation_policy: false,
        parent_phone: '(209) 555-0101'
      },
      // Parent 2 swimmers
      {
        parent_id: userIds.parent2,
        first_name: 'Olivia',
        last_name: 'Chen',
        date_of_birth: '2014-11-08',
        gender: 'Female',
        enrollment_status: 'enrolled',
        approval_status: 'approved',
        payment_type: 'vmrc',
        is_vmrc_client: true,
        vmrc_sessions_authorized: 12,
        vmrc_sessions_used: 8,
        vmrc_current_pos_number: 'PO-2024-001',
        current_level_id: levelIds['level_3'],
        signed_waiver: true,
        photo_release: true,
        agreed_to_cancellation_policy: true,
        parent_phone: '(209) 555-0102',
        created_by: userIds.vmrc_coordinator,
        approved_at: new Date().toISOString(),
        approved_by: userIds.admin,
        diagnosis: ['Autism', 'Developmental Disability'],
        comfortable_in_water: 'Somewhat comfortable',
        has_medical_conditions: false,
        has_allergies: false,
        toilet_trained: true,
        non_ambulatory: false
      },
      {
        parent_id: userIds.parent2,
        first_name: 'Liam',
        last_name: 'Chen',
        date_of_birth: '2016-05-19',
        gender: 'Male',
        enrollment_status: 'pending_enrollment',
        approval_status: 'pending',
        payment_type: 'private_pay',
        current_level_id: levelIds['level_1'],
        signed_waiver: false,
        photo_release: false,
        agreed_to_cancellation_policy: false,
        parent_phone: '(209) 555-0102'
      }
    ];

    const swimmerIds: string[] = [];
    for (const swimmer of swimmers) {
      const { data, error } = await supabaseAdmin
        .from('swimmers')
        .insert(swimmer)
        .select()
        .single();
      
      if (!error && data) {
        swimmerIds.push(data.id);
        console.log(`Created swimmer: ${swimmer.first_name} ${swimmer.last_name}`);
      }
    }

    // Step 4: Create sessions for the next 14 days
    console.log('Creating sessions...');
    const sessions = [];
    const instructorsList = [userIds.instructor, userIds.instructor2];
    
    for (let day = 0; day < 14; day++) {
      const sessionDate = addDays(today, day);
      const dayOfWeek = sessionDate.getDay();
      
      // Skip Sundays (0)
      if (dayOfWeek === 0) continue;
      
      // Create 3 sessions per day at different times
      const times = [
        { start: 9, end: 9.5 },   // 9:00 AM - 9:30 AM
        { start: 14, end: 14.5 },  // 2:00 PM - 2:30 PM
        { start: 16, end: 16.5 }   // 4:00 PM - 4:30 PM
      ];
      
      for (let i = 0; i < times.length; i++) {
        const time = times[i];
        const startTime = new Date(sessionDate);
        startTime.setHours(Math.floor(time.start), (time.start % 1) * 60, 0, 0);
        
        const endTime = new Date(sessionDate);
        endTime.setHours(Math.floor(time.end), (time.end % 1) * 60, 0, 0);
        
        sessions.push({
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          session_type: i === 0 ? 'private' : (i === 1 ? 'group' : 'assessment'),
          location: 'Main Pool',
          max_capacity: i === 1 ? 4 : 1,
          price_cents: i === 1 ? 3500 : 5000,
          status: day < 7 ? 'available' : 'draft',
          instructor_id: instructorsList[i % 2],
          allowed_swim_levels: [levelIds['level_1'], levelIds['level_2'], levelIds['level_3']],
          day_of_week: dayOfWeek,
          month_year: `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`
        });
      }
    }

    const sessionIds: string[] = [];
    for (const session of sessions) {
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .insert(session)
        .select()
        .single();
      
      if (!error && data) {
        sessionIds.push(data.id);
      }
    }
    console.log(`Created ${sessionIds.length} sessions`);

    // Step 5: Create bookings for approved swimmers
    console.log('Creating bookings...');
    const bookings = [];
    
    // Emma (approved) gets 3 upcoming bookings
    for (let i = 0; i < 3; i++) {
      if (sessionIds[i]) {
        bookings.push({
          session_id: sessionIds[i],
          swimmer_id: swimmerIds[0], // Emma
          parent_id: userIds.parent1,
          status: 'confirmed',
          notes: `Regular lesson ${i + 1}`
        });
      }
    }
    
    // Olivia (VMRC, approved) gets 2 upcoming bookings
    for (let i = 3; i < 5; i++) {
      if (sessionIds[i]) {
        bookings.push({
          session_id: sessionIds[i],
          swimmer_id: swimmerIds[2], // Olivia
          parent_id: userIds.parent2,
          status: 'confirmed',
          notes: `VMRC session ${i - 2}`
        });
      }
    }

    // Add a cancelled booking
    if (sessionIds[5]) {
      bookings.push({
        session_id: sessionIds[5],
        swimmer_id: swimmerIds[0], // Emma
        parent_id: userIds.parent1,
        status: 'cancelled',
        cancel_reason: 'Family emergency',
        cancel_source: 'parent',
        canceled_at: new Date().toISOString(),
        canceled_by: userIds.parent1
      });
    }

    for (const booking of bookings) {
      await supabaseAdmin.from('bookings').insert(booking);
    }
    console.log(`Created ${bookings.length} bookings`);

    // Step 6: Create progress notes
    console.log('Creating progress notes...');
    const progressNotes = [
      {
        session_id: sessionIds[0],
        booking_id: (await supabaseAdmin.from('bookings').select('id').eq('session_id', sessionIds[0]).single()).data?.id,
        swimmer_id: swimmerIds[0],
        instructor_id: userIds.instructor,
        current_level_id: levelIds['level_2'],
        lesson_number: 8,
        total_lessons: 12,
        lesson_summary: 'Great progress on freestyle kicks! Emma is becoming more confident in deeper water.',
        instructor_notes: 'Continue working on breathing technique. Ready to move to Level 3 soon.',
        shared_with_parent: true,
        skills_working_on: ['Freestyle kicks', 'Breathing technique', 'Treading water']
      },
      {
        session_id: sessionIds[3],
        booking_id: (await supabaseAdmin.from('bookings').select('id').eq('session_id', sessionIds[3]).single()).data?.id,
        swimmer_id: swimmerIds[2],
        instructor_id: userIds.instructor2,
        current_level_id: levelIds['level_3'],
        lesson_number: 8,
        total_lessons: 12,
        lesson_summary: 'Olivia worked on backstroke and showed excellent improvement. Very focused today.',
        instructor_notes: 'POS renewal needed soon. Recommend continuing with 12 more sessions.',
        parent_notes: 'Olivia loves swimming! She talks about it all week.',
        shared_with_parent: true,
        skills_working_on: ['Backstroke', 'Endurance', 'Diving']
      }
    ];

    for (const note of progressNotes) {
      await supabaseAdmin.from('progress_notes').insert(note);
    }
    console.log('Created progress notes');

    // Step 7: Create purchase order for VMRC client
    console.log('Creating purchase order...');
    const poStartDate = addDays(today, -60);
    const poEndDate = addDays(poStartDate, 90);
    
    await supabaseAdmin.from('purchase_orders').insert({
      swimmer_id: swimmerIds[2], // Olivia
      coordinator_id: userIds.vmrc_coordinator,
      po_type: 'lessons',
      authorization_number: 'PO-2024-001',
      start_date: poStartDate.toISOString().split('T')[0],
      end_date: poEndDate.toISOString().split('T')[0],
      allowed_lessons: 12,
      lessons_booked: 10,
      lessons_used: 8,
      status: 'in_progress',
      notes: 'Initial 3-month authorization for Olivia Chen'
    });

    console.log('Setup complete!');

    return new Response(
      JSON.stringify({
        message: 'Demo accounts and data setup complete',
        results,
        summary: {
          accounts: results.length,
          swimmers: swimmerIds.length,
          sessions: sessionIds.length,
          bookings: bookings.length,
          testAccounts: {
            parent1: { email: 'parent@icanswim209.com', password: 'Demo2024!Parent' },
            parent2: { email: 'parent2@icanswim209.com', password: 'Demo2024!Parent' },
            instructor1: { email: 'instructor@icanswim209.com', password: 'Demo2024!Instructor' },
            instructor2: { email: 'instructor2@icanswim209.com', password: 'Demo2024!Instructor' },
            admin: { email: 'admin@icanswim209.com', password: 'Demo2024!Admin' },
            coordinator: { email: 'coordinator@icanswim209.com', password: 'Demo2024!Coordinator' }
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in setup-demo-accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
