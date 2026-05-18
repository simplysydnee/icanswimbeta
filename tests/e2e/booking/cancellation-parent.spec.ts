import { test, expect } from '@playwright/test';
import { loginUser, ensureLoggedOut, TEST_USERS } from '../../utils/auth-helpers';
import {
  resetBookingState,
  directBookSingle,
  directCancelBooking,
  preCreateConfirmedBooking,
  getAuthIdForEmail,
  getBooking,
  getCancellationForBooking,
  getServiceSupabase,
  getSwimmer,
} from '../../utils/booking-helpers';
import { FIXTURE_IDS } from '../../utils/fixtures';

// L1: cancel >24h — booking cancelled, cancellation row inserted with was_late_cancellation=false.
// L2: cancel <24h — corrected from catalog: route at src/app/api/bookings/[id]/cancel/route.ts:97
//     does NOT 403. It succeeds and (a) inserts cancellations.was_late_cancellation=true,
//     (b) creates a floating_session row. It does NOT flip swimmer.flexible_swimmer because
//     route.ts:119 passes p_late_cancel_type='unexcused', and the RPC at
//     atomic_booking_functions.sql:210-211 only marks flexible when p_late_cancel_type IS NULL.

test.describe('Booking — parent cancellation (L1-L2)', () => {
  test.beforeEach(async ({ page }) => {
    await resetBookingState();
    await ensureLoggedOut(page);
  });

  test('L1: cancel >24h — booking cancelled, was_late_cancellation=false', async ({ page }) => {
    await loginUser(page, TEST_USERS.parentPrivate);

    // Book Liam onto the 25h-out session
    const bookRes = await directBookSingle(page.request, {
      swimmerId: FIXTURE_IDS.SWIMMER_LIAM,
      sessionId: FIXTURE_IDS.SESS_CANCEL_25H,
    });
    expect(bookRes.status()).toBe(200);
    const { bookingId } = await bookRes.json();
    expect(bookingId).toBeTruthy();

    const cancelRes = await directCancelBooking(page.request, bookingId);
    expect(cancelRes.status()).toBe(200);
    const cancelBody = await cancelRes.json();
    expect(cancelBody.isLateCancellation).toBe(false);

    const booking = await getBooking(bookingId);
    expect(booking?.status).toBe('cancelled');

    const cancellation = await getCancellationForBooking(bookingId);
    expect(cancellation).toBeTruthy();
    expect(cancellation?.was_late_cancellation).toBe(false);
    expect(cancellation?.created_floating_session).toBe(false);
  });

  test('L2: cancel <24h — succeeds, was_late_cancellation=true, floating_session created, swimmer NOT marked flexible', async ({ page }) => {
    // Pre-create a confirmed booking on the 12h-out session (can't book it normally — booking
    // would succeed but trip the 24h logic on cancel either way; pre-create keeps the test isolated).
    const parentAuthId = await getAuthIdForEmail(TEST_USERS.parentPrivate.email);
    expect(parentAuthId).toBeTruthy();
    const bookingId = await preCreateConfirmedBooking({
      swimmerId: FIXTURE_IDS.SWIMMER_LIAM,
      sessionId: FIXTURE_IDS.SESS_CANCEL_12H,
      parentAuthId: parentAuthId!,
    });

    // Snapshot flexible flag before
    const beforeSwimmer = await getSwimmer(FIXTURE_IDS.SWIMMER_LIAM);
    expect(beforeSwimmer?.flexible_swimmer).toBe(false);

    await loginUser(page, TEST_USERS.parentPrivate);
    const cancelRes = await directCancelBooking(page.request, bookingId);
    expect(cancelRes.status()).toBe(200);
    const cancelBody = await cancelRes.json();
    expect(cancelBody.isLateCancellation).toBe(true);
    expect(cancelBody.createdFloatingSession).toBe(true);

    const booking = await getBooking(bookingId);
    expect(booking?.status).toBe('cancelled');

    const cancellation = await getCancellationForBooking(bookingId);
    expect(cancellation?.was_late_cancellation).toBe(true);
    expect(cancellation?.created_floating_session).toBe(true);

    // floating_sessions row exists for the cancelled session
    const supa = getServiceSupabase();
    const { data: floating } = await supa
      .from('floating_sessions')
      .select('id, available_until, status')
      .eq('original_booking_id', bookingId)
      .single();
    expect(floating).toBeTruthy();
    expect(floating?.status).toBe('available');

    // Liam should NOT be marked flexible (cancel route passes late_cancel_type='unexcused',
    // RPC only marks flexible when late_cancel_type IS NULL).
    const afterSwimmer = await getSwimmer(FIXTURE_IDS.SWIMMER_LIAM);
    expect(afterSwimmer?.flexible_swimmer).toBe(false);
  });
});
