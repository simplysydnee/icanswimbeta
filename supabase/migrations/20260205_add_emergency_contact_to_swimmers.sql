-- Add emergency contact columns to swimmers table
-- Migration: 20260205_add_emergency_contact_to_swimmers.sql
-- Description: Adds emergency contact information columns to swimmers table for waiver update system

ALTER TABLE public.swimmers
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- Add comment on columns for documentation
COMMENT ON COLUMN public.swimmers.emergency_contact_name IS 'Full name of emergency contact';
COMMENT ON COLUMN public.swimmers.emergency_contact_phone IS 'Phone number of emergency contact';
COMMENT ON COLUMN public.swimmers.emergency_contact_relationship IS 'Relationship of emergency contact to swimmer (e.g., Parent, Guardian, Relative)';