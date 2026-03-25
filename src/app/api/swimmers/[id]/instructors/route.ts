import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing Supabase env');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const swimmerId = params.id;
    if (!swimmerId) {
      return NextResponse.json({ error: 'Swimmer ID required' }, { status: 400 });
    }

    const authClient = await createServerClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = getServiceSupabase();

    // Load swimmer to check access
    const { data: swimmer, error: swimmerError } = await serviceSupabase
      .from('swimmers')
      .select('id, parent_id')
      .eq('id', swimmerId)
      .maybeSingle();

    if (swimmerError || !swimmer) {
      return NextResponse.json({ error: 'Swimmer not found' }, { status: 404 });
    }

    // User roles (for admin check)
    const { data: roles } = await authClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    const isAdmin = roles?.some((r: { role: string }) => r.role === 'admin') ?? false;

    const isParent = swimmer.parent_id === user.id;

    // Instructor: allowed if they are assigned to this swimmer
    let isAssignedInstructor = false;
    if (!isParent && !isAdmin) {
      const { data: assignment } = await serviceSupabase
        .from('swimmer_instructor_assignments')
        .select('id')
        .eq('swimmer_id', swimmerId)
        .eq('instructor_id', user.id)
        .maybeSingle();
      isAssignedInstructor = !!assignment;
    }

    if (!isParent && !isAdmin && !isAssignedInstructor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: assignments, error: assignError } = await serviceSupabase
      .from('swimmer_instructor_assignments')
      .select(`
        id,
        swimmer_id,
        instructor_id,
        assigned_by,
        assigned_at,
        is_primary,
        notes,
        created_at,
        updated_at,
        instructor:profiles!instructor_id(id, full_name, email, avatar_url)
      `)
      .eq('swimmer_id', swimmerId)
      .order('is_primary', { ascending: false });

    if (assignError) {
      console.error('Error fetching swimmer instructors:', assignError);
      return NextResponse.json(
        { error: 'Failed to fetch assigned instructors' },
        { status: 500 }
      );
    }

    const instructors = (assignments || []).map((row: any) => {
      const instructor = Array.isArray(row.instructor) ? row.instructor[0] : row.instructor;
      return {
        id: row.id,
        swimmerId: row.swimmer_id,
        instructorId: row.instructor_id,
        assignedBy: row.assigned_by,
        assignedAt: row.assigned_at,
        isPrimary: row.is_primary ?? false,
        notes: row.notes ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        instructor: instructor
          ? {
              id: instructor.id,
              fullName: instructor.full_name,
              email: instructor.email,
              avatarUrl: instructor.avatar_url ?? null,
            }
          : null,
      };
    });

    return NextResponse.json({ instructors });
  } catch (error) {
    console.error('Swimmer instructors API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
