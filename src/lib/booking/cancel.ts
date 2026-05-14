/**
 * Shared booking cancellation service.
 *
 * Before this existed, three different cancel paths (parent /cancel endpoint,
 * admin bulk-cancel, and direct PATCH /api/bookings/[id] with status='cancelled')
 * had divergent side-effect logic — only the parent path created floating
 * sessions, none of them decremented purchase_orders.sessions_booked. That
 * caused funded clients to lose entitled lessons (BUG-00d) and silently lost
 * cancelled slots that should have been re-offered to flexible swimmers (BUG-00e).
 *
 * This module centralises the cancel lifecycle so every path produces the
 * same result: booking flipped to 'cancelled', session counter decremented,
 * funded-PO counter decremented, floating session created for late
 * cancellations, flexible_swimmer flag set, and an analytics row inserted.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type CancelSource = 'parent' | 'admin' | 'bulk' | 'system';

export type CancelBookingInput = {
  bookingId: string;
  /** Who triggered the cancellation. Drives cancel_source + analytics. */
  source: CancelSource;
  /** auth.users.id of the person canceling (admin id, parent id, etc.). */
  canceledByUserId: string;
  reason?: string | null;
  /** If true, skip the late-cancellation side effects (used when admin overrides). */
  skipLateConsequences?: boolean;
};

export type CancelBookingResult = {
  bookingId: string;
  hoursBeforeSession: number;
  isLateCancellation: boolean;
  isSemiPrivate: boolean;
  createdFloatingSession: boolean;
  floatingSessionId: string | null;
  decrementedPoId: string | null;
};

const MS_PER_HOUR = 1000 * 60 * 60;

/**
 * Cancel a single booking and run every required side effect. Idempotent for
 * already-cancelled bookings: returns the existing state without re-running
 * side effects.
 */
