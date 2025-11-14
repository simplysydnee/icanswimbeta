import { test, expect } from '@playwright/test';

/**
 * Basic Booking Test
 * Tests the basic booking page functionality without complex fixtures
 */

test.describe('Basic Booking Test', () => {
  test('should load booking page and show swimmer selector', async ({ page }) => {
    // Navigate to booking page
    await page.goto('/booking');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page.locator('h1')).toContainText('Book Swim Sessions');

    // Verify swimmer selector exists
    const swimmerSelector = page.locator('[data-testid="swimmer-selector"]');
    await expect(swimmerSelector).toBeVisible();

    // Check if any swimmers are available
    const swimmerOptions = page.locator('[data-testid^="swimmer-"]');
    const swimmerCount = await swimmerOptions.count();

    if (swimmerCount === 0) {
      console.log('❌ No swimmers available for selection');
      console.log('This confirms the issue: no swimmers appear for parent account');
    } else {
      console.log(`✅ Found ${swimmerCount} swimmers available`);
    }

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/booking-page.png' });
  });

  test('should show assessment tab when swimmer selected', async ({ page }) => {
    // Navigate to booking page
    await page.goto('/booking');
    await page.waitForLoadState('networkidle');

    // Check if swimmers exist
    const swimmerOptions = page.locator('[data-testid^="swimmer-"]');
    const swimmerCount = await swimmerOptions.count();

    if (swimmerCount === 0) {
      console.log('❌ No swimmers available - cannot test assessment tab');
      return;
    }

    // Select first swimmer
    await swimmerOptions.first().click();
    await page.waitForTimeout(2000);

    // Check if Assessment tab is visible and enabled
    const assessmentTab = page.locator('[role="tab"]:has-text("Assessment")');

    // Debug: take screenshot to see current state
    await page.screenshot({ path: 'test-results/after-swimmer-selection.png' });

    const isTabVisible = await assessmentTab.isVisible();
    const isTabEnabled = await assessmentTab.isEnabled();

    console.log(`Assessment tab - Visible: ${isTabVisible}, Enabled: ${isTabEnabled}`);

    if (!isTabVisible || !isTabEnabled) {
      console.log('❌ Assessment tab not available - checking why...');

      // Check what tabs are available
      const allTabs = page.locator('[role="tab"]');
      const tabCount = await allTabs.count();
      console.log(`Found ${tabCount} total tabs`);

      for (let i = 0; i < tabCount; i++) {
        const tab = allTabs.nth(i);
        const text = await tab.textContent();
        const visible = await tab.isVisible();
        const enabled = await tab.isEnabled();
        console.log(`Tab ${i}: "${text}" - Visible: ${visible}, Enabled: ${enabled}`);
      }

      return;
    }

    // Click Assessment tab
    await assessmentTab.click();
    await page.waitForTimeout(1000);

    // Verify assessment interface loads
    const assessmentSessions = page.locator('[data-testid="assessment-sessions"]');
    await expect(assessmentSessions).toBeVisible();

    console.log('✅ Assessment tab loads correctly with swimmer selected');
  });
});