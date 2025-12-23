import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get today's date in local timezone
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Build query for today's scheduled assessments
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
      .lt('sessions.start_time', `${todayString}T23:59:59`)
      .order('sessions.start_time', { ascending: true });

    // Filter by instructor if user is instructor
    if (profile.role === 'instructor') {
      query = query.eq('sessions.instructor_id', user.id);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching scheduled assessments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled assessments' },
        { status: 500 }
      );
    }

    // Transform the data
    const swimmers = bookings
      .filter(booking => booking.sessions && booking.swimmers)
      .map(booking => {
        const swimmer = booking.swimmers;
        const session = booking.sessions;
        const parent = swimmer.profiles;

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

    return NextResponse.json(swimmers);

  } catch (error) {
    console.error('Error in scheduled assessments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}