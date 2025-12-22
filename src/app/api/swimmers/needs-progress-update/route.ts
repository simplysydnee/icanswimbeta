import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role from user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = roleData?.role;
    const isAdmin = userRole === 'admin';
    const isInstructor = userRole === 'instructor';

    if (!isAdmin && !isInstructor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get today's date range
    const today = new Date();
    const startOfToday = startOfDay(today).toISOString();
    const endOfToday = endOfDay(today).toISOString();

    // Get completed sessions for today
    let sessionsQuery = supabase
      .from('sessions')
      .select('id, start_time, end_time, instructor_id')
      .gte('start_time', startOfToday)
      .lte('start_time', endOfToday)
      .or(`status.eq.completed,end_time.lt.${new Date().toISOString()}`);

    // Instructors only see their own sessions
    if (isInstructor) {
      sessionsQuery = sessionsQuery.eq('instructor_id', user.id);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('Sessions query error:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json([]);
    }

    const sessionIds = sessions.map(s => s.id);

    // Get bookings for these sessions with swimmer info
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        session_id,
        swimmer:swimmers(
          id,
          first_name,
          last_name,
          photo_url,
          current_level:swim_levels(name, display_name)
        ),
        session:sessions(
          id,
          start_time,
          end_time,
          instructor:profiles(full_name)
        )
      `)
      .in('session_id', sessionIds)
      .eq('status', 'confirmed');

    if (bookingsError) {
      console.error('Bookings query error:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Get existing progress notes for these sessions
    const { data: existingNotes } = await supabase
      .from('progress_notes')
      .select('booking_id, swimmer_id, session_id')
      .in('session_id', sessionIds);

    const notedBookingIds = new Set(existingNotes?.map(n => n.booking_id) || []);

    // Filter out bookings that already have progress notes
    const needsUpdate = bookings?.filter(b => !notedBookingIds.has(b.id)) || [];

    return NextResponse.json(needsUpdate);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}