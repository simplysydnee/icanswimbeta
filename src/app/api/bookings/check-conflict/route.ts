import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { swimmerId, sessionId, startTime, endTime } = await request.json();

    if (!swimmerId || (!sessionId && !startTime)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If sessionId provided, get session times
    let sessionStart = startTime;
    let sessionEnd = endTime;

    if (sessionId && !startTime) {
      const { data: session } = await supabase
        .from('sessions')
        .select('start_time, end_time')
        .eq('id', sessionId)
        .single();

      if (session) {
        sessionStart = session.start_time;
        sessionEnd = session.end_time;
      }
    }

    if (!sessionStart) {
      return NextResponse.json({ error: 'Could not determine session time' }, { status: 400 });
    }

    // Check for existing bookings that overlap
    const { data: conflicts, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        session:sessions(id, start_time, end_time, location)
      `)
      .eq('swimmer_id', swimmerId)
      .in('status', ['confirmed', 'pending'])
      .not('session', 'is', null);

    if (error) {
      console.error('Conflict check error:', error);
      return NextResponse.json({ error: 'Failed to check conflicts' }, { status: 500 });
    }

    // Check for time overlaps
    const sessionStartTime = new Date(sessionStart).getTime();
    const sessionEndTime = sessionEnd ? new Date(sessionEnd).getTime() : sessionStartTime + (45 * 60 * 1000); // Default 45 min

    const overlappingBookings = conflicts?.filter(booking => {
      if (!booking.session?.start_time) return false;

      const existingStart = new Date(booking.session.start_time).getTime();
      const existingEnd = booking.session.end_time
        ? new Date(booking.session.end_time).getTime()
        : existingStart + (45 * 60 * 1000);

      // Check if times overlap
      return (sessionStartTime < existingEnd && sessionEndTime > existingStart);
    }) || [];

    if (overlappingBookings.length > 0) {
      return NextResponse.json({
        hasConflict: true,
        conflicts: overlappingBookings.map(b => ({
          bookingId: b.id,
          sessionTime: b.session?.start_time,
          location: b.session?.location,
        })),
        message: `This swimmer already has a booking at this time.`,
      });
    }

    // Check daily booking limit (max 4 per day per swimmer)
    const sessionDate = new Date(sessionStart).toISOString().split('T')[0];
    const dayStart = `${sessionDate}T00:00:00.000Z`;
    const dayEnd = `${sessionDate}T23:59:59.999Z`;

    const { count: dailyBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' })
      .eq('swimmer_id', swimmerId)
      .in('status', ['confirmed', 'pending'])
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd);

    if ((dailyBookings || 0) >= 4) {
      return NextResponse.json({
        hasConflict: true,
        conflicts: [],
        message: 'Daily booking limit reached (maximum 4 sessions per day).',
      });
    }

    return NextResponse.json({ hasConflict: false });

  } catch (error) {
    console.error('Conflict check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}