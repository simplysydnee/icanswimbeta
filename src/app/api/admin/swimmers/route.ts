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
      funding: (searchParams.get('funding') as 'private_pay' | 'regional_center' | 'scholarship' | 'other' | 'all') || 'all',
      level: searchParams.get('level') || 'all',
      sortBy: (searchParams.get('sortBy') as 'name' | 'age' | 'status' | 'lessons' | 'nextSession') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '25'
    };

    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 25;
    const offset = (page - 1) * limit;

    // ========== STEP 4: Build Base Query ==========
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
        funding_source_id,
        photo_url,
        funding_source_sessions_used,
        funding_source_sessions_authorized,
        funding_source_current_pos_number,
        funding_source_pos_expires_at,
        created_at,
        updated_at,
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
        lessons_completed:bookings!bookings_swimmer_id_fkey(
          count
        ).filter(status.eq.completed),
        next_session:bookings!bookings_swimmer_id_fkey(
          session:sessions(
            start_time,
            instructor:profiles(full_name)
          )
        ).filter(status.eq.confirmed, sessions.start_time.gte.now()).order(sessions.start_time).limit(1)
      `, { count: 'exact' });

    // ========== STEP 5: Apply Filters ==========

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
    if (params.search) {
      const searchTerm = `%${params.search}%`;
      query = query.or(`
        first_name.ilike.${searchTerm},
        last_name.ilike.${searchTerm},
        parent.full_name.ilike.${searchTerm},
        parent.email.ilike.${searchTerm}
      `);
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
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching swimmers:', error);
      return NextResponse.json(
        { error: `Failed to fetch swimmers: ${error.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 9: Transform Data ==========
    const transformedSwimmers: SwimmerResponse[] = data.map(swimmer => {
      const age = swimmer.date_of_birth ? calculateAge(swimmer.date_of_birth) : null;
      const lessonsCompleted = swimmer.lessons_completed?.[0]?.count || 0;
      const nextSession = swimmer.next_session?.[0]?.session;

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
        currentLevel: swimmer.swim_levels ? {
          id: swimmer.swim_levels.id,
          name: swimmer.swim_levels.name,
          displayName: swimmer.swim_levels.display_name,
          color: swimmer.swim_levels.color
        } : null,
        fundingSourceId: swimmer.funding_source_id,
        photoUrl: swimmer.photo_url,
        fundingSourceSessionsUsed: swimmer.funding_source_sessions_used,
        fundingSourceSessionsAuthorized: swimmer.funding_source_sessions_authorized,
        fundingSourceCurrentPosNumber: swimmer.funding_source_current_pos_number,
        fundingSourcePosExpiresAt: swimmer.funding_source_pos_expires_at,
        createdAt: swimmer.created_at,
        updatedAt: swimmer.updated_at,
        parent: swimmer.parent ? {
          id: swimmer.parent.id,
          fullName: swimmer.parent.full_name,
          email: swimmer.parent.email,
          phone: swimmer.parent.phone
        } : null,
        lessonsCompleted,
        nextSession: nextSession ? {
          startTime: nextSession.start_time,
          instructorName: nextSession.instructor?.full_name
        } : null
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