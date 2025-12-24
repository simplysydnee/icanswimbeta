import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get assessment booking details
    const { data: booking, error } = await supabase
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
          has_allergies,
          allergies_description,
          has_medical_conditions,
          medical_conditions_description,
          diagnosis,
          previous_swim_lessons,
          swim_goals,
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
      .eq('id', id)
      .eq('sessions.session_type', 'assessment')
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check if user has permission
    // Admin can see all, instructor can only see their own assessments
    if (profile.role === 'instructor' && booking.sessions.instructor_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

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

    const assessment = {
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

    return NextResponse.json(assessment);

  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}