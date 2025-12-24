import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const instructorId = searchParams.get('instructor_id');

    // Build query for assessments (bookings for assessment sessions)
    let query = supabase
      .from('bookings')
      .select(`
        id,
        session_id,
        swimmer_id,
        parent_id,
        status as booking_status,
        created_at,
        sessions (
          id,
          start_time,
          end_time,
          instructor_id,
          location,
          session_type,
          status as session_status,
          profiles!sessions_instructor_id_fkey (
            id,
            full_name
          )
        ),
        swimmers (
          id,
          first_name,
          last_name,
          date_of_birth,
          comfortable_in_water,
          current_level_id,
          payment_type,
          funding_source_id,
          assessment_status,
          enrollment_status,
          profiles!swimmers_parent_id_fkey (
            id,
            full_name,
            email
          ),
          funding_sources (
            id,
            name
          )
        ),
        swim_levels!swimmers_current_level_id_fkey (
          id,
          name,
          display_name
        )
      `)
      .eq('sessions.session_type', 'assessment')
      .order('sessions.start_time', { ascending: true });

    // Filter by status if provided
    if (status) {
      if (status === 'scheduled') {
        query = query.eq('status', 'confirmed');
      } else if (status === 'completed') {
        query = query.eq('status', 'completed');
      } else if (status === 'cancelled') {
        query = query.eq('status', 'cancelled');
      }
    }

    // Filter by instructor if user is instructor
    if (profile.role === 'instructor') {
      query = query.eq('sessions.instructor_id', user.id);
    } else if (instructorId) {
      query = query.eq('sessions.instructor_id', instructorId);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching assessments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      );
    }

    // Transform the data
    const assessments = bookings
      .filter(booking => booking.sessions && booking.swimmers)
      .map(booking => {
        const swimmer = booking.swimmers;
        const session = booking.sessions;
        const parent = swimmer.profiles;
        const instructor = session.profiles;
        const currentLevel = booking.swim_levels;
        const fundingSource = swimmer.funding_sources;

        // Calculate age
        let age = 0;
        if (swimmer.date_of_birth) {
          const birthDate = new Date(swimmer.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        return {
          id: booking.id,
          session_id: session.id,
          swimmer_id: swimmer.id,
          swimmer_name: `${swimmer.first_name} ${swimmer.last_name}`,
          swimmer_age: age,
          parent_name: parent?.full_name || 'Unknown',
          parent_email: parent?.email || '',
          start_time: session.start_time,
          end_time: session.end_time,
          instructor_id: session.instructor_id,
          instructor_name: instructor?.full_name || 'Unknown',
          location: session.location,
          status: booking.booking_status as 'scheduled' | 'completed' | 'cancelled',
          assessment_status: swimmer.assessment_status,
          comfortable_in_water: swimmer.comfortable_in_water,
          current_level_id: swimmer.current_level_id,
          current_level_name: currentLevel?.display_name || null,
          payment_type: swimmer.payment_type,
          is_funded_client: swimmer.payment_type === 'funded' || !!swimmer.funding_source_id,
          funding_source_name: fundingSource?.name,
          coordinator_name: swimmer.coordinator_name,
          has_allergies: swimmer.has_allergies,
          allergies_description: swimmer.allergies_description,
          has_medical_conditions: swimmer.has_medical_conditions,
          medical_conditions_description: swimmer.medical_conditions_description,
          diagnosis: swimmer.diagnosis || [],
          previous_swim_lessons: swimmer.previous_swim_lessons,
          swim_goals: swimmer.swim_goals || [],
        };
      });

    return NextResponse.json(assessments);

  } catch (error) {
    console.error('Error in assessments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}