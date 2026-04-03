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
  const rollback: {
    bookingIds: string[];
    sessionSnapshots: { id: string; booking_count: number; is_full: boolean | null; status: string }[];
  } = { bookingIds: [], sessionSnapshots: [] };

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

    const { data: fresh, error: freshErr } = await serviceSupabase
      .from('sessions')
      .select(
        'id, start_time, end_time, status, is_full, max_capacity, booking_count, instructor_id, location, is_recurring'
      )
      .eq('id', sessionId)
      .single();

    if (freshErr || !fresh) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const fr = fresh as SessionRow;
    const fc = fr.booking_count ?? 0;
    const fcap = fr.max_capacity ?? 1;
    if (!['available', 'open'].includes(fr.status) || fr.is_full || fc >= fcap) {
      throw new Error(`Session ${sessionId} is no longer available`);
    }
    if (fc + nBookings > fcap) {
      throw new Error(`Session ${sessionId} would exceed max capacity`);
    }

    rollback.sessionSnapshots.push({
      id: fr.id,
      booking_count: fc,
      is_full: fr.is_full,
      status: fr.status,
    });

    const bookings: { id: string; session_id: string }[] = [];

    for (const sessionDateYmd of sessionDatesToBook) {
      const { data: booking, error: bookingError } = await serviceSupabase
        .from('bookings')
        .insert({
          session_id: sessionId,
          swimmer_id: swimmerId,
          parent_id: parentId,
          status: 'confirmed',
          session_date: sessionDateYmd,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (bookingError || !booking) {
        throw new Error(`Failed to create booking for ${sessionDateYmd}`);
      }

      rollback.bookingIds.push(booking.id);
      bookings.push({ id: booking.id, session_id: sessionId });
    }

    const newBookingCount = fc + nBookings;
    const isFull = newBookingCount >= fcap;
    const { error: sessionUpdateError } = await serviceSupabase
      .from('sessions')
      .update({
        booking_count: newBookingCount,
        is_full: isFull,
        status: isFull ? 'booked' : fr.status,
      })
      .eq('id', sessionId);

    if (sessionUpdateError) {
      throw new Error(`Failed to update session ${sessionId}`);
    }

    if (fundingSourceId && activePoId) {
      const nextSessionsBooked = currentBookingCount + nBookings;

      const { error: poUpdateError, data: poUpdated } = await serviceSupabase
        .from('purchase_orders')
        .update({ sessions_booked: nextSessionsBooked })
        .eq('id', activePoId)
        .select('sessions_booked')
        .maybeSingle();

      if (poUpdateError) {
        console.error('Purchase order update failed:', poUpdateError);
        throw new Error('Failed to update purchase order usage');
      }

      if (!poUpdated) {
        throw new Error('Purchase order not found');
      }

      console.log('Purchase order updated:', poUpdated);
    }

    try {
      const { data: parentProfile } = await serviceSupabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', parentId)
        .single();

      const sessionsForEmail = sessionDatesToBook.map(ymd => {
        const dt = occurrenceDateTime(ymd, fr.start_time);
        return {
          date: format(dt, 'EEEE, MMMM d, yyyy'),
          time: format(dt, 'h:mm a'),
        };
      });

      const firstInstructorId = fr.instructor_id;
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
          location: fr.location || 'TBD',
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
          const { data: instructorProfile } = fr.instructor_id
            ? await serviceSupabase
                .from('profiles')
                .select('full_name')
                .eq('id', fr.instructor_id)
                .single()
            : { data: null };

          for (const ymd of sessionDatesToBook) {
            const dt = occurrenceDateTime(ymd, fr.start_time);
            await emailService.sendFundedSingleLessonCoordinatorNotification({
              coordinatorEmail: coordinatorProfile.email,
              coordinatorName: coordinatorProfile.full_name || 'Coordinator',
              parentName: parentProfile?.full_name || 'Parent',
              childName: `${swimmer.first_name} ${swimmer.last_name}`,
              date: format(dt, 'EEEE, MMMM d, yyyy'),
              time: format(dt, 'h:mm a'),
              location: fr.location || 'TBD',
              instructor: instructorProfile?.full_name || 'Instructor',
              fundingSourceName: fundingSourceRow?.name ?? undefined,
            });
          }
        }
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
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

    for (const bid of rollback.bookingIds) {
      await serviceSupabase.from('bookings').delete().eq('id', bid);
    }
    for (const snap of rollback.sessionSnapshots) {
      await serviceSupabase
        .from('sessions')
        .update({
          booking_count: snap.booking_count,
          is_full: snap.is_full,
          status: snap.status,
        })
        .eq('id', snap.id);
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    if (
      message.includes('no longer available') ||
      message.includes('not found') ||
      message.includes('Failed to create booking') ||
      message.includes('Failed to update session') ||
      message.includes('exceed max capacity')
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
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
