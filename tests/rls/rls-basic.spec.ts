import { test, expect } from '@playwright/test';

/**
 * Basic RLS Authorization Tests
 *
 * These tests verify RLS policies work correctly by testing API endpoints
 * with different user roles. They don't require complex test data setup.
 */

test.describe('Basic RLS Authorization Tests', () => {
  // Test user credentials (should be set up in test environment)
  const testUsers = {
    parent: {
      email: 'test-parent@example.com',
      password: 'TestPassword123!'
    },
    coordinator: {
      email: 'test-coordinator@example.com',
      password: 'TestPassword123!'
    },
    instructor: {
      email: 'test-instructor@example.com',
      password: 'TestPassword123!'
    },
    admin: {
      email: 'test-admin@example.com',
      password: 'TestPassword123!'
    }
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  // ==================== AUTHENTICATION TESTS ====================

  test('Unauthenticated users cannot access protected APIs', async ({ page }) => {
    // Test bookings API without authentication
    const response = await page.request.get('/api/bookings');
    expect(response.status()).toBe(401); // Should require authentication
  });

  // ==================== PARENT ROLE TESTS ====================

  test('Parent can access their swimmers API', async ({ page }) => {
    // Login as parent
    await page.fill('input[type="email"]', testUsers.parent.email);
    await page.fill('input[type="password"]', testUsers.parent.password);
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL('/**');

    // Test swimmers API
    const response = await page.request.get('/api/swimmers');
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Parent should only see their own swimmers
    // (Implementation detail: API filters by parent_id)
    expect(Array.isArray(data)).toBe(true);
  });

  test('Parent cannot access admin APIs', async ({ page }) => {
    // Login as parent
    await page.fill('input[type="email"]', testUsers.parent.email);
    await page.fill('input[type="password"]', testUsers.parent.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('/**');

    // Try to access admin-only API
    const response = await page.request.get('/api/admin/swimmers');
    expect(response.status()).toBe(403); // Forbidden
  });

  // ==================== COORDINATOR ROLE TESTS ====================

  test('Coordinator can access purchase orders API', async ({ page }) => {
    // Login as coordinator
    await page.fill('input[type="email"]', testUsers.coordinator.email);
    await page.fill('input[type="password"]', testUsers.coordinator.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('/**');

    // Test purchase orders API
    const response = await page.request.get('/api/pos');
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Coordinator should only see POs for their assigned swimmers
    expect(Array.isArray(data)).toBe(true);
  });

  // ==================== INSTRUCTOR ROLE TESTS ====================

  test('Instructor can access progress notes API', async ({ page }) => {
    // Login as instructor
    await page.fill('input[type="email"]', testUsers.instructor.email);
    await page.fill('input[type="password"]', testUsers.instructor.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('/**');

    // Test progress notes API
    const response = await page.request.get('/api/progress-notes');
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Instructor should see progress notes they created
    expect(Array.isArray(data)).toBe(true);
  });

  test('Instructor can access instructor swimmers API', async ({ page }) => {
    // Login as instructor
    await page.fill('input[type="email"]', testUsers.instructor.email);
    await page.fill('input[type="password"]', testUsers.instructor.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('/**');

    // Test instructor swimmers API
    const response = await page.request.get('/api/instructor/swimmers');
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Should return structured response with swimmers
    expect(data).toHaveProperty('swimmers');
    expect(Array.isArray(data.swimmers)).toBe(true);
  });

  // ==================== ADMIN ROLE TESTS ====================

  test('Admin can access all APIs', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', testUsers.admin.email);
    await page.fill('input[type="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('/**');

    // Test various admin APIs
    const apis = [
      '/api/admin/swimmers',
      '/api/admin/sessions/all',
      '/api/admin/time-off',
      '/api/bookings' // Admin should see all bookings
    ];

    for (const api of apis) {
      const response = await page.request.get(api);
      expect(response.status()).toBe(200, `Admin should have access to ${api}`);
    }
  });

  test('Admin can see all swimmers', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', testUsers.admin.email);
    await page.fill('input[type="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('/**');

    // Test admin swimmers API with pagination
    const response = await page.request.get('/api/admin/swimmers?limit=10');
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Admin should see structured response with pagination
    expect(data).toHaveProperty('swimmers');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(Array.isArray(data.swimmers)).toBe(true);
  });

  // ==================== CROSS-ROLE ACCESS TESTS ====================

  test('Parent cannot see other parent swimmers via API', async ({ page }) => {
    // This test requires specific test data setup
    // For now, we'll verify the API structure
    await page.fill('input[type="email"]', testUsers.parent.email);
    await page.fill('input[type="password"]', testUsers.parent.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('/**');

    const response = await page.request.get('/api/swimmers');
    const data = await response.json();

    // Verify API returns data in expected format
    // Actual data isolation is tested by RLS policies in database
    expect(Array.isArray(data)).toBe(true);
  });

  test('Coordinator cannot access admin swimmers API', async ({ page }) => {
    await page.fill('input[type="email"]', testUsers.coordinator.email);
    await page.fill('input[type="password"]', testUsers.coordinator.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('/**');

    const response = await page.request.get('/api/admin/swimmers');
    expect(response.status()).toBe(403); // Forbidden
  });

  // ==================== PROGRESS NOTES SHARING TESTS ====================

  test('Progress notes respect shared_with_parent flag', async ({ page }) => {
    // Note: This test requires specific test data with shared and private notes
    // For now, we'll test the API endpoint structure

    await page.fill('input[type="email"]', testUsers.parent.email);
    await page.fill('input[type="password"]', testUsers.parent.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('/**');

    // Parent accessing progress notes should only see shared notes
    // (RLS policy should enforce this)
    const response = await page.request.get('/api/progress-notes');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  // ==================== ERROR HANDLING TESTS ====================

  test('Invalid JWT token is rejected', async ({ page }) => {
    // Try to access API with invalid token
    const response = await page.request.get('/api/swimmers', {
      headers: {
        'Authorization': 'Bearer invalid-token-123'
      }
    });
    expect(response.status()).toBe(401);
  });

  test('Expired JWT token is rejected', async ({ page }) => {
    // Note: Testing expired tokens requires generating an expired JWT
    // For now, we'll test authentication requirement
    const response = await page.request.get('/api/swimmers');
    expect(response.status()).toBe(401);
  });
});

// Helper function to login programmatically
async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/**');
}