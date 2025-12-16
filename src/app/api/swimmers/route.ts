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
        funding_source_id,
        photo_url,
        funding_source_sessions_used,
        funding_source_sessions_authorized,
        swim_levels:current_level_id(name, display_name, color),
        lessons_completed:bookings!bookings_swimmer_id_fkey(
          count
        ).filter(status.eq.completed),
        next_session:bookings!bookings_swimmer_id_fkey(
          session:sessions(
            start_time,
            instructor:profiles(full_name)
          )
        ).filter(status.eq.confirmed, sessions.start_time.gte.now()).order(sessions.start_time).limit(1)
      `)
      .eq('parent_id', user.id)
      .order('first_name');

    if (error) {
      console.error('Error fetching swimmers:', error);
      return NextResponse.json({ error: 'Failed to fetch swimmers' }, { status: 500 });
    }

    // Transform snake_case to camelCase and extract nested data
    const transformedData = data.map(swimmer => ({
      id: swimmer.id,
      parentId: swimmer.parent_id,
      firstName: swimmer.first_name,
      lastName: swimmer.last_name,
      dateOfBirth: swimmer.date_of_birth,
      enrollmentStatus: swimmer.enrollment_status,
      assessmentStatus: swimmer.assessment_status,
      currentLevelId: swimmer.current_level_id,
      currentLevel: swimmer.swim_levels ? {
        name: swimmer.swim_levels.name,
        displayName: swimmer.swim_levels.display_name,
        color: swimmer.swim_levels.color
      } : null,
      fundingSourceId: swimmer.funding_source_id,
      photoUrl: swimmer.photo_url,
      fundingSourceSessionsUsed: swimmer.funding_source_sessions_used,
      fundingSourceSessionsAuthorized: swimmer.funding_source_sessions_authorized,
      lessonsCompleted: swimmer.lessons_completed?.[0]?.count || 0,
      nextSession: swimmer.next_session?.[0]?.session ? {
        startTime: swimmer.next_session[0].session.start_time,
        instructorName: swimmer.next_session[0].session.instructor?.full_name
      } : null
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Unexpected error in swimmers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}