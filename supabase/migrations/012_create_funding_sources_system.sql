-- Migration: 012_create_funding_sources_system.sql
-- Description: Creates tables and updates schema for multiple funding sources/vendors
-- This replaces the hardcoded VMRC system with a generic funding source system

-- Step 1: Create funding_sources table to store different vendors/agencies
CREATE TABLE public.funding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name TEXT NOT NULL, -- e.g., "Valley Mountain Regional Center", "Central Valley Regional Center"
  short_name TEXT, -- e.g., "VMRC", "CVRC"
  description TEXT,

  -- Contact Information
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,

  -- Configuration
  allowed_email_domains TEXT[], -- Array of email domains for coordinators (e.g., ['@vmrc.net', '@cvrc.org'])
  default_coordinator_role TEXT DEFAULT 'coordinator', -- Role name for coordinators from this funding source
  assessment_sessions INTEGER DEFAULT 1, -- Number of assessment sessions authorized
  lessons_per_po INTEGER DEFAULT 12, -- Number of lessons per purchase order
  po_duration_months INTEGER DEFAULT 3, -- Duration of purchase orders in months
  renewal_alert_threshold INTEGER DEFAULT 11, -- Alert at this many sessions used

  -- Billing Information
  billing_contact_name TEXT,
  billing_contact_email TEXT,
  billing_contact_phone TEXT,
  billing_address TEXT,
  billing_notes TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),

  -- Constraints
  UNIQUE(name),
  UNIQUE(short_name)
);

-- Step 2: Update swimmers table to reference funding sources instead of hardcoded VMRC fields
-- First, add new columns
ALTER TABLE public.swimmers
  ADD COLUMN funding_source_id UUID REFERENCES public.funding_sources(id),
  ADD COLUMN coordinator_name TEXT,
  ADD COLUMN coordinator_email TEXT,
  ADD COLUMN coordinator_phone TEXT,
  ADD COLUMN sessions_used INTEGER DEFAULT 0,
  ADD COLUMN sessions_authorized INTEGER DEFAULT 0,
  ADD COLUMN current_pos_number TEXT,
  ADD COLUMN pos_expires_at DATE;

-- Step 3: Migrate existing VMRC data to the new structure
-- First, insert VMRC as a funding source
INSERT INTO public.funding_sources (
  name,
  short_name,
  description,
  allowed_email_domains,
  default_coordinator_role,
  assessment_sessions,
  lessons_per_po,
  po_duration_months,
  renewal_alert_threshold
) VALUES (
  'Valley Mountain Regional Center',
  'VMRC',
  'State-funded regional center providing services for individuals with developmental disabilities',
  ARRAY['@vmrc.net'],
  'vmrc_coordinator',
  1,
  12,
  3,
  11
);

-- Step 4: Update existing VMRC swimmers to reference the new funding source
-- Get the VMRC funding source ID
DO $$
DECLARE
  vmrc_id UUID;
BEGIN
  SELECT id INTO vmrc_id FROM public.funding_sources WHERE short_name = 'VMRC';

  -- Update swimmers that are VMRC clients
  UPDATE public.swimmers
  SET
    funding_source_id = vmrc_id,
    coordinator_name = vmrc_coordinator_name,
    coordinator_email = vmrc_coordinator_email,
    coordinator_phone = vmrc_coordinator_phone,
    sessions_used = vmrc_sessions_used,
    sessions_authorized = vmrc_sessions_authorized,
    current_pos_number = vmrc_current_pos_number,
    pos_expires_at = vmrc_pos_expires_at
  WHERE is_vmrc_client = true;
END $$;

-- Step 5: Drop old VMRC-specific columns from swimmers table
ALTER TABLE public.swimmers
  DROP COLUMN is_vmrc_client,
  DROP COLUMN vmrc_coordinator_name,
  DROP COLUMN vmrc_coordinator_email,
  DROP COLUMN vmrc_coordinator_phone,
  DROP COLUMN vmrc_sessions_used,
  DROP COLUMN vmrc_sessions_authorized,
  DROP COLUMN vmrc_current_pos_number,
  DROP COLUMN vmrc_pos_expires_at;

-- Step 6: Update purchase_orders table to reference funding sources
ALTER TABLE public.purchase_orders
  ADD COLUMN funding_source_id UUID REFERENCES public.funding_sources(id);

