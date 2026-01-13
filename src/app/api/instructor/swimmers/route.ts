import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Types for query parameters
interface SwimmersQueryParams {
  search?: string;
  status?: 'enrolled' | 'waitlist' | 'pending' | 'inactive' | 'all';
  funding?: 'private_pay' | 'regional_center' | 'scholarship' | 'other' | 'all';
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
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  age?: number;
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
  adminNotes?: string;
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

    // ========== STEP 1: Authentication ==========
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ========== STEP 2: Authorization ==========
    // Check if user is instructor using user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'instructor')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 403 }
      );
    }

    // ========== STEP 3: Parse Query Parameters ==========
    const params: SwimmersQueryParams = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as 'enrolled' | 'waitlist' | 'pending' | 'inactive' | 'all') || 'all',
      funding: (searchParams.get('funding') as 'private_pay' | 'regional_center' | 'scholarship' | 'other' | 'all') || 'all',
      level: searchParams.get('level') || 'all',
      sortBy: (searchParams.get('sortBy') as 'name' | 'age' | 'status' | 'lessons' | 'nextSession') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '25'
    };

    const page = parseInt(params.page || '1') || 1;
    const limit = parseInt(params.limit || '25') || 25;
    const offset = (page - 1) * limit;

    // ========== STEP 4: Get Swimmer IDs for This Instructor ==========
    // Use the new database function to get swimmers instructor has access to
    const { data: instructorSwimmers, error: swimmersError } = await supabase
      .rpc('get_instructor_swimmers', { p_instructor_id: user.id });

    if (swimmersError) {
      console.error('Error fetching instructor swimmers via function:', swimmersError);
      return NextResponse.json(
        { error: `Failed to fetch instructor swimmers: ${swimmersError.message}` },
        { status: 500 }
      );
    }

    // If no swimmers found for this instructor, return empty
    if (!instructorSwimmers || instructorSwimmers.length === 0) {
      const response: SwimmersResponse = {
        swimmers: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
      return NextResponse.json(response);
    }

    // Extract swimmer IDs
    const swimmerIds = instructorSwimmers.map((swimmer: any) => swimmer.id);

    // ========== STEP 5: Build Base Query ==========
    let query = supabase
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
        authorized_sessions_used,
        authorized_sessions_total,
        current_authorization_number,
        authorization_expires_at,
        created_at,
        updated_at,
        admin_notes,
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
      `, { count: 'exact' })
      .in('id', Array.from(swimmerIds));

    // ========== STEP 6: Apply Filters ==========

    // Status filter
    if (params.status !== 'all') {
      query = query.eq('enrollment_status', params.status);
    }

    // Funding source filter
    if (params.funding && params.funding !== 'all') {
      // Get funding source IDs for the specified type
      const { data: fundingSources } = await supabase
        .from('funding_sources')
        .select('id')
        .eq('type', params.funding);

      if (fundingSources && fundingSources.length > 0) {
        const fundingSourceIds = fundingSources.map(fs => fs.id);
        query = query.in('funding_source_id', fundingSourceIds);
      }
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

    // ========== STEP 7: Apply Sorting ==========
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

    // ========== STEP 8: Apply Pagination ==========
    query = query.range(offset, offset + limit - 1);

    // ========== STEP 9: Execute Query ==========
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching swimmers:', error);
      return NextResponse.json(
        { error: `Failed to fetch swimmers: ${error.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 10: Transform Data ==========
    const transformedSwimmers: SwimmerResponse[] = data.map(swimmer => {
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
        firstName: swimmer.first_name,
        lastName: swimmer.last_name,
        fullName: `${swimmer.first_name} ${swimmer.last_name}`,
        dateOfBirth: swimmer.date_of_birth,
        age,
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
        photoUrl: null,
        fundingSourceSessionsUsed: swimmer.authorized_sessions_used || 0,
        fundingSourceSessionsAuthorized: swimmer.authorized_sessions_total || 0,
        fundingSourceCurrentPosNumber: swimmer.current_authorization_number,
        fundingSourcePosExpiresAt: swimmer.authorization_expires_at,
        createdAt: swimmer.created_at,
        updatedAt: swimmer.updated_at,
        parent: swimmer.parent ? {
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
        adminNotes: swimmer.admin_notes
      };
    });

    // ========== STEP 11: Apply Post-Processing Sorting ==========
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

    // ========== STEP 12: Calculate Pagination Info ==========
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // ========== STEP 13: Return Response ==========
    const response: SwimmersResponse = {
      swimmers: transformedSwimmers,
      total,
      page,
      totalPages
    };

    console.log(`✅ Instructor fetched ${transformedSwimmers.length} swimmers (page ${page}/${totalPages}, total: ${total})`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get instructor swimmers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}