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
    const bookingType = searchParams.get('bookingType'); // 'single' or 'recurring'

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate query parameters are required' },
        { status: 400 }
      );
    }

    // Note: Flexible swimmer validation is handled in:
    // 1. UI level (SessionTypeStep disables recurring option for flexible swimmers)
    // 2. API level (recurring booking API blocks flexible swimmers)
    // This endpoint just filters sessions based on booking type

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
        is_recurring,
        held_by,
        held_until,
        profiles!instructor_id(full_name, avatar_url)
      `)
      .eq('session_type', 'lesson')
      .in('status', ['available', 'open'])
      .eq('is_full', false)
      .or(`held_by.is.null,held_until.lt.${new Date().toISOString()}`)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });

    // Apply session type filtering based on booking type
    if (bookingType === 'single') {
      // For single lesson booking - show floating sessions (non-recurring)
      // These are canceled weekly slots now available for one-time booking
      // Available to ALL enrolled swimmers (regular AND flexible)
      query = query.eq('is_recurring', false);
    } else if (bookingType === 'recurring') {
      // For recurring booking - show recurring sessions
      // Only for non-flexible swimmers (flexible swimmers blocked in UI and API)
      query = query.eq('is_recurring', true);
    }
    // If bookingType not specified, show all available sessions

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
      currentBookings: session.booking_count,
      isFull: session.booking_count >= session.max_capacity,
      spotsRemaining: session.max_capacity - session.booking_count,
      isRecurring: session.is_recurring,
      heldBy: session.held_by,
      heldUntil: session.held_until,
      isHeld: session.held_by !== null && new Date(session.held_until) > new Date(),
      instructorName: session.profiles?.[0]?.full_name || 'Unknown Instructor',
      instructorAvatarUrl: session.profiles?.[0]?.avatar_url || null,
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