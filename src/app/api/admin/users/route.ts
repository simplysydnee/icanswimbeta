import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Joi from 'joi';

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
  search: Joi.string().allow('').optional(),
  role: Joi.string()
    .valid('all', 'admin', 'instructor', 'coordinator', 'parent')
    .default('all'),
});

const escapeIlike = (s: string) => s.replace(/([%_,])/g, '\\$1');

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    const { data: roleRow, error: roleErr } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleErr || !roleRow) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(
      Array.from(searchParams.entries())
        .filter(([, v]) => v !== null && v !== '')
        .map(([k, v]) => (k === 'page' || k === 'limit' ? [k, Number(v)] : [k, v]))
    );

    const { value, error: validationError } = querySchema.validate(queryParams);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.details[0].message },
        { status: 400 }
      );
    }

    const { page, limit, search, role } = value as {
      page: number;
      limit: number;
      search?: string;
      role: 'all' | 'admin' | 'instructor' | 'coordinator' | 'parent';
    };

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const searchPattern = search?.trim()
      ? `%${escapeIlike(search.trim())}%`
      : null;
    const orFilter = searchPattern
      ? `full_name.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern}`
      : null;

    type ProfileRow = {
      id: string;
      email: string;
      full_name: string | null;
      phone: string | null;
      created_at: string;
      updated_at: string;
      last_login_at: string | null;
      login_count: number | null;
    };

    // Always query user_roles -> profiles!inner so that multi-role users
    // produce one row per role. With role='all' this means a user with both
    // 'parent' and 'admin' appears twice (once per role); with a role filter
    // only the matching role row is returned.
    let q = supabase
      .from('user_roles')
      .select(
        'role, profiles!inner(id, email, full_name, phone, created_at, updated_at, last_login_at, login_count)',
        { count: 'exact' }
      )
      .order('created_at', { referencedTable: 'profiles', ascending: false });

    if (role !== 'all') q = q.eq('role', role);
    if (orFilter) q = q.or(orFilter, { referencedTable: 'profiles' });

    const res = await q.range(from, to);

    if (res.error) {
      console.error('Error fetching user_roles+profiles:', {
        message: res.error.message,
        details: res.error.details,
        hint: res.error.hint,
        code: res.error.code,
        role,
        search,
      });
      return NextResponse.json(
        { error: `Failed to load users: ${res.error.message}` },
        { status: 500 }
      );
    }

    type Row = { profile: ProfileRow; role: string };
    const rows: Row[] = ((res.data as Array<{ role: string; profiles: ProfileRow | ProfileRow[] }> | null) ?? [])
      .map((r) => {
        const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        return p ? { profile: p, role: r.role } : null;
      })
      .filter((r): r is Row => r !== null);

    const count = res.count;

    const parentIds = Array.from(
      new Set(rows.filter((r) => r.role === 'parent').map((r) => r.profile.id))
    );
    const coordIds = Array.from(
      new Set(rows.filter((r) => r.role === 'coordinator').map((r) => r.profile.id))
    );

    const [swimRes, clientRes] = await Promise.all([
      parentIds.length
        ? supabase.from('swimmers').select('parent_id').in('parent_id', parentIds)
        : Promise.resolve({ data: [] as { parent_id: string | null }[], error: null }),
      coordIds.length
        ? supabase.from('swimmers').select('coordinator_id').in('coordinator_id', coordIds)
        : Promise.resolve({ data: [] as { coordinator_id: string | null }[], error: null }),
    ]);

    const swimmerCount = new Map<string, number>();
    for (const r of swimRes.data ?? []) {
      if (r.parent_id) {
        swimmerCount.set(r.parent_id, (swimmerCount.get(r.parent_id) ?? 0) + 1);
      }
    }
    const clientCount = new Map<string, number>();
    for (const r of clientRes.data ?? []) {
      if (r.coordinator_id) {
        clientCount.set(r.coordinator_id, (clientCount.get(r.coordinator_id) ?? 0) + 1);
      }
    }

    const users = rows.map(({ profile, role: rowRole }) => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      last_login_at: profile.last_login_at,
      login_count: profile.login_count ?? 0,
      role: rowRole,
      swimmer_count: rowRole === 'parent' ? swimmerCount.get(profile.id) ?? 0 : 0,
      client_count: rowRole === 'coordinator' ? clientCount.get(profile.id) ?? 0 : 0,
    }));

    const total = count ?? 0;
    return NextResponse.json({
      users,
      total,
      page,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Unexpected error in /api/admin/users:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
