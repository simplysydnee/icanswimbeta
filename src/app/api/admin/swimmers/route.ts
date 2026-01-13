import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Types for query parameters
interface SwimmersQueryParams {
  search?: string;
  status?: 'enrolled' | 'waitlist' | 'pending' | 'inactive' | 'all';
  priority?: 'all' | 'priority' | 'standard';
  funding?: 'private_pay' | 'funded' | 'scholarship' | 'other' | 'all';
  level?: string; // level_id or "none" or "all"
  sortBy?: 'name' | 'age' | 'status' | 'lessons' | 'nextSession';
  sortOrder?: 'asc' | 'desc';
  page?: string;
  limit?: string;
}

// Swimmer type for response
interface SwimmerResponse {
  id: string;
  parentId: string;
  parentEmail?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  height?: string;
  weight?: string;
  enrollmentStatus: string;
  assessmentStatus: string;
  currentLevelId?: string;
  currentLevel?: {
    id: string;
    name: string;
    displayName: string;
    color?: string;
  } | null;
  fundingSourceId?: string;
  paymentType?: string;
  fundingSourceName?: string;
  photoUrl?: string;
  fundingSourceSessionsUsed?: number;
  fundingSourceSessionsAuthorized?: number;
  fundingSourceCurrentPosNumber?: string;
  fundingSourcePosExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  invitedAt?: string;
  parent?: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  } | null;
  lessonsCompleted: number;
  nextSession?: {
    startTime: string;
    instructorName?: string;
  } | null;
  // Priority Booking
  isPriorityBooking?: boolean;
  priorityBookingReason?: string | null;
  priorityBookingNotes?: string | null;
  priorityBookingExpiresAt?: string | null;
  adminNotes?: string;
  // Coordinator fields
  coordinatorName?: string;
  coordinatorEmail?: string;
  coordinatorPhone?: string;
  // Medical & Safety
  hasAllergies?: boolean;
  allergiesDescription?: string;
  hasMedicalConditions?: boolean;
  medicalConditionsDescription?: string;
  diagnosis?: string[];
  historyOfSeizures?: boolean;
  seizuresDescription?: string;
  // Care needs
  toiletTrained?: string;
  nonAmbulatory?: boolean;
  communicationType?: string[];
  otherTherapies?: boolean;
  therapiesDescription?: string;
  // Behavioral
  selfInjuriousBehavior?: boolean;
  selfInjuriousBehaviorDescription?: string;
  aggressiveBehavior?: boolean;
  aggressiveBehaviorDescription?: string;
  elopementHistory?: boolean;
  elopementHistoryDescription?: string;
  hasBehaviorPlan?: boolean;
  restraintHistory?: boolean;
  restraintHistoryDescription?: string;
  // Swimming background
  previousSwimLessons?: boolean;
  comfortableInWater?: string;
  swimGoals?: string[];
  strengthsInterests?: string;
}

// Response type
interface SwimmersResponse {
  swimmers: SwimmerResponse[];
  total: number;
  page: number;
  totalPages: number;
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // ========== DEBUG LOGGING ==========
    console.log('=== SWIMMERS API CALLED ===');
    console.log('Full URL:', request.url);
    console.log('Search param:', searchParams.get('search'));
    console.log('All params:', Object.fromEntries(searchParams.entries()));

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

