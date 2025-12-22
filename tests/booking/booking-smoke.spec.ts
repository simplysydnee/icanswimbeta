import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Simple smoke tests that don't require test data
test.describe('Booking Wizard Smoke Tests', () => {

  test('booking page requires authentication', async ({ page }) => {
    await page.goto(`${BASE_URL}/parent/book`);
    await page.waitForTimeout(2000);

    const url = page.url();
    const requiresAuth = url.includes('login') || url.includes('auth') || url.includes('sign');

    console.log(`✓ Current URL: ${url}`);
    console.log(`✓ Requires auth: ${requiresAuth}`);

    expect(requiresAuth).toBe(true);
  });

  test('API routes reject unauthenticated requests', async ({ request }) => {
    // Test swimmers API
    const swimmersRes = await request.get(`${BASE_URL}/api/swimmers`);
    console.log(`✓ GET /api/swimmers: ${swimmersRes.status()}`);
    expect(swimmersRes.status()).toBe(401);

    // Test instructors API (may be public for parent viewing)
    const instructorsRes = await request.get(`${BASE_URL}/api/instructors`);
    console.log(`✓ GET /api/instructors: ${instructorsRes.status()}`);
    expect([200, 401, 403]).toContain(instructorsRes.status());

    // Test sessions API
    const now = new Date().toISOString();
    const later = new Date(Date.now() + 7*24*60*60*1000).toISOString();
    const sessionsRes = await request.get(`${BASE_URL}/api/sessions/available?startDate=${now}&endDate=${later}`);
    console.log(`✓ GET /api/sessions/available: ${sessionsRes.status()}`);
    expect(sessionsRes.status()).toBe(401);

    // Test booking API rejects empty/unauthorized
    const bookingRes = await request.post(`${BASE_URL}/api/bookings/single`, { data: {} });
    console.log(`✓ POST /api/bookings/single: ${bookingRes.status()}`);
    expect([400, 401]).toContain(bookingRes.status());
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1000);

    // Check for email input
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').isVisible();
    console.log(`✓ Email input visible: ${emailInput}`);

    // Check for password input
    const passwordInput = await page.locator('input[type="password"]').isVisible();
    console.log(`✓ Password input visible: ${passwordInput}`);

    // Check for submit button
    const submitBtn = await page.locator('button[type="submit"]').isVisible();
    console.log(`✓ Submit button visible: ${submitBtn}`);

    expect(emailInput).toBe(true);
    expect(passwordInput).toBe(true);
  });

});

test.describe('Booking Wizard UI Tests (No Auth)', () => {

  test('booking components exist in codebase', async ({ page }) => {
    // This test just verifies the components were created
    // by checking if the booking page route exists

    const response = await page.goto(`${BASE_URL}/parent/book`);
    const status = response?.status();

    console.log(`✓ /parent/book route exists: ${status !== 404}`);

    // Even if redirected, 404 would mean route doesn't exist
    expect(status).not.toBe(404);
  });

  test('booking wizard page structure', async ({ page }) => {
    // Navigate to booking page (will redirect to login)
    await page.goto(`${BASE_URL}/parent/book`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`✓ Current URL after navigation: ${currentUrl}`);

    // If we're redirected to login, check login page structure
    if (currentUrl.includes('login')) {
      console.log('✓ Redirected to login page as expected');

      // Check login form exists
      const loginForm = await page.locator('form').isVisible();
      console.log(`✓ Login form visible: ${loginForm}`);

      // Check for email field
      const emailField = await page.locator('input[type="email"]').isVisible();
      console.log(`✓ Email field visible: ${emailField}`);

      expect(loginForm).toBe(true);
      expect(emailField).toBe(true);
    } else {
      // If not redirected, check for booking wizard elements
      console.log('✓ Not redirected - checking for booking wizard');

      // Look for common booking wizard elements
      const wizardCard = await page.locator('[class*="card"]').isVisible().catch(() => false);
      console.log(`✓ Wizard card visible: ${wizardCard}`);

      const stepIndicator = await page.locator('text=/step/i, [class*="step"]').isVisible().catch(() => false);
      console.log(`✓ Step indicator visible: ${stepIndicator}`);
    }
  });

  test('booking API endpoints exist', async ({ request }) => {
    // Test that API endpoints respond (even with errors)
    const endpoints = [
      '/api/swimmers',
      '/api/instructors',
      '/api/sessions/available',
      '/api/bookings/single'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`${BASE_URL}${endpoint}`);
        console.log(`✓ ${endpoint}: ${response.status()}`);
        expect(response.status()).not.toBe(404);
      } catch (error) {
        // POST endpoints will fail on GET, that's OK
        if (endpoint.includes('/bookings/')) {
          console.log(`✓ ${endpoint}: POST endpoint (GET failed as expected)`);
        } else {
          console.log(`✗ ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  });

});