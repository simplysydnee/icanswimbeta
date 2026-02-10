-- Migration: Add index for updated_by column on swimmer_targets table
-- This improves query performance when filtering by instructor who updated targets

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_swimmer_targets_updated_by
ON public.swimmer_targets(updated_by);

-- Add comment for documentation
COMMENT ON INDEX public.idx_swimmer_targets_updated_by IS 'Index for fast lookups by instructor who last updated target status';