    // ========== STEP 3: Parse Query Parameters ==========
    const params: SwimmersQueryParams = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as 'enrolled' | 'waitlist' | 'pending' | 'inactive' | 'all') || 'all',
      priority: (searchParams.get('priority') as 'all' | 'priority' | 'standard') || 'all',
      funding: (searchParams.get('funding') as 'private_pay' | 'funded' | 'scholarship' | 'other' | 'all') || 'all',
      level: searchParams.get('level') || 'all',
      sortBy: (searchParams.get('sortBy') as 'name' | 'age' | 'status' | 'lessons' | 'nextSession') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '25'
    };

    const page = parseInt(params.page || '1') || 1;
    const limit = parseInt(params.limit || '25') || 25;
    const offset = (page - 1) * limit;

    // ========== STEP 4: Build Base Query ==========
    let query = supabase
      .from('swimmers')
      .select(`
        id,
        parent_id,
        parent_email,
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
        photo_url,
        created_at,
        updated_at,
        invited_at,
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
        parent:profiles!swimmers_parent_id_fkey(
          id,
          full_name,
          email,
          phone
        ),
        swim_levels:current_level_id(
          id,
          name,
          display_name,
          color
        ),
        funding_source:funding_source_id(
          id,
          name,
          short_name
        ),
        bookings!bookings_swimmer_id_fkey(
          id,
          status,
          session:sessions(
            start_time,
            instructor:profiles!sessions_instructor_id_fkey(full_name)
          )
        )
      `, { count: 'exact' });

    // ========== STEP 5: Apply Filters ==========

    // Status filter
    if (params.status !== 'all') {
      query = query.eq('enrollment_status', params.status);
    }

    // Priority filter
    if (params.priority !== 'all') {
      if (params.priority === 'priority') {
        query = query.eq('is_priority_booking', true);
      } else if (params.priority === 'standard') {
        query = query.or('is_priority_booking.is.null,is_priority_booking.eq.false');
      }
    }

    // Funding source filter (payment_type in swimmers table)
    if (params.funding && params.funding !== 'all') {
      query = query.eq('payment_type', params.funding);
    }

    // Level filter
    if (params.level === 'none') {
      query = query.is('current_level_id', null);
    } else if (params.level !== 'all') {
      query = query.eq('current_level_id', params.level);
    }

    // Search filter
    if (params.search && params.search.trim() !== '') {
      // Escape special characters for SQL LIKE
      // We need to handle: % _ ' "
      let escapedSearch = params.search;
      // Escape % and _ for SQL LIKE (they are wildcards)
      escapedSearch = escapedSearch.replace(/[%_]/g, '\\$&');
      // Escape single quotes by doubling them
      escapedSearch = escapedSearch.replace(/'/g, "''");
      // Escape double quotes by doubling them
      escapedSearch = escapedSearch.replace(/"/g, '""');

      const searchTerm = `%${escapedSearch}%`;
      console.log('=== SEARCH DEBUG ===');
      console.log('Original search:', params.search);
      console.log('Escaped search:', escapedSearch);
      console.log('Search term with wildcards:', searchTerm);
      // Use the filter syntax with ilike - Supabase will combine these with OR
      // Note: The value needs to be quoted because it contains %
      const orString = `first_name.ilike."${searchTerm}",last_name.ilike."${searchTerm}"`;
      console.log('Generated or() string:', orString);
      query = query.or(orString);
    }

    // ========== STEP 6: Apply Sorting ==========
    switch (params.sortBy) {
      case 'age':
        query = query.order('date_of_birth', { ascending: params.sortOrder === 'desc' });
        break;
      case 'status':
        query = query.order('enrollment_status', { ascending: params.sortOrder === 'asc' });
        break;
      case 'lessons':
        // Note: This sorts by swimmer ID since we can't sort by count in the query
        // We'll handle this in post-processing
        query = query.order('created_at', { ascending: params.sortOrder === 'asc' });
        break;
      case 'nextSession':
        // Note: This sorts by swimmer ID since we can't sort by nested data
        // We'll handle this in post-processing
        query = query.order('created_at', { ascending: params.sortOrder === 'asc' });
        break;
      case 'name':
      default:
        query = query.order('first_name', { ascending: params.sortOrder === 'asc' })
                    .order('last_name', { ascending: params.sortOrder === 'asc' });
        break;
    }

    // ========== STEP 7: Apply Pagination ==========
    query = query.range(offset, offset + limit - 1);

    // ========== STEP 8: Execute Query ==========
    console.log('Executing Supabase query with filters...');
    let data, error, count;
    try {
      const result = await query;
      data = result.data;
      error = result.error;
      count = result.count;
    } catch (queryError) {
      console.error('Query execution error:', queryError);
      return NextResponse.json(
        { error: `Query execution failed: ${queryError instanceof Error ? queryError.message : String(queryError)}` },
        { status: 500 }
      );
    }

    if (error) {
      console.error('Error fetching swimmers:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error hint:', error.hint);
      console.error('Error details:', error.details);
      return NextResponse.json(
        { error: `Failed to fetch swimmers: ${error.message || error.details || error.hint || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // ========== STEP 9: Transform Data ==========
    const transformedSwimmers: SwimmerResponse[] = (data as any[]).map(swimmer => {
      const age = swimmer.date_of_birth ? calculateAge(swimmer.date_of_birth) : undefined;

      // Calculate lessons completed from bookings
      const completedBookings = (swimmer.bookings as any[])?.filter((b: any) => b.status === 'completed') || [];
      const lessonsCompleted = completedBookings.length;

      // Find next upcoming session
      const now = new Date();
      const upcomingBookings = (swimmer.bookings as any[])?.filter((b: any) =>
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
        parentEmail: swimmer.parent_email,
        firstName: swimmer.first_name,
        lastName: swimmer.last_name,
        fullName: `${swimmer.first_name} ${swimmer.last_name}`,
        dateOfBirth: swimmer.date_of_birth,
        age,
        gender: swimmer.gender,
        height: swimmer.height,
        weight: swimmer.weight,
        enrollmentStatus: swimmer.enrollment_status,
        assessmentStatus: swimmer.assessment_status,
        currentLevelId: swimmer.current_level_id,
        currentLevel: swimmer.swim_levels?.[0] ? {
          id: swimmer.swim_levels[0].id,
          name: swimmer.swim_levels[0].name,
          displayName: swimmer.swim_levels[0].display_name,
          color: swimmer.swim_levels[0].color
        } : null,
        fundingSourceId: swimmer.funding_source_id,
        paymentType: swimmer.payment_type,
        fundingSourceName: swimmer.funding_source?.[0]?.short_name ||
                          (swimmer.payment_type === 'private_pay' ? 'Private Pay' :
                          swimmer.payment_type === 'scholarship' ? 'Scholarship' :
                          swimmer.payment_type === 'other' ? 'Other' : 'Funded'),
        photoUrl: swimmer.photo_url,
        fundingSourceSessionsUsed: 0,
        fundingSourceSessionsAuthorized: 0,
        fundingSourceCurrentPosNumber: undefined,
        fundingSourcePosExpiresAt: undefined,
        createdAt: swimmer.created_at,
        updatedAt: swimmer.updated_at,
        invitedAt: swimmer.invited_at,
        parent: swimmer.parent && Array.isArray(swimmer.parent) && swimmer.parent.length > 0 ? {
          id: (swimmer.parent as any[])[0]?.id,
          fullName: (swimmer.parent as any[])[0]?.full_name,
          email: (swimmer.parent as any[])[0]?.email,
          phone: (swimmer.parent as any[])[0]?.phone
        } : null,
        lessonsCompleted,
        nextSession: nextBooking?.session?.[0] ? {
          startTime: nextBooking.session[0].start_time,
          instructorName: nextBooking.session[0].instructor?.[0]?.full_name
        } : null,
        // Priority Booking
        isPriorityBooking: false,
        priorityBookingReason: undefined,
        priorityBookingNotes: undefined,
        priorityBookingExpiresAt: undefined,
        // Admin Notes
        adminNotes: undefined,
        // Coordinator fields
        coordinatorName: undefined,
        coordinatorEmail: undefined,
        coordinatorPhone: undefined,
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
        strengthsInterests: swimmer.strengths_interests
      };
    });

    // ========== STEP 10: Apply Post-Processing Sorting ==========
    if (params.sortBy === 'lessons' || params.sortBy === 'nextSession') {
      transformedSwimmers.sort((a, b) => {
        let aValue: number, bValue: number;

        if (params.sortBy === 'lessons') {
          aValue = a.lessonsCompleted;
          bValue = b.lessonsCompleted;
        } else { // nextSession
          aValue = a.nextSession?.startTime ? new Date(a.nextSession.startTime).getTime() : 0;
          bValue = b.nextSession?.startTime ? new Date(b.nextSession.startTime).getTime() : 0;
        }

        if (params.sortOrder === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }

    // ========== STEP 11: Calculate Pagination Info ==========
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // ========== STEP 12: Return Response ==========
    const response: SwimmersResponse = {
      swimmers: transformedSwimmers,
      total,
      page,
      totalPages
    };

    console.log(`✅ Admin fetched ${transformedSwimmers.length} swimmers (page ${page}/${totalPages}, total: ${total})`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get admin swimmers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}