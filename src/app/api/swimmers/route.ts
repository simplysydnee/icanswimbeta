import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query swimmers for this parent with additional data
    const { data, error } = await supabase
      .from('swimmers')
      .select(`
        id,
        parent_id,
        first_name,
        last_name,
        date_of_birth,
        enrollment_status,
        assessment_status,
        current_level_id,
        payment_type,
        funding_source_id,
        funding_source_name,
        flexible_swimmer,
        authorized_sessions_used,
        authorized_sessions_total,
        swim_levels:current_level_id(name, display_name, color),
        bookings!bookings_swimmer_id_fkey(
          id,
          status,
          session:sessions(
            start_time,
            instructor:profiles!sessions_instructor_id_fkey(full_name)
          )
        )
      `)
      .eq('parent_id', user.id)
      .order('first_name');

    if (error) {
      console.error('Error fetching swimmers:', error);
      return NextResponse.json({ error: 'Failed to fetch swimmers' }, { status: 500 });
    }

    // Transform snake_case to camelCase and extract nested data
    const transformedData = data.map((swimmer: any) => {
      // Calculate lessons completed
      const completedBookings = swimmer.bookings?.filter((b: any) => b.status === 'completed') || [];
      const lessonsCompleted = completedBookings.length;

      // Find next upcoming session
      const now = new Date();
      const upcomingBookings = swimmer.bookings?.filter((b: any) =>
        b.status === 'confirmed' &&
        b.session &&
        b.session.length > 0 &&
        new Date(b.session[0].start_time) > now
      ) || [];

      const nextBooking = upcomingBookings.sort((a: any, b: any) =>
        new Date(a.session[0].start_time).getTime() - new Date(b.session[0].start_time).getTime()
      )[0];

      return {
        id: swimmer.id,
        parentId: swimmer.parent_id,
        firstName: swimmer.first_name,
        lastName: swimmer.last_name,
        dateOfBirth: swimmer.date_of_birth,
        enrollmentStatus: swimmer.enrollment_status,
        assessmentStatus: swimmer.assessment_status,
        currentLevelId: swimmer.current_level_id,
        currentLevel: swimmer.swim_levels?.[0] ? {
          name: swimmer.swim_levels[0].name,
          displayName: swimmer.swim_levels[0].display_name,
          color: swimmer.swim_levels[0].color
        } : null,
        paymentType: swimmer.payment_type === 'vmrc' ? 'funded' : swimmer.payment_type,
        fundingSourceId: swimmer.funding_source_id,
        fundingSourceName: swimmer.funding_source_name,
        flexibleSwimmer: swimmer.flexible_swimmer || false,
        authorizedSessionsUsed: swimmer.authorized_sessions_used,
        authorizedSessionsTotal: swimmer.authorized_sessions_total,
        lessonsCompleted,
        nextSession: nextBooking?.session?.[0] ? {
          startTime: nextBooking.session[0].start_time,
          instructorName: nextBooking.session[0].instructor?.[0]?.full_name
        } : null
      };
    });

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Unexpected error in swimmers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}