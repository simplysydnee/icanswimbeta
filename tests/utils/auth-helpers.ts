import { Page, expect } from '@playwright/test';

/**
 * Authentication utilities for Playwright tests
 */

export interface TestUser {
  email: string;
  password: string;
}

// Test user credentials - these should match your test environment
export const TEST_USERS = {
  // User with active subscription
  subscribed: {
    email: 'test-subscribed@example.com',
    password: 'TestPassword123!',
  },
  // User without subscription
  free: {
    email: 'test-free@example.com', 
    password: 'TestPassword123!',
  },
  // User with different subscription tiers
  pro: {
    email: 'test-pro@example.com',
    password: 'TestPassword123!',
  },
  enterprise: {
    email: 'test-enterprise@example.com',
    password: 'TestPassword123!',
  },
} as const;

/**
 * Login helper function
 */
export async function loginUser(page: Page, user: TestUser) {
  await page.goto('/login');

  // Wait for login form to be visible - use more flexible selectors
  await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();

  // Fill in credentials
  await page.locator('input[type="email"], input[name="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);

  // Submit form
  await page.locator('button[type="submit"]').click();

  // Wait for successful login - check for redirect
  // Accept various redirects: dashboard, subscriptions, parent, or home
  await page.waitForURL(/\/(dashboard|subscriptions|parent|$)/, { timeout: 10000 }).catch(() => {
    console.log('Warning: Expected URL pattern not matched after login');
  });

  // Wait a bit for page to settle
  await page.waitForTimeout(1000);

  // Verify successful login by checking we're not on login page anymore
  const currentUrl = page.url();
  const isLoginPage = currentUrl.includes('login');

  if (isLoginPage) {
    throw new Error(`Login failed - still on login page: ${currentUrl}`);
  }

  console.log(`✓ Login successful, redirected to: ${currentUrl}`);
}

/**
 * Logout helper function
 */
export async function logoutUser(page: Page) {
  // Try to find and click logout if available
  // For now, just navigate away and clear cookies
  await page.goto('/');
  await page.context().clearCookies();
  await page.reload();

  console.log('✓ Logged out (cleared cookies)');
}

/**
 * Check if user is authenticated
 */
export async function isUserAuthenticated(page: Page): Promise<boolean> {
  // Check if we're on a protected page without being redirected to login
  const currentUrl = page.url();
  const isProtectedPage = currentUrl.includes('/parent') ||
                         currentUrl.includes('/dashboard') ||
                         currentUrl.includes('/subscriptions');

  const isLoginPage = currentUrl.includes('login') || currentUrl.includes('auth');

  // If we're on a protected page and not on login page, assume authenticated
  if (isProtectedPage && !isLoginPage) {
    return true;
  }

  // Try to navigate to a protected page and see if redirected
  try {
    await page.goto('/parent');
    await page.waitForTimeout(1000);

    const newUrl = page.url();
    const redirectedToLogin = newUrl.includes('login') || newUrl.includes('auth');

    // Go back to original page
    await page.goto(currentUrl);

    return !redirectedToLogin;
  } catch {
    return false;
  }
}

/**
 * Create a test user context for authenticated tests
 */
export async function setupAuthenticatedUser(page: Page, userType: keyof typeof TEST_USERS = 'free') {
  const user = TEST_USERS[userType];
  await loginUser(page, user);
  return user;
}

/**
 * Ensure user is logged out
 */
export async function ensureLoggedOut(page: Page) {
  // Clear cookies to ensure logged out state
  await page.context().clearCookies();
  await page.goto('/');
  await page.waitForTimeout(500);

  console.log('✓ Ensured logged out state');
}