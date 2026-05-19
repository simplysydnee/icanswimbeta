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

function todayYmdUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function utcDow(ymd: string): number {
  return new Date(`${ymd}T12:00:00.000Z`).getUTCDay();
}

function addDaysUTC(ymd: string, n: number): string {
  const d = new Date(`${ymd}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** First booking date: template date if >= today, else first same weekday >= today (UTC). */
function firstBookingYmd(templateYmd: string, currentYmd: string): string {
  if (templateYmd >= currentYmd) return templateYmd;
  const want = utcDow(templateYmd);
  let d = currentYmd;
  for (let i = 0; i < 7; i++) {
    if (utcDow(d) === want) return d;
    d = addDaysUTC(d, 1);
  }
  return currentYmd;
}

/** Weekly dates from first through until (inclusive). */
function weeklyUntilInclusive(first: string, until: string): string[] {
  const out: string[] = [];
  let d = first;
  while (d <= until) {
    out.push(d);
    d = addDaysUTC(d, 7);
  }
  return out;
}

function occurrenceDateTime(ymd: string, templateStartIso: string): Date {
  const t = parseISO(templateStartIso);
  return new Date(
    Date.UTC(
      Number(ymd.slice(0, 4)),
      Number(ymd.slice(5, 7)) - 1,
      Number(ymd.slice(8, 10)),
      t.getUTCHours(),
      t.getUTCMinutes(),
      t.getUTCSeconds(),
      t.getUTCMilliseconds()
    )
  );
}

export async function POST(request: Request) {
  const bookingIds: string[] = [];

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

    const sessionId = [...new Set(sessionIds as string[])][0];

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

    const { data: session, error: sessErr } = await serviceSupabase
      .from('sessions')
      .select(
        'id, start_time, end_time, status, is_full, max_capacity, booking_count, instructor_id, location, is_recurring'
      )
      .eq('id', sessionId)
      .single();

    if (sessErr || !session) {
      return NextResponse.json({ error: 'Session not available' }, { status: 400 });
    }

    const s0 = session as SessionRow;
    if (!['available', 'open'].includes(s0.status) || s0.is_full) {
      return NextResponse.json({ error: 'Session not available', sessionId }, { status: 400 });
    }
    const cap = s0.max_capacity ?? 1;
    const count = s0.booking_count ?? 0;
    if (count >= cap) {
      return NextResponse.json(
        {
          error: 'Session at capacity',
          sessionId,
          booking_count: count,
          max_capacity: cap,
        },
        { status: 400 }
      );
    }

    if (!s0.is_recurring) {
      return NextResponse.json({
        error:
          'Recurring bookings can only include weekly recurring sessions. Floating sessions must be booked individually.',
        nonRecurringSessionIds: [sessionId],
        code: 'NON_RECURRING_SESSION_IN_RECURRING_BOOKING',
      }, { status: 400 });
    }

    const templateYmd = ymdUTC(s0.start_time);
    const firstYmd = firstBookingYmd(templateYmd, todayYmdUTC());
    const weeklyDates = weeklyUntilInclusive(firstYmd, untilDay);

    if (weeklyDates.length === 0) {
      return NextResponse.json(
        { error: 'No lesson dates on or before until date', until: untilDay },
        { status: 400 }
      );
    }

    const anchorStart = `${firstYmd}T12:00:00.000Z`;

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

    const inPo = (d: string) =>
      (!poStartStr || d >= poStartStr) && (!poEndStr || d <= poEndStr);
    const datesInPo =
      fundingSourceId && fundingSourceRow?.requires_authorization
        ? weeklyDates.filter(inPo)
        : weeklyDates;

    const capacitySlots = cap - count;
    const poSlots =
      fundingSourceId && fundingSourceRow?.requires_authorization && activePoId
        ? poAuthorized - currentBookingCount
        : Number.POSITIVE_INFINITY;

    const nBookings = Math.min(datesInPo.length, Math.max(0, capacitySlots), Math.max(0, poSlots));

    if (nBookings <= 0) {
      if (capacitySlots <= 0) {
        return NextResponse.json(
          { error: 'Session at capacity', booking_count: count, max_capacity: cap },
          { status: 400 }
        );
      }
      if (Number.isFinite(poSlots) && poSlots <= 0) {
        return NextResponse.json(
          {
            error: 'Not enough funding source sessions available',
            remainingSessions: Math.max(0, poSlots),
          },
          { status: 400 }
        );
      }
      if (datesInPo.length === 0 && weeklyDates.length > 0) {
        return NextResponse.json(
          { error: 'All dates fall outside purchase order window', until: untilDay },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'No bookings can be created with current limits' }, { status: 400 });
    }

    const sessionDatesToBook = datesInPo.slice(0, nBookings);

    // ═══════════════════════════════════════════════════════════════════
    // Atomically create bookings via book_session RPC (row-level lock)
    // Called once per date — each call increments booking_count by 1
    // ═══════════════════════════════════════════════════════════════════
    const bookings: { id: string; session_id: string }[] = [];

    for (const sessionDateYmd of sessionDatesToBook) {
      const { data: result, error: rpcError } = await serviceSupabase.rpc('book_session', {
        p_session_id: sessionId,
        p_swimmer_id: swimmerId,
        p_parent_id: parentId,
        p_booking_type: 'lesson',
        p_purchase_order_id: activePoId ?? null,
        p_status: 'confirmed',
      });

      if (rpcError || result?.error) {
        // Rollback already-created bookings via cancel_booking
        for (const bid of bookingIds) {
          await serviceSupabase.rpc('cancel_booking', {
            p_booking_id: bid,
            p_cancelled_by: parentId,
            p_cancel_reason: 'Rollback from recurring booking failure',
            p_cancel_source: 'system',
            p_is_late_cancel: false,
          });
        }
        const code = result?.error || 'rpc_error';
        throw new Error(`book_session failed for ${sessionDateYmd}: ${code}${rpcError ? ' (' + rpcError.message + ')' : ''}`);
      }

      bookingIds.push(result.booking_id);
      bookings.push({ id: result.booking_id, session_id: sessionId });
    }

    // PO increment now handled atomically inside book_session RPC

    try {
      const { data: parentProfile } = await serviceSupabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', parentId)
        .single();

      const sessionsForEmail = sessionDatesToBook.map(ymd => {
        const dt = occurrenceDateTime(ymd, s0.start_time);
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

          for (const ymd of sessionDatesToBook) {
            const dt = occurrenceDateTime(ymd, s0.start_time);
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
      sessionDatesBooked: sessionDatesToBook,
      bookings: bookings.map(b => ({
        id: b.id,
        sessionId: b.session_id,
        status: 'confirmed',
      })),
      fundingSourceId,
    });
  } catch (error) {
    console.error('Recurring booking creation error:', error);

    const serviceSupabase = getServiceSupabase();

    // Rollback via cancel_booking (atomic, logs to cancellations table)
    for (const bid of bookingIds) {
      try {
        await serviceSupabase.rpc('cancel_booking', {
          p_booking_id: bid,
          p_cancelled_by: parentId,
          p_cancel_reason: 'Rollback on recurring booking error',
          p_cancel_source: 'system',
          p_is_late_cancel: false,
        });
      } catch (cancelErr) {
        console.error(`Failed to rollback booking ${bid}:`, cancelErr);
      }
    }

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
