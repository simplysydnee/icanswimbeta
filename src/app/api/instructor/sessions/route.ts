import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is instructor or admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['instructor', 'admin'])
      .single();

    if (!userRole) {
      return NextResponse.json({ error: 'Instructor access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Get start and end of target date
    const startOfTargetDate = startOfDay(targetDate);
    const endOfTargetDate = endOfDay(targetDate);

    // Fetch today's sessions for this instructor using direct query
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id as session_id,
        start_time,
        end_time,
        location,
        status as session_status,
        instructor_id,
        bookings!inner(
          id as booking_id,
          swimmer_id,
          status as booking_status,
          swimmers!inner(
            id,
            first_name,
            last_name,
            current_level_id,
            swim_levels!current_level_id(
              name as current_level_name,
              color as level_color
            )
          )
        ),
        progress_notes!left(
          id as progress_note_id,
          lesson_summary,
          shared_with_parent,
          created_at as note_created_at
        )
      `)
      .eq('instructor_id', user.id)
      .gte('start_time', startOfTargetDate.toISOString())
      .lte('start_time', endOfTargetDate.toISOString())
      .in('status', ['open', 'booked', 'confirmed', 'completed'])
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching instructor sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Transform data for frontend
    const transformedSessions = sessions.map(session => {
      const booking = session.bookings?.[0];
      const swimmer = booking?.swimmers?.[0];
      const level = swimmer?.swim_levels?.[0];
      const progressNote = session.progress_notes?.[0];

      return {
        id: session.session_id,
        startTime: session.start_time,
        endTime: session.end_time,
        location: session.location,
        sessionStatus: session.session_status,
        bookingId: booking?.booking_id,
        bookingStatus: booking?.booking_status,
        swimmer: swimmer ? {
          id: swimmer.id,
          firstName: swimmer.first_name,
          lastName: swimmer.last_name,
          currentLevelId: swimmer.current_level_id,
          currentLevelName: level?.current_level_name,
          levelColor: level?.level_color,
        } : null,
        progressNote: progressNote ? {
          id: progressNote.progress_note_id,
          lessonSummary: progressNote.lesson_summary,
          sharedWithParent: progressNote.shared_with_parent,
          createdAt: progressNote.note_created_at,
        } : null,
      };
    });

    return NextResponse.json({
      date: targetDate.toISOString(),
      sessions: transformedSessions,
      count: transformedSessions.length,
    });

  } catch (error) {
    console.error('Unexpected error in instructor sessions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}