-- Update parent_invitations table to add missing fields and fix token type
-- Add sent_at column
ALTER TABLE parent_invitations ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Change invitation_token from UUID to TEXT with hex encoding
-- First, create a new column with default hex token
ALTER TABLE parent_invitations ADD COLUMN IF NOT EXISTS invitation_token_text TEXT DEFAULT encode(gen_random_bytes(32), 'hex');

-- For existing records, generate new hex tokens
UPDATE parent_invitations
SET invitation_token_text = encode(gen_random_bytes(32), 'hex')
WHERE invitation_token_text IS NULL;

-- Make the new column NOT NULL and add unique constraint
ALTER TABLE parent_invitations ALTER COLUMN invitation_token_text SET NOT NULL;
ALTER TABLE parent_invitations ADD CONSTRAINT parent_invitations_token_text_unique UNIQUE(invitation_token_text);

-- Drop the old UUID column
ALTER TABLE parent_invitations DROP COLUMN invitation_token;

-- Rename the new column to invitation_token
ALTER TABLE parent_invitations RENAME COLUMN invitation_token_text TO invitation_token;

-- Add updated_at column
ALTER TABLE parent_invitations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_parent_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_parent_invitations_updated_at_trigger ON parent_invitations;
CREATE TRIGGER update_parent_invitations_updated_at_trigger
  BEFORE UPDATE ON parent_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_invitations_updated_at();

-- Update RLS policy to include claimed_by check for viewing
DROP POLICY IF EXISTS "Users can view invitations for their email" ON parent_invitations;
CREATE POLICY "Users can view invitations for their email or claimed by them" ON parent_invitations
  FOR SELECT USING (
    LOWER(parent_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    OR claimed_by = auth.uid()
  );