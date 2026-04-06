-- Migration: Add new consent/waiver fields to swimmers table
-- Description: Adds fields for Terms of Service, Privacy Policy, SMS consent, cancellation quiz, and guardian relationship

-- Add new consent fields to swimmers table
ALTER TABLE public.swimmers
ADD COLUMN IF NOT EXISTS terms_of_service_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_of_service_agreed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_of_service_signature TEXT,
ADD COLUMN IF NOT EXISTS cancellation_quiz_passed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancellation_quiz_passed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_acknowledged_24hr BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancellation_acknowledged_consequences BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_policy_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_policy_agreed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_policy_signature TEXT,
ADD COLUMN IF NOT EXISTS sms_consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_consent_given_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS guardian_relationship TEXT;

-- Add comment for guardian_relationship field
COMMENT ON COLUMN public.swimmers.guardian_relationship IS 'Relationship to minor (e.g., Parent, Legal Guardian, Grandparent)';

-- Update RLS policies if needed (existing policies should cover new columns)
-- Note: New columns inherit existing RLS policies automatically

-- Create indexes for querying consent status
CREATE INDEX IF NOT EXISTS idx_swimmers_terms_of_service_agreed ON public.swimmers(terms_of_service_agreed) WHERE terms_of_service_agreed = true;
CREATE INDEX IF NOT EXISTS idx_swimmers_privacy_policy_agreed ON public.swimmers(privacy_policy_agreed) WHERE privacy_policy_agreed = true;
CREATE INDEX IF NOT EXISTS idx_swimmers_sms_consent_given ON public.swimmers(sms_consent_given) WHERE sms_consent_given = true;
CREATE INDEX IF NOT EXISTS idx_swimmers_cancellation_quiz_passed ON public.swimmers(cancellation_quiz_passed) WHERE cancellation_quiz_passed = true;