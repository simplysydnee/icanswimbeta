import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { addMonths, format, parseISO } from 'date-fns';
import { notifyCoordinatorPendingRenewalPO } from '@/lib/email/pos-notifications';

export const dynamic = 'force-dynamic';

async function assertInstructorOrAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      user: null as null,
      roles: [] as string[],
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['instructor', 'admin']);
  const roles = roleRows?.map((r) => r.role) || [];
  if (!roles.includes('instructor') && !roles.includes('admin')) {
    return {
      user: null as null,
      roles,
      error: NextResponse.json({ error: 'Instructor access required' }, { status: 403 }),
    };
  }
  return { user, roles, error: null as null };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { user, roles, error } = await assertInstructorOrAdmin(supabase);
    if (error || !user) return error!;

    const { searchParams } = new URL(request.url);
    const parentPoId = searchParams.get('parentPoId');
    if (!parentPoId) {
      return NextResponse.json({ error: 'parentPoId is required' }, { status: 400 });
    }

    const { data: parent, error: pErr } = await supabase
      .from('purchase_orders')
      .select(
        `
        id,
        swimmer_id,
        funding_source_id,
        coordinator_id,
        po_type,
        status,
        sessions_authorized,
        sessions_used,
        end_date,
        start_date,
        funding_sources ( lessons_per_po, renewal_alert_threshold, name )
      `
      )
      .eq('id', parentPoId)
      .single();

    if (pErr || !parent) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    if (!roles.includes('admin')) {
      const { data: access } = await supabase.rpc('instructor_has_swimmer_access', {
        p_instructor_id: user.id,
        p_swimmer_id: parent.swimmer_id,
      });

      if (!access) {
        return NextResponse.json({ error: 'Not authorized for this swimmer' }, { status: 403 });
      }
    }

    const fs = Array.isArray(parent.funding_sources)
      ? parent.funding_sources[0]
      : parent.funding_sources;

    const defaultSessions = fs?.lessons_per_po ?? 12;

    const { data: swimmer } = await supabase
      .from('swimmers')
      .select(
        'id, first_name, last_name, coordinator_email, coordinator_name, funding_coordinator_email, funding_coordinator_name'
      )
      .eq('id', parent.swimmer_id)
      .single();

    return NextResponse.json({
      parentPo: {
        id: parent.id,
        swimmerId: parent.swimmer_id,
        sessionsAuthorized: parent.sessions_authorized,
        sessionsUsed: parent.sessions_used,
        endDate: parent.end_date,
        startDate: parent.start_date,
        status: parent.status,
      },
      defaults: {
        sessionsAuthorized: defaultSessions,
      },
      fundingSourceName: fs?.name ?? null,
      swimmerName: swimmer
        ? `${swimmer.first_name ?? ''} ${swimmer.last_name ?? ''}`.trim()
        : null,
    });
  } catch (e) {
    console.error('po-renewal GET:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase service role config for po-renewal POST');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const serviceSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey);
    const { user, roles, error } = await assertInstructorOrAdmin(supabase);
    if (error || !user) return error!;

    const body = await request.json();
    const parentPoId = body.parentPoId as string | undefined;
    const sessionsAuthorizedRaw = body.sessionsAuthorized ?? body.sessions_authorized;
    const goalsNextPo = (body.goalsNextPo ?? body.goals_next_po ?? '') as string;

    if (!parentPoId || typeof goalsNextPo !== 'string' || goalsNextPo.trim().length < 3) {
      return NextResponse.json(
        { error: 'parentPoId and goalsNextPo (min 3 characters) are required' },
        { status: 400 }
      );
    }

    const sessionsAuthorized = Number(sessionsAuthorizedRaw);
    if (!Number.isFinite(sessionsAuthorized) || sessionsAuthorized < 1 || !Number.isInteger(sessionsAuthorized)) {
      return NextResponse.json({ error: 'sessionsAuthorized must be a positive integer' }, { status: 400 });
    }

    const { data: parent, error: pErr } = await supabase
      .from('purchase_orders')
      .select(
        `
        id,
        swimmer_id,
        funding_source_id,
        coordinator_id,
        end_date,
        start_date,
        funding_sources ( po_duration_months, lessons_per_po, name )
      `
      )
      .eq('id', parentPoId)
      .single();

    if (pErr || !parent) {
      return NextResponse.json({ error: 'Parent purchase order not found' }, { status: 404 });
    }

    if (!roles.includes('admin')) {
      const { data: access } = await supabase.rpc('instructor_has_swimmer_access', {
        p_instructor_id: user.id,
        p_swimmer_id: parent.swimmer_id,
      });

      if (!access) {
        return NextResponse.json({ error: 'Not authorized for this swimmer' }, { status: 403 });
      }
    }

    const { data: pendingSibling } = await supabase
      .from('purchase_orders')
      .select('id')
      .eq('parent_po_id', parent.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingSibling) {
      return NextResponse.json(
        { error: 'A pending renewal PO already exists for this authorization' },
        { status: 409 }
      );
    }

    const fs = Array.isArray(parent.funding_sources)
      ? parent.funding_sources[0]
      : parent.funding_sources;
    const months = fs?.po_duration_months ?? 3;

    const parentEnd = parent.end_date
      ? parseISO(String(parent.end_date))
      : new Date();
    const startBase = Number.isNaN(parentEnd.getTime()) ? new Date() : parentEnd;
    const startDate = format(addDaysSafe(startBase, 1), 'yyyy-MM-dd');
    const endDate = format(addMonths(parseISO(`${startDate}T12:00:00`), months), 'yyyy-MM-dd');

    const notes = `Next PO goals:\n${goalsNextPo.trim()}`;

    const { data: inserted, error: insErr } = await serviceSupabase
      .from('purchase_orders')
      .insert({
        swimmer_id: parent.swimmer_id,
        funding_source_id: parent.funding_source_id,
        coordinator_id: parent.coordinator_id,
        po_type: 'lessons',
        parent_po_id: parent.id,
        sessions_authorized: sessionsAuthorized,
        sessions_booked: 0,
        sessions_used: 0,
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
        notes,
      })
      .select('id, start_date, end_date, sessions_authorized, status')
      .single();

    if (insErr) {
      console.error('po-renewal insert:', insErr);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    const { data: swimmer } = await supabase
      .from('swimmers')
      .select(
        'first_name, last_name, coordinator_email, coordinator_name, funding_coordinator_email, funding_coordinator_name'
      )
      .eq('id', parent.swimmer_id)
      .single();

    const swimmerName = swimmer
      ? `${swimmer.first_name ?? ''} ${swimmer.last_name ?? ''}`.trim()
      : 'Swimmer';

    const coordEmail =
      swimmer?.funding_coordinator_email?.trim() ||
      swimmer?.coordinator_email?.trim() ||
      undefined;
    const coordName =
      swimmer?.funding_coordinator_name?.trim() ||
      swimmer?.coordinator_name?.trim() ||
      undefined;

    await notifyCoordinatorPendingRenewalPO({
      coordinatorEmail: coordEmail,
      coordinatorName: coordName,
      swimmerName,
      fundingSourceName: fs?.name ?? 'Funding source',
      sessionsAuthorized,
      startDate: inserted.start_date,
      endDate: inserted.end_date,
      parentPoId: parent.id,
      newPoId: inserted.id,
    });

    return NextResponse.json({ data: inserted }, { status: 201 });
  } catch (e) {
    console.error('po-renewal POST:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function addDaysSafe(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
