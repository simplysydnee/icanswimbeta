import { test, expect } from '@playwright/test'
import {
  createTestReferral,
  createCompletedReferral,
  deleteTestReferral,
  getReferralByToken
} from '../helpers/db-seed'

test.describe('Parent Completion Page', () => {
  let testReferral: { referral: any; token: string }
  let completedReferral: { referral: any; token: string }

  test.beforeAll(async () => {
    testReferral = await createTestReferral()
    completedReferral = await createCompletedReferral()
  })

  test.afterAll(async () => {
    if (testReferral?.referral?.id) {
      await deleteTestReferral(testReferral.referral.id)
    }
    if (completedReferral?.referral?.id) {
      await deleteTestReferral(completedReferral.referral.id)
    }
  })

  test('shows error for invalid token', async ({ page }) => {
    await page.goto('/enroll/complete/invalid-token-12345')

    await expect(page.getByRole('heading', { name: 'Link Not Found' })).toBeVisible({ timeout: 10000 })
  })

  test('shows already completed message', async ({ page }) => {
    await page.goto(`/enroll/complete/${completedReferral.token}`)

    await expect(page.getByRole('heading', { name: 'Enrollment Complete!' })).toBeVisible({ timeout: 10000 })
  })

  test('displays referral information', async ({ page }) => {
    await page.goto(`/enroll/complete/${testReferral.token}`)

    await expect(page.getByRole('heading', { name: 'Complete Your Enrollment' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Test Child')).toBeVisible()
    await expect(page.getByText('Test Parent')).toBeVisible()
    await expect(page.getByText('Test Coordinator')).toBeVisible()
  })

  test('validates swim goals required', async ({ page }) => {
    await page.goto(`/enroll/complete/${testReferral.token}`)
    await expect(page.getByRole('heading', { name: 'Complete Your Enrollment' })).toBeVisible({ timeout: 10000 })

    // Try to submit without selecting anything
    await page.getByTestId('submit-button').click()

    // Should show validation error toast
    await expect(page.getByText('Please select at least one swim goal')).toBeVisible({ timeout: 5000 })
  })

  test('validates liability signature required', async ({ page }) => {
    await page.goto(`/enroll/complete/${testReferral.token}`)
    await expect(page.getByRole('heading', { name: 'Complete Your Enrollment' })).toBeVisible({ timeout: 10000 })

    // Select swim goal
    await page.getByText('Develop comfort and familiarity with water').click()

    // Select availability
    await page.getByText('Flexible').first().click()

    // Check liability but don't sign
    await page.getByTestId('liability-checkbox').click()

    // Fill emergency contact
    await page.getByTestId('emergency-name').fill('Emergency Person')
    await page.getByTestId('emergency-phone').fill('2095551234')

    // Check cancellation and sign it
    await page.getByTestId('cancellation-checkbox').click()
    await page.getByTestId('cancellation-signature').fill('Test Parent')

    // Try to submit
    await page.getByTestId('submit-button').click()

    await expect(page.getByText('Please sign the liability waiver')).toBeVisible({ timeout: 5000 })
  })

  test('validates cancellation signature required', async ({ page }) => {
    await page.goto(`/enroll/complete/${testReferral.token}`)
    await expect(page.getByRole('heading', { name: 'Complete Your Enrollment' })).toBeVisible({ timeout: 10000 })

    // Select swim goal
    await page.getByText('Develop comfort and familiarity with water').click()

    // Select availability
    await page.getByText('Flexible').first().click()

    // Sign liability waiver
    await page.getByTestId('liability-checkbox').click()
    await page.getByTestId('liability-signature').fill('Test Parent')

    // Check cancellation but don't sign
    await page.getByTestId('cancellation-checkbox').click()

    // Fill emergency contact
    await page.getByTestId('emergency-name').fill('Emergency Person')
    await page.getByTestId('emergency-phone').fill('2095551234')

    // Try to submit
    await page.getByTestId('submit-button').click()

    await expect(page.getByText('Please sign the cancellation policy')).toBeVisible({ timeout: 5000 })
  })

  test('validates emergency contact required', async ({ page }) => {
    await page.goto(`/enroll/complete/${testReferral.token}`)
    await expect(page.getByRole('heading', { name: 'Complete Your Enrollment' })).toBeVisible({ timeout: 10000 })

    // Select swim goal
    await page.getByText('Develop comfort and familiarity with water').click()

    // Select availability
    await page.getByText('Flexible').first().click()

    // Sign both waivers
    await page.getByTestId('liability-checkbox').click()
    await page.getByTestId('liability-signature').fill('Test Parent')
    await page.getByTestId('cancellation-checkbox').click()
    await page.getByTestId('cancellation-signature').fill('Test Parent')

    // Don't fill emergency contact

    // Try to submit
    await page.getByTestId('submit-button').click()

    await expect(page.getByText('Please provide an emergency contact name')).toBeVisible({ timeout: 5000 })
  })

  test('successfully completes enrollment', async ({ page }) => {
    // Create fresh referral for this test
    const freshReferral = await createTestReferral()

    try {
      await page.goto(`/enroll/complete/${freshReferral.token}`)
      await expect(page.getByRole('heading', { name: 'Complete Your Enrollment' })).toBeVisible({ timeout: 10000 })

      // Select swim goals
      await page.getByText('Develop comfort and familiarity with water').click()
      await page.getByText('Learn basic swimming strokes').click()

      // Fill optional fields
      await page.getByTestId('strengths-input').fill('Loves water, very determined')
      await page.getByTestId('motivation-input').fill('Praise and high-fives')

      // Select availability
      await page.getByText('Weekday Mornings').first().click()

      // Sign liability waiver
      await page.getByTestId('liability-checkbox').click()
      await page.getByTestId('liability-signature').fill('Test Parent')

      // Sign cancellation policy
      await page.getByTestId('cancellation-checkbox').click()
      await page.getByTestId('cancellation-signature').fill('Test Parent')

      // Optional: Photo release
      await page.getByTestId('photo-checkbox').click()
      await page.getByTestId('photo-signature').fill('Test Parent')

      // Fill emergency contact
      await page.getByTestId('emergency-name').fill('Emergency Person')
      await page.getByTestId('emergency-phone').fill('2095551234')
      await page.getByTestId('emergency-relationship').fill('Grandmother')

      // Submit
      await page.getByTestId('submit-button').click()

      // Wait for success
      await expect(page.getByRole('heading', { name: 'Enrollment Complete!' })).toBeVisible({ timeout: 15000 })

      // Verify database
      const updated = await getReferralByToken(freshReferral.token)
      expect(updated.parent_completed_at).toBeTruthy()
      expect(updated.liability_waiver_signed).toBe(true)
      expect(updated.emergency_contact_name).toBe('Emergency Person')

    } finally {
      await deleteTestReferral(freshReferral.referral.id)
    }
  })

  test('signature field appears after checkbox clicked', async ({ page }) => {
    await page.goto(`/enroll/complete/${testReferral.token}`)
    await expect(page.getByRole('heading', { name: 'Complete Your Enrollment' })).toBeVisible({ timeout: 10000 })

    // Signature should not be visible initially
    await expect(page.getByTestId('liability-signature')).not.toBeVisible()

    // Click checkbox
    await page.getByTestId('liability-checkbox').click()

    // Now signature should be visible
    await expect(page.getByTestId('liability-signature')).toBeVisible()
  })

  test('contact footer displays correctly', async ({ page }) => {
    await page.goto(`/enroll/complete/${testReferral.token}`)
    await expect(page.getByRole('heading', { name: 'Complete Your Enrollment' })).toBeVisible({ timeout: 10000 })

    // Check contact info using testid
    await expect(page.getByTestId('contact-footer')).toContainText('(209) 778-7877')
    await expect(page.getByTestId('contact-footer')).toContainText('info@icanswim209.com')
  })

  test('mobile responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto(`/enroll/complete/${testReferral.token}`)

    await expect(page.getByRole('heading', { name: 'Complete Your Enrollment' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('submit-button')).toBeVisible()
  })
})