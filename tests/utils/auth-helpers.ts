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
  
  // Wait for login form to be visible
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  
  // Fill in credentials
  await page.getByRole('textbox', { name: /email/i }).fill(user.email);
  await page.getByRole('textbox', { name: /password/i }).fill(user.password);
  
  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for successful login - check for redirect or user menu
  await expect(page).toHaveURL(/\/(dashboard|subscriptions)/);
  
  // Verify user menu is visible (indicates successful auth)
  await expect(page.getByTestId('user-menu')).toBeVisible();
}

/**
 * Logout helper function
 */
export async function logoutUser(page: Page) {
  // Click user menu
  await page.getByTestId('user-menu').click();
  
  // Click logout button
  await page.getByRole('button', { name: /logout/i }).click();
  
  // Wait for redirect to login or home page
  await expect(page).toHaveURL(/\/(login|$)/);
  
  // Verify user menu is no longer visible
  await expect(page.getByTestId('user-menu')).not.toBeVisible();
}

/**
 * Check if user is authenticated
 */
export async function isUserAuthenticated(page: Page): Promise<boolean> {
  try {
    await expect(page.getByTestId('user-menu')).toBeVisible({ timeout: 1000 });
    return true;
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
  const isAuthenticated = await isUserAuthenticated(page);
  if (isAuthenticated) {
    await logoutUser(page);
  }
}