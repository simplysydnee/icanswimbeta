-- Migration: Add updated_by column to swimmer_targets table
-- This tracks which instructor/staff member last updated a target status
-- Required for accountability and audit trails

-- Add updated_by column if it doesn't exist
ALTER TABLE public.swimmer_targets
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add comment explaining the column
COMMENT ON COLUMN public.swimmer_targets.updated_by IS 'Profile ID of the instructor/staff member who last updated this target status';

-- Note: The application should set updated_by via API
-- We'll update existing records to have null for updated_by (can't determine historical updates)
-- This is fine as we only need to track future updates

-- Add date_started column if it doesn't exist (for consistency with swimmer_skills)
ALTER TABLE public.swimmer_targets
ADD COLUMN IF NOT EXISTS date_started DATE;

-- Add comment for date_started
COMMENT ON COLUMN public.swimmer_targets.date_started IS 'Date when swimmer started working on this target (when status changed to in_progress)';

-- Create a trigger function to automatically set date_started when status changes to in_progress
CREATE OR REPLACE FUNCTION handle_swimmer_target_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Set date_started when status changes to in_progress (and it's not already set)
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
    NEW.date_started = COALESCE(NEW.date_started, CURRENT_DATE);
  END IF;

  -- Ensure updated_at is always current on update
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_swimmer_target_dates ON public.swimmer_targets;

-- Create trigger
CREATE TRIGGER set_swimmer_target_dates
  BEFORE UPDATE ON public.swimmer_targets
  FOR EACH ROW
  EXECUTE FUNCTION handle_swimmer_target_status_change();

-- Also add trigger for INSERT to set date_started if status is in_progress
CREATE OR REPLACE FUNCTION set_swimmer_target_dates_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Set date_started if status is in_progress on insert
  IF NEW.status = 'in_progress' AND NEW.date_started IS NULL THEN
    NEW.date_started = CURRENT_DATE;
  END IF;

  -- Ensure created_at and updated_at are set
  NEW.created_at = COALESCE(NEW.created_at, NOW());
  NEW.updated_at = COALESCE(NEW.updated_at, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing insert trigger if it exists
DROP TRIGGER IF EXISTS set_swimmer_target_dates_insert ON public.swimmer_targets;

-- Create insert trigger
CREATE TRIGGER set_swimmer_target_dates_insert
  BEFORE INSERT ON public.swimmer_targets
  FOR EACH ROW
  EXECUTE FUNCTION set_swimmer_target_dates_on_insert();