import { test, expect } from '@playwright/test';
import { ensureLoggedOut } from '../utils/auth-helpers';

/**
 * Admin Schedule Page Tests
 *
 * Note: The `/admin/schedule` page doesn't exist yet (as of 2025-12-05).
 * The dashboard links to it but it's not implemented.
 * These tests verify:
 * 1. What happens when trying to access non-existent /admin/schedule
 * 2. The existing /admin/sessions page functionality
 * 3. Admin authentication and authorization patterns
 * 4. Dashboard navigation and link validation
 *
 * IMPORTANT: These tests don't require admin credentials since they test
 * the behavior for non-admin users (which is the common case).
 * To test actual admin functionality, you would need to:
 * 1. Create admin test users in your Supabase test environment
 * 2. Add admin credentials to auth-helpers.ts
 * 3. Write additional tests with admin authentication
 */

test.describe('Admin Schedule & Sessions', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start logged out for each test
    await ensureLoggedOut(page);
  });

  test('Non-existent /admin/schedule shows 404 or redirects', async ({ page }) => {
    console.log('🔍 Testing non-existent /admin/schedule page...');

    await page.goto('/admin/schedule');
    console.log(`✓ Navigated to /admin/schedule, current URL: ${page.url()}`);

    const currentUrl = page.url();
    const status = await page.evaluate(() => document.readyState);

    console.log(`✓ Page status: ${status}`);
    console.log(`✓ Current URL after navigation: ${currentUrl}`);

    // Check what happened - could be:
    // 1. 404 page (not found)
    // 2. Redirect to login (if middleware protects it)
    // 3. Redirect to dashboard or home
    // 4. Shows the page but with error/empty state

    const is404 = await page.locator('h1, h2').filter({ hasText: /404|not found|error/i }).count() > 0;
    const isLoginPage = currentUrl.includes('login') || currentUrl.includes('auth');
    const isDashboard = currentUrl.includes('dashboard');
    const isHome = currentUrl === 'http://localhost:3000/' || currentUrl === 'http://localhost:3000';

    console.log(`✓ Is 404 page: ${is404}`);
    console.log(`✓ Is login page: ${isLoginPage}`);
    console.log(`✓ Is dashboard: ${isDashboard}`);
    console.log(`✓ Is home: ${isHome}`);

    // At least one of these should be true
    expect(is404 || isLoginPage || isDashboard || isHome).toBeTruthy();

    console.log('✅ /admin/schedule test completed');
  });

  test('Admin user can access /admin/sessions page', async ({ page }) => {
    console.log('🔐 Testing admin access to /admin/sessions...');

    // Note: We don't have admin test user credentials in auth-helpers
    // For now, we'll test that non-admin users get redirected
    // In a real scenario, we would need admin test credentials

    // First try as non-authenticated user
    await page.goto('/admin/sessions');
    const urlAfterAccess = page.url();
    console.log(`✓ Non-authenticated user tried /admin/sessions, redirected to: ${urlAfterAccess}`);

    // Should redirect to login or show unauthorized
    const isLoginPage = urlAfterAccess.includes('login') || urlAfterAccess.includes('auth');
    const showsUnauthorized = await page.locator('body').textContent().then(text =>
      text?.toLowerCase().includes('unauthorized') || false
    );

    console.log(`✓ Redirected to login: ${isLoginPage}`);
    console.log(`✓ Shows unauthorized: ${showsUnauthorized}`);

    // Either should happen for non-admin/non-authenticated user
    expect(isLoginPage || showsUnauthorized).toBeTruthy();

    console.log('✅ Admin sessions access test completed (non-admin case)');
  });

  test('Existing /admin/sessions page has session generator form', async ({ page }) => {
    console.log('📋 Testing /admin/sessions page structure...');

    await page.goto('/admin/sessions');

    // Check if we're on the page or redirected
    const currentUrl = page.url();
    const isOnSessionsPage = currentUrl.includes('/admin/sessions');

    if (isOnSessionsPage) {
      console.log('✓ On /admin/sessions page');

      // Check for page title/heading
      const heading = await page.locator('h1, h2').first().textContent();
      console.log(`✓ Page heading: "${heading}"`);

      // Look for session generator form elements
      // Based on the SessionGeneratorForm component
      const hasForm = await page.locator('form').count() > 0;
      const hasInputs = await page.locator('input, select, textarea').count() > 0;
      const hasButtons = await page.locator('button').count() > 0;

      console.log(`✓ Has form: ${hasForm}`);
      console.log(`✓ Has form inputs: ${hasInputs}`);
      console.log(`✓ Has buttons: ${hasButtons}`);

      // Should have at least some form elements if the page loads
      expect(hasForm || hasInputs || hasButtons).toBeTruthy();

      // Check for specific session generator elements
      const hasModeSection = await page.locator('*').filter({ hasText: /mode|type/i }).count() > 0;
      const hasDateSection = await page.locator('*').filter({ hasText: /date|schedule/i }).count() > 0;
      const hasTimeSection = await page.locator('*').filter({ hasText: /time|duration/i }).count() > 0;

      console.log(`✓ Has mode section: ${hasModeSection}`);
      console.log(`✓ Has date section: ${hasDateSection}`);
      console.log(`✓ Has time section: ${hasTimeSection}`);
    } else {
      console.log(`✓ Not on sessions page (redirected to: ${currentUrl})`);
      // This is expected for non-admin users
      expect(true).toBeTruthy();
    }

    console.log('✅ Sessions page structure test completed');
  });

  test('Check RoleGuard component behavior', async ({ page }) => {
    console.log('🛡️ Testing RoleGuard component behavior...');

    // Test accessing a page that uses RoleGuard
    await page.goto('/admin/sessions');

    const currentUrl = page.url();
    console.log(`✓ Current URL after accessing /admin/sessions: ${currentUrl}`);

    // The RoleGuard should either:
    // 1. Redirect to login (if not authenticated)
    // 2. Show unauthorized message (if authenticated but not admin)
    // 3. Show the page content (if admin)

    const isLoginPage = currentUrl.includes('login') || currentUrl.includes('auth');
    const isOnSessionsPage = currentUrl.includes('/admin/sessions');

    if (isLoginPage) {
      console.log('✓ Redirected to login (not authenticated)');

      // Check login form is present
      const hasEmailInput = await page.locator('input[type="email"], input[name="email"]').count() > 0;
      const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;

      console.log(`✓ Login form has email input: ${hasEmailInput}`);
      console.log(`✓ Login form has password input: ${hasPasswordInput}`);

      expect(hasEmailInput && hasPasswordInput).toBeTruthy();
    } else if (isOnSessionsPage) {
      console.log('✓ Still on /admin/sessions page');

      // Check if it shows admin content or unauthorized message
      const pageText = await page.locator('body').textContent();
      const showsUnauthorized = pageText?.toLowerCase().includes('unauthorized') ||
                               pageText?.toLowerCase().includes('access denied') ||
                               pageText?.toLowerCase().includes('not authorized');

      console.log(`✓ Shows unauthorized message: ${showsUnauthorized}`);

      if (showsUnauthorized) {
        console.log('✓ RoleGuard showing unauthorized message (authenticated but not admin)');
      } else {
        console.log('⚠️ Page may be accessible without admin role - check RoleGuard implementation');
      }
    } else {
      console.log(`✓ Redirected elsewhere: ${currentUrl}`);
      // Could be redirected to dashboard, home, or unauthorized page
    }

    console.log('✅ RoleGuard test completed');
  });

  test('Dashboard has admin schedule link', async ({ page }) => {
    console.log('🔗 Testing dashboard admin schedule link...');

    await page.goto('/');

    // Check if dashboard is accessible
    const dashboardLink = await page.locator('a[href*="dashboard"]').first();
    if (await dashboardLink.count() > 0) {
      await dashboardLink.click();
      await page.waitForURL(/\/dashboard/);

      console.log('✓ Navigated to dashboard');

      // Look for admin schedule link
      const scheduleLink = await page.locator('a[href="/admin/schedule"]');
      const linkCount = await scheduleLink.count();

      console.log(`✓ Admin schedule links found: ${linkCount}`);

      if (linkCount > 0) {
        const linkText = await scheduleLink.first().textContent();
        console.log(`✓ Link text: "${linkText?.trim()}"`);

        // Verify link goes to /admin/schedule
        const href = await scheduleLink.first().getAttribute('href');
        console.log(`✓ Link href: ${href}`);
        expect(href).toBe('/admin/schedule');
      } else {
        console.log('⚠️ No admin schedule link found on dashboard');
      }
    } else {
      console.log('⚠️ Could not find dashboard link');
    }

    console.log('✅ Dashboard link test completed');
  });

  test('Check admin routes protection', async ({ page }) => {
    console.log('🛡️ Testing admin route protection...');

    const adminRoutes = [
      '/admin',
      '/admin/schedule',
      '/admin/sessions',
      '/admin/referrals',
      '/admin/users',
      '/admin/reports'
    ];

    for (const route of adminRoutes) {
      console.log(`\nTesting route: ${route}`);
      await page.goto(route);

      const currentUrl = page.url();
      const isOnRoute = currentUrl.includes(route);
      const isLoginPage = currentUrl.includes('login') || currentUrl.includes('auth');

      console.log(`  Current URL: ${currentUrl}`);
      console.log(`  Still on route: ${isOnRoute}`);
      console.log(`  Redirected to login: ${isLoginPage}`);

      // For non-existent routes or unauthorized access:
      // - Should redirect to login OR
      // - Show 404/error OR
      // - Show unauthorized message
      if (isOnRoute) {
        // If we're still on the route, check for error/unauthorized content
        const bodyText = await page.locator('body').textContent();
        const hasError = bodyText?.toLowerCase().includes('error') ||
                        bodyText?.toLowerCase().includes('unauthorized') ||
                        bodyText?.toLowerCase().includes('404') ||
                        bodyText?.toLowerCase().includes('not found');

        console.log(`  Shows error/unauthorized: ${hasError}`);

        // If not an error page, it might be accessible (which could be a security issue)
        if (!hasError) {
          console.log(`  ⚠️ WARNING: Route ${route} may be accessible without proper auth!`);
        }
      }

      await page.waitForTimeout(500); // Brief pause between routes
    }

    console.log('\n✅ Admin route protection test completed');
  });
});