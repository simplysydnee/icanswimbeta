import { Page, expect, APIRequestContext, APIResponse } from '@playwright/test';

/**
 * API testing utilities for subscription system
 */

export interface ApiResponse {
  status: number;
  data: any;
  error?: string;
}

/**
 * Make authenticated API request
 */
export async function makeAuthenticatedRequest(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: any
): Promise<ApiResponse> {
  const response = await page.request[method.toLowerCase() as keyof APIRequestContext](url, {
    data: body,
    headers: {
      'Content-Type': 'application/json',
    },
  }) as APIResponse;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Response might not be JSON
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  return {
    status: response.status(),
    data,
    error: response.ok() ? undefined : data?.error || data,
  };
}

/**
 * Test /api/plans endpoint
 */
export async function testPlansApi(page: Page) {
  const response = await makeAuthenticatedRequest(page, 'GET', '/api/plans');
  
  expect(response.status).toBe(200);
  expect(response.data).toHaveProperty('plans');
  expect(Array.isArray(response.data.plans)).toBe(true);
  expect(response.data.plans.length).toBeGreaterThan(0);

  // Verify plan structure
  for (const plan of response.data.plans) {
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('name');
    expect(plan).toHaveProperty('description');
    expect(plan).toHaveProperty('price');
    expect(plan).toHaveProperty('features');
    
    // Verify price structure
    expect(plan.price).toHaveProperty('amount');
    expect(plan.price).toHaveProperty('currency');
    expect(plan.price).toHaveProperty('interval');
  }

  return response.data.plans;
}

/**
 * Test /api/subscriptions/current endpoint (authenticated)
 */
export async function testCurrentSubscriptionApi(page: Page, expectSubscription = false) {
  const response = await makeAuthenticatedRequest(page, 'GET', '/api/subscriptions/current');
  
  if (expectSubscription) {
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('plan');
    expect(response.data).toHaveProperty('subscription');
  } else {
    // Could be 200 with null subscription or 404
    expect([200, 404]).toContain(response.status);
  }

  return response;
}

/**
 * Test /api/subscriptions/current endpoint (unauthenticated)
 */
export async function testUnauthenticatedSubscriptionApi(page: Page) {
  // First ensure we're not authenticated by going to a page that would clear auth
  await page.goto('/');
  
  const response = await makeAuthenticatedRequest(page, 'GET', '/api/subscriptions/current');
  
  // Should return 401 or redirect
  expect([401, 302]).toContain(response.status);
  
  return response;
}

/**
 * Test /api/subscriptions/checkout endpoint
 */
export async function testCheckoutApi(page: Page, priceId: string) {
  const response = await makeAuthenticatedRequest(page, 'POST', '/api/subscriptions/checkout', {
    priceId,
  });
  
  return response;
}

/**
 * Test /api/subscriptions/portal endpoint
 */
export async function testPortalApi(page: Page) {
  const response = await makeAuthenticatedRequest(page, 'POST', '/api/subscriptions/portal');
  
  return response;
}

/**
 * Verify API error responses have proper structure
 */
export function verifyErrorResponse(response: ApiResponse, expectedStatus: number) {
  expect(response.status).toBe(expectedStatus);
  expect(response.data).toHaveProperty('error');
  expect(typeof response.data.error).toBe('string');
}

/**
 * Test API rate limiting (if implemented)
 */
export async function testRateLimit(page: Page, endpoint: string, maxRequests = 10) {
  const responses = [];
  
  for (let i = 0; i < maxRequests + 1; i++) {
    const response = await makeAuthenticatedRequest(page, 'GET', endpoint);
    responses.push(response);
    
    // Small delay to avoid overwhelming
    await page.waitForTimeout(10);
  }
  
  return responses;
}

/**
 * Mock API responses for testing offline scenarios
 */
export async function mockApiResponse(page: Page, url: string, response: any, status = 200) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}