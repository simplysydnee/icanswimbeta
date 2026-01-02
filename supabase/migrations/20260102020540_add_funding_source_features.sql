-- Migration: 20260102020540_add_funding_source_features.sql
-- Description: Adds logo upload, budget amount, and Self Determination funding types to funding sources

-- Step 1: Add new columns to funding_sources table
ALTER TABLE public.funding_sources
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS budget_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS is_self_determination BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_coordinator BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS funding_type VARCHAR(50) DEFAULT 'regional_center';

-- Step 2: Update existing funding sources with correct funding types
UPDATE public.funding_sources
SET
  funding_type = CASE
    WHEN short_name = 'private_pay' THEN 'private_pay'
    WHEN short_name = 'scholarship' THEN 'scholarship'
    ELSE 'regional_center'
  END,
  requires_coordinator = CASE
    WHEN short_name IN ('private_pay', 'scholarship') THEN false
    ELSE true
  END;

-- Step 3: Add Self Determination funding sources
-- Self Determination (VMRC)
INSERT INTO public.funding_sources (
  name,
  short_name,
  description,
  funding_type,
  is_self_determination,
  requires_coordinator,
  price_cents,
  requires_authorization,
  authorization_label,
  is_active
) VALUES (
  'Self Determination (VMRC)',
  'self_determination_vmrc',
  'Self Determination funding through Valley Mountain Regional Center',
  'self_determination',
  true,
  false,
  9644,
  true,
  'Budget Authorization',
  true
) ON CONFLICT (short_name) DO NOTHING;

-- Self Determination (CVRC)
INSERT INTO public.funding_sources (
  name,
  short_name,
  description,
  funding_type,
  is_self_determination,
  requires_coordinator,
  price_cents,
  requires_authorization,
  authorization_label,
  is_active
) VALUES (
  'Self Determination (CVRC)',
  'self_determination_cvrc',
  'Self Determination funding through Central Valley Regional Center',
  'self_determination',
  true,
  false,
  9644,
  true,
  'Budget Authorization',
  true
) ON CONFLICT (short_name) DO NOTHING;

-- Step 4: Update funding_type check constraint
-- First, drop existing constraint if it exists
ALTER TABLE public.funding_sources
  DROP CONSTRAINT IF EXISTS funding_sources_funding_type_check;

-- Add new constraint with all valid funding types
ALTER TABLE public.funding_sources
  ADD CONSTRAINT funding_sources_funding_type_check
  CHECK (funding_type IN ('private_pay', 'regional_center', 'scholarship', 'self_determination'));

-- Step 5: Create index for better performance on funding_type queries
CREATE INDEX IF NOT EXISTS idx_funding_sources_funding_type ON public.funding_sources(funding_type);
CREATE INDEX IF NOT EXISTS idx_funding_sources_is_self_determination ON public.funding_sources(is_self_determination);
CREATE INDEX IF NOT EXISTS idx_funding_sources_requires_coordinator ON public.funding_sources(requires_coordinator);

-- Step 6: Update swimmers_with_funding_details view to include new fields
CREATE OR REPLACE VIEW public.swimmers_with_funding_details AS
SELECT
  s.*,
  fs.name as funding_source_name,
  fs.short_name as funding_source_code,
  fs.funding_type as funding_source_type,
  fs.is_self_determination,
  fs.requires_coordinator,
  fs.requires_authorization,
  fs.price_cents as funding_source_price_cents,
  fs.budget_amount_cents as funding_source_budget_cents,
  fs.authorization_label,
  fs.logo_url as funding_source_logo_url,
  fs.contact_name as funding_source_contact_name,
  fs.contact_email as funding_source_contact_email,
  fs.contact_phone as funding_source_contact_phone,
  -- Calculate remaining sessions
  CASE
    WHEN fs.requires_authorization AND s.authorized_sessions_total > 0
    THEN s.authorized_sessions_total - s.authorized_sessions_used
    ELSE NULL
  END as sessions_remaining,
  -- Check if authorization is expired
  CASE
    WHEN fs.requires_authorization AND s.authorization_expires_at IS NOT NULL
    THEN s.authorization_expires_at < NOW()
    ELSE false
  END as authorization_expired,
  -- Calculate remaining budget (if applicable)
  CASE
    WHEN fs.budget_amount_cents IS NOT NULL AND fs.budget_amount_cents > 0
    THEN fs.budget_amount_cents - (s.authorized_sessions_used * fs.price_cents)
    ELSE NULL
  END as budget_remaining_cents
