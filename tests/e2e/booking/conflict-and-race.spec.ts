import { test, expect } from '@playwright/test';
import { loginUser, ensureLoggedOut, TEST_USERS } from '../../utils/auth-helpers';
import {
  resetBookingState,
  directBookSingle,
  preCreateConfirmedBooking,
  getAuthIdForEmail,
} from '../../utils/booking-helpers';
import { FIXTURE_IDS } from '../../utils/fixtures';

test.describe('Booking — conflict detection (I1)', () => {
  test.beforeEach(async ({ page }) => {
    await resetBookingState();
    await ensureLoggedOut(page);
  });

  test('I1: same swimmer + already-confirmed session — 409 duplicate_booking', async ({ page }) => {
    // Pre-create a confirmed booking for Liam on SESS_LIAM_LESSON via service client
    // (replicates the duplicate_booking branch of book_session RPC at lines 57-65).
    const parentAuthId = await getAuthIdForEmail(TEST_USERS.parentPrivate.email);
    expect(parentAuthId).toBeTruthy();
    await preCreateConfirmedBooking({
      swimmerId: FIXTURE_IDS.SWIMMER_LIAM,
      sessionId: FIXTURE_IDS.SESS_LIAM_LESSON,
      parentAuthId: parentAuthId!,
    });

    await loginUser(page, TEST_USERS.parentPrivate);

    const res = await directBookSingle(page.request, {
      swimmerId: FIXTURE_IDS.SWIMMER_LIAM,
      sessionId: FIXTURE_IDS.SESS_LIAM_LESSON,
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already booked/i);
  });
});
