-- Migration: Add email mismatch logs table
-- Purpose: Track email mismatch attempts during invitation claiming for analytics and support
-- Part of: Email mismatch validation feature - Phase 4
-- Date: 2026-02-17

-- Create email mismatch logs table
CREATE TABLE IF NOT EXISTS email_mismatch_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES parent_invitations(id) ON DELETE SET NULL,
  invited_email text NOT NULL,
  attempted_email text NOT NULL,
  swimmer_id uuid REFERENCES swimmers(id) ON DELETE SET NULL,
  user_agent text,
  resolution_action text CHECK (resolution_action IN ('signed_out', 'contacted_admin')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_email_mismatch_logs_invitation ON email_mismatch_logs(invitation_id);
CREATE INDEX idx_email_mismatch_logs_created ON email_mismatch_logs(created_at DESC);
CREATE INDEX idx_email_mismatch_logs_swimmer ON email_mismatch_logs(swimmer_id);

-- Enable RLS
ALTER TABLE email_mismatch_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs (use existing has_role pattern from other tables)
CREATE POLICY "Admins can view email mismatch logs"
ON email_mismatch_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Add helpful comment
COMMENT ON TABLE email_mismatch_logs IS
  'Logs all email mismatch attempts during invitation claiming for analytics and support';

-- Comment on columns
COMMENT ON COLUMN email_mismatch_logs.invitation_id IS 'Reference to the parent_invitations table';
COMMENT ON COLUMN email_mismatch_logs.invited_email IS 'Email address the invitation was sent to';
COMMENT ON COLUMN email_mismatch_logs.attempted_email IS 'Email address the user attempted to claim with';
COMMENT ON COLUMN email_mismatch_logs.swimmer_id IS 'Reference to the swimmers table';
COMMENT ON COLUMN email_mismatch_logs.user_agent IS 'Browser/device user agent string';
COMMENT ON COLUMN email_mismatch_logs.resolution_action IS 'How the user resolved the mismatch: signed_out or contacted_admin';
COMMENT ON COLUMN email_mismatch_logs.created_at IS 'Timestamp when the mismatch was detected';