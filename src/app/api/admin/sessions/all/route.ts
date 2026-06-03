import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SESSION_STATUS } from '@/config/constants';

interface SessionWithBookings {
  id: string;
  instructor_id: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
  location: string;
  max_capacity: number;
  booking_count: number;
  is_full: boolean;
  session_type: string;
  status: string;
  price_cents: number;
  batch_id: string;
  created_at: string;
  updated_at: string;
  open_at: string | null;
  instructor_name?: string;
  bookings?: Array<{
    id: string;
    status: string;
    swimmer?: {
      id: string;
      first_name: string;
      last_name: string;
    };
    parent?: {
      id: string;
      full_name: string;
      email: string;
      phone: string;
    };
  }>;
}

interface AllSessionsResponse {
  sessions: SessionWithBookings[];
  stats: {
    total: number;
    draft: number;
    open: number;
    booked: number;
    completed: number;
    cancelled: number;
    no_shows: number;
  };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    // Optional filters (applied in the database, not the browser).
    const statusParam = searchParams.get('status');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const dayOfWeekParam = searchParams.get('dayOfWeek');
    const timeFilterParam = searchParams.get('timeFilter');
    const instructorIdParam = searchParams.get('instructorId');
    const locationParam = searchParams.get('location');
    const searchParam = searchParams.get('search');

    // ========== STEP 1: Authentication ==========
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ========== STEP 2: Authorization ==========
    // Check if user is admin using user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // ========== STEP 3: Parse Month/Year Parameters ==========
    let monthNum: number | null = null;
    let yearNum: number | null = null;

    if (month && year) {
      monthNum = parseInt(month);
      yearNum = parseInt(year);
    }

    // ========== STEP 4: Fetch Statistics ==========
    // Helper function to get count with optional date filter
    const getCountByStatus = async (status: string | null = null) => {
      let query = supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });

      // Apply date filter if provided
      if (monthNum !== null && yearNum !== null) {
        const startDate = new Date(yearNum, monthNum - 1, 1).toISOString();
        const endDate = new Date(yearNum, monthNum, 1).toISOString();

        query = query
          .gte('start_time', startDate)
          .lt('start_time', endDate);
      }

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }

      const { count, error } = await query;

      if (error) {
        console.error(`Error fetching count for status ${status}:`, error);
        return 0;
      }

      return count || 0;
    };

    // Get all counts
    const totalCount = await getCountByStatus();
    const draftCount = await getCountByStatus(SESSION_STATUS.DRAFT);
    const availableCount = await getCountByStatus(SESSION_STATUS.AVAILABLE);
    const bookedCount = await getCountByStatus(SESSION_STATUS.BOOKED);
    const completedCount = await getCountByStatus(SESSION_STATUS.COMPLETED);
    const cancelledCount = await getCountByStatus(SESSION_STATUS.CANCELLED);
    const noShowCount = await getCountByStatus('no_show');

    // ========== STEP 5: Fetch Sessions (filtered + searched in the database) ==========
    // Base start_time window comes from month/year; explicit startDate/endDate
    // (within the month) tighten it. Upper bound is EXCLUSIVE.
    const monthStart = (monthNum !== null && yearNum !== null)
      ? new Date(yearNum, monthNum - 1, 1)
      : null;
    const monthEnd = (monthNum !== null && yearNum !== null)
      ? new Date(yearNum, monthNum, 1)
      : null;

    let pStartDate: string | null = monthStart ? monthStart.toISOString() : null;
    if (startDateParam) {
      pStartDate = new Date(`${startDateParam}T00:00:00`).toISOString();
    }

    let pEndDate: string | null = monthEnd ? monthEnd.toISOString() : null;
    if (endDateParam) {
      // Exclusive upper bound = start of the day AFTER the selected end date.
      const end = new Date(`${endDateParam}T00:00:00`);
      end.setDate(end.getDate() + 1);
      pEndDate = end.toISOString();
    }

    // Map UI status 'open' -> DB status 'available'. 'all'/empty -> no filter.
    const pStatus = (!statusParam || statusParam === 'all')
      ? null
      : (statusParam === 'open' ? 'available' : statusParam);

    // Day name -> 0..6 (Sunday=0), matching EXTRACT(DOW) / getDay().
    const DAY_NAME_TO_NUM: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
    };
    const pDayOfWeek = (!dayOfWeekParam || dayOfWeekParam === 'all')
      ? null
      : (DAY_NAME_TO_NUM[dayOfWeekParam.toLowerCase()] ?? null);

    // Time-of-day buckets (studio-timezone hours), matching the UI options.
    const TIME_BUCKETS: Record<string, [number, number]> = {
      am: [0, 11],
      pm: [12, 23],
      morning: [6, 11],
      afternoon: [12, 16],
      evening: [17, 21],
    };
    const bucket = (timeFilterParam && timeFilterParam !== 'all')
      ? (TIME_BUCKETS[timeFilterParam] ?? null)
      : null;
    const pTimeStartHour = bucket ? bucket[0] : null;
    const pTimeEndHour = bucket ? bucket[1] : null;

    const pInstructorId = (!instructorIdParam || instructorIdParam === 'all') ? null : instructorIdParam;
    const pLocation = (!locationParam || locationParam === 'all') ? null : locationParam;
    const pSearch = searchParam ? (searchParam.trim() || null) : null;

    const { data: rpcSessions, error: sessionsError } = await supabase.rpc('list_admin_sessions', {
      p_start_date: pStartDate,
      p_end_date: pEndDate,
      p_status: pStatus,
      p_day_of_week: pDayOfWeek,
      p_time_start_hour: pTimeStartHour,
      p_time_end_hour: pTimeEndHour,
      p_instructor_id: pInstructorId,
      p_location: pLocation,
      p_search: pSearch,
    });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: `Failed to fetch sessions: ${sessionsError.message}` },
        { status: 500 }
      );
    }

    // The RPC already returns rows in the SessionWithBookings shape
    // (instructor_name resolved, bookings aggregated as JSON).
    const processedSessions: SessionWithBookings[] = (rpcSessions || []) as SessionWithBookings[];

    // ========== STEP 8: Calculate Statistics ==========
    const stats = {
      total: totalCount || 0,
      draft: draftCount || 0,
      open: availableCount || 0, // Note: database uses 'available' not 'open'
      booked: bookedCount || 0,
      completed: completedCount || 0,
      cancelled: cancelledCount || 0,
      no_shows: noShowCount || 0,
    };

    // ========== STEP 9: Return Response ==========
    const response: AllSessionsResponse = {
      sessions: processedSessions,
      stats
    };

    console.log(`✅ Fetched ${processedSessions.length} sessions with statistics${monthNum !== null && yearNum !== null ? ` for ${monthNum}/${yearNum}` : ''}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get all sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}