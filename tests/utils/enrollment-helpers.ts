import { Page, expect } from '@playwright/test';

/**
 * Enrollment utilities for Playwright tests
 */

export interface TestSwimmerData {
  // Section 1: Parent Information
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  parent_address: string;
  parent_city: string;
  parent_state: string;
  parent_zip: string;

  // Section 2: Child Information
  child_first_name: string;
  child_last_name: string;
  child_date_of_birth: string;
  child_gender: string;

  // Section 3: Medical & Safety Information
  has_allergies?: 'yes' | 'no';
  allergies_description?: string;
  has_medical_conditions?: 'yes' | 'no';
  medical_conditions_description?: string;
  diagnosis?: string[];
  history_of_seizures?: 'yes' | 'no';
  toilet_trained?: 'yes' | 'no' | 'sometimes';
  non_ambulatory?: 'yes' | 'no';

  // Section 4: Behavioral Information
  self_injurious_behavior?: 'yes' | 'no';
  self_injurious_description?: string;
  aggressive_behavior?: 'yes' | 'no';
  aggressive_behavior_description?: string;
  elopement_history?: 'yes' | 'no';
  elopement_description?: string;
  has_behavior_plan?: 'yes' | 'no';
  behavior_plan_description?: string;

  // Section 5: Swimming Background
  previous_swim_lessons?: 'yes' | 'no';
  previous_swim_experience?: string;
  comfortable_in_water?: 'very' | 'somewhat' | 'not_at_all';
  swim_goals?: string[];

  // Section 6: Scheduling & Availability
  availability_slots?: string[];
  other_availability?: string;
  flexible_swimmer?: boolean;

