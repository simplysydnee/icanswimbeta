import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startOfDay, endOfDay } from 'date-fns';

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
        id,
        start_time,
        end_time,
        location,
        status,
        instructor_id,
        bookings(
          id,
          swimmer_id,
          status,
          swimmers(
            id,
            first_name,
            last_name,
            current_level_id,
            swim_levels!current_level_id(
              name,
              color
            )
          )
        ),
        progress_notes(
          id,
          lesson_summary,
          shared_with_parent,
          created_at
        )
      `)
      .eq('instructor_id', user.id)
      //.gte('start_time', startOfTargetDate.toISOString())
      //.lte('start_time', endOfTargetDate.toISOString())
      //.in('status', ['open', 'booked', 'confirmed', 'completed'])
      .order('start_time', { ascending: true });
        console.log("Sessions...", sessions, user.id);
    if (error) {
      console.error('Error fetching instructor sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    const firstRel = <T,>(v: T | T[] | null | undefined): T | undefined => {
      if (v == null) return undefined;
      return Array.isArray(v) ? v[0] : v;
    };

    // Transform data for frontend
    const transformedSessions = (sessions ?? []).map(session => {
      const booking = session.bookings?.[0];
      const swimmer = firstRel(booking?.swimmers);
      const level = firstRel(swimmer?.swim_levels);
      const progressNote = session.progress_notes?.[0];

      return {
        id: session.id,
        startTime: session.start_time,
        endTime: session.end_time,
        location: session.location,
        sessionStatus: session.status,
        bookingId: booking?.id,
        bookingStatus: booking?.status,
        swimmer: swimmer ? {
          id: swimmer.id,
          firstName: swimmer.first_name,
          lastName: swimmer.last_name,
          currentLevelId: swimmer.current_level_id,
          currentLevelName: level?.name,
          levelColor: level?.color,
        } : null,
        progressNote: progressNote ? {
          id: progressNote.id,
          lessonSummary: progressNote.lesson_summary,
          sharedWithParent: progressNote.shared_with_parent,
          createdAt: progressNote.created_at,
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