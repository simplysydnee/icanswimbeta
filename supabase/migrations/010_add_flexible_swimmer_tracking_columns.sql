-- Add flexible swimmer tracking columns to swimmers table
-- These columns track when and why a swimmer was marked as flexible swimmer

ALTER TABLE swimmers
ADD COLUMN IF NOT EXISTS flexible_swimmer_reason TEXT,
ADD COLUMN IF NOT EXISTS flexible_swimmer_set_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS flexible_swimmer_set_by UUID REFERENCES profiles(id);

-- Add comment explaining the columns
COMMENT ON COLUMN swimmers.flexible_swimmer_reason IS 'Reason why swimmer was marked as flexible (e.g., "Late cancellation - admin marked")';
COMMENT ON COLUMN swimmers.flexible_swimmer_set_at IS 'When the flexible swimmer status was set';
COMMENT ON COLUMN swimmers.flexible_swimmer_set_by IS 'Admin who set the flexible swimmer status';

-- Create index for flexible swimmer queries
CREATE INDEX IF NOT EXISTS idx_swimmers_flexible_swimmer ON swimmers(flexible_swimmer);
CREATE INDEX IF NOT EXISTS idx_swimmers_flexible_set_at ON swimmers(flexible_swimmer_set_at);