-- Migration: Add date_started field to swimmer_skills table
-- This allows tracking when a swimmer started working on a skill
-- Required for proper skills tracking by level

-- Add date_started column if it doesn't exist
ALTER TABLE public.swimmer_skills
ADD COLUMN IF NOT EXISTS date_started DATE;

-- Update existing records: set date_started to updated_at for skills in progress or mastered
-- This ensures historical data has reasonable date_started values
UPDATE public.swimmer_skills
SET date_started = updated_at::DATE
WHERE status IN ('in_progress', 'mastered')
  AND date_started IS NULL;

-- Create a comment explaining the column
COMMENT ON COLUMN public.swimmer_skills.date_started IS 'Date when swimmer started working on this skill (when status changed to in_progress)';

-- Update the trigger function to automatically set date_started when status changes to in_progress
-- First, let's check if the trigger function exists and update it
-- We'll create a new function that handles date_started logic

CREATE OR REPLACE FUNCTION handle_swimmer_skill_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Set updated_at timestamp
  NEW.updated_at = now();

  -- Set date_started when status changes to 'in_progress' and date_started is not set
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' AND NEW.date_started IS NULL THEN
    NEW.date_started = CURRENT_DATE;
  END IF;

  -- Set date_mastered when status changes to 'mastered'
  IF NEW.status = 'mastered' AND OLD.status != 'mastered' AND NEW.date_mastered IS NULL THEN
    NEW.date_mastered = CURRENT_DATE;
  END IF;

  -- Clear date_mastered if status changes from 'mastered' to something else
  IF NEW.status != 'mastered' AND OLD.status = 'mastered' THEN
    NEW.date_mastered = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_swimmer_skill_dates ON public.swimmer_skills;

-- Create trigger
CREATE TRIGGER set_swimmer_skill_dates
  BEFORE UPDATE ON public.swimmer_skills
  FOR EACH ROW
  EXECUTE FUNCTION handle_swimmer_skill_status_change();