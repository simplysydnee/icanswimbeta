import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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
    const isInstructor = roles.includes('instructor');
    const isAdmin = roles.includes('admin');

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

    // Filter by instructor if user is instructor (not admin)
    if (isInstructor && !isAdmin) {
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

    return NextResponse.json(swimmers);

  } catch (error) {
    console.error('Error in scheduled assessments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}