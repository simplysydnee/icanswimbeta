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

    // Query 1: Total private pay swimmers (non-regional center)
    // First get funding source IDs that are not regional_center
    const { data: nonRegionalFundingSources, error: fundingSourcesError } = await supabase
      .from('funding_sources')
      .select('id')
      .neq('type', 'regional_center');

    if (fundingSourcesError) {
      console.error('Error fetching non-regional funding sources:', fundingSourcesError);
      throw fundingSourcesError;
    }

    const nonRegionalFundingSourceIds = nonRegionalFundingSources?.map(fs => fs.id) || [];

    const { count: totalPrivatePay, error: totalError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .in('funding_source_id', nonRegionalFundingSourceIds);

    if (totalError) {
      console.error('Error fetching total non-VMRC swimmers:', totalError);
      throw totalError;
    }

    // Query 2: Waitlisted private pay swimmers
    const { count: waitlistedPrivatePay, error: waitlistedError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .in('funding_source_id', nonRegionalFundingSourceIds)
      .eq('enrollment_status', 'waitlist');

    if (waitlistedError) {
      console.error('Error fetching waitlisted non-VMRC swimmers:', waitlistedError);
      throw waitlistedError;
    }

    // Query 3: Active enrolled private pay swimmers
    const { count: activeEnrolledPrivatePay, error: activeError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .in('funding_source_id', nonRegionalFundingSourceIds)
      .eq('enrollment_status', 'enrolled');

    if (activeError) {
      console.error('Error fetching active enrolled non-VMRC swimmers:', activeError);
      throw activeError;
    }

    // Query 4: Regional center clients count
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

    // Query 5: Average lessons for private pay swimmers
    // First, get all private pay swimmers with their completed bookings count
    const { data: swimmersWithLessons, error: lessonsError } = await supabase
      .from('swimmers')
      .select(`
        id,
        bookings!bookings_swimmer_id_fkey(
          count
        )
      `)
      .in('funding_source_id', nonRegionalFundingSourceIds);

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
      totalSwimmers: totalPrivatePay || 0,
      waitlistedSwimmers: waitlistedPrivatePay || 0,
      activeEnrolledSwimmers: activeEnrolledPrivatePay || 0,
      averageLessons: parseFloat(averageLessons.toFixed(1)), // Round to 1 decimal place
      regionalCenterClients: regionalCenterClients || 0,
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ Admin fetched swimmer metrics:`, {
      totalPrivatePay: metrics.totalSwimmers,
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