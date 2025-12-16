-- Migration: 015_add_funding_source_price_fields.sql
-- Description: Adds price and authorization fields to funding_sources table for multi-funding support
-- Based on audit findings, we need these fields to properly support multiple funding sources

-- Step 1: Add missing fields to funding_sources table
ALTER TABLE public.funding_sources
  ADD COLUMN IF NOT EXISTS price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS requires_authorization BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS authorization_label VARCHAR(100) DEFAULT 'Purchase Order',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 2: Update existing funding sources with correct pricing and authorization settings
UPDATE public.funding_sources
SET
  price_cents = CASE
    WHEN short_name = 'VMRC' THEN 9644
    WHEN short_name = 'CVRC' THEN 9644
    WHEN short_name = 'private_pay' THEN 7500
    ELSE 0
  END,
  requires_authorization = CASE
    WHEN short_name IN ('VMRC', 'CVRC') THEN true
    ELSE false
  END,
  authorization_label = CASE
    WHEN short_name IN ('VMRC', 'CVRC') THEN 'Purchase Order'
    ELSE NULL
  END
WHERE price_cents IS NULL;

-- Step 3: Add private_pay and scholarship funding sources if they don't exist
INSERT INTO public.funding_sources (
  name,
  short_name,
  description,
  price_cents,
  requires_authorization,
  authorization_label,
  is_active
) VALUES
(
  'Private Pay',
  'private_pay',
  'Private payment from families',
  7500,
  false,
  NULL,
  true
),
(
  'Scholarship',
  'scholarship',
  'Scholarship-funded lessons',
  0,
  false,
  NULL,
  true
) ON CONFLICT (short_name) DO NOTHING;

-- Step 4: Update swimmers table to add generic authorization fields (if not already added by migration 012)
-- These fields should already exist from migration 012, but adding IF NOT EXISTS for safety
ALTER TABLE public.swimmers
  ADD COLUMN IF NOT EXISTS funding_coordinator_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS funding_coordinator_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS funding_coordinator_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS authorized_sessions_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS authorized_sessions_total INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_authorization_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS authorization_expires_at TIMESTAMP WITH TIME ZONE;

-- Step 5: Migrate data from old VMRC-specific fields to generic fields
-- This ensures data is in both places during transition period
UPDATE public.swimmers
SET
  funding_coordinator_name = coordinator_name,
  funding_coordinator_email = coordinator_email,
  funding_coordinator_phone = coordinator_phone,
  authorized_sessions_used = sessions_used,
  authorized_sessions_total = sessions_authorized,
  current_authorization_number = current_pos_number,
  authorization_expires_at = pos_expires_at
WHERE funding_source_id IS NOT NULL
  AND (coordinator_name IS NOT NULL OR sessions_used IS NOT NULL);

-- Step 6: Create a view for backward compatibility and easier querying
CREATE OR REPLACE VIEW public.swimmers_with_funding_details AS
SELECT
  s.*,
  fs.name as funding_source_name,
  fs.short_name as funding_source_code,
  fs.type as funding_source_type,
  fs.requires_authorization,
  fs.price_cents as funding_source_price_cents,
  fs.authorization_label,
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
  END as authorization_expired
FROM public.swimmers s
LEFT JOIN public.funding_sources fs ON s.funding_source_id = fs.id;

-- Step 7: Add comment for documentation
COMMENT ON VIEW public.swimmers_with_funding_details IS 'Provides comprehensive funding information for swimmers including pricing and authorization status';

-- Step 8: Create helper function to check if swimmer can book based on funding
CREATE OR REPLACE FUNCTION public.can_swimmer_book(s_id UUID)
RETURNS TABLE (
  can_book BOOLEAN,
  reason TEXT,
  remaining_sessions INTEGER,
  authorization_expired BOOLEAN
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
           (s.authorization_expires_at IS NULL OR s.authorization_expires_at > NOW()) THEN true
      ELSE false
    END as can_book,
    CASE
      WHEN fs.requires_authorization = false THEN 'No authorization required'
      WHEN fs.requires_authorization = true AND s.authorized_sessions_total <= s.authorized_sessions_used THEN 'No sessions remaining'
      WHEN fs.requires_authorization = true AND s.authorization_expires_at <= NOW() THEN 'Authorization expired'
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
    END as authorization_expired
  FROM public.swimmers s
  LEFT JOIN public.funding_sources fs ON s.funding_source_id = fs.id
  WHERE s.id = s_id;
END;
$$;

-- Step 9: Add index for better performance on authorization checks
CREATE INDEX IF NOT EXISTS idx_swimmers_funding_authorization
ON public.swimmers(funding_source_id, authorized_sessions_used, authorized_sessions_total, authorization_expires_at);

-- Step 10: Update RLS policies to include new fields
-- Ensure the policies from migration 012 still work with new fields
COMMENT ON COLUMN public.funding_sources.price_cents IS 'Price per session in cents for this funding source. NULL means variable pricing.';
COMMENT ON COLUMN public.funding_sources.requires_authorization IS 'Whether this funding source requires purchase order/authorization';
COMMENT ON COLUMN public.funding_sources.authorization_label IS 'Label for authorization document (e.g., Purchase Order, Authorization Letter)';