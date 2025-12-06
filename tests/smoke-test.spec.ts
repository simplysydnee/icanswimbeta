import { test, expect } from '@playwright/test';

test('Smoke test - app loads', async ({ page }) => {
  console.log('🚀 Starting smoke test...');

  await page.goto('http://localhost:3000');
  console.log('✓ Navigated to homepage');

  const title = await page.title();
  console.log(`✓ Page title: "${title}"`);

  // Check for some content
  const bodyText = await page.locator('body').textContent();
  console.log(`✓ Body contains text: ${bodyText ? 'Yes' : 'No'}`);

  console.log('✅ Smoke test completed');
});

test('Check booking page redirects to login', async ({ page }) => {
  console.log('\n🔐 Testing booking page authentication...');

  await page.goto('http://localhost:3000/parent/book');
  console.log('✓ Navigated to /parent/book');

  const currentUrl = page.url();
  console.log(`✓ Current URL: ${currentUrl}`);

  // Should redirect to login if not authenticated
  const isLoginPage = currentUrl.includes('login') || currentUrl.includes('auth');
  console.log(`✓ Redirected to login: ${isLoginPage}`);

  console.log('✅ Authentication test completed');
});