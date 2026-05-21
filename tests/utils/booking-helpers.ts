import { Page, APIRequestContext, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FIXTURE_IDS } from './fixtures';

let cachedServiceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
  if (cachedServiceClient) return cachedServiceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      'E2E tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in the environment. ' +
      'Run via `node --env-file=.env.local` or export them before `npm run test:e2e`.'
    );
  }
  cachedServiceClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedServiceClient;
}

/** Wipe bookings/cancellations/floating-sessions for all seeded swimmers, reset PO counters. */
export async function resetBookingState(): Promise<void> {
  const supa = getServiceSupabase();
  const swimmerIds = [
    FIXTURE_IDS.SWIMMER_ALEX, FIXTURE_IDS.SWIMMER_LIAM, FIXTURE_IDS.SWIMMER_MIA,
    FIXTURE_IDS.SWIMMER_PENDING, FIXTURE_IDS.SWIMMER_NOAH, FIXTURE_IDS.SWIMMER_AVA,
    FIXTURE_IDS.SWIMMER_BEN, FIXTURE_IDS.SWIMMER_SARA,
  ];

  await supa.from('cancellations').delete().in('swimmer_id', swimmerIds);
  await supa.from('bookings').delete().in('swimmer_id', swimmerIds);

  // Reset floating_sessions: delete late-cancel-derived rows, restore the seeded source
  await supa
    .from('floating_sessions')
    .delete()
    .neq('id', FIXTURE_IDS.FLOATING_SESSION)
    .in('original_session_id', Object.values(FIXTURE_IDS));

  await supa
    .from('floating_sessions')
    .update({ status: 'available' })
    .eq('id', FIXTURE_IDS.FLOATING_SESSION);

  // Reset PO counters
  await supa
    .from('purchase_orders')
    .update({ sessions_booked: 0, lessons_booked: 0 })
    .eq('id', FIXTURE_IDS.PO_AVA);

  await supa
    .from('purchase_orders')
    .update({ sessions_booked: 12, lessons_booked: 12 })
    .eq('id', FIXTURE_IDS.PO_SARA);

  // Reset session state (booking_count, is_full)
  await supa
    .from('sessions')
    .update({ booking_count: 0, is_full: false, status: 'open' })
    .in('id', [
      FIXTURE_IDS.SESS_LIAM_LESSON,
      FIXTURE_IDS.SESS_AVA_LESSON_1, FIXTURE_IDS.SESS_AVA_LESSON_2,
      FIXTURE_IDS.SESS_AVA_LESSON_3, FIXTURE_IDS.SESS_AVA_LESSON_4,
      FIXTURE_IDS.SESS_FLOATING_SRC, FIXTURE_IDS.SESS_OTHER_INSTR,
      FIXTURE_IDS.SESS_CANCEL_25H, FIXTURE_IDS.SESS_CANCEL_12H,
      FIXTURE_IDS.SESS_NOAH_NO_PO, FIXTURE_IDS.SESS_SARA_MAXED,
      FIXTURE_IDS.SESS_BEN_EXPIRED,
    ]);

  await supa
    .from('sessions')
    .update({ booking_count: 0, is_full: false, status: 'available' })
    .eq('id', FIXTURE_IDS.SESS_ASSESSMENT);

  // Reset flexible_swimmer flag back to seeded baseline (only Mia is flexible)
  await supa
    .from('swimmers')
    .update({ flexible_swimmer: false, flexible_swimmer_reason: null, flexible_swimmer_set_at: null })
    .in('id', [
      FIXTURE_IDS.SWIMMER_ALEX, FIXTURE_IDS.SWIMMER_LIAM, FIXTURE_IDS.SWIMMER_PENDING,
      FIXTURE_IDS.SWIMMER_NOAH, FIXTURE_IDS.SWIMMER_AVA, FIXTURE_IDS.SWIMMER_BEN,
      FIXTURE_IDS.SWIMMER_SARA,
    ]);

  await supa
    .from('swimmers')
    .update({ flexible_swimmer: true })
    .eq('id', FIXTURE_IDS.SWIMMER_MIA);
}

/** POST /api/bookings/single via the page's session cookies. */
export async function directBookSingle(
  request: APIRequestContext,
  payload: { swimmerId: string; sessionId: string }
) {
  return request.post('/api/bookings/single', {
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** POST /api/bookings/[id]/cancel via the page's session cookies. */
export async function directCancelBooking(
  request: APIRequestContext,
  bookingId: string,
  reason?: string
) {
  return request.post(`/api/bookings/${bookingId}/cancel`, {
    data: { reason: reason ?? 'e2e-test' },
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Assert the wizard's "Step N of M" indicator. */
export async function expectWizardStep(page: Page, n: number, total: number): Promise<void> {
  await expect(page.getByText(`Step ${n} of ${total}`)).toBeVisible({ timeout: 10_000 });
}

/** Read a booking row by id via the service client. */
export async function getBooking(bookingId: string) {
  const supa = getServiceSupabase();
  const { data } = await supa.from('bookings').select('*').eq('id', bookingId).single();
  return data;
}

/** Read a cancellation row for a booking via the service client. */
export async function getCancellationForBooking(bookingId: string) {
  const supa = getServiceSupabase();
  const { data } = await supa
    .from('cancellations')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();
  return data;
}

/** Read a PO row by id. */
export async function getPurchaseOrder(poId: string) {
  const supa = getServiceSupabase();
  const { data } = await supa
    .from('purchase_orders')
    .select('id, status, sessions_authorized, sessions_booked, sessions_used, end_date')
    .eq('id', poId)
    .single();
  return data;
}

/** Read a swimmer row. */
export async function getSwimmer(swimmerId: string) {
  const supa = getServiceSupabase();
  const { data } = await supa
    .from('swimmers')
    .select('id, flexible_swimmer, flexible_swimmer_reason, enrollment_status')
    .eq('id', swimmerId)
    .single();
  return data;
}

/** Mark a session as fully booked (used to set up I1 conflict scenario without needing a real prior booking). */
export async function markSessionAsBooked(sessionId: string): Promise<void> {
  const supa = getServiceSupabase();
  await supa
    .from('sessions')
    .update({ booking_count: 1, is_full: true, status: 'booked' })
    .eq('id', sessionId);
}

/** Insert a pre-existing confirmed booking for a swimmer on a session (for I1 conflict setup). */
export async function preCreateConfirmedBooking(opts: {
  swimmerId: string;
  sessionId: string;
  parentAuthId: string;
  purchaseOrderId?: string | null;
}): Promise<string> {
  const supa = getServiceSupabase();
  const { data: session } = await supa
    .from('sessions')
    .select('start_time')
    .eq('id', opts.sessionId)
    .single();
  const sessionDate = session?.start_time
    ? new Date(session.start_time).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const { data, error } = await supa
    .from('bookings')
    .insert({
      swimmer_id: opts.swimmerId,
      session_id: opts.sessionId,
      parent_id: opts.parentAuthId,
      booking_type: 'lesson',
      status: 'confirmed',
      session_date: sessionDate,
      purchase_order_id: opts.purchaseOrderId ?? null,
    })
    .select('id')
    .single();
  if (error) throw new Error(`preCreateConfirmedBooking: ${error.message}`);
  return data!.id;
}

/** Resolve the auth user id for a seeded email (returns null if user not yet seeded). */
export async function getAuthIdForEmail(email: string): Promise<string | null> {
  const supa = getServiceSupabase();
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supa.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return null;
    const found = data?.users?.find((u) => u.email === email);
    if (found) return found.id;
    if (!data?.users || data.users.length < 100) return null;
    page++;
  }
  return null;
}
