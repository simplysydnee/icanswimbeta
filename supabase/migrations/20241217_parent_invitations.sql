-- Create parent_invitations table to track invitation status
CREATE TABLE IF NOT EXISTS parent_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID REFERENCES swimmers(id) ON DELETE CASCADE,
  parent_email TEXT NOT NULL,
  parent_name TEXT,
  invitation_token UUID DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'claimed', 'expired')),
  claimed_by UUID REFERENCES profiles(id),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),

  UNIQUE(invitation_token)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_parent_invitations_token ON parent_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_parent_invitations_email ON parent_invitations(parent_email);
CREATE INDEX IF NOT EXISTS idx_parent_invitations_swimmer ON parent_invitations(swimmer_id);

-- Enable RLS
ALTER TABLE parent_invitations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage all invitations" ON parent_invitations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view invitations for their email" ON parent_invitations
  FOR SELECT USING (
    LOWER(parent_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can claim invitations for their email" ON parent_invitations
  FOR UPDATE USING (
    LOWER(parent_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  );