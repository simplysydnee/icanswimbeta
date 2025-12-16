import { test, expect } from '@playwright/test';
import { ensureLoggedOut } from '../utils/auth-helpers';

test.describe('Signup Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('should load signup page', async ({ page, baseURL }) => {
    // Use the correct port (3001 instead of 3000)
    const url = `${baseURL?.replace('3000', '3001') || 'http://localhost:3001'}/signup`;
    await page.goto(url);

    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator('text="Create Account"')).toBeVisible();
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();

    console.log(`✓ Signup page loaded at: ${page.url()}`);
  });

  test('should show validation errors for empty form submission', async ({ page, baseURL }) => {
    const url = `${baseURL?.replace('3000', '3001') || 'http://localhost:3001'}/signup`;
    await page.goto(url);

    // Try to submit empty form
    await page.locator('button[type="submit"]').click();

    // Should show validation error
    await expect(page.locator('[role="alert"]')).toBeVisible();

    console.log(`✓ Validation errors shown for empty form`);
  });

  test('should show password mismatch error', async ({ page, baseURL }) => {
    const url = `${baseURL?.replace('3000', '3001') || 'http://localhost:3001'}/signup`;
    await page.goto(url);

    // Fill form with mismatched passwords
    await page.locator('input[name="fullName"]').fill('Test Parent');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('Password123!');
    await page.locator('input[name="confirmPassword"]').fill('Different123!');
    await page.locator('input[name="termsAccepted"]').check();

    await page.locator('button[type="submit"]').click();

    // Should show password mismatch error
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toContainText(/password.*match/i);

    console.log(`✓ Password mismatch error shown`);
  });
});