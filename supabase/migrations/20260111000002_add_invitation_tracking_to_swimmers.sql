-- Migration: Add invitation tracking columns to swimmers table
-- Description: Adds invited_at and follow_up_task_created columns to support overdue parent invite auto-task system

-- Add invited_at column to track when parent invitation was sent
ALTER TABLE public.swimmers
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Add follow_up_task_created column to prevent duplicate task creation
ALTER TABLE public.swimmers
ADD COLUMN IF NOT EXISTS follow_up_task_created BOOLEAN DEFAULT false;

-- Add index for performance on invited_at queries
CREATE INDEX IF NOT EXISTS idx_swimmers_invited_at ON public.swimmers(invited_at) WHERE invited_at IS NOT NULL;

-- Add index for performance on follow_up_task_created queries
CREATE INDEX IF NOT EXISTS idx_swimmers_follow_up_task_created ON public.swimmers(follow_up_task_created) WHERE follow_up_task_created = false;

-- Update comment on swimmers table
COMMENT ON COLUMN public.swimmers.invited_at IS 'Timestamp when parent invitation was sent. Used for tracking overdue invites.';
COMMENT ON COLUMN public.swimmers.follow_up_task_created IS 'Boolean flag to prevent duplicate follow-up task creation for overdue parent invites.';