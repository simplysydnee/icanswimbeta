-- Add hold columns to sessions table for 5-minute booking holds
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS held_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS held_until TIMESTAMPTZ;

-- Create index for efficient hold queries
CREATE INDEX IF NOT EXISTS idx_sessions_held_until ON sessions(held_until) WHERE held_until IS NOT NULL;

-- Function to automatically release expired holds
CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sessions
  SET held_by = NULL, held_until = NULL
  WHERE held_until < NOW();
END;
$$;

-- Comment for documentation
COMMENT ON COLUMN sessions.held_by IS 'User ID who has temporarily held this session (5-minute hold during booking)';
COMMENT ON COLUMN sessions.held_until IS 'Timestamp when the hold expires';