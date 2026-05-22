import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { emailService } from '@/lib/email-service';
import { format, parseISO } from 'date-fns';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing Supabase env (service role)');
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type SessionRow = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  is_full: boolean | null;
  max_capacity: number | null;
  booking_count: number | null;
  instructor_id: string | null;
  location: string | null;
  is_recurring: boolean | null;
};

/** Date part of session start (UTC yyyy-MM-dd). */
function ymdUTC(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const serviceSupabase = getServiceSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parentId = user.id;
    const { swimmerId, sessionIds, until } = await request.json();
    if (!swimmerId || !sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (until == null || until === '') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (typeof until !== 'string') {
      return NextResponse.json({ error: 'until must be a date string (e.g. YYYY-MM-DD)' }, { status: 400 });
    }
    const untilParsed = parseISO(until.length === 10 ? `${until}T12:00:00` : until);
    if (Number.isNaN(untilParsed.getTime())) {
      return NextResponse.json({ error: 'Invalid until date' }, { status: 400 });
    }
    const untilDay = format(untilParsed, 'yyyy-MM-dd');

    const uniqueIds = [...new Set(sessionIds as string[])];

    const { data: swimmer } = await serviceSupabase
      .from('swimmers')
      .select(
        'id, funding_source_id, flexible_swimmer, enrollment_status, first_name, last_name'
      )
      .eq('id', swimmerId)
      .eq('parent_id', parentId)
      .single();
    if (!swimmer) return NextResponse.json({ error: 'Swimmer not authorized' }, { status: 403 });

    const fundingSourceId = swimmer.funding_source_id;

    let fundingSourceRow: {
      requires_authorization: boolean | null;
      name: string | null;
    } | null = null;
    if (fundingSourceId) {
      const { data: fs } = await serviceSupabase
        .from('funding_sources')
        .select('requires_authorization, name')
        .eq('id', fundingSourceId)
        .single();
      fundingSourceRow = fs;
    }

    if (swimmer.enrollment_status !== 'enrolled' && swimmer.enrollment_status !== 'approved') {
      return NextResponse.json({
        error: 'SWIMMER_NOT_ENROLLED',
        message: 'Swimmer must be enrolled to book lessons',
      }, { status: 400 });
    }

    // Bulk fetch every requested session row. Each one is its own occurrence
    // (Model B: one sessions row per weekly date), so we book each one individually.
    const { data: rawSessions, error: sessErr } = await serviceSupabase
      .from('sessions')
      .select(
        'id, start_time, end_time, status, is_full, max_capacity, booking_count, instructor_id, location, is_recurring'
      )
      .in('id', uniqueIds);

    if (sessErr || !rawSessions || rawSessions.length === 0) {
      return NextResponse.json({ error: 'Sessions not available' }, { status: 400 });
    }
    if (rawSessions.length !== uniqueIds.length) {
      const found = new Set(rawSessions.map(r => r.id));
      return NextResponse.json({
        error: 'Some sessions not found',
        missingSessionIds: uniqueIds.filter(id => !found.has(id)),
      }, { status: 400 });
    }

    // Sort chronologically so the email/confirmation list and PO anchor are predictable.
    const sessions = (rawSessions as SessionRow[]).slice().sort(
      (a, b) => a.start_time.localeCompare(b.start_time)
    );
    const s0 = sessions[0]; // anchor for PO lookup; instructor/location for emails

    // Validate the full set up front — any bad row aborts before the RPC runs.
    const invalidSessions: { id: string; reason: string }[] = [];
    for (const s of sessions) {
      const reason =
        !['available', 'open'].includes(s.status) ? 'session_not_available'
        : s.is_full ? 'session_full'
        : !s.is_recurring ? 'not_recurring'
        : (s.booking_count ?? 0) >= (s.max_capacity ?? 1) ? 'session_at_capacity'
        : ymdUTC(s.start_time) > untilDay ? 'past_until_date'
        : null;
      if (reason) invalidSessions.push({ id: s.id, reason });
    }
    if (invalidSessions.length > 0) {
      return NextResponse.json({
        error: 'Some sessions are not bookable',
        invalidSessions,
      }, { status: 400 });
    }

    // PO lookup anchored on the first chronological session.
    const anchorStart = s0.start_time;

    let activePoId: string | null = null;
    let currentBookingCount = 0;
    let poCoordinatorId: string | null = null;
    let poAuthorized = 0;
    let poStartStr: string | null = null;
    let poEndStr: string | null = null;

    if (fundingSourceId && fundingSourceRow?.requires_authorization) {
      const { data: purchaseOrders } = await serviceSupabase
        .from('purchase_orders')
        .select('id, sessions_authorized, sessions_booked, coordinator_id, start_date, end_date')
        .eq('swimmer_id', swimmerId)
        .eq('status', 'approved')
        .lte('start_date', anchorStart)
        .gte('end_date', anchorStart)
        .order('end_date', { ascending: true })
        .limit(1);

      if (!purchaseOrders || purchaseOrders.length === 0) {
        return NextResponse.json({ error: 'No valid funding source authorization' }, { status: 400 });
      }

      const activePo = purchaseOrders[0];
      if ((activePo.sessions_booked ?? 0) >= (activePo.sessions_authorized ?? 0)) {
        return NextResponse.json({ error: 'Funding source authorization exhausted' }, { status: 400 });
      }

      poStartStr = activePo.start_date
        ? format(
            typeof activePo.start_date === 'string'
              ? parseISO(activePo.start_date)
              : new Date(activePo.start_date),
            'yyyy-MM-dd'
          )
        : null;
      poEndStr = activePo.end_date
        ? format(
            typeof activePo.end_date === 'string'
              ? parseISO(activePo.end_date)
              : new Date(activePo.end_date),
            'yyyy-MM-dd'
          )
        : null;

      activePoId = activePo.id;
      currentBookingCount = activePo.sessions_booked ?? 0;
      poAuthorized = activePo.sessions_authorized ?? 0;
      poCoordinatorId = activePo.coordinator_id ?? null;
    }

    // PO date window filter applies to the actual sessions, not generated dates.
    const inPoWindow = (s: SessionRow) => {
      const d = ymdUTC(s.start_time);
      return (!poStartStr || d >= poStartStr) && (!poEndStr || d <= poEndStr);
    };
    const sessionsInPo = (fundingSourceId && fundingSourceRow?.requires_authorization)
      ? sessions.filter(inPoWindow)
      : sessions;

    if (sessionsInPo.length === 0) {
      return NextResponse.json(
        { error: 'All sessions fall outside purchase order window', until: untilDay },
        { status: 400 }
      );
    }

    // PO authorization gate on the FULL requested set — no per-session capacity cap.
    if (activePoId) {
      const poSlotsAvailable = poAuthorized - currentBookingCount;
      if (sessionsInPo.length > poSlotsAvailable) {
        return NextResponse.json({
          error: 'Not enough funding source sessions available',
          requested: sessionsInPo.length,
          remaining: Math.max(0, poSlotsAvailable),
        }, { status: 400 });
      }
    }

    const sessionsToBook = sessionsInPo;

    // ═══════════════════════════════════════════════════════════════════
    // One RPC call → Postgres transaction. If any individual book_session
    // fails mid-loop, RAISE EXCEPTION inside book_recurring_sessions rolls
    // back every prior insert + booking_count++ + sessions_booked++ atomically.
    // No client-side compensating actions needed.
    // ═══════════════════════════════════════════════════════════════════
    const { data: rpcResult, error: rpcError } = await serviceSupabase.rpc('book_recurring_sessions', {
      p_session_ids: sessionsToBook.map(s => s.id),
      p_swimmer_id: swimmerId,
      p_parent_id: parentId,
      p_booking_type: 'lesson',
      p_purchase_order_id: activePoId ?? null,
      p_status: 'confirmed',
    });

    if (rpcError) {
      throw new Error(rpcError.message);
    }

    const rpcBookingIds: string[] = (rpcResult?.booking_ids ?? []) as string[];
    const rpcSessionDates: string[] = (rpcResult?.session_dates ?? []) as string[];
    const bookings = rpcBookingIds.map((id, i) => ({
      id,
      session_id: sessionsToBook[i].id,
      session_date: rpcSessionDates[i] ?? ymdUTC(sessionsToBook[i].start_time),
    }));

    try {
      const { data: parentProfile } = await serviceSupabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', parentId)
        .single();

      const sessionsForEmail = sessionsToBook.map(s => {
        const dt = parseISO(s.start_time);
        return {
          date: format(dt, 'EEEE, MMMM d, yyyy'),
          time: format(dt, 'h:mm a'),
        };
      });

      const firstInstructorId = s0.instructor_id;
      const { data: firstInstructorProfile } = firstInstructorId
        ? await serviceSupabase
            .from('profiles')
            .select('full_name')
            .eq('id', firstInstructorId)
            .single()
        : { data: null };

      if (parentProfile?.email) {
        await emailService.sendRecurringLessonBooking({
          parentEmail: parentProfile.email,
          parentName: parentProfile.full_name || 'Parent',
          childName: `${swimmer.first_name} ${swimmer.last_name}`,
          instructor: firstInstructorProfile?.full_name || 'Instructor',
          location: s0.location || 'TBD',
          sessions: sessionsForEmail,
        });
      }

      if (fundingSourceId && poCoordinatorId) {
        const { data: coordinatorProfile } = await serviceSupabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', poCoordinatorId)
          .maybeSingle();

        if (coordinatorProfile?.email) {
          const { data: instructorProfile } = s0.instructor_id
            ? await serviceSupabase
                .from('profiles')
                .select('full_name')
                .eq('id', s0.instructor_id)
                .single()
            : { data: null };

          for (const s of sessionsToBook) {
            const dt = parseISO(s.start_time);
            await emailService.sendFundedSingleLessonCoordinatorNotification({
              coordinatorEmail: coordinatorProfile.email,
              coordinatorName: coordinatorProfile.full_name || 'Coordinator',
              parentName: parentProfile?.full_name || 'Parent',
              childName: `${swimmer.first_name} ${swimmer.last_name}`,
              date: format(dt, 'EEEE, MMMM d, yyyy'),
              time: format(dt, 'h:mm a'),
              location: s0.location || 'TBD',
              instructor: instructorProfile?.full_name || 'Instructor',
              fundingSourceName: fundingSourceRow?.name ?? undefined,
            });
          }
        }
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Generate confirmation number for the response
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const confirmationNumber = `ICS-${dateStr}-${randomNum}`;

    return NextResponse.json({
      success: true,
      confirmationNumber,
      until: untilDay,
      bookingsCreated: bookings.length,
      sessionDatesBooked: bookings.map(b => b.session_date),
      bookings: bookings.map(b => ({
        id: b.id,
        sessionId: b.session_id,
        sessionDate: b.session_date,
        status: 'confirmed',
      })),
      fundingSourceId,
    });
  } catch (error) {
    console.error('Recurring booking creation error:', error);

    // No compensating rollback: book_recurring_sessions RPC is atomic, so any
    // mid-loop failure inside Postgres already rolled back every prior insert.

    const message = error instanceof Error ? error.message : 'Internal server error';

    // Map book_session error codes to HTTP statuses
    if (
      message.includes('session_full') ||
      message.includes('session_not_available') ||
      message.includes('session_held') ||
      message.includes('duplicate_booking') ||
      message.includes('swimmer_conflict') ||
      message.includes('no longer available') ||
      message.includes('exceed max capacity')
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message.includes('session_not_found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (
      message.includes('Purchase order') ||
      message.includes('purchase order')
    ) {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json(
      { error: message === 'Internal server error' ? 'Internal server error' : message },
      { status: 500 }
    );
  }
}
