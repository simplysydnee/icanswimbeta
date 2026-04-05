import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SORT_FIELDS = new Set([
  'first_name',
  'last_name',
  'enrollment_status',
  'approval_status',
  'assessment_status',
  'created_at',
]);

function escapeIlike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
}

async function resolveCoordinatorScope(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  searchParams: URLSearchParams
): Promise<
  | { ok: true; coordinatorId: string }
  | { ok: false; status: number; error: string }
> {
  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    return { ok: false, status: 500, error: 'Failed to verify role' };
  }

  const roleList = roles?.map((r) => r.role) ?? [];
  const isAdmin = roleList.includes('admin');
  const isCoordinator =
    roleList.includes('coordinator') || roleList.includes('vmrc_coordinator');

  if (!isAdmin && !isCoordinator) {
    return { ok: false, status: 403, error: 'Coordinator or admin access required' };
  }

  if (isCoordinator && !isAdmin) {
    return { ok: true, coordinatorId: userId };
  }

  const paramId = searchParams.get('coordinator_id');
  if (!paramId) {
    return {
      ok: false,
      status: 400,
      error: 'Query parameter coordinator_id is required when using an admin account',
    };
  }

  return { ok: true, coordinatorId: paramId };
}

/** GET — list swimmers assigned to the logged-in coordinator (or admin viewing a coordinator via ?coordinator_id=) */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await resolveCoordinatorScope(supabase, user.id, request.nextUrl.searchParams);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.error }, { status: scope.status });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10) || 25));
    const search = (searchParams.get('search') || '').trim();
    const sortBy = SORT_FIELDS.has(searchParams.get('sortBy') || '')
      ? (searchParams.get('sortBy') as string)
      : 'first_name';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? false : true;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('swimmers')
      .select(
        `
        id,
        first_name,
        last_name,
        parent_email,
        enrollment_status,
        approval_status,
        assessment_status,
        created_at,
        coordinator_id,
        parent:profiles!parent_id (
          id,
          full_name,
          email
        )
      `,
        { count: 'exact' }
      )
      .eq('coordinator_id', scope.coordinatorId);

    if (search) {
      const cleaned = search.replace(/,/g, ' ').trim();
      const term = `%${escapeIlike(cleaned)}%`;
      query = query.or(
        `first_name.ilike.${term},last_name.ilike.${term},parent_email.ilike.${term}`
      );
    }

    query = query.order(sortBy, { ascending: sortOrder }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('GET /api/coordinator/swimmers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []).map((row: any) => {
      const parent = Array.isArray(row.parent) ? row.parent[0] : row.parent;
      const parentName = parent?.full_name ?? '';
      const parentEmail = parent?.email ?? row.parent_email ?? '';
      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        parentName,
        parentEmail,
        enrollmentStatus: row.enrollment_status,
        approvalStatus: row.approval_status,
        assessmentStatus: row.assessment_status,
        createdAt: row.created_at,
      };
    });

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      data: rows,
      total,
      page,
      pageSize,
      totalPages,
      sortBy,
      sortOrder: sortOrder ? 'asc' : 'desc',
    });
  } catch (e) {
    console.error('GET /api/coordinator/swimmers', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
