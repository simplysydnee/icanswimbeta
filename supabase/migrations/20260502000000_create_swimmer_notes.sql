-- Create swimmer_notes table for admin internal notes/comment thread
CREATE TABLE IF NOT EXISTS swimmer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  airtable_comment_date TIMESTAMPTZ,
  airtable_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_swimmer_notes_swimmer_id ON swimmer_notes(swimmer_id);
CREATE INDEX IF NOT EXISTS idx_swimmer_notes_created_at ON swimmer_notes(created_at);

-- Enable RLS
ALTER TABLE swimmer_notes ENABLE ROW LEVEL SECURITY;

-- Allow admins to SELECT all notes
CREATE POLICY "Admins can view all swimmer notes"
  ON swimmer_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow admins to INSERT notes
CREATE POLICY "Admins can insert swimmer notes"
  ON swimmer_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow admins to UPDATE their own notes
CREATE POLICY "Admins can update their own notes"
  ON swimmer_notes
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
