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

    // Fetch today's sessions for this instructor using the view we created
    const { data: sessions, error } = await supabase
      .from('instructor_today_sessions')
      .select('*')
      .gte('start_time', startOfTargetDate.toISOString())
      .lte('start_time', endOfTargetDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching instructor sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Transform data for frontend
    const transformedSessions = sessions.map(session => ({
      id: session.session_id,
      startTime: session.start_time,
      endTime: session.end_time,
      location: session.location,
      sessionStatus: session.session_status,
      bookingId: session.booking_id,
      bookingStatus: session.booking_status,
      swimmer: {
        id: session.swimmer_id,
        firstName: session.first_name,
        lastName: session.last_name,
        currentLevelId: session.current_level_id,
        currentLevelName: session.current_level_name,
        levelColor: session.level_color,
      },
      progressNote: session.progress_note_id ? {
        id: session.progress_note_id,
        lessonSummary: session.lesson_summary,
        sharedWithParent: session.shared_with_parent,
        createdAt: session.note_created_at,
      } : null,
    }));

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