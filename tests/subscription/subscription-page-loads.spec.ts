import { test, expect } from '@playwright/test';
import { 
  navigateToSubscriptions, 
  verifyAllPlansDisplayed, 
  verifyPlanFeatures, 
  waitForSubscriptionPageLoad,
  EXPECTED_PLANS 
} from '../utils/subscription-helpers';

test.describe('Subscription Page Load Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with a clean state
    await page.goto('/');
  });

  test('should load subscriptions page without errors', async ({ page }) => {
    await navigateToSubscriptions(page);
    
    // Verify page title and header
    await expect(page).toHaveTitle(/Subscription/);
    await expect(page.getByRole('heading', { name: 'Subscription Plans' })).toBeVisible();
    await expect(page.getByText('Choose the plan that\'s right for you')).toBeVisible();
    
    // Wait for content to load completely
    await waitForSubscriptionPageLoad(page);
  });

  test('should display all 3 plans (Free, Pro, Enterprise)', async ({ page }) => {
    await navigateToSubscriptions(page);
    await waitForSubscriptionPageLoad(page);
    
    // Verify all plans are displayed
    await verifyAllPlansDisplayed(page);
    
    // Verify we have exactly 3 plan cards
    const planCards = page.locator('div').filter({ 
      has: page.getByRole('heading', { name: /^(Free|Pro|Enterprise)$/ }) 
    });
    await expect(planCards).toHaveCount(3);
  });

  test('should display correct pricing for each plan', async ({ page }) => {
    await navigateToSubscriptions(page);
    await waitForSubscriptionPageLoad(page);
    
    // Verify pricing for each plan
    for (const plan of EXPECTED_PLANS) {
      const planCard = page.locator('div').filter({ 
        has: page.getByRole('heading', { name: plan.name }) 
      });
      
      await expect(planCard).toBeVisible();
      await expect(planCard.getByText(plan.price)).toBeVisible();
    }
  });

  test('should display features for Free plan', async ({ page }) => {
    await navigateToSubscriptions(page);
    await waitForSubscriptionPageLoad(page);
    
    await verifyPlanFeatures(page, 'Free');
  });

  test('should display features for Pro plan', async ({ page }) => {
    await navigateToSubscriptions(page);
    await waitForSubscriptionPageLoad(page);
    
    await verifyPlanFeatures(page, 'Pro');
  });

  test('should display features for Enterprise plan', async ({ page }) => {
    await navigateToSubscriptions(page);
    await waitForSubscriptionPageLoad(page);
    
    await verifyPlanFeatures(page, 'Enterprise');
  });

  test('should display check icons next to each feature', async ({ page }) => {
    await navigateToSubscriptions(page);
    await waitForSubscriptionPageLoad(page);
    
    // Count features across all plans and verify they have check icons
    const features = page.locator('div').filter({ 
      has: page.locator('svg').filter({ hasText: '' }).first() // Check icon
    }).filter({ 
      has: page.getByText(/Max Users:|API Calls|Storage:|Support Level:|Custom Branding:|Advanced Analytics:|Priority Support:|Single Sign-On:/) 
    });
    
    // Should have features from all three plans
    await expect(features.first()).toBeVisible();
    const featureCount = await features.count();
    expect(featureCount).toBeGreaterThan(10); // At least features from all plans
  });

  test('should have proper page structure and accessibility', async ({ page }) => {
    await navigateToSubscriptions(page);
    await waitForSubscriptionPageLoad(page);
    
    // Verify main heading structure
    await expect(page.getByRole('heading', { level: 1, name: 'Subscription Plans' })).toBeVisible();
    
    // Verify each plan has proper heading structure
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible(); 
    await expect(page.getByRole('heading', { name: 'Enterprise' })).toBeVisible();
    
    // Verify buttons are properly labeled
    const buttons = page.getByRole('button');
    await expect(buttons.first()).toBeVisible();
    
    // Check that container has proper layout classes
    const container = page.locator('.container');
    await expect(container).toBeVisible();
    
    // Verify grid layout for plans
    const planGrid = page.locator('.grid');
    await expect(planGrid).toBeVisible();
  });

  test('should handle page refresh correctly', async ({ page }) => {
    await navigateToSubscriptions(page);
    await waitForSubscriptionPageLoad(page);
    
    // Verify initial load
    await verifyAllPlansDisplayed(page);
    
    // Refresh page
    await page.reload();
    
    // Verify content loads again after refresh
    await waitForSubscriptionPageLoad(page);
    await verifyAllPlansDisplayed(page);
  });

  test('should display unauthenticated user message', async ({ page }) => {
    await navigateToSubscriptions(page);
    await waitForSubscriptionPageLoad(page);
    
    // Should show message for unauthenticated users
    await expect(page.getByText('Sign in to view your current subscription and manage your plan')).toBeVisible();
  });
});