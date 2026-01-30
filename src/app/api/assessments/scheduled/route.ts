import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  console.log('[API] /api/assessments/scheduled - Starting request');

  try {
    const supabase = await createClient();
    console.log('[API] Supabase client created');

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[API] Auth error:', authError);
      return NextResponse.json({ error: 'Auth error', details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.log('[API] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API] User authenticated:', user.id);

    // Get user roles from user_roles table
    console.log('[API] Fetching user roles...');
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error('[API] Error fetching user roles:', roleError);
      return NextResponse.json(
        {
          error: 'Failed to check permissions',
          details: roleError.message,
          hint: 'Check if user_roles table exists and has proper permissions'
        },
        { status: 500 }
      );
    }

    const roles = roleData?.map(r => r.role) || [];
    const isInstructor = roles.includes('instructor');
    const isAdmin = roles.includes('admin');
    console.log('[API] User roles:', roles, 'isInstructor:', isInstructor, 'isAdmin:', isAdmin);

    // Get today's date in local timezone
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log('[API] Today date:', todayString);

    // FIRST: Test a simple query to see if we can access the assessments table
    console.log('[API] Testing simple assessments query...');
    const { data: testData, error: testError } = await supabase
      .from('assessments')
      .select('*')
      .limit(5);

    if (testError) {
      console.error('[API] Simple assessments query error:', testError);
      console.error('[API] Error details:', testError.message, 'Code:', testError.code);

      // Try an even simpler query
      console.log('[API] Trying count query...');
      const { count, error: countError } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('[API] Count query error:', countError);
        return NextResponse.json(
          {
            error: 'Database access error',
            details: `Simple query failed: ${testError.message}. Count query failed: ${countError.message}`,
            hint: 'Check RLS policies on assessments table'
          },
          { status: 500 }
        );
      }

      console.log('[API] Count query successful, count:', count);
    } else {
      console.log('[API] Simple query successful, found', testData?.length || 0, 'assessments');
    }

    // Build query for today's scheduled assessments
    console.log('[API] Building main query...');
    let query = supabase
      .from('bookings')
      .select(`
        id,
        swimmer_id,
        parent_id,
        status,
        sessions (
          id,
          start_time,
          end_time,
          instructor_id,
          location,
          session_type,
          status
        ),
        swimmers (
          id,
          first_name,
          last_name,
          date_of_birth,
          assessment_status,
          enrollment_status,
          profiles!swimmers_parent_id_fkey (
            id,
            full_name
          )
        )
      `)
      .eq('sessions.session_type', 'assessment')
      .eq('status', 'confirmed')
      .gte('sessions.start_time', `${todayString}T00:00:00`)
      .lt('sessions.start_time', `${todayString}T23:59:59`);
      // Note: Ordering removed due to Supabase nested table ordering issue
      // .order('start_time', { foreignTable: 'sessions', ascending: true });

    // Filter by instructor if user is instructor (not admin)
    if (isInstructor && !isAdmin) {
      query = query.eq('sessions.instructor_id', user.id);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('[API] Error fetching scheduled assessments:', error);
      console.error('[API] Error details:', error.message, 'Code:', error.code, 'Details:', error.details);
      return NextResponse.json(
        {
          error: 'Failed to fetch scheduled assessments',
          details: error.message,
          code: error.code,
          hint: 'Check if all required tables (bookings, sessions, swimmers, profiles) exist and have proper relationships'
        },
        { status: 500 }
      );
    }

    console.log('[API] Main query successful, found', bookings?.length || 0, 'bookings');

    // Transform the data
    const swimmers = bookings
      .filter(booking => booking.sessions && booking.sessions.length > 0 && booking.swimmers && booking.swimmers.length > 0)
      .map(booking => {
        const swimmer = booking.swimmers[0];
        const session = booking.sessions[0];
        const parent = swimmer.profiles && swimmer.profiles.length > 0 ? swimmer.profiles[0] : null;

        // Format time
        const startTime = new Date(session.start_time);
        const timeString = startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return {
          id: swimmer.id,
          name: `${swimmer.first_name} ${swimmer.last_name}`,
          parentName: parent?.full_name || 'Unknown',
          scheduledTime: timeString,
          location: session.location,
          startTime: session.start_time,
          endTime: session.end_time,
        };
      });

    console.log('[API] Transformed data, returning', swimmers.length, 'swimmers');
    return NextResponse.json(swimmers);

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}