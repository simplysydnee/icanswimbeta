-- Add approval tracking fields to assessments table
ALTER TABLE public.assessments 
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'scheduled' CHECK (approval_status IN ('scheduled', 'pending', 'approved', 'cancelled', 'rejected')),
  ADD COLUMN IF NOT EXISTS approval_deadline timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approval_notes text;

-- Update existing assessments to use new approval_status
UPDATE public.assessments SET approval_status = status WHERE approval_status = 'scheduled';

-- Create index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_assessments_pending_deadline 
  ON public.assessments(approval_status, approval_deadline) 
  WHERE approval_status = 'pending' AND approval_deadline IS NOT NULL;