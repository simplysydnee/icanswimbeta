import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Joi from 'joi';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Fetching swimmers for user:', user.id);

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
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        has_allergies,
        allergies_description,
        has_medical_conditions,
        medical_conditions_description,
        diagnosis,
        history_of_seizures,
        seizures_description,
        toilet_trained,
        non_ambulatory,
        communication_type,
        other_therapies,
        therapies_description,
        self_injurious_behavior,
        self_injurious_behavior_description,
        aggressive_behavior,
        aggressive_behavior_description,
        elopement_history,
        elopement_history_description,
        has_behavior_plan,
        restraint_history,
        restraint_history_description,
        previous_swim_lessons,
        comfortable_in_water,
        swim_goals,
        strengths_interests,
        swim_levels:current_level_id(name, display_name, color),
        funding_source:funding_source_id(id, name, short_name, type),
        bookings(
          id,
          status,
          session:sessions(
            start_time,
            instructor:instructor_id(full_name)
          )
        )
      `)
      .order('first_name');

    if (error) {
      console.error('Error fetching swimmers:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error hint:', error.hint);
      console.error('Error details:', error.details);
      return NextResponse.json({ error: `Failed to fetch swimmers: ${error.message || error.details || error.hint || 'Unknown error'}` }, { status: 500 });
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
        coordinatorPhone: swimmer.funding_coordinator_phone,
        // Emergency contact
        emergencyContactName: swimmer.emergency_contact_name,
        emergencyContactPhone: swimmer.emergency_contact_phone,
        emergencyContactRelationship: swimmer.emergency_contact_relationship
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

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(user)
    const body = await req.json();
    const { error: validationError, value } = schema.validate(body);
    if (validationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationError.details },
        { status: 400 }
      );
    }

    // existence checks
    // if (value.parent_id) {
    //   // adjust table names here if your project stores parents in a different table
    //   const parentFound =
    //     (await existsInTable('parents', value.parent_id)) ||
    //     (await existsInTable('profiles', value.parent_id));
    //   if (!parentFound) {
    //     return NextResponse.json({ error: 'parent_id not found' }, { status: 400 });
    //   }
    // }

    // if (value.funding_source_id) {
    //   const fundingFound = await existsInTable('funding_sources', value.funding_source_id);
    //   if (!fundingFound) {
    //     return NextResponse.json({ error: 'funding_source_id not found' }, { status: 400 });
    //   }
    // }

    // if (value.coordinator_id) {
    //   const coordinatorFound =
    //     (await existsInTable('coordinators', value.coordinator_id)) ||
    //     (await existsInTable('profiles', value.coordinator_id));
    //   if (!coordinatorFound) {
    //     return NextResponse.json({ error: 'coordinator_id not found' }, { status: 400 });
    //   }
    // }

    // build insert payload with proper boolean coercion and allowed keys
    const payload: Record<string, any> = {
      parent_id: user.id ?? null,
      first_name: value.first_name,
      last_name: value.last_name,
      date_of_birth: value.date_of_birth ?? null,
      gender: value.gender ?? null,

      has_allergies: parseBoolLike(value.has_allergies) ?? false,
      allergies_description: value.allergies_description ?? null,
      has_medical_conditions: parseBoolLike(value.has_medical_conditions) ?? false,
      medical_conditions_description: value.medical_conditions_description ?? null,
      history_of_seizures: parseBoolLike(value.history_of_seizures) ?? false,
      seizures_description: value.seizures_description ?? null,

      self_injurious_behavior: parseBoolLike(value.self_injurious_behavior) ?? false,
      self_injurious_behavior_description: value.self_injurious_behavior_description ?? null,
      aggressive_behavior: parseBoolLike(value.aggressive_behavior) ?? false,
      aggressive_behavior_description: value.aggressive_behavior_description ?? null,
      elopement_history: parseBoolLike(value.elopement_history) ?? false,
      elopement_history_description: value.elopement_history_description ?? null,
      has_behavior_plan: parseBoolLike(value.has_behavior_plan) ?? false,

      previous_swim_lessons: parseBoolLike(value.previous_swim_lessons) ?? false,
      previous_swim_lessons_description: value.previous_swim_lessons_description ?? null,
      comfortable_in_water: value.comfortable_in_water,
      swim_goals: Array.isArray(value.swim_goals) ? value.swim_goals : value.swim_goals ? [value.swim_goals] : null,

      // communication_type: value.communication_type ?? null,
      communication_type: Array.isArray(value.communication_type)
        ? value.communication_type
        : value.communication_type
        ? [value.communication_type]
        : null,
      strengths_interests: value.strengths_interests ?? null,
      motivators: value.motivators ?? null,
      other_therapies: parseBoolLike(value.other_therapies) ?? false,
      therapies_description: value.therapies_description ?? null,

      availability: Array.isArray(value.availability) ? value.availability : value.availability ? [value.availability] : [],
      flexible_swimmer: parseBoolLike(value.flexible_swimmer) ?? false,
      preferred_start_date: value.preferred_start_date ?? null,

      photo_video_permission: parseBoolLike(value.photo_video_permission) ?? false,
      signed_cancellation: parseBoolLike(value.signed_cancellation) ?? false,
      signed_liability: parseBoolLike(value.signed_liability) ?? false,
      photo_video_signature: value.photo_video_signature ?? null,
      cancellation_policy_signature: value.cancellation_policy_signature ?? null,
      liability_waiver_signature: value.liability_waiver_signature ?? null,

      payment_type: value.payment_type ?? 'private_pay',

      funding_source_id: value.funding_source_id ?? null,
      funding_coordinator_name: value.funding_coordinator_name ?? null,
      funding_coordinator_email: value.funding_coordinator_email ?? null,
      funding_coordinator_phone: value.funding_coordinator_phone ?? null,
      coordinator_id: value.coordinator_id ?? null,

      enrollment_status: value.enrollment_status ?? 'waitlist',
      approval_status: value.approval_status ?? 'pending',
      assessment_status: value.assessment_status ?? 'not_scheduled',
    };
    console.log('Inserting swimmer with payload:', payload);
    const { data: inserted, error: insertError } = await supabase
      .from('swimmers')
      .insert([payload])
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Insert failed', details: insertError }, { status: 500 });
    }

    return NextResponse.json({ swimmer: inserted }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', details: err?.message || err }, { status: 500 });
  }
}


const booleanLike = Joi.alternatives().try(
  Joi.boolean(),
  Joi.string().valid('yes', 'no', 'true', 'false', '1', '0')
);

const schema = Joi.object({
  parent_id: Joi.string().uuid().optional().allow(null),
  first_name: Joi.string().trim().required(),
  last_name: Joi.string().trim().required(),
  date_of_birth: Joi.date().iso().optional().allow(null),
  gender: Joi.string().valid('male', 'female', 'other').optional().allow(null),

  has_allergies: booleanLike.optional(),
  allergies_description: Joi.string().allow(null, ''),
  has_medical_conditions: booleanLike.optional(),
  medical_conditions_description: Joi.string().allow(null, ''),
  history_of_seizures: booleanLike.optional(),
  seizures_description: Joi.string().allow(null, ''),

  self_injurious_behavior: booleanLike.optional(),
  self_injurious_behavior_description: Joi.string().allow(null, ''),
  aggressive_behavior: booleanLike.optional(),
  aggressive_behavior_description: Joi.string().allow(null, ''),
  elopement_history: booleanLike.optional(),
  elopement_history_description: Joi.string().allow(null, ''),
  has_behavior_plan: booleanLike.optional(),

  previous_swim_lessons: booleanLike.optional(),
  previous_swim_lessons_description: Joi.string().allow(null, ''),
  comfortable_in_water: Joi.string().trim().required(),
  swim_goals: Joi.array().items(Joi.string().trim()).optional().allow(null),

  communication_type: Joi.string().valid('verbal', 'non_verbal', 'other').optional().allow(null),
  strengths_interests: Joi.string().allow(null, ''),
  motivators: Joi.string().allow(null, ''),
  other_therapies: booleanLike.optional(),
  therapies_description: Joi.string().allow(null, ''),

  availability: Joi.array().items(Joi.string().trim()).required(),
  flexible_swimmer: booleanLike.optional(),
  preferred_start_date: Joi.date().iso().optional().allow(null),

  photo_video_permission: booleanLike.optional(),
  signed_cancellation: booleanLike.optional(),
  signed_liability: booleanLike.optional(),
  photo_video_signature: Joi.string().allow(null, ''),
  cancellation_policy_signature: Joi.string().allow(null, ''),
  liability_waiver_signature: Joi.string().allow(null, ''),

  payment_type: Joi.string().valid('private_pay', 'funding_source').optional(),

  funding_source_id: Joi.string().uuid().optional().allow(null),
  funding_coordinator_name: Joi.string().allow(null, ''),
  funding_coordinator_email: Joi.string().email().allow(null, ''),
  funding_coordinator_phone: Joi.string().allow(null, ''),
  coordinator_id: Joi.string().uuid().optional().allow(null),

  enrollment_status: Joi.string().optional(),
  approval_status: Joi.string().optional(),
  assessment_status: Joi.string().optional(),
}).options({ stripUnknown: true });

function parseBoolLike(v: any): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (['yes', 'true', '1'].includes(s)) return true;
    if (['no', 'false', '0'].includes(s)) return false;
  }
  return undefined;
}

// async function existsInTable(table: string, id: string) {
//   const { data, error } = await supabase
//     .from(table)
//     .select('id')
//     .eq('id', id)
//     .limit(1)
//     .maybeSingle();

//   if (error) return false;
//   return !!data;
// }