import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { format, addDays } from 'date-fns';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user roles from user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error('Error fetching user roles:', roleError);
      return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 });
    }

    const roles = roleData?.map(r => r.role) || [];
    const isAdmin = roles.includes('admin');
    const isInstructor = roles.includes('instructor');

    if (!isAdmin && !isInstructor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get today's sessions that need progress updates (same logic as admin dashboard)
    const today = new Date();
    const dateStr = format(today, 'yyyy-MM-dd');
    const startOfDayUTC = `${dateStr}T08:00:00.000Z`;
    const endOfDayUTC = `${format(addDays(today, 1), 'yyyy-MM-dd')}T08:00:00.000Z`;
    console.log('Progress update API: date range', { startOfDayUTC, endOfDayUTC, today: dateStr });

    // Get sessions that have started (or are in progress/ended) today
    // Exclude cancelled sessions
    let sessionsQuery = supabase
      .from('sessions')
      .select('id, start_time, end_time, instructor_id, status')
      .gte('start_time', startOfDayUTC)
      .lt('start_time', endOfDayUTC)
      .lte('start_time', new Date().toISOString()) // Has started (not in future)
      .neq('status', 'cancelled')            // Exclude cancelled sessions
      .neq('status', 'draft');               // Exclude draft sessions

    // Instructors only see their own sessions
    if (isInstructor) {
      sessionsQuery = sessionsQuery.eq('instructor_id', user.id);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('Sessions query error:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    console.log('Progress update API: sessions found', sessions?.length || 0);

    if (!sessions || sessions.length === 0) {
      console.log('Progress update API: no sessions, returning empty array');
      return NextResponse.json([]);
    }

    const sessionIds = sessions.map(s => s.id);

    // Get bookings for these sessions with swimmer info
    // Exclude cancelled bookings (same as admin dashboard logic)
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
      .neq('status', 'cancelled');

    if (bookingsError) {
      console.error('Bookings query error:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    console.log('Progress update API: bookings found', bookings?.length || 0);

    // Get existing progress notes for these sessions
    const { data: existingNotes } = await supabase
      .from('progress_notes')
      .select('booking_id, swimmer_id, session_id')
      .in('session_id', sessionIds);

    console.log('Progress update API: existing notes found', existingNotes?.length || 0);

    const notedBookingIds = new Set(existingNotes?.map(n => n.booking_id) || []);

    // Filter out bookings that already have progress notes
    const needsUpdate = bookings?.filter(b => !notedBookingIds.has(b.id)) || [];

    console.log('Progress update API: bookings needing update', needsUpdate.length);

    return NextResponse.json(needsUpdate);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}