FROM public.swimmers s
LEFT JOIN public.funding_sources fs ON s.funding_source_id = fs.id;

-- Step 7: Update can_swimmer_book function to consider budget amounts
CREATE OR REPLACE FUNCTION public.can_swimmer_book(s_id UUID)
RETURNS TABLE (
  can_book BOOLEAN,
  reason TEXT,
  remaining_sessions INTEGER,
  authorization_expired BOOLEAN,
  remaining_budget_cents INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN fs.requires_authorization = false THEN true
      WHEN fs.requires_authorization = true AND
           s.authorized_sessions_total > s.authorized_sessions_used AND
           (s.authorization_expires_at IS NULL OR s.authorization_expires_at > NOW()) AND
           (fs.budget_amount_cents IS NULL OR
            (fs.budget_amount_cents - (s.authorized_sessions_used * fs.price_cents)) >= fs.price_cents) THEN true
      ELSE false
    END as can_book,
    CASE
      WHEN fs.requires_authorization = false THEN 'No authorization required'
      WHEN fs.requires_authorization = true AND s.authorized_sessions_total <= s.authorized_sessions_used THEN 'No sessions remaining'
      WHEN fs.requires_authorization = true AND s.authorization_expires_at <= NOW() THEN 'Authorization expired'
      WHEN fs.requires_authorization = true AND fs.budget_amount_cents IS NOT NULL AND
           (fs.budget_amount_cents - (s.authorized_sessions_used * fs.price_cents)) < fs.price_cents THEN 'Insufficient budget'
      WHEN fs.requires_authorization = true THEN 'Has available sessions'
      ELSE 'Unknown funding status'
    END as reason,
    CASE
      WHEN fs.requires_authorization = true THEN s.authorized_sessions_total - s.authorized_sessions_used
      ELSE NULL
    END as remaining_sessions,
    CASE
      WHEN fs.requires_authorization = true AND s.authorization_expires_at <= NOW() THEN true
      ELSE false
    END as authorization_expired,
    CASE
      WHEN fs.budget_amount_cents IS NOT NULL THEN fs.budget_amount_cents - (s.authorized_sessions_used * fs.price_cents)
      ELSE NULL
    END as remaining_budget_cents
  FROM public.swimmers s
  LEFT JOIN public.funding_sources fs ON s.funding_source_id = fs.id
  WHERE s.id = s_id;
END;
$$;

-- Step 8: Add comments for documentation
COMMENT ON COLUMN public.funding_sources.logo_url IS 'URL of the funding source logo stored in Supabase Storage';
COMMENT ON COLUMN public.funding_sources.budget_amount_cents IS 'Optional budget amount in cents for funding sources with fixed budgets (e.g., Self Determination, Scholarship)';
COMMENT ON COLUMN public.funding_sources.is_self_determination IS 'Whether this is a Self Determination funding source (no coordinator required)';
COMMENT ON COLUMN public.funding_sources.requires_coordinator IS 'Whether this funding source requires coordinator information during enrollment';
COMMENT ON COLUMN public.funding_sources.funding_type IS 'Type of funding source: private_pay, regional_center, scholarship, self_determination';

-- Step 9: Create storage bucket for funding source logos if it doesn't exist
-- Note: This requires the storage admin API, so we'll handle this in the application code
-- The bucket name should be 'funding-source-logos'