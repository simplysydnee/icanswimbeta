-- Migration: Rename VMRC-specific columns to generic funding columns
-- This supports multiple funding sources (VMRC, Central Valley RC, etc.)
-- Date: 2024-12-21

-- First, check if funding_sources table exists, create it if not
CREATE TABLE IF NOT EXISTS public.funding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  vendor_number TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default funding sources if they don't exist
INSERT INTO public.funding_sources (name, code, vendor_number)
VALUES
  ('Valley Mountain Regional Center', 'VMRC', 'VMRC-001'),
  ('Central Valley Regional Center', 'CVRC', 'CVRC-001'),
  ('Other Regional Center', 'OTHER', NULL)
ON CONFLICT (code) DO NOTHING;

-- Rename VMRC-specific columns to generic funding columns
-- This supports multiple funding sources (VMRC, Central Valley RC, etc.)

-- Only run if columns haven't been renamed yet
DO $$
BEGIN
  -- Check if old column exists before renaming
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'swimmers' AND column_name = 'is_vmrc_client') THEN
    -- Update payment_type to use 'funded' instead of 'vmrc'
    UPDATE swimmers SET payment_type = 'funded' WHERE payment_type = 'vmrc';

    -- Add constraint for payment_type if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'swimmers' AND constraint_name = 'swimmers_payment_type_check') THEN
      ALTER TABLE swimmers ADD CONSTRAINT swimmers_payment_type_check
        CHECK (payment_type IN ('private_pay', 'funded', 'scholarship', 'other'));
    END IF;
  END IF;

  -- Rename coordinator fields if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'swimmers' AND column_name = 'vmrc_coordinator_name') THEN
    ALTER TABLE swimmers RENAME COLUMN vmrc_coordinator_name TO coordinator_name;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'swimmers' AND column_name = 'vmrc_coordinator_email') THEN
    ALTER TABLE swimmers RENAME COLUMN vmrc_coordinator_email TO coordinator_email;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'swimmers' AND column_name = 'vmrc_coordinator_phone') THEN
    ALTER TABLE swimmers RENAME COLUMN vmrc_coordinator_phone TO coordinator_phone;
  END IF;

  -- Rename session tracking fields
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'swimmers' AND column_name = 'vmrc_sessions_used') THEN
    ALTER TABLE swimmers RENAME COLUMN vmrc_sessions_used TO funded_sessions_used;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'swimmers' AND column_name = 'vmrc_sessions_authorized') THEN
    ALTER TABLE swimmers RENAME COLUMN vmrc_sessions_authorized TO funded_sessions_authorized;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'swimmers' AND column_name = 'vmrc_current_pos_number') THEN
    ALTER TABLE swimmers RENAME COLUMN vmrc_current_pos_number TO current_po_number;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'swimmers' AND column_name = 'vmrc_pos_expires_at') THEN
    ALTER TABLE swimmers RENAME COLUMN vmrc_pos_expires_at TO po_expires_at;
  END IF;

END $$;

-- Add funding_source_id if not exists
ALTER TABLE swimmers ADD COLUMN IF NOT EXISTS funding_source_id UUID REFERENCES funding_sources(id);

-- Add index for funding source queries
CREATE INDEX IF NOT EXISTS idx_swimmers_funding_source ON swimmers(funding_source_id) WHERE funding_source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_swimmers_payment_type ON swimmers(payment_type);

-- Update user roles to use generic 'coordinator' instead of 'vmrc_coordinator'
UPDATE profiles SET role = 'coordinator' WHERE role = 'vmrc_coordinator';

-- Update role check constraint if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check') THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('parent', 'instructor', 'admin', 'coordinator'));

-- Rename vmrc_referral_requests table to referral_requests if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vmrc_referral_requests') THEN
    ALTER TABLE vmrc_referral_requests RENAME TO referral_requests;

    -- Add funding_source_id to referral_requests if it doesn't exist
    ALTER TABLE referral_requests ADD COLUMN IF NOT EXISTS funding_source_id UUID REFERENCES funding_sources(id);

    -- Set default funding source to VMRC for existing referrals
    UPDATE referral_requests
    SET funding_source_id = (SELECT id FROM funding_sources WHERE code = 'VMRC')
    WHERE funding_source_id IS NULL;
  END IF;
END $$;

-- Comment for documentation
COMMENT ON COLUMN swimmers.payment_type IS 'Payment type: private_pay, funded, scholarship, other';
COMMENT ON COLUMN swimmers.funding_source_id IS 'Reference to funding_sources table for funded swimmers';
COMMENT ON COLUMN swimmers.coordinator_name IS 'Coordinator name for funded swimmers (generic, not VMRC-specific)';
COMMENT ON COLUMN swimmers.funded_sessions_used IS 'Number of funded sessions used (generic, not VMRC-specific)';
COMMENT ON COLUMN swimmers.funded_sessions_authorized IS 'Number of funded sessions authorized (generic, not VMRC-specific)';

-- Create view for backwards compatibility (optional, can be removed later)
CREATE OR REPLACE VIEW vmrc_swimmers AS
SELECT
  s.*,
  fs.name as funding_source_name,
  fs.code as funding_source_code
FROM swimmers s
LEFT JOIN funding_sources fs ON s.funding_source_id = fs.id
WHERE s.payment_type = 'funded';

COMMENT ON VIEW vmrc_swimmers IS 'Legacy view for VMRC swimmers - use swimmers table with payment_type = ''funded'' instead';