export async function cancelBooking(
  serviceSupabase: SupabaseClient,
  input: CancelBookingInput
): Promise<CancelBookingResult> {
  const { bookingId, source, canceledByUserId, reason, skipLateConsequences } = input;
  const now = new Date();

  const { data: booking, error: bookingErr } = await serviceSupabase
    .from('bookings')
    .select(
      `
        id,
        status,
        booking_type,
        session_id,
        swimmer_id,
        parent_id,
        session:sessions (
          id,
          start_time,
          end_time,
          location,
          booking_count,
          instructor_id,
          session_type_detail,
          is_semi_private_restricted
        ),
        swimmer:swimmers (
          id,
          first_name,
          last_name,
          funding_source_id,
          parent_id,
          flexible_swimmer
        )
      `
    )
    .eq('id', bookingId)
    .single();

  if (bookingErr || !booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'cancelled') {
    return {
      bookingId,
      hoursBeforeSession: 0,
      isLateCancellation: false,
      isSemiPrivate: false,
      createdFloatingSession: false,
      floatingSessionId: null,
      decrementedPoId: null,
    };
  }

  const session = (booking.session as any) ?? {};
  const swimmer = (booking.swimmer as any) ?? {};
  const sessionStart = session.start_time ? new Date(session.start_time) : null;
  const hoursBeforeSession = sessionStart
    ? (sessionStart.getTime() - now.getTime()) / MS_PER_HOUR
    : 0;

  const isSemiPrivate =
    session.session_type_detail === 'semi_private' || !!session.is_semi_private_restricted;
  const isLateCancellation =
    !skipLateConsequences && !isSemiPrivate && hoursBeforeSession < 24;

  // Look up instructor name for the analytics row (best-effort).
  let instructorName: string | null = null;
  if (session.instructor_id) {
    const { data: instructor } = await serviceSupabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.instructor_id)
      .single();
    instructorName = instructor?.full_name ?? null;
  }

  // 1. Mark booking cancelled.
  const { error: updateError } = await serviceSupabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancel_reason: reason ?? null,
      cancel_source: source,
      canceled_at: now.toISOString(),
      canceled_by: canceledByUserId,
    })
    .eq('id', bookingId);

  if (updateError) {
    throw new Error('Failed to cancel booking');
  }

  // 2. Decrement session.booking_count and clear is_full.
  if (session.id) {
    await serviceSupabase
      .from('sessions')
      .update({
        booking_count: Math.max(0, (session.booking_count ?? 1) - 1),
        is_full: false,
      })
      .eq('id', session.id);
  }

  // 3. Decrement matching PO for funded swimmers (BUG-00d).
  //    Find the approved PO whose date range covered the session start time
  //    — i.e. the one increment_purchase_order_sessions_booked() would have
  //    incremented when the booking was originally created.
  let decrementedPoId: string | null = null;
  if (swimmer.funding_source_id && session.start_time) {
    const { data: pos } = await serviceSupabase
      .from('purchase_orders')
      .select('id, sessions_booked')
      .eq('swimmer_id', swimmer.id)
      // Production POs use status='active'. See verification report:
      // approved is not a value present in the live purchase_orders enum.
      .eq('status', 'active')
      .lte('start_date', session.start_time)
      .gte('end_date', session.start_time)
      .order('end_date', { ascending: true })
      .limit(1);

    const activePo = pos?.[0];
    if (activePo?.id) {
      const { error: decErr } = await serviceSupabase.rpc(
        'decrement_purchase_order_sessions_booked',
        { p_purchase_order_id: activePo.id, p_decrement: 1 }
      );
      if (decErr) {
        console.error('cancelBooking: PO decrement failed', decErr);
      } else {
        decrementedPoId = activePo.id;
      }
    }
  }

  // 4. Late-cancellation consequences: flexible_swimmer + floating_session.
  let createdFloatingSession = false;
  let floatingSessionId: string | null = null;

  if (isLateCancellation) {
    await serviceSupabase
      .from('swimmers')
      .update({
        flexible_swimmer: true,
        flexible_swimmer_reason: 'late_cancellation',
        flexible_swimmer_set_at: now.toISOString(),
      })
      .eq('id', swimmer.id);

    if (sessionStart && sessionStart.getTime() > now.getTime() && session.id) {
      const { data: floating } = await serviceSupabase
        .from('floating_sessions')
        .insert({
          original_session_id: session.id,
          original_booking_id: bookingId,
          available_until: session.start_time,
          month_year: sessionStart.toISOString().slice(0, 7),
          status: 'available',
        })
        .select('id')
        .single();

      if (floating) {
        createdFloatingSession = true;
        floatingSessionId = floating.id;
      }
    }
  }

  // 5. Analytics row.
  //
  // NOTE on schema drift: the live `cancellations` table schema differs from
  // migration 009_create_cancellation_tracking_table.sql. The actual production
  // schema is the narrow set below (verified 2026-05-14). The old cancel route
  // wrote ~20 columns and got rejected silently because Postgres bails on the
  // whole INSERT when it sees an unknown column. We now only write columns
  // that exist; everything else is captured on the booking itself, in
  // floating_sessions, on the swimmer, and in the funding source PO.
  const { error: analyticsErr } = await serviceSupabase.from('cancellations').insert({
    booking_id: bookingId,
    session_id: session.id ?? null,
    swimmer_id: swimmer.id ?? null,
    cancelled_by: canceledByUserId,
    cancel_reason: reason ?? null,
    cancel_source: source,
    was_late_cancellation: isLateCancellation,
    created_floating_session: createdFloatingSession,
  });
  if (analyticsErr) {
    console.error('cancelBooking: cancellations insert failed', analyticsErr);
  }

  // 6. Assessment-specific cleanup.
  if (booking.booking_type === 'assessment') {
    await serviceSupabase
      .from('assessments')
      .update({ status: 'cancelled' })
      .eq('booking_id', bookingId);

    await serviceSupabase
      .from('swimmers')
      .update({ assessment_status: 'not_scheduled' })
      .eq('id', swimmer.id);
  }

  return {
    bookingId,
    hoursBeforeSession: Math.round(hoursBeforeSession * 10) / 10,
    isLateCancellation,
    isSemiPrivate,
    createdFloatingSession,
    floatingSessionId,
    decrementedPoId,
  };
}
