import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const instructorId = searchParams.get('instructorId');

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate query parameters are required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('sessions')
      .select(`
        id,
        instructor_id,
        start_time,
        end_time,
        day_of_week,
        session_type,
        location,
        price_cents,
        max_capacity,
        booking_count,
        profiles!instructor_id(full_name)
      `)
      .eq('session_type', 'lesson')
      .in('status', ['available', 'open'])
      .eq('is_full', false)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });

    // Apply instructor filter if provided
    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching available sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch available sessions' },
        { status: 500 }
      );
    }

    // Transform snake_case to camelCase and calculate spotsRemaining
    const transformedData = data.map(session => ({
      id: session.id,
      instructorId: session.instructor_id,
      startTime: session.start_time,
      endTime: session.end_time,
      dayOfWeek: session.day_of_week,
      sessionType: session.session_type,
      location: session.location,
      priceCents: session.price_cents,
      maxCapacity: session.max_capacity,
      bookingCount: session.booking_count,
      spotsRemaining: session.max_capacity - session.booking_count,
      instructorName: session.profiles?.full_name || 'Unknown Instructor',
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Unexpected error in available sessions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}