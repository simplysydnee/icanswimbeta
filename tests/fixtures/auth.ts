import { test as base } from '@playwright/test';

/**
 * Auth fixture for Playwright tests
 * Uses dev auth for authentication
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Enable dev auth for testing
    await page.goto('/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Check if we're already authenticated
    const isAuthenticated = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token') !== null;
    });

    if (!isAuthenticated) {
      // Use dev auth to authenticate
      await page.goto('/auth?dev=true');

      // Wait for dev auth to complete
      await page.waitForURL('/parent-home', { timeout: 10000 });
    }

    await use(page);
  },
});

export { expect } from '@playwright/test';