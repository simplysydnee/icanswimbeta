import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isWithinInterval, parseISO } from 'date-fns';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Authorization - Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const instructorId = searchParams.get('instructor_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const requestId = searchParams.get('request_id');

    if (!instructorId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: instructor_id, start_date, end_date' },
        { status: 400 }
      );
    }

    // Parse dates
    const timeOffStart = parseISO(startDate);
    const timeOffEnd = parseISO(endDate);

    // Fetch instructor's sessions during the time off period
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        end_time,
        location,
        status,
        bookings!inner (
          id,
          status,
          swimmer_id
        )
      `)
      .eq('instructor_id', instructorId)
      .eq('status', 'scheduled')
      .gte('start_time', timeOffStart.toISOString())
      .lte('start_time', timeOffEnd.toISOString())
      .order('start_time', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    // Format conflicts
    const conflicts = (sessions || []).map(session => {
      const confirmedBookings = session.bookings?.filter((b: any) => b.status === 'confirmed') || [];
      return {
        id: session.id,
        start_time: session.start_time,
        end_time: session.end_time,
        location: session.location || 'Location TBD',
        swimmer_count: confirmedBookings.length,
        status: session.status,
      };
    });

    // If a requestId is provided, also check for overlapping approved time off requests
    let overlappingTimeOff: any[] = [];
    if (requestId) {
      const { data: timeOffRequests, error: timeOffError } = await supabase
        .from('time_off_requests')
        .select(`
          id,
          start_date,
          end_date,
          reason_type,
          instructor:profiles!time_off_requests_instructor_id_fkey (
            id,
            full_name
          )
        `)
        .eq('instructor_id', instructorId)
        .eq('status', 'approved')
        .neq('id', requestId) // Exclude the current request
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (!timeOffError && timeOffRequests) {
        overlappingTimeOff = timeOffRequests.map(req => ({
          id: req.id,
          start_date: req.start_date,
          end_date: req.end_date,
          reason_type: req.reason_type,
          instructor_name: req.instructor?.full_name,
        }));
      }
    }

    return NextResponse.json({
      conflicts,
      overlapping_time_off: overlappingTimeOff,
      conflict_count: conflicts.length,
      overlapping_time_off_count: overlappingTimeOff.length,
      has_conflicts: conflicts.length > 0 || overlappingTimeOff.length > 0,
    });
  } catch (error: any) {
    console.error('Unexpected error in conflict detection API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}