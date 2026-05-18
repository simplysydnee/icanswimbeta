import { test, expect } from '@playwright/test';
import { loginUser, ensureLoggedOut, TEST_USERS } from '../../utils/auth-helpers';
import { resetBookingState, expectWizardStep } from '../../utils/booking-helpers';
import { FIXTURE_IDS } from '../../utils/fixtures';

test.describe('Booking wizard — enrollment routing (A1-A3)', () => {
  test.beforeEach(async ({ page }) => {
    await resetBookingState();
    await ensureLoggedOut(page);
  });

  test('A1: enrolled swimmer enters 5-step flow', async ({ page }) => {
    await loginUser(page, TEST_USERS.parentPrivate);
    await page.goto('/parent/book');

    // Without preselected swimmer, parent lands on Step 1 of 5 (select-swimmer)
    await expectWizardStep(page, 1, 5);
    await expect(page.getByText(/Select Swimmer/i)).toBeVisible();
  });

  test('A2: waitlist swimmer routes to assessment booking', async ({ page }) => {
    await loginUser(page, TEST_USERS.parentPrivate);
    await page.goto(`/parent/book?swimmerId=${FIXTURE_IDS.SWIMMER_ALEX}`);

    // Wizard auto-routes a waitlist swimmer to the assessment step.
    // BookingWizard.tsx:58-59 sets currentStep='assessment'; AssessmentTab is rendered.
    await expect(page.getByRole('tab').or(page.getByText(/Book.*Assessment/i)).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('A3: pending_enrollment swimmer sees info-only pending-approval screen', async ({ page }) => {
    await loginUser(page, TEST_USERS.parentPrivate);
    await page.goto(`/parent/book?swimmerId=${FIXTURE_IDS.SWIMMER_PENDING}`);

    // Wizard auto-routes pending_enrollment to 'confirm' step which renders the
    // amber "Pending Approval" UI (BookingWizard.tsx:403-440).
    await expect(page.getByText(/Pending Approval/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/awaiting admin approval/i)).toBeVisible();
    // No "Continue" / step controls (info-only)
    await expect(page.getByRole('button', { name: /Continue/i })).toBeHidden();
  });
});
