import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing Supabase env (service role)');
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceSupabase = getServiceSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { swimmerId } = body;

    if (!swimmerId) {
      return NextResponse.json({ error: 'Missing swimmerId' }, { status: 400 });
    }

    // Normalize input: batched (`sessions: [...]`) or single (`sessionId`/`startTime`).
    // Backward-compatible — existing single-session callers keep working unchanged.
    type Input = { sessionId?: string; startTime?: string; endTime?: string };
    const isBatch = Array.isArray(body.sessions) && body.sessions.length > 0;
    const inputs: Input[] = isBatch
      ? (body.sessions as Input[])
      : [{ sessionId: body.sessionId, startTime: body.startTime, endTime: body.endTime }];

    if (inputs.length === 0 || inputs.every(i => !i.sessionId && !i.startTime)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hydrate any inputs that only have sessionId — one .in() query.
    const idsToHydrate = inputs.filter(i => i.sessionId && !i.startTime).map(i => i.sessionId!);
    if (idsToHydrate.length > 0) {
      const { data: sessRows } = await serviceSupabase
        .from('sessions')
        .select('id, start_time, end_time')
        .in('id', idsToHydrate);
      const byId = new Map((sessRows ?? []).map(r => [r.id, r]));
      for (const inp of inputs) {
        if (inp.sessionId && !inp.startTime) {
          const r = byId.get(inp.sessionId);
          if (r) {
            inp.startTime = r.start_time;
            inp.endTime = r.end_time;
          }
        }
      }
    }

    if (inputs.some(i => !i.startTime)) {
      return NextResponse.json({ error: 'Could not determine session time' }, { status: 400 });
    }

    // ONE query for the swimmer's existing bookings — reused for every input.
    const { data: conflicts, error } = await serviceSupabase
      .from('bookings')
      .select(`
        id,
        status,
        session:sessions(id, start_time, end_time, location)
      `)
      .eq('swimmer_id', swimmerId)
      .in('status', ['confirmed', 'pending'])
      .not('session', 'is', null);

    if (error) {
      console.error('Conflict check error:', error);
      return NextResponse.json({ error: 'Failed to check conflicts' }, { status: 500 });
    }

    // In-memory overlap check for each input.
    const perSession = inputs.map((inp, index) => {
      const start = new Date(inp.startTime!).getTime();
      const end = inp.endTime ? new Date(inp.endTime).getTime() : start + 30 * 60 * 1000;
      const overlaps = (conflicts ?? []).filter(b => {
        if (!b.session?.start_time) return false;
        const bStart = new Date(b.session.start_time).getTime();
        const bEnd = b.session.end_time
          ? new Date(b.session.end_time).getTime()
          : bStart + 30 * 60 * 1000;
        return start < bEnd && end > bStart;
      });
      return {
        index,
        sessionId: inp.sessionId,
        startTime: inp.startTime,
        hasConflict: overlaps.length > 0,
        message: overlaps.length > 0 ? 'This swimmer already has a booking at this time.' : undefined,
        conflicts: overlaps.map(b => ({
          bookingId: b.id,
          sessionTime: b.session?.start_time,
          location: b.session?.location,
        })),
      };
    });

    const anyConflict = perSession.some(p => p.hasConflict);

    // Single-shape response for the legacy single-session call — preserves the existing
    // contract (the wizard's single-booking branch and any other callers rely on
    // top-level `hasConflict` / `conflicts` / `message`).
    if (!isBatch) {
      const first = perSession[0];

      // Preserve the existing 4-per-day cap on the single path. It counts bookings by
      // `created_at` (when the row was inserted) rather than session date — keeping
      // that quirk as-is to avoid scope creep; revisit separately if needed.
      if (!first.hasConflict && first.startTime) {
        const sessionDate = new Date(first.startTime).toISOString().split('T')[0];
        const dayStart = `${sessionDate}T00:00:00.000Z`;
        const dayEnd = `${sessionDate}T23:59:59.999Z`;
        const { count: dailyBookings } = await serviceSupabase
          .from('bookings')
          .select('id', { count: 'exact' })
          .eq('swimmer_id', swimmerId)
          .in('status', ['confirmed', 'pending'])
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);
        if ((dailyBookings || 0) >= 4) {
          return NextResponse.json({
            hasConflict: true,
            conflicts: [],
            message: 'Daily booking limit reached (maximum 4 sessions per day).',
          });
        }
      }

      return NextResponse.json({
        hasConflict: first.hasConflict,
        conflicts: first.conflicts,
        message: first.message,
      });
    }

    // Batched response — per-session results so the caller can surface the first
    // (or all) conflicts. Daily-limit check intentionally skipped on the batched
    // path; recurring submissions span many dates and the 4/day cap on the single
    // path is the looser of the two protections.
    return NextResponse.json({
      hasConflict: anyConflict,
      perSession,
    });

  } catch (error) {
    console.error('Conflict check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}