-- Migrate existing purchase orders to VMRC funding source
DO $$
DECLARE
  vmrc_id UUID;
BEGIN
  SELECT id INTO vmrc_id FROM public.funding_sources WHERE short_name = 'VMRC';

  -- All existing purchase orders are for VMRC
  UPDATE public.purchase_orders
  SET funding_source_id = vmrc_id
  WHERE funding_source_id IS NULL;
END $$;

-- Step 7: Update referral tables to be generic
-- Rename vmrc_referral_requests to funding_source_referral_requests
ALTER TABLE public.vmrc_referral_requests
  RENAME TO funding_source_referral_requests;

-- Add funding_source_id column
ALTER TABLE public.funding_source_referral_requests
  ADD COLUMN funding_source_id UUID REFERENCES public.funding_sources(id);

-- Migrate existing referrals to VMRC funding source
DO $$
DECLARE
  vmrc_id UUID;
BEGIN
  SELECT id INTO vmrc_id FROM public.funding_sources WHERE short_name = 'VMRC';

  UPDATE public.funding_source_referral_requests
  SET funding_source_id = vmrc_id
  WHERE funding_source_id IS NULL;
END $$;

-- Step 8: Update user roles to support multiple coordinator types
-- First, update the default coordinator role for VMRC
UPDATE public.funding_sources
SET default_coordinator_role = 'coordinator'
WHERE short_name = 'VMRC';

-- Step 9: Create indexes for better performance
CREATE INDEX idx_funding_sources_name ON public.funding_sources(name);
CREATE INDEX idx_funding_sources_short_name ON public.funding_sources(short_name);
CREATE INDEX idx_funding_sources_is_active ON public.funding_sources(is_active);

CREATE INDEX idx_swimmers_funding_source_id ON public.swimmers(funding_source_id);
CREATE INDEX idx_swimmers_payment_type_funding ON public.swimmers(payment_type, funding_source_id);

CREATE INDEX idx_purchase_orders_funding_source_id ON public.purchase_orders(funding_source_id);

CREATE INDEX idx_funding_source_referrals_funding_source_id ON public.funding_source_referral_requests(funding_source_id);

-- Step 10: Enable RLS on new table
ALTER TABLE public.funding_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for funding_sources
-- Everyone can view active funding sources
CREATE POLICY "Anyone can view active funding sources" ON public.funding_sources
  FOR SELECT USING (is_active = true);

-- Admins can do everything with funding sources
CREATE POLICY "Admins have full access to funding sources" ON public.funding_sources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Step 11: Create updated_at trigger for funding_sources
CREATE TRIGGER update_funding_sources_updated_at
  BEFORE UPDATE ON public.funding_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Update payment_type check constraint to include generic funding source option
ALTER TABLE public.swimmers
  DROP CONSTRAINT IF EXISTS swimmers_payment_type_check;

ALTER TABLE public.swimmers
  ADD CONSTRAINT swimmers_payment_type_check
  CHECK (payment_type IN ('private_pay', 'funding_source', 'scholarship', 'other'));

-- Step 13: Add comment explaining the new system
COMMENT ON TABLE public.funding_sources IS 'Stores different funding sources/vendors (e.g., VMRC, CVRC) that provide state-funded services';
COMMENT ON COLUMN public.swimmers.funding_source_id IS 'References the funding source for state-funded clients';
COMMENT ON COLUMN public.swimmers.coordinator_name IS 'Name of the coordinator from the funding source';
COMMENT ON COLUMN public.swimmers.sessions_used IS 'Number of sessions used under current funding';
COMMENT ON COLUMN public.swimmers.sessions_authorized IS 'Number of sessions authorized by funding source';

-- Step 14: Insert a test funding source for Central Valley Regional Center
INSERT INTO public.funding_sources (
  name,
  short_name,
  description,
  contact_name,
  contact_email,
  contact_phone,
  allowed_email_domains,
  default_coordinator_role,
  assessment_sessions,
  lessons_per_po,
  po_duration_months,
  renewal_alert_threshold
) VALUES (
  'Central Valley Regional Center',
  'CVRC',
  'Regional center serving the Central Valley area',
  'CVRC Coordinator',
  'coordinator@cvrc.org',
  '(555) 123-4567',
  ARRAY['@cvrc.org'],
  'coordinator',
  1,
  12,
  3,
  11
);