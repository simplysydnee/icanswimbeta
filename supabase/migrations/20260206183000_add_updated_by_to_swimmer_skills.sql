-- Migration: Add updated_by and created_at columns to swimmer_skills table
-- This tracks which instructor/staff member last updated a skill status and when the record was created
-- Required for accountability and audit trails

-- Add created_at column if it doesn't exist
ALTER TABLE public.swimmer_skills
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add updated_by column if it doesn't exist
ALTER TABLE public.swimmer_skills
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add comments explaining the columns
COMMENT ON COLUMN public.swimmer_skills.created_at IS 'Timestamp when the skill record was created';
COMMENT ON COLUMN public.swimmer_skills.updated_by IS 'Profile ID of the instructor/staff member who last updated this skill status';

-- Update trigger function to preserve updated_by when set by application
-- The application should set updated_by via API; trigger only sets updated_at
-- No changes needed to existing trigger function