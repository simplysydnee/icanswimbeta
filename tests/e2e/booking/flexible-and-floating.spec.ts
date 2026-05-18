import { test, expect } from '@playwright/test';
import { loginUser, ensureLoggedOut, TEST_USERS } from '../../utils/auth-helpers';
import {
  resetBookingState,
  directBookSingle,
  getServiceSupabase,
} from '../../utils/booking-helpers';
import { FIXTURE_IDS } from '../../utils/fixtures';

// Asserts src/app/api/bookings/single/route.ts:94-108 floating-session gate:
//   if a floating_session row exists (status='available') for the original_session_id and the
//   swimmer is NOT flexible → 403 "only available to flexible swimmers".
//   Flexible swimmer claim is allowed.

test.describe('Booking — flexible & floating sessions (K1-K3)', () => {
  test.beforeEach(async ({ page }) => {
    await resetBookingState();
    await ensureLoggedOut(page);
    await loginUser(page, TEST_USERS.parentPrivate);
  });

  test('K1: flexible swimmer (Mia) claims floating before available_until — allowed', async ({ page }) => {
    const res = await directBookSingle(page.request, {
      swimmerId: FIXTURE_IDS.SWIMMER_MIA,
      sessionId: FIXTURE_IDS.SESS_FLOATING_SRC,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('K2: floating window expired — flexible swimmer still allowed by current API (route does not check available_until)', async ({ page }) => {
    // route.ts:94-108 checks floating_sessions.status='available' but does NOT compare available_until
    // against NOW(). So an expired floating row whose status is still 'available' still gates non-flex
    // and allows flex. To simulate "expired", we mark the floating row 'expired' — that removes the
    // gate entirely (any swimmer can claim the underlying session).
    const supa = getServiceSupabase();
    await supa
      .from('floating_sessions')
      .update({ status: 'expired', available_until: new Date(Date.now() - 3600 * 1000).toISOString() })
      .eq('id', FIXTURE_IDS.FLOATING_SESSION);

    const res = await directBookSingle(page.request, {
      swimmerId: FIXTURE_IDS.SWIMMER_MIA,
      sessionId: FIXTURE_IDS.SESS_FLOATING_SRC,
    });
    expect(res.status()).toBe(200);
  });

  test('K3: non-flexible swimmer (Liam) attempts floating — 403 "only available to flexible swimmers"', async ({ page }) => {
    const res = await directBookSingle(page.request, {
      swimmerId: FIXTURE_IDS.SWIMMER_LIAM,
      sessionId: FIXTURE_IDS.SESS_FLOATING_SRC,
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/only available to flexible swimmers/i);
  });
});
