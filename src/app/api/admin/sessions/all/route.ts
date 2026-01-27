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

export async function GET() {
  try {
    const supabase = await createClient();

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

    // ========== STEP 3: Fetch Statistics ==========
    // First, get accurate counts using aggregation query
    const { count: totalCount, error: countError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching total session count:', countError);
      return NextResponse.json(
        { error: `Failed to fetch session count: ${countError.message}` },
        { status: 500 }
      );
    }

    // Get counts by status using separate queries
    const { count: draftCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', SESSION_STATUS.DRAFT);

    const { count: availableCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', SESSION_STATUS.AVAILABLE);

    const { count: bookedCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', SESSION_STATUS.BOOKED);

    const { count: completedCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', SESSION_STATUS.COMPLETED);

    const { count: cancelledCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', SESSION_STATUS.CANCELLED);

    const { count: noShowCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'no_show');

    // ========== STEP 4: Fetch All Sessions ==========
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        *,
        bookings(
          id,
          status,
          swimmer:swimmers(id, first_name, last_name),
          parent:profiles!parent_id(id, full_name, email, phone)
        )
      `)
      .order('start_time', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: `Failed to fetch sessions: ${sessionsError.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 4: Get Instructor Information ==========
    // Get unique instructor IDs from sessions
    const instructorIds = Array.from(new Set(sessions.map(s => s.instructor_id).filter(Boolean)));

    let instructorsMap = new Map<string, { id: string; name: string }>();

    if (instructorIds.length > 0) {
      const { data: instructorProfiles, error: instructorsError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', instructorIds);

      if (instructorsError) {
        console.error('Error fetching instructor profiles:', instructorsError);
        // Continue without instructor names - they'll show as "Unknown Instructor"
      } else if (instructorProfiles) {
        instructorProfiles.forEach(profile => {
          instructorsMap.set(profile.id, {
            id: profile.id,
            name: profile.full_name || 'Unknown Instructor'
          });
        });
      }
    }

    // ========== STEP 5: Process Sessions ==========
    const processedSessions: SessionWithBookings[] = sessions.map(session => {
      const instructor = instructorsMap.get(session.instructor_id) || {
        id: session.instructor_id,
        name: 'Unknown Instructor'
      };

      return {
        ...session,
        instructor_name: instructor.name,
        bookings: session.bookings?.map((booking: any) => ({
          id: booking.id,
          status: booking.status,
          swimmer: booking.swimmer,
          parent: booking.parent
        })) || []
      };
    });

    // ========== STEP 6: Calculate Statistics ==========
    const stats = {
      total: totalCount || 0,
      draft: draftCount || 0,
      open: availableCount || 0, // Note: database uses 'available' not 'open'
      booked: bookedCount || 0,
      completed: completedCount || 0,
      cancelled: cancelledCount || 0,
      no_shows: noShowCount || 0,
    };

    // ========== STEP 7: Return Response ==========
    const response: AllSessionsResponse = {
      sessions: processedSessions,
      stats
    };

    console.log(`✅ Fetched ${processedSessions.length} sessions with statistics`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get all sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}