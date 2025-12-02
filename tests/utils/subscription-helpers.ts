import { Page, expect } from '@playwright/test';

/**
 * Subscription testing utilities
 */

export interface PlanData {
  name: string;
  price: string;
  features: string[];
}

/**
 * Expected plan data for verification
 */
export const EXPECTED_PLANS: PlanData[] = [
  {
    name: 'Free',
    price: 'Free',
    features: ['Max Users: 1', 'API Calls/Month: 1,000', 'Storage: 1 GB', 'Support Level: Basic']
  },
  {
    name: 'Pro', 
    price: '$29/month',
    features: ['Max Users: 10', 'API Calls/Month: 50,000', 'Storage: 10 GB', 'Support Level: Standard', 'Custom Branding: Yes']
  },
  {
    name: 'Enterprise',
    price: '$99/month', 
    features: ['Max Users: Unlimited', 'API Calls/Month: Unlimited', 'Storage: 100 GB', 'Support Level: Premium', 'Advanced Analytics: Yes', 'Priority Support: Yes', 'Single Sign-On: Yes']
  }
];

/**
 * Navigate to subscriptions page
 */
export async function navigateToSubscriptions(page: Page) {
  await page.goto('/subscriptions');
  await expect(page.getByRole('heading', { name: 'Subscription Plans' })).toBeVisible();
}

/**
 * Verify that all expected plans are displayed
 */
export async function verifyAllPlansDisplayed(page: Page) {
  for (const plan of EXPECTED_PLANS) {
    // Check plan name
    await expect(page.getByRole('heading', { name: plan.name })).toBeVisible();
    
    // Check price
    await expect(page.getByText(plan.price)).toBeVisible();
  }
}

/**
 * Verify plan features are displayed correctly
 */
export async function verifyPlanFeatures(page: Page, planName: string) {
  const expectedPlan = EXPECTED_PLANS.find(p => p.name === planName);
  if (!expectedPlan) {
    throw new Error(`Plan ${planName} not found in expected plans`);
  }

  // Find the plan card
  const planCard = page.locator('div').filter({ has: page.getByRole('heading', { name: planName }) });
  await expect(planCard).toBeVisible();

  // Verify each feature
  for (const feature of expectedPlan.features) {
    await expect(planCard.getByText(feature)).toBeVisible();
  }
}

/**
 * Check if a plan is marked as current
 */
export async function isPlanCurrent(page: Page, planName: string): Promise<boolean> {
  try {
    const planCard = page.locator('div').filter({ has: page.getByRole('heading', { name: planName }) });
    await expect(planCard.getByText('Current')).toBeVisible({ timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the subscribe button for a plan
 */
export async function getSubscribeButton(page: Page, planName: string) {
  const planCard = page.locator('div').filter({ has: page.getByRole('heading', { name: planName }) });
  return planCard.getByRole('button');
}

/**
 * Click subscribe button for a specific plan
 */
export async function clickSubscribeButton(page: Page, planName: string) {
  const button = await getSubscribeButton(page, planName);
  await button.click();
}

/**
 * Verify loading state on subscribe button
 */
export async function verifySubscribeButtonLoading(page: Page, planName: string) {
  const button = await getSubscribeButton(page, planName);
  await expect(button).toBeDisabled();
  await expect(button.locator('svg.animate-spin')).toBeVisible();
}

/**
 * Verify current subscription status card
 */
export async function verifyCurrentSubscriptionCard(page: Page, expectedPlan: string) {
  const statusCard = page.getByRole('heading', { name: 'Current Plan' }).locator('..').locator('..');
  await expect(statusCard).toBeVisible();
  await expect(statusCard.getByText(expectedPlan)).toBeVisible();
  await expect(statusCard.getByRole('button', { name: 'Manage Subscription' })).toBeVisible();
}

/**
 * Click manage subscription button
 */
export async function clickManageSubscription(page: Page) {
  const button = page.getByRole('button', { name: 'Manage Subscription' });
  await expect(button).toBeVisible();
  await button.click();
}

/**
 * Wait for page loading to complete
 */
export async function waitForSubscriptionPageLoad(page: Page) {
  // Wait for loading spinner to disappear
  await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });
  
  // Wait for plans to be loaded
  await expect(page.getByRole('heading', { name: 'Subscription Plans' })).toBeVisible();
  
  // Wait for at least one plan card to be visible
  await expect(page.locator('div').filter({ has: page.getByRole('heading', { name: /Free|Pro|Enterprise/ }) }).first()).toBeVisible();
}