  // Section 7: Consent & Agreement
  signed_waiver?: boolean;
  photo_release?: boolean;
  cancellation_policy_agreement?: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

// Default test swimmer data
export const DEFAULT_TEST_SWIMMER: TestSwimmerData = {
  // Parent Information
  parent_name: 'Test Parent',
  parent_email: 'test-parent@example.com',
  parent_phone: '555-123-4567',
  parent_address: '123 Test Street',
  parent_city: 'Test City',
  parent_state: 'CA',
  parent_zip: '95382',

  // Child Information
  child_first_name: 'Test',
  child_last_name: 'Swimmer',
  child_date_of_birth: '2020-01-15',
  child_gender: 'male',

  // Medical & Safety (defaults to 'no' for all)
  has_allergies: 'no',
  has_medical_conditions: 'no',
  history_of_seizures: 'no',
  toilet_trained: 'yes',
  non_ambulatory: 'no',

  // Behavioral (defaults to 'no' for all)
  self_injurious_behavior: 'no',
  aggressive_behavior: 'no',
  elopement_history: 'no',
  has_behavior_plan: 'no',

  // Swimming Background
  previous_swim_lessons: 'no',
  comfortable_in_water: 'somewhat',
  swim_goals: ['water_safety', 'basic_swimming'],

  // Scheduling & Availability
  availability_slots: ['weekday_morning', 'weekday_afternoon'],
  flexible_swimmer: false,

  // Consent & Agreement
  signed_waiver: true,
  photo_release: true,
  cancellation_policy_agreement: true,
  emergency_contact_name: 'Emergency Contact',
  emergency_contact_phone: '555-987-6543',
  emergency_contact_relationship: 'Grandparent'
};

/**
 * Navigate to enrollment page and wait for it to load
 */
export async function navigateToEnrollment(page: Page, enrollmentType: 'private' | 'vmrc' = 'private') {
  await page.goto(`/enroll/${enrollmentType}`);
  await expect(page).toHaveURL(`/enroll/${enrollmentType}`);
  await expect(page.locator('h1')).toBeVisible();
}

/**
 * Fill Section 1: Parent Information
 */
export async function fillParentInformation(page: Page, data: TestSwimmerData) {
  await page.locator('input[name="parent_name"]').fill(data.parent_name);
  await page.locator('input[name="parent_email"]').fill(data.parent_email);
  await page.locator('input[name="parent_phone"]').fill(data.parent_phone);
  await page.locator('input[name="parent_address"]').fill(data.parent_address);
  await page.locator('input[name="parent_city"]').fill(data.parent_city);
  await page.locator('input[name="parent_state"]').fill(data.parent_state);
  await page.locator('input[name="parent_zip"]').fill(data.parent_zip);
}

/**
 * Fill Section 2: Child Information
 */
export async function fillChildInformation(page: Page, data: TestSwimmerData) {
  await page.locator('input[name="child_first_name"]').fill(data.child_first_name);
  await page.locator('input[name="child_last_name"]').fill(data.child_last_name);
  await page.locator('input[name="child_date_of_birth"]').fill(data.child_date_of_birth);
  await page.locator('select[name="child_gender"]').selectOption(data.child_gender);
}

/**
 * Fill Section 3: Medical & Safety Information
 */
export async function fillMedicalInformation(page: Page, data: TestSwimmerData) {
  // Set radio buttons for medical/safety questions
  if (data.has_allergies) {
    await page.locator(`input[name="has_allergies"][value="${data.has_allergies}"]`).check();
  }

  if (data.has_allergies === 'yes' && data.allergies_description) {
    await page.locator('textarea[name="allergies_description"]').fill(data.allergies_description);
  }

  if (data.has_medical_conditions) {
    await page.locator(`input[name="has_medical_conditions"][value="${data.has_medical_conditions}"]`).check();
  }

  if (data.has_medical_conditions === 'yes' && data.medical_conditions_description) {
    await page.locator('textarea[name="medical_conditions_description"]').fill(data.medical_conditions_description);
  }

  if (data.history_of_seizures) {
    await page.locator(`input[name="history_of_seizures"][value="${data.history_of_seizures}"]`).check();
  }

  if (data.toilet_trained) {
    await page.locator(`input[name="toilet_trained"][value="${data.toilet_trained}"]`).check();
  }

  if (data.non_ambulatory) {
    await page.locator(`input[name="non_ambulatory"][value="${data.non_ambulatory}"]`).check();
  }
}

/**
 * Fill Section 4: Behavioral Information
 */
export async function fillBehavioralInformation(page: Page, data: TestSwimmerData) {
  if (data.self_injurious_behavior) {
    await page.locator(`input[name="self_injurious_behavior"][value="${data.self_injurious_behavior}"]`).check();
  }

  if (data.self_injurious_behavior === 'yes' && data.self_injurious_description) {
    await page.locator('textarea[name="self_injurious_description"]').fill(data.self_injurious_description);
  }

  if (data.aggressive_behavior) {
    await page.locator(`input[name="aggressive_behavior"][value="${data.aggressive_behavior}"]`).check();
  }

  if (data.aggressive_behavior === 'yes' && data.aggressive_behavior_description) {
    await page.locator('textarea[name="aggressive_behavior_description"]').fill(data.aggressive_behavior_description);
  }

  if (data.elopement_history) {
    await page.locator(`input[name="elopement_history"][value="${data.elopement_history}"]`).check();
  }

  if (data.elopement_history === 'yes' && data.elopement_description) {
    await page.locator('textarea[name="elopement_description"]').fill(data.elopement_description);
  }

  if (data.has_behavior_plan) {
    await page.locator(`input[name="has_behavior_plan"][value="${data.has_behavior_plan}"]`).check();
  }

  if (data.has_behavior_plan === 'yes' && data.behavior_plan_description) {
    await page.locator('textarea[name="behavior_plan_description"]').fill(data.behavior_plan_description);
  }
}

/**
 * Fill Section 5: Swimming Background
 */
export async function fillSwimmingBackground(page: Page, data: TestSwimmerData) {
  if (data.previous_swim_lessons) {
    await page.locator(`input[name="previous_swim_lessons"][value="${data.previous_swim_lessons}"]`).check();
  }

  if (data.previous_swim_lessons === 'yes' && data.previous_swim_experience) {
    await page.locator('textarea[name="previous_swim_experience"]').fill(data.previous_swim_experience);
  }

  if (data.comfortable_in_water) {
    await page.locator('select[name="comfortable_in_water"]').selectOption(data.comfortable_in_water);
  }

  if (data.swim_goals && data.swim_goals.length > 0) {
    for (const goal of data.swim_goals) {
      await page.locator(`input[value="${goal}"]`).check();
    }
  }
}

/**
 * Fill Section 6: Scheduling & Availability
 */
export async function fillSchedulingInformation(page: Page, data: TestSwimmerData) {
  if (data.availability_slots && data.availability_slots.length > 0) {
    for (const slot of data.availability_slots) {
      await page.locator(`input[value="${slot}"]`).check();
    }
  }

  if (data.other_availability) {
    await page.locator('textarea[name="other_availability"]').fill(data.other_availability);
  }

  if (data.flexible_swimmer !== undefined) {
    if (data.flexible_swimmer) {
      await page.locator('input[name="flexible_swimmer"]').check();
    } else {
      await page.locator('input[name="flexible_swimmer"]').uncheck();
    }
  }
}

/**
 * Fill Section 7: Consent & Agreement
 */
export async function fillConsentInformation(page: Page, data: TestSwimmerData) {
  if (data.signed_waiver) {
    await page.locator('input[name="signed_waiver"]').check();
  }

  if (data.photo_release) {
    await page.locator('input[name="photo_release"]').check();
  }

  if (data.cancellation_policy_agreement) {
    await page.locator('input[name="cancellation_policy_agreement"]').check();
  }

  await page.locator('input[name="emergency_contact_name"]').fill(data.emergency_contact_name);
  await page.locator('input[name="emergency_contact_phone"]').fill(data.emergency_contact_phone);
  await page.locator('input[name="emergency_contact_relationship"]').fill(data.emergency_contact_relationship);
}

/**
 * Navigate to next section in the enrollment form
 */
export async function goToNextSection(page: Page) {
  await page.locator('button:has-text("Next")').click();
  await page.waitForTimeout(500); // Wait for section transition
}

/**
 * Submit the enrollment form
 */
export async function submitEnrollmentForm(page: Page) {
  await page.locator('button:has-text("Submit Enrollment")').click();
}

/**
 * Complete entire enrollment flow with default or custom data
 */
export async function completeEnrollmentFlow(
  page: Page,
  data: TestSwimmerData = DEFAULT_TEST_SWIMMER,
  enrollmentType: 'private' | 'vmrc' = 'private'
) {
  await navigateToEnrollment(page, enrollmentType);

  // Section 1: Parent Information
  await fillParentInformation(page, data);
  await goToNextSection(page);

  // Section 2: Child Information
  await fillChildInformation(page, data);
  await goToNextSection(page);

  // Section 3: Medical & Safety Information
  await fillMedicalInformation(page, data);
  await goToNextSection(page);

  // Section 4: Behavioral Information
  await fillBehavioralInformation(page, data);
  await goToNextSection(page);

  // Section 5: Swimming Background
  await fillSwimmingBackground(page, data);
  await goToNextSection(page);

  // Section 6: Scheduling & Availability
  await fillSchedulingInformation(page, data);
  await goToNextSection(page);

  // Section 7: Consent & Agreement
  await fillConsentInformation(page, data);

  // Submit the form
  await submitEnrollmentForm(page);

  // Wait for submission to complete
  await page.waitForTimeout(2000);

  // Check for success
  const successMessage = page.locator('text*=successfully|text*=Thank you|text*=submitted', { ignoreCase: true });
  await expect(successMessage).toBeVisible({ timeout: 5000 });

  return successMessage;
}

/**
 * Generate unique test email for signup tests
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  return `test-parent-${timestamp}@example.com`;
}