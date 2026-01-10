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
        gender,
        height,
        weight,
        enrollment_status,
        assessment_status,
        current_level_id,
        payment_type,
        funding_source_id,
        flexible_swimmer,
        authorized_sessions_used,
        authorized_sessions_total,
        is_vmrc_client,
        vmrc_coordinator_name,
        funding_coordinator_name,
        funding_coordinator_email,
        funding_coordinator_phone,
        -- Medical & Safety fields
        has_allergies,
        allergies_description,
        has_medical_conditions,
        medical_conditions_description,
        diagnosis,
        history_of_seizures,
        seizures_description,
        -- Care needs
        toilet_trained,
        non_ambulatory,
        communication_type,
        other_therapies,
        therapies_description,
        -- Behavioral
        self_injurious_behavior,
        self_injurious_behavior_description,
        aggressive_behavior,
        aggressive_behavior_description,
        elopement_history,
        elopement_history_description,
        has_behavior_plan,
        restraint_history,
        restraint_history_description,
        -- Swimming background
        previous_swim_lessons,
        comfortable_in_water,
        swim_goals,
        strengths_interests,
        swim_levels:current_level_id(name, display_name, color),
        funding_source:funding_source_id(id, name, short_name, type),
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
        gender: swimmer.gender,
        height: swimmer.height,
        weight: swimmer.weight,
        enrollmentStatus: swimmer.enrollment_status,
        assessmentStatus: swimmer.assessment_status,
        currentLevelId: swimmer.current_level_id,
        currentLevel: swimmer.swim_levels?.[0] ? {
          name: swimmer.swim_levels[0].name,
          displayName: swimmer.swim_levels[0].display_name,
          color: swimmer.swim_levels[0].color
        } : null,
        paymentType: swimmer.funding_source_id ? 'funded' : (swimmer.payment_type || 'private_pay'),
        fundingSourceId: swimmer.funding_source_id,
        fundingSourceName: swimmer.funding_source?.[0]?.name || swimmer.funding_coordinator_name || null,
        fundingSourceShortName: swimmer.funding_source?.[0]?.short_name || null,
        fundingSourceType: swimmer.funding_source?.[0]?.type || null,
        flexibleSwimmer: swimmer.flexible_swimmer || false,
        authorizedSessionsUsed: swimmer.authorized_sessions_used,
        authorizedSessionsTotal: swimmer.authorized_sessions_total,
        lessonsCompleted,
        nextSession: nextBooking?.session?.[0] ? {
          startTime: nextBooking.session[0].start_time,
          instructorName: nextBooking.session[0].instructor?.[0]?.full_name
        } : null,
        // Medical & Safety
        hasAllergies: swimmer.has_allergies,
        allergiesDescription: swimmer.allergies_description,
        hasMedicalConditions: swimmer.has_medical_conditions,
        medicalConditionsDescription: swimmer.medical_conditions_description,
        diagnosis: swimmer.diagnosis,
        historyOfSeizures: swimmer.history_of_seizures,
        seizuresDescription: swimmer.seizures_description,
        // Care needs
        toiletTrained: swimmer.toilet_trained,
        nonAmbulatory: swimmer.non_ambulatory,
        communicationType: swimmer.communication_type,
        otherTherapies: swimmer.other_therapies,
        therapiesDescription: swimmer.therapies_description,
        // Behavioral
        selfInjuriousBehavior: swimmer.self_injurious_behavior,
        selfInjuriousBehaviorDescription: swimmer.self_injurious_behavior_description,
        aggressiveBehavior: swimmer.aggressive_behavior,
        aggressiveBehaviorDescription: swimmer.aggressive_behavior_description,
        elopementHistory: swimmer.elopement_history,
        elopementHistoryDescription: swimmer.elopement_history_description,
        hasBehaviorPlan: swimmer.has_behavior_plan,
        restraintHistory: swimmer.restraint_history,
        restraintHistoryDescription: swimmer.restraint_history_description,
        // Swimming background
        previousSwimLessons: swimmer.previous_swim_lessons,
        comfortableInWater: swimmer.comfortable_in_water,
        swimGoals: swimmer.swim_goals,
        strengthsInterests: swimmer.strengths_interests,
        // Coordinator info
        coordinatorName: swimmer.funding_coordinator_name,
        coordinatorEmail: swimmer.funding_coordinator_email,
        coordinatorPhone: swimmer.funding_coordinator_phone
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