import { test, expect } from '@playwright/test';
import { 
  navigateToSubscriptions, 
  waitForSubscriptionPageLoad,
  getSubscribeButton,
  clickSubscribeButton 
} from '../utils/subscription-helpers';
import { 
  ensureLoggedOut, 
  setupAuthenticatedUser,
  TEST_USERS 
} from '../utils/auth-helpers';

test.describe('Authentication Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with a clean state
    await page.goto('/');
  });

  test.describe('Unauthenticated User Flow', () => {
    test.beforeEach(async ({ page }) => {
      await ensureLoggedOut(page);
    });

    test('should show "Sign In to Subscribe" buttons for unauthenticated users', async ({ page }) => {
      await navigateToSubscriptions(page);
      await waitForSubscriptionPageLoad(page);
      
      // Free plan should show "Default Plan" button (disabled)
      const freeButton = await getSubscribeButton(page, 'Free');
      await expect(freeButton).toHaveText(/Default Plan/);
      await expect(freeButton).toBeDisabled();
      
      // Pro plan should show "Sign In to Subscribe" button
      const proButton = await getSubscribeButton(page, 'Pro');
      await expect(proButton).toHaveText('Sign In to Subscribe');
      await expect(proButton).not.toBeDisabled();
      
      // Enterprise plan should show "Sign In to Subscribe" button  
      const enterpriseButton = await getSubscribeButton(page, 'Enterprise');
      await expect(enterpriseButton).toHaveText('Sign In to Subscribe');
      await expect(enterpriseButton).not.toBeDisabled();
    });

    test('should redirect to login when clicking subscribe without auth - Pro plan', async ({ page }) => {
      await navigateToSubscriptions(page);
      await waitForSubscriptionPageLoad(page);
      
      // Click subscribe button for Pro plan
      await clickSubscribeButton(page, 'Pro');
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    });

    test('should redirect to login when clicking subscribe without auth - Enterprise plan', async ({ page }) => {
      await navigateToSubscriptions(page);
      await waitForSubscriptionPageLoad(page);
      
      // Click subscribe button for Enterprise plan
      await clickSubscribeButton(page, 'Enterprise');
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    });

    test('should not show current subscription card for unauthenticated users', async ({ page }) => {
      await navigateToSubscriptions(page);
      await waitForSubscriptionPageLoad(page);
      
      // Current subscription card should not be visible
      await expect(page.getByRole('heading', { name: 'Current Plan' })).not.toBeVisible();
    });

    test('should show proper unauthenticated message', async ({ page }) => {
      await navigateToSubscriptions(page);
      await waitForSubscriptionPageLoad(page);
      
      // Should show message for unauthenticated users
      await expect(page.getByText('Sign in to view your current subscription and manage your plan')).toBeVisible();
    });
  });

  test.describe('Authenticated User Flow', () => {
    test('should show different buttons for authenticated free user', async ({ page }) => {
      await setupAuthenticatedUser(page, 'free');
      await navigateToSubscriptions(page);
      await waitForSubscriptionPageLoad(page);
      
      // Free plan should show "Current Plan" if user is on free plan
      const freeButton = await getSubscribeButton(page, 'Free');
      await expect(freeButton).toHaveText(/Current Plan|Default Plan/);
      await expect(freeButton).toBeDisabled();
      
      // Pro plan should show "Subscribe" button
      const proButton = await getSubscribeButton(page, 'Pro');
      await expect(proButton).toHaveText('Subscribe');
      await expect(proButton).not.toBeDisabled();
      
      // Enterprise plan should show "Subscribe" button
      const enterpriseButton = await getSubscribeButton(page, 'Enterprise');
      await expect(enterpriseButton).toHaveText('Subscribe');
      await expect(enterpriseButton).not.toBeDisabled();
    });

    test('should not show unauthenticated message for logged in users', async ({ page }) => {
      await setupAuthenticatedUser(page, 'free');
      await navigateToSubscriptions(page);
      await waitForSubscriptionPageLoad(page);
      
      // Should not show unauthenticated message
      await expect(page.getByText('Sign in to view your current subscription and manage your plan')).not.toBeVisible();
    });

    test('should maintain authentication state after page refresh', async ({ page }) => {
      await setupAuthenticatedUser(page, 'free');
      await navigateToSubscriptions(page);
      await waitForSubscriptionPageLoad(page);
      
      // Verify authenticated state
      const proButton = await getSubscribeButton(page, 'Pro');
      await expect(proButton).toHaveText('Subscribe');
      
      // Refresh page
      await page.reload();
      await waitForSubscriptionPageLoad(page);
      
      // Should still be authenticated
      const proButtonAfterRefresh = await getSubscribeButton(page, 'Pro');
      await expect(proButtonAfterRefresh).toHaveText('Subscribe');
      await expect(page.getByText('Sign in to view your current subscription and manage your plan')).not.toBeVisible();
    });

    test('should handle authentication state changes correctly', async ({ page }) => {
      // Start unauthenticated
      await ensureLoggedOut(page);
      await navigateToSubscriptions(page);
      await waitForSubscriptionPageLoad(page);
      
      // Verify unauthenticated state
      const proButton1 = await getSubscribeButton(page, 'Pro');
      await expect(proButton1).toHaveText('Sign In to Subscribe');
      
      // Login in same session
      await setupAuthenticatedUser(page, 'free');
      await navigateToSubscriptions(page);
      await waitForSubscriptionPageLoad(page);
      
      // Verify authenticated state
      const proButton2 = await getSubscribeButton(page, 'Pro');
      await expect(proButton2).toHaveText('Subscribe');
    });
  });

  test.describe('Authentication Context', () => {
    test('should show user menu when authenticated', async ({ page }) => {
      await setupAuthenticatedUser(page, 'free');
      await navigateToSubscriptions(page);
      
      // User menu should be visible
      await expect(page.getByTestId('user-menu')).toBeVisible();
    });

    test('should not show user menu when unauthenticated', async ({ page }) => {
      await ensureLoggedOut(page);
      await navigateToSubscriptions(page);
      
      // User menu should not be visible
      await expect(page.getByTestId('user-menu')).not.toBeVisible();
    });

    test('should handle login redirect with return URL', async ({ page }) => {
      await ensureLoggedOut(page);
      await navigateToSubscriptions(page);
      await waitForSubscriptionPageLoad(page);
      
      // Click subscribe button (should redirect to login)
      await clickSubscribeButton(page, 'Pro');
      
      // Should be on login page
      await expect(page).toHaveURL(/\/login/);
      
      // Login manually to verify redirect behavior
      const user = TEST_USERS.free;
      await page.getByRole('textbox', { name: /email/i }).fill(user.email);
      await page.getByRole('textbox', { name: /password/i }).fill(user.password);
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Should redirect to dashboard or subscriptions after login
      await expect(page).toHaveURL(/\/(dashboard|subscriptions)/);
    });
  });
});