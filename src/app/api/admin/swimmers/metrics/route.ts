import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Response type for swimmer metrics
interface SwimmerMetricsResponse {
  totalSwimmers: number;
  waitlistedSwimmers: number;
  activeEnrolledSwimmers: number;
  averageLessons: number;
  regionalCenterClients: number;
  lastUpdated: string;
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

    // ========== STEP 3: Fetch Metrics ==========

    // Query 1: Total ALL swimmers (including all funding sources)
    const { count: totalSwimmers, error: totalError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total swimmers:', totalError);
      throw totalError;
    }

    // Query 2: Waitlisted swimmers (all funding sources)
    const { count: waitlistedSwimmers, error: waitlistedError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_status', 'waitlist');

    if (waitlistedError) {
      console.error('Error fetching waitlisted swimmers:', waitlistedError);
      throw waitlistedError;
    }

    // Query 3: Active enrolled swimmers (all funding sources)
    const { count: activeEnrolledSwimmers, error: activeError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_status', 'enrolled');

    if (activeError) {
      console.error('Error fetching active enrolled swimmers:', activeError);
      throw activeError;
    }

    // Query 4: Regional center clients count (for reference, but not excluded)
    // First get regional center funding source IDs
    const { data: regionalFundingSources, error: regionalFundingError } = await supabase
      .from('funding_sources')
      .select('id')
      .eq('type', 'regional_center');

    if (regionalFundingError) {
      console.error('Error fetching regional funding sources:', regionalFundingError);
      throw regionalFundingError;
    }

    const regionalFundingSourceIds = regionalFundingSources?.map(fs => fs.id) || [];

    const { count: regionalCenterClients, error: regionalError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .in('funding_source_id', regionalFundingSourceIds);

    if (regionalError) {
      console.error('Error fetching regional center clients:', regionalError);
      throw regionalError;
    }

    // Query 5: Average lessons for ALL swimmers
    // Get all swimmers with their completed bookings count
    const { data: swimmersWithLessons, error: lessonsError } = await supabase
      .from('swimmers')
      .select(`
        id,
        bookings!bookings_swimmer_id_fkey(
          count
        )
      `);

    if (lessonsError) {
      console.error('Error fetching swimmers with lessons:', lessonsError);
      throw lessonsError;
    }

    // Calculate average lessons
    let totalLessons = 0;
    let swimmersWithData = 0;

    if (swimmersWithLessons && swimmersWithLessons.length > 0) {
      swimmersWithLessons.forEach(swimmer => {
        const lessonsCount = swimmer.bookings?.[0]?.count || 0;
        totalLessons += lessonsCount;
        swimmersWithData++;
      });
    }

    const averageLessons = swimmersWithData > 0 ? totalLessons / swimmersWithData : 0;

    // ========== STEP 4: Prepare Response ==========
    const metrics: SwimmerMetricsResponse = {
      totalSwimmers: totalSwimmers || 0,
      waitlistedSwimmers: waitlistedSwimmers || 0,
      activeEnrolledSwimmers: activeEnrolledSwimmers || 0,
      averageLessons: parseFloat(averageLessons.toFixed(1)), // Round to 1 decimal place
      regionalCenterClients: regionalCenterClients || 0,
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ Admin fetched swimmer metrics:`, {
      totalSwimmers: metrics.totalSwimmers,
      waitlisted: metrics.waitlistedSwimmers,
      activeEnrolled: metrics.activeEnrolledSwimmers,
      averageLessons: metrics.averageLessons,
      regionalCenterClients: metrics.regionalCenterClients
    });

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Get swimmer metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}