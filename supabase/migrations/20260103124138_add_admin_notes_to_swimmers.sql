-- Add admin_notes column to swimmers table for internal staff comments
ALTER TABLE swimmers 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN swimmers.admin_notes IS 'Internal notes visible only to admin/staff - not shown to parents';

-- Create index for searching notes (optional)
CREATE INDEX IF NOT EXISTS idx_swimmers_admin_notes ON swimmers USING gin(to_tsvector('english', admin_notes)) WHERE admin_notes IS NOT NULL;
