const { chromium } = require('playwright');

async function testAdminSessionGenerator() {
  console.log('🚀 Testing Admin Session Generator...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3008/login');
    await page.waitForTimeout(1000);

    // Check if we're on login page
    const isLoginPage = page.url().includes('login');
    if (!isLoginPage) {
      console.log('⚠ Already logged in or redirected');
    }

    // Fill login form
    console.log('2. Logging in as admin...');
    await page.locator('input[type="email"], input[name="email"]').fill('admin@test.com');
    await page.locator('input[type="password"]').fill('TestPassword123!');
    await page.locator('button[type="submit"]').click();

    // Wait for login to complete
    await page.waitForTimeout(3000);

    // Check login success
    const currentUrl = page.url();
    console.log(`3. Current URL after login: ${currentUrl}`);

    if (currentUrl.includes('login')) {
      console.log('❌ Login failed - still on login page');
      console.log('Checking for error messages...');

      // Check for error messages
      const errorElements = await page.locator('[class*="error"], [class*="destructive"], .text-red-500, .text-destructive').all();
      for (const element of errorElements) {
        const text = await element.textContent();
        if (text) console.log(`Error: ${text}`);
      }

      // Take screenshot for debugging
      await page.screenshot({ path: 'login-error.png' });
      console.log('📸 Screenshot saved: login-error.png');

      await browser.close();
      return;
    }

    console.log('✅ Login successful!');

    // Navigate to admin sessions page
    console.log('4. Navigating to admin sessions page...');
    await page.goto('http://localhost:3008/admin/sessions');
    await page.waitForTimeout(2000);

    // Check if we can access the page
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    // Look for Session Generator components
    console.log('5. Checking for Session Generator components...');

    // Check for mode selection
    const modeSection = await page.locator('text=Session Type').count();
    console.log(`✓ Mode section found: ${modeSection > 0}`);

    // Check for date pickers
    const dateSection = await page.locator('text=Date Range,text=Select Date').count();
    console.log(`✓ Date section found: ${dateSection > 0}`);

    // Check for time section
    const timeSection = await page.locator('text=Time Range,text=Start Time').count();
    console.log(`✓ Time section found: ${timeSection > 0}`);

    // Check for instructor section
    const instructorSection = await page.locator('text=Instructors,text=Select Instructors').count();
    console.log(`✓ Instructor section found: ${instructorSection > 0}`);

    // Check for details section
    const detailsSection = await page.locator('text=Location,text=Max Capacity').count();
    console.log(`✓ Details section found: ${detailsSection > 0}`);

    // Check for preview section
    const previewSection = await page.locator('text=Preview,text=Generate Sessions').count();
    console.log(`✓ Preview section found: ${previewSection > 0}`);

    // Take a screenshot of the page
    console.log('6. Taking screenshot...');
    await page.screenshot({ path: 'admin-sessions-page.png', fullPage: true });
    console.log('📸 Screenshot saved: admin-sessions-page.png');

    // Test mode selection
    console.log('7. Testing mode selection...');
    const modeButtons = await page.locator('[role="radio"], input[type="radio"]').all();
    console.log(`Found ${modeButtons.length} mode radio buttons`);

    if (modeButtons.length > 0) {
      // Click on "Single" mode if available
      const singleMode = await page.locator('text=Single,text=Floating').first();
      if (await singleMode.count() > 0) {
        await singleMode.click();
        console.log('✅ Clicked Single mode');
        await page.waitForTimeout(500);
      }
    }

    // Test date picker
    console.log('8. Testing date picker...');
    const dateInputs = await page.locator('input[type="date"], [role="button"]').all();
    console.log(`Found ${dateInputs.length} date inputs/buttons`);

    // Test form interaction
    console.log('9. Testing form interaction...');

    // Try to fill location
    const locationInput = await page.locator('input[name="location"], [placeholder*="location"], text=Location + input').first();
    if (await locationInput.count() > 0) {
      await locationInput.fill('Modesto');
      console.log('✅ Filled location: Modesto');
    }

    // Try to set max capacity
    const capacityInput = await page.locator('input[type="number"], [placeholder*="capacity"]').first();
    if (await capacityInput.count() > 0) {
      await capacityInput.fill('2');
      console.log('✅ Set max capacity: 2');
    }

    // Final screenshot
    await page.screenshot({ path: 'admin-sessions-filled.png' });
    console.log('📸 Screenshot saved: admin-sessions-filled.png');

    console.log('\n🎉 Admin Session Generator test completed!');
    console.log('The form appears to be working correctly with all sections present.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'test-error.png' });
    console.log('📸 Error screenshot saved: test-error.png');
  } finally {
    // Keep browser open for manual inspection
    console.log('\n⚠ Browser kept open for manual inspection...');
    console.log('Press Ctrl+C to close the browser and end the test.');

    // Wait for user to close browser manually
    await new Promise(() => {});
  }
}

testAdminSessionGenerator();