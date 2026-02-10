-- Migration: Add updated_by column to progress_notes table
-- This tracks which instructor/staff member last updated a progress note
-- Required for accountability and audit trails

-- Add updated_by column if it doesn't exist
ALTER TABLE public.progress_notes
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add comment explaining the column
COMMENT ON COLUMN public.progress_notes.updated_by IS 'Profile ID of the instructor/staff member who last updated this progress note';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_progress_notes_updated_by
ON public.progress_notes(updated_by);

-- Note: The application should set updated_by via API
-- Existing records will have null for updated_by (can't determine historical updates)
-- This is fine as we only need to track future updates