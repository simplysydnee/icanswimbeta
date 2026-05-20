import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Joi from 'joi';
// import { createClient as createSupabaseClient } from '@supabase/supabase-js';


export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Fetching swimmers for user:', user.id);

    const { searchParams } = new URL(req.url);
/*
    const queryParams = {
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : undefined,

      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
      search: searchParams.get("search") ?? "",

      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    };

  */
    const queryParams = Object.fromEntries(
      Array.from(searchParams.entries())
        .filter(([key, value]) => value !== null && value !== "")
        .map(([key, value]) => {
          if (key === "page" || key === "limit") return [key, Number(value)];
          return [key, value];
        })
    );
    const { value, error: validationError } = querySchema.unknown(true).validate(queryParams);

    if (validationError) {
      return NextResponse.json(
        { error: validationError.details[0].message },
        { status: 400 }
      );
    }

    const { page, limit, search, enrollmentStatus, sortBy, sortOrder } = value;

    
    // Query swimmers for this parent with additional data
    let query =  supabase
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
        approval_status,
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
        funding_source:funding_sources(id, name, price_cents, requires_authorization, type),
        photo_video_signature,
        cancellation_policy_signature,
        liability_waiver_signature,
        signed_waiver,
        bookings(
          id,
          status,
          booking_type,
          session:sessions(
            start_time,
            instructor:instructor_id(full_name)
          )
        )
          
      `, { count: 'exact' })
      .order('first_name');

      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      if (search && typeof search === 'string' && search.trim()) {
        const term = search.trim().replace(/[%_]/g, '\\$&');
        const pattern = `%${term}%`;
        query = query.or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`);
      }

      if (page && limit) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
      
        query = query.range(from, to);
      }

      const excludedKeys = ["page", "limit", "sortBy", "sortOrder", "search", "enrollmentStatus", "funding", "priority", "level"];
      Object.keys(queryParams).forEach((key) => {
        if (excludedKeys.includes(key)) return;
        const value = queryParams[key];
        if (value === undefined || value === null || value === "") return;

        query = query.eq(key, value);
      });

      // Map frontend filter params to actual DB columns
      if (queryParams.funding && queryParams.funding !== 'all') {
        // Normalize: 'funding_source' and 'funded' both map to payment_type = 'funding_source'
        const fundingValue = queryParams.funding === 'funded' ? 'funding_source' : queryParams.funding;
        query = query.eq('payment_type', fundingValue);
      }
      if (queryParams.priority && queryParams.priority !== 'all') {
        query = query.eq('is_priority_booking', queryParams.priority === 'priority');
      }
      if (queryParams.level && queryParams.level !== 'all' && queryParams.level !== 'none') {
        // level values are color names (white, red, yellow, green, blue)
        // We need to filter via the swim_levels join. PostgREST supports nested filters.
        query = query.eq('swim_levels.name', queryParams.level);
      }

      const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching swimmers:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error hint:', error.hint);
      console.error('Error details:', error.details);
      return NextResponse.json({ error: `Failed to fetch swimmers: ${error.message || error.details || error.hint || 'Unknown error'}` }, { status: 500 });
    }

    // Batch query active purchase orders for funded swimmers
    let poMap: Record<string, any> = {};
    const fundedSwimmers = (data || []).filter(
      s => (s.funding_source as any)?.requires_authorization === true
    );
    if (fundedSwimmers.length > 0) {
      const swimmerIds = fundedSwimmers.map(s => s.id);
      const { data: poRows } = await supabase
        .from('purchase_orders')
        .select('swimmer_id, sessions_authorized, sessions_used, unexcused_late_cancel_count')
        .in('swimmer_id', swimmerIds)
        .eq('po_type', 'lessons')
        .in('status', ['active', 'approved_pending_auth'])
        .order('start_date', { ascending: false });

      if (poRows) {
        for (const po of poRows) {
          if (!poMap[po.swimmer_id]) {
            poMap[po.swimmer_id] = po;
          }
        }
      }
    }

    // Transform snake_case → camelCase for frontend consistency
    function transformSwimmer(raw: any) {
      const completedLessons = raw.bookings?.filter(
        (b: any) => b.status === 'completed' && b.booking_type === 'lesson'
      ) || [];
      const lessonsCompleted = completedLessons.length;

      const now = new Date();
      const upcomingLessons = raw.bookings?.filter((b: any) =>
        b.status === 'confirmed' &&
        b.booking_type === 'lesson' &&
        b.session &&
        new Date(b.session.start_time) > now
      ) || [];
      const lessonsUpcoming = upcomingLessons.length;

      const nextBooking = upcomingLessons.sort((a: any, b: any) =>
        new Date(a.session.start_time).getTime() - new Date(b.session.start_time).getTime()
      )[0];

      const level = raw.swim_levels ? {
        name: raw.swim_levels.name,
        displayName: raw.swim_levels.display_name,
        color: raw.swim_levels.color,
      } : null;

      const funding = raw.funding_source || null;

      const rawPo = poMap[raw.id] || null;
      const activePurchaseOrder = rawPo ? {
        sessionsAuthorized: rawPo.sessions_authorized,
        sessionsUsed: rawPo.sessions_used,
        unexcusedLateCancelCount: rawPo.unexcused_late_cancel_count,
      } : null;

      const nextSession = nextBooking?.session ? {
        startTime: nextBooking.session.start_time,
        instructorName: nextBooking.session.instructor?.full_name,
      } : null;

      return {
        id: raw.id,
        parentId: raw.parent_id,
        firstName: raw.first_name,
        lastName: raw.last_name,
        dateOfBirth: raw.date_of_birth,
        gender: raw.gender,
        height: raw.height,
        weight: raw.weight,
        enrollmentStatus: raw.enrollment_status,
        assessmentStatus: raw.assessment_status,
        approvalStatus: raw.approval_status,
        currentLevelId: raw.current_level_id,
        currentLevelName: level?.name
          ? level.name.charAt(0).toUpperCase() + level.name.slice(1)
          : null,
        // Derive display payment type: if swimmer has a funded/regional-center funding source,
        // show as 'funding_source' even when payment_type is incorrectly 'private_pay'
        paymentType: (raw.payment_type === 'private_pay' && funding?.type === 'regional_center')
          ? 'funding_source'
          : raw.payment_type,
        fundingSourceId: raw.funding_source_id,
        flexibleSwimmer: raw.flexible_swimmer,
        authorizedSessionsUsed: raw.authorized_sessions_used,
        authorizedSessionsTotal: raw.authorized_sessions_total,
        isVmrcClient: raw.is_vmrc_client,
        vmrcCoordinatorName: raw.vmrc_coordinator_name,
        fundingCoordinatorName: raw.funding_coordinator_name,
        fundingCoordinatorEmail: raw.funding_coordinator_email,
        fundingCoordinatorPhone: raw.funding_coordinator_phone,
        emergencyContactName: raw.emergency_contact_name,
        emergencyContactPhone: raw.emergency_contact_phone,
        emergencyContactRelationship: raw.emergency_contact_relationship,
        hasAllergies: raw.has_allergies,
        allergiesDescription: raw.allergies_description,
        hasMedicalConditions: raw.has_medical_conditions,
        medicalConditionsDescription: raw.medical_conditions_description,
        diagnosis: raw.diagnosis,
        historyOfSeizures: raw.history_of_seizures,
        seizuresDescription: raw.seizures_description,
        toiletTrained: raw.toilet_trained,
        nonAmbulatory: raw.non_ambulatory,
        communicationType: raw.communication_type,
        otherTherapies: raw.other_therapies,
        therapiesDescription: raw.therapies_description,
        selfInjuriousBehavior: raw.self_injurious_behavior,
        selfInjuriousBehaviorDescription: raw.self_injurious_behavior_description,
        aggressiveBehavior: raw.aggressive_behavior,
        aggressiveBehaviorDescription: raw.aggressive_behavior_description,
        elopementHistory: raw.elopement_history,
        elopementHistoryDescription: raw.elopement_history_description,
        hasBehaviorPlan: raw.has_behavior_plan,
        restraintHistory: raw.restraint_history,
        restraintHistoryDescription: raw.restraint_history_description,
        previousSwimLessons: raw.previous_swim_lessons,
        comfortableInWater: raw.comfortable_in_water,
        swimGoals: raw.swim_goals,
        strengthsInterests: raw.strengths_interests,
        photoVideoSignature: raw.photo_video_signature,
        cancellationPolicySignature: raw.cancellation_policy_signature,
        liabilityWaiverSignature: raw.liability_waiver_signature,
        signedWaiver: raw.signed_waiver,
        currentLevel: level,
        fundingSource: funding ? {
          id: funding.id,
          name: funding.name,
          priceCents: funding.price_cents,
          requiresAuthorization: funding.requires_authorization,
          type: funding.type,
        } : null,
        // fundingSourceName is what SwimmerManagementTable reads for the funding column.
        // Prefer the joined funding_source name; fall back to payment_type label.
        fundingSourceName: funding?.name ?? null,
        activePurchaseOrder,
        nextSession,
        lessonsCompleted,
        lessonsUpcoming,
        bookings: raw.bookings,
      };
    }

    const transformed = data.map(transformSwimmer);

    return NextResponse.json({
      swimmers: transformed,
      metadata: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count ?? 0) / (limit || 1)),
      },
    });
    
  } catch (error) {
    console.error('Unexpected error in swimmers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(10000).default(1000),

  search: Joi.string().allow("").optional(),

  enrollmentStatus: Joi.string()
    .valid("pending", "approved", "rejected")
    .optional(),

  approval_status: Joi.string()
    .valid("pending", "approved", "declined")
    .optional(),

  sortBy: Joi.string()
    .valid("first_name", "date_of_birth", "created_at")
    .default("first_name"),

  sortOrder: Joi.string()
    .valid("asc", "desc")
    .default("asc"),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    // // Read incoming bearer token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { error: validationError, value } = schema.validate(body);
    if (validationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationError.details },
        { status: 400 }
      );
    }

    // When a coordinator is selected, derive name/email/phone from their profile
    // (and verify the coordinator belongs to the supplied funding source)
    let derivedCoordinatorName: string | null = null;
    let derivedCoordinatorEmail: string | null = null;
    let derivedCoordinatorPhone: string | null = null;
    if (value.payment_type === 'funding_source' && value.coordinator_id) {
      const { data: coordinatorProfile, error: coordinatorErr } = await supabase
        .from('profiles')
        .select('full_name, email, phone, funding_source_id')
        .eq('id', value.coordinator_id)
        .maybeSingle();

      if (coordinatorErr) {
        return NextResponse.json(
          { error: 'Failed to verify coordinator', details: coordinatorErr.message },
          { status: 500 }
        );
      }
      if (!coordinatorProfile) {
        return NextResponse.json(
          { error: 'Selected coordinator not found' },
          { status: 400 }
        );
      }
      if (
        value.funding_source_id &&
        coordinatorProfile.funding_source_id &&
        coordinatorProfile.funding_source_id !== value.funding_source_id
      ) {
        return NextResponse.json(
          { error: 'Selected coordinator does not belong to the selected funding source' },
          { status: 400 }
        );
      }
      derivedCoordinatorName = coordinatorProfile.full_name ?? null;
      derivedCoordinatorEmail = coordinatorProfile.email ?? null;
      derivedCoordinatorPhone = coordinatorProfile.phone ?? null;
    }

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

      // New consent fields
      terms_of_service_agreed: parseBoolLike(value.terms_of_service_agreed) ?? false,
      terms_of_service_signature: value.terms_of_service_signature ?? null,
      cancellation_quiz_passed: parseBoolLike(value.cancellation_quiz_passed) ?? false,
      cancellation_acknowledged_24hr: parseBoolLike(value.cancellation_acknowledged_24hr) ?? false,
      cancellation_acknowledged_consequences: parseBoolLike(value.cancellation_acknowledged_consequences) ?? false,
      privacy_policy_agreed: parseBoolLike(value.privacy_policy_agreed) ?? false,
      privacy_policy_signature: value.privacy_policy_signature ?? null,
      sms_consent_given: parseBoolLike(value.sms_consent_given) ?? false,
      guardian_relationship: value.guardian_relationship ?? null,

      payment_type: value.payment_type ?? 'private_pay',

      funding_source_id: value.funding_source_id ?? null,
      funding_coordinator_name: derivedCoordinatorName ?? value.funding_coordinator_name ?? null,
      funding_coordinator_email:
        derivedCoordinatorEmail ??
        (value.funding_coordinator_email &&
        String(value.funding_coordinator_email).trim() !== ''
          ? String(value.funding_coordinator_email).trim()
          : null),
      funding_coordinator_phone: derivedCoordinatorPhone ?? value.funding_coordinator_phone ?? null,
      coordinator_id: value.coordinator_id ?? null,

      enrollment_status: value.enrollment_status ?? 'waitlist',
      approval_status: value.approval_status ?? 'pending',
      assessment_status: value.assessment_status ?? 'not_scheduled',
    };

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

  // New consent fields
  terms_of_service_agreed: booleanLike.optional(),
  terms_of_service_signature: Joi.string().allow(null, ''),
  cancellation_quiz_passed: booleanLike.optional(),
  cancellation_acknowledged_24hr: booleanLike.optional(),
  cancellation_acknowledged_consequences: booleanLike.optional(),
  privacy_policy_agreed: booleanLike.optional(),
  privacy_policy_signature: Joi.string().allow(null, ''),
  sms_consent_given: booleanLike.optional(),
  guardian_relationship: Joi.string().allow(null, ''),

  payment_type: Joi.string().valid('private_pay', 'funding_source').optional(),

  funding_source_id: Joi.string().uuid().optional().allow(null),
  funding_coordinator_name: Joi.string().allow(null, ''),
  // Allow internal / dev domains (e.g. *.local) — default Joi email rejects non-IANA TLDs.
  funding_coordinator_email: Joi.alternatives()
    .try(
      Joi.valid(null),
      Joi.string().trim().valid(''),
      Joi.string().trim().email({ tlds: { allow: false } })
    )
    .optional(),
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
