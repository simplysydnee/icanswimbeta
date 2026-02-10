-- Migration: Add updated_by column to swimmer_strategies table
-- This tracks which instructor/staff member last updated a strategy status
-- Required for accountability and audit trails

-- Add updated_by column if it doesn't exist
ALTER TABLE public.swimmer_strategies
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add comment explaining the column
COMMENT ON COLUMN public.swimmer_strategies.updated_by IS 'Profile ID of the instructor/staff member who last updated this strategy status';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_swimmer_strategies_updated_by
ON public.swimmer_strategies(updated_by);

-- Note: The application should set updated_by via API
-- Existing records will have null for updated_by (can't determine historical updates)
-- This is fine as we only need to track future updates