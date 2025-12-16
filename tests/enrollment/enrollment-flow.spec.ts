import { test, expect } from '@playwright/test';
import {
  ensureLoggedOut,
  loginUser,
  TEST_USERS
} from '../utils/auth-helpers';
import {
  generateTestEmail,
  DEFAULT_TEST_SWIMMER,
  completeEnrollmentFlow
} from '../utils/enrollment-helpers';

test.describe('Enrollment and Signup Flow', () => {
  test.describe('New User Signup Flow', () => {
    test.beforeEach(async ({ page }) => {
      await ensureLoggedOut(page);
    });

    test('should allow new user to sign up and access parent dashboard', async ({ page }) => {
      const testEmail = generateTestEmail();
      const testPassword = 'TestPassword123!';

      // Navigate to signup page
      await page.goto('/signup');
      await expect(page).toHaveURL('/signup');

      // Fill signup form
      await page.locator('input[name="fullName"]').fill('Test Parent');
      await page.locator('input[name="email"]').fill(testEmail);
      await page.locator('input[name="password"]').fill(testPassword);
      await page.locator('input[name="confirmPassword"]').fill(testPassword);
      await page.locator('input[name="termsAccepted"]').check();

      // Submit form
      await page.locator('button[type="submit"]').click();

      // Wait for successful signup and redirect
      await page.waitForURL(/\/(dashboard|parent)/, { timeout: 10000 });

      // Verify we're on a protected page (not login/signup)
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('login');
      expect(currentUrl).not.toContain('signup');

      console.log(`✓ New user signed up: ${testEmail}`);
    });

    test('should show validation errors for invalid signup data', async ({ page }) => {
      await page.goto('/signup');

      // Try to submit empty form
      await page.locator('button[type="submit"]').click();

      // Should show validation error
      await expect(page.locator('[role="alert"]')).toBeVisible();

      // Fill with mismatched passwords
      await page.locator('input[name="fullName"]').fill('Test Parent');
      await page.locator('input[name="email"]').fill('invalid-email');
      await page.locator('input[name="password"]').fill('short');
      await page.locator('input[name="confirmPassword"]').fill('different');

      await page.locator('button[type="submit"]').click();

      // Should show validation errors
      await expect(page.locator('[role="alert"]')).toBeVisible();
    });
  });

  test.describe('Existing User Enrollment Flow', () => {
    test.beforeEach(async ({ page }) => {
      await ensureLoggedOut(page);
      // Use existing test user
      await loginUser(page, TEST_USERS.free);
    });

    test('should allow authenticated parent to enroll a new swimmer', async ({ page }) => {
      // Update email in test data to match logged in user
      const testSwimmerData = {
        ...DEFAULT_TEST_SWIMMER,
        parent_email: TEST_USERS.free.email
      };

      // Use helper to complete enrollment flow
      await completeEnrollmentFlow(page, testSwimmerData, 'private');

      console.log(`✓ Swimmer enrolled: ${testSwimmerData.child_first_name} ${testSwimmerData.child_last_name}`);
    });

    test('should show validation errors for incomplete enrollment form', async ({ page }) => {
      await page.goto('/enroll/private');

      // Try to submit without filling required fields
      await page.locator('button:has-text("Submit Enrollment")').click();

      // Should show validation errors
      await expect(page.locator('text*="required"')).toBeVisible();
    });

    test('should redirect to login if not authenticated', async ({ page }) => {
      await ensureLoggedOut(page);

      // Try to access enrollment page without authentication
      await page.goto('/enroll/private');

      // Should redirect to login with redirect parameter
      await expect(page).toHaveURL(/\/login/);
      expect(page.url()).toContain('redirect=/enroll/private');
    });
  });

  test.describe('Parent Dashboard Integration', () => {
    test.beforeEach(async ({ page }) => {
      await ensureLoggedOut(page);
      await loginUser(page, TEST_USERS.free);
    });

    test('should show enrolled swimmers in parent dashboard', async ({ page }) => {
      // Navigate to parent dashboard
      await page.goto('/parent');

      // Check for swimmer management section
      await expect(page.locator('text*="My Swimmers"')).toBeVisible();
      await expect(page.locator('text*="Add Swimmer"')).toBeVisible();

      // Navigate to swimmers page
      await page.locator('a[href*="/parent/swimmers"]').click();
      await expect(page).toHaveURL(/\/parent\/swimmers/);

      // Check for swimmers list
      await expect(page.locator('text*="Swimmers"')).toBeVisible();
    });
  });
});