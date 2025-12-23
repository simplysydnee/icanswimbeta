import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!

// Create Supabase client with service role for database operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface TestReferralData {
  id: string
  parent_token: string
  child_name: string
  child_date_of_birth: string
  parent_name: string
  parent_email: string
  coordinator_name: string
  status: string
  parent_completed_at: string | null
  [key: string]: any
}

/**
 * Create a test referral for parent completion testing
 */
export async function createTestReferral(): Promise<{ referral: TestReferralData; token: string }> {
  const testToken = crypto.randomUUID()

  const { data, error } = await supabase
    .from('referral_requests')
    .insert({
      parent_token: testToken,
      child_name: 'Test Child',
      child_date_of_birth: '2018-05-15',
      parent_name: 'Test Parent',
      parent_email: 'testparent@example.com',
      parent_phone: '(209) 555-1234',
      coordinator_name: 'Test Coordinator',
      coordinator_email: 'coordinator@vmrc.net',
      status: 'pending_parent',
      // Required fields from original schema
      diagnosis: ['Autism'],
      non_ambulatory: 'no',
      has_seizure_disorder: 'no',
      height: '48 inches',
      weight: '50 lbs',
      toilet_trained: 'yes',
      has_medical_conditions: 'no',
      medical_conditions_description: '',
      has_allergies: 'no',
      allergies_description: '',
      has_other_therapies: 'no',
      other_therapies_description: '',
      comfortable_in_water: 'yes',
      self_injurious_behavior: 'no',
      self_injurious_behavior_description: '',
      aggressive_behavior: 'no',
      aggressive_behavior_description: '',
      elopement_behavior: 'no',
      elopement_behavior_description: '',
      has_safety_plan: 'no',
      safety_plan_description: '',
      referral_type: 'vmrc_client',
      photo_release: 'no',
      liability_agreement: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating test referral:', error)
    throw error
  }

  return { referral: data as TestReferralData, token: testToken }
}

/**
 * Create a test referral that's already completed
 */
export async function createCompletedReferral(): Promise<{ referral: TestReferralData; token: string }> {
  const testToken = crypto.randomUUID()

  const { data, error } = await supabase
    .from('referral_requests')
    .insert({
      parent_token: testToken,
      child_name: 'Completed Child',
      child_date_of_birth: '2019-03-20',
      parent_name: 'Completed Parent',
      parent_email: 'completed@example.com',
      parent_phone: '(209) 555-5678',
      coordinator_name: 'Test Coordinator',
      coordinator_email: 'coordinator@vmrc.net',
      status: 'pending',
      parent_completed_at: new Date().toISOString(),
      // Required fields from original schema
      diagnosis: ['Autism'],
      non_ambulatory: 'no',
      has_seizure_disorder: 'no',
      height: '48 inches',
      weight: '50 lbs',
      toilet_trained: 'yes',
      has_medical_conditions: 'no',
      medical_conditions_description: '',
      has_allergies: 'no',
      allergies_description: '',
      has_other_therapies: 'no',
      other_therapies_description: '',
      comfortable_in_water: 'yes',
      self_injurious_behavior: 'no',
      self_injurious_behavior_description: '',
      aggressive_behavior: 'no',
      aggressive_behavior_description: '',
      elopement_behavior: 'no',
      elopement_behavior_description: '',
      has_safety_plan: 'no',
      safety_plan_description: '',
      referral_type: 'vmrc_client',
      photo_release: 'no',
      liability_agreement: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating completed referral:', error)
    throw error
  }

  return { referral: data as TestReferralData, token: testToken }
}

/**
 * Delete a test referral by ID
 */
export async function deleteTestReferral(id: string): Promise<void> {
  const { error } = await supabase
    .from('referral_requests')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting test referral:', error)
    throw error
  }
}

/**
 * Get referral by parent token
 */
export async function getReferralByToken(token: string): Promise<TestReferralData | null> {
  const { data, error } = await supabase
    .from('referral_requests')
    .select('*')
    .eq('parent_token', token)
    .single()

  if (error) {
    console.error('Error getting referral by token:', error)
    return null
  }

  return data as TestReferralData
}

/**
 * Clean up all test referrals (useful for afterAll)
 */
export async function cleanupTestReferrals(): Promise<void> {
  // Delete referrals created during tests
  const { error } = await supabase
    .from('referral_requests')
    .delete()
    .like('parent_email', '%@example.com')

  if (error) {
    console.error('Error cleaning up test referrals:', error)
  }
}

/**
 * Wait for referral to be updated (polling)
 */
export async function waitForReferralUpdate(token: string, timeoutMs = 10000): Promise<TestReferralData | null> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const referral = await getReferralByToken(token)

    if (referral?.parent_completed_at) {
      return referral
    }

    // Wait 500ms before checking again
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return null
}