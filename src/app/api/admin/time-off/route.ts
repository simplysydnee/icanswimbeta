import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch all time off requests with instructor info
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Authorization - Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const status = searchParams.get('status');
    const instructorId = searchParams.get('instructor_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query
    let query = supabase
      .from('time_off_requests')
      .select(`
        *,
        instructor:profiles!time_off_requests_instructor_id_fkey (
          id,
          full_name,
          email,
          phone
        ),
        reviewer:profiles!time_off_requests_reviewed_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }

    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('end_date', endDate);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching time off requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch time off requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error: any) {
    console.error('Unexpected error in admin time-off API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update request status (approve/decline)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Authorization - Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { requestId, status, adminNotes } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId and status' },
        { status: 400 }
      );
    }

    if (!['approved', 'declined'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "declined"' },
        { status: 400 }
      );
    }

    // Update the request
    const { data: updatedRequest, error } = await supabase
      .from('time_off_requests')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null
      })
      .eq('id', requestId)
      .select(`
        *,
        instructor:profiles!time_off_requests_instructor_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Error updating time off request:', error);
      return NextResponse.json(
        { error: 'Failed to update time off request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error: any) {
    console.error('Unexpected error in admin time-off PATCH API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}