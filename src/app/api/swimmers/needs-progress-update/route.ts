import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role from user_roles table first, then fall back to profiles table
    let userRole = 'parent'; // default

    // Try user_roles table first
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleError && roleData?.role) {
      userRole = roleData.role;
    } else {
      // Fall back to profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileError && profileData?.role) {
        userRole = profileData.role;
      }
    }

    const isAdmin = userRole === 'admin';
    const isInstructor = userRole === 'instructor';

    if (!isAdmin && !isInstructor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get sessions that have ended and need progress updates
    const now = new Date().toISOString();

    // Get sessions that have ended (not in future)
    let sessionsQuery = supabase
      .from('sessions')
      .select('id, start_time, end_time, instructor_id, status')
      .lte('end_time', now);                // Has ended (not in future)

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