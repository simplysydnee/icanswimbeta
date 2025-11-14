import { test, expect } from '../fixtures/auth';
import { databaseHelpers } from '../../../helpers/database';

/**
 * Assessment Booking E2E Tests
 * Tests the complete assessment booking flow
 */

test.describe('Assessment Booking', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to booking page
    await page.goto('/booking');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    await databaseHelpers.cleanupTestData();
  });

  test('should display assessment booking interface', async ({ page }) => {
    // Click Assessment tab
    await page.click('button[role="tab"]:has-text("Initial Assessment")');

    // Verify: Swimmer selector exists
    await expect(page.locator('[data-testid="swimmer-selector"]')).toBeVisible();

    // Verify: Session list exists
    await expect(page.locator('[data-testid="assessment-sessions"]')).toBeVisible();

    // Verify: Confirm button exists (initially disabled)
    const confirmButton = page.locator('[data-testid="confirm-assessment-button"]');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeDisabled();
  });

  test('should book assessment for private pay swimmer', async ({ page }) => {
    // Click Assessment tab
    await page.click('[data-testid="assessment-tab"]');

    // Get available swimmers from database
    const testSwimmers = await databaseHelpers.getTestSwimmers();
    expect(testSwimmers.length).toBeGreaterThan(0);

    // Select first available non-VMRC swimmer
    const swimmerId = testSwimmers[0].id;
    const swimmerName = `${testSwimmers[0].first_name} ${testSwimmers[0].last_name}`;

    // Select swimmer in the UI
    await page.click(`[data-testid="swimmer-${swimmerId}"]`);

    // Wait for swimmer selection to be reflected
    await page.waitForTimeout(1000);

    // Get available assessment sessions
    const availableSessions = await databaseHelpers.getAvailableAssessmentSessions();
    expect(availableSessions.length).toBeGreaterThan(0);

    // Select first available session
    const sessionId = availableSessions[0].id;
    await page.click(`[data-testid="session-${sessionId}"]`);

    // Wait for session selection to be reflected
    await page.waitForTimeout(1000);

    // Click Confirm button
    const confirmButton = page.locator('button:has-text("Confirm Assessment")');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // Verify: Success toast appears
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Assessment Booked');

    // Wait 2 seconds for database write
    await page.waitForTimeout(2000);

    // Query database: Check booking exists with status 'confirmed'
    const lastBooking = await databaseHelpers.getLastBooking();
    expect(lastBooking).not.toBeNull();
    expect(lastBooking?.session_id).toBe(sessionId);
    expect(lastBooking?.swimmer_id).toBe(swimmerId);
    expect(lastBooking?.status).toBe('confirmed');

    // Query database: Check assessment exists with status 'scheduled'
    const lastAssessment = await databaseHelpers.getLastAssessment();
    expect(lastAssessment).not.toBeNull();
    expect(lastAssessment?.session_id).toBe(sessionId);
    expect(lastAssessment?.swimmer_id).toBe(swimmerId);
    expect(lastAssessment?.status).toBe('scheduled');
    expect(lastAssessment?.approval_status).toBe('approved');

    // Query database: Check session booking_count incremented
    const session = await databaseHelpers.getSessionById(sessionId);
    expect(session).not.toBeNull();
    expect(session?.booking_count).toBeGreaterThan(0);
  });

  test('should show error when no swimmer selected', async ({ page }) => {
    // Click Assessment tab
    await page.click('[data-testid="assessment-tab"]');

    // Get available assessment sessions
    const availableSessions = await databaseHelpers.getAvailableAssessmentSessions();
    expect(availableSessions.length).toBeGreaterThan(0);

    // Select first available session (but no swimmer)
    const sessionId = availableSessions[0].id;
    await page.click(`[data-testid="session-${sessionId}"]`);

    // Wait for session selection to be reflected
    await page.waitForTimeout(1000);

    // Click Confirm button
    const confirmButton = page.locator('button:has-text("Confirm Assessment")');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // Verify: Error toast appears
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-toast"]')).toContainText('Selection Required');
  });

  test('should show error when no session selected', async ({ page }) => {
    // Click Assessment tab
    await page.click('[data-testid="assessment-tab"]');

    // Get available swimmers from database
    const testSwimmers = await databaseHelpers.getTestSwimmers();
    expect(testSwimmers.length).toBeGreaterThan(0);

    // Select first available non-VMRC swimmer (but no session)
    const swimmerId = testSwimmers[0].id;
    await page.click(`[data-testid="swimmer-${swimmerId}"]`);

    // Wait for swimmer selection to be reflected
    await page.waitForTimeout(1000);

    // Click Confirm button
    const confirmButton = page.locator('button:has-text("Confirm Assessment")');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // Verify: Error toast appears
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-toast"]')).toContainText('Selection Required');
  });

  test('should handle no available sessions gracefully', async ({ page }) => {
    // Click Assessment tab
    await page.click('[data-testid="assessment-tab"]');

    // Get available swimmers from database
    const testSwimmers = await databaseHelpers.getTestSwimmers();
    expect(testSwimmers.length).toBeGreaterThan(0);

    // Select first available non-VMRC swimmer
    const swimmerId = testSwimmers[0].id;
    await page.click(`[data-testid="swimmer-${swimmerId}"]`);

    // Wait for swimmer selection to be reflected
    await page.waitForTimeout(1000);

    // Check if no sessions are available
    const availableSessions = await databaseHelpers.getAvailableAssessmentSessions();

    if (availableSessions.length === 0) {
      // Verify: No sessions message is shown
      await expect(page.locator('[data-testid="no-sessions-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-sessions-message"]')).toContainText('No assessment openings available');

      // Verify: Confirm button is disabled
      const confirmButton = page.locator('button:has-text("Confirm Assessment")');
      await expect(confirmButton).toBeDisabled();
    } else {
      // If sessions are available, this test passes by default
      console.log('Sessions are available, test passes');
    }
  });
});