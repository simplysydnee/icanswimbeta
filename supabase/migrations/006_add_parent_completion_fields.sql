-- Migration: Add parent completion fields to vmrc_referral_requests
-- This enables the parent completion flow for VMRC referrals

-- Add parent completion fields to vmrc_referral_requests
ALTER TABLE vmrc_referral_requests
ADD COLUMN IF NOT EXISTS parent_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS parent_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS swim_goals TEXT[],
ADD COLUMN IF NOT EXISTS availability TEXT[],
ADD COLUMN IF NOT EXISTS preferred_start_date DATE,
ADD COLUMN IF NOT EXISTS strengths_interests TEXT,
ADD COLUMN IF NOT EXISTS motivation_factors TEXT,
ADD COLUMN IF NOT EXISTS liability_waiver_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS liability_waiver_signature TEXT,
ADD COLUMN IF NOT EXISTS liability_waiver_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_policy_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancellation_policy_signature TEXT,
ADD COLUMN IF NOT EXISTS cancellation_policy_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS photo_release_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS photo_release_signature TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- Create index for parent_token lookups
CREATE INDEX IF NOT EXISTS idx_vmrc_referrals_parent_token
ON vmrc_referral_requests(parent_token);

-- Note: RLS policy "Anyone can update vmrc referrals" already exists
-- which allows parents to update their referral by token