/**
 * Server-side booking conflict check.
 *
 * Used by single, recurring, and assessment booking routes to prevent a parent
 * from booking the same swimmer into overlapping sessions, and to enforce the
 * max-4-bookings-per-day rule. Previously this lived only in /api/bookings/check-conflict
 * and was commented out in the single route — now it's a shared helper called
 * server-side from each booking route (BUG-00a).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type ConflictCheckInput = {
  swimmerId: string;
  /** Either sessionId, or explicit startTime (+ optional endTime) must be provided. */
  sessionId?: string;
  startTime?: string;
  endTime?: string;
};

export type ConflictCheckResult =
  | { hasConflict: false }
  | {
      hasConflict: true;
      message: string;
      conflicts: Array<{
        bookingId: string;
        sessionTime?: string | null;
        location?: string | null;
      }>;
    };

const DEFAULT_SESSION_MS = 30 * 60 * 1000;
const DAILY_BOOKING_LIMIT = 4;

export async function checkBookingConflict(
  serviceSupabase: SupabaseClient,
  input: ConflictCheckInput
): Promise<ConflictCheckResult> {
  const { swimmerId } = input;
  let { sessionId, startTime, endTime } = input;

  if (!swimmerId || (!sessionId && !startTime)) {
    throw new Error('checkBookingConflict: swimmerId and either sessionId or startTime required');
  }

  if (sessionId && !startTime) {
    const { data: session } = await serviceSupabase
      .from('sessions')
      .select('start_time, end_time')
      .eq('id', sessionId)
      .single();
    if (session) {
      startTime = session.start_time;
      endTime = session.end_time;
    }
  }

  if (!startTime) {
    throw new Error('checkBookingConflict: could not resolve session start time');
  }

  const { data: existing, error } = await serviceSupabase
    .from('bookings')
    .select('id, status, session:sessions(id, start_time, end_time, location)')
    .eq('swimmer_id', swimmerId)
    .in('status', ['confirmed', 'pending'])
    .not('session', 'is', null);

  if (error) {
    throw new Error(`checkBookingConflict: ${error.message}`);
  }

  const sessionStartMs = new Date(startTime).getTime();
  const sessionEndMs = endTime
    ? new Date(endTime).getTime()
    : sessionStartMs + DEFAULT_SESSION_MS;

  const overlapping = (existing ?? []).filter((b: any) => {
    if (!b.session?.start_time) return false;
    const existingStart = new Date(b.session.start_time).getTime();
    const existingEnd = b.session.end_time
      ? new Date(b.session.end_time).getTime()
      : existingStart + DEFAULT_SESSION_MS;
    return sessionStartMs < existingEnd && sessionEndMs > existingStart;
  });

  if (overlapping.length > 0) {
    return {
      hasConflict: true,
      message: 'This swimmer already has a booking at this time.',
      conflicts: overlapping.map((b: any) => ({
        bookingId: b.id,
        sessionTime: b.session?.start_time,
        location: b.session?.location,
      })),
    };
  }

  // Daily booking limit
  const sessionDay = new Date(startTime).toISOString().slice(0, 10);
  const dayStart = `${sessionDay}T00:00:00.000Z`;
  const dayEnd = `${sessionDay}T23:59:59.999Z`;

  const { count } = await serviceSupabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('swimmer_id', swimmerId)
    .in('status', ['confirmed', 'pending'])
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd);

  if ((count ?? 0) >= DAILY_BOOKING_LIMIT) {
    return {
      hasConflict: true,
      message: `Daily booking limit reached (maximum ${DAILY_BOOKING_LIMIT} sessions per day).`,
      conflicts: [],
    };
  }

  return { hasConflict: false };
}

/**
 * Postgres unique_violation code, raised by the
 * `bookings_unique_active_session_swimmer` partial index when two concurrent
 * inserts race past the conflict check (BUG-00b defense in depth).
 */
export const UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  return code === UNIQUE_VIOLATION;
}
