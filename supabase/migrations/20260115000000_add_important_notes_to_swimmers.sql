-- Add important_notes array field to swimmers table
ALTER TABLE swimmers
ADD COLUMN IF NOT EXISTS important_notes text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN swimmers.important_notes IS 'Critical safety/behavioral notes shown to all staff. Editable by admin only.';

-- Create index for faster lookups (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_swimmers_important_notes
ON swimmers USING GIN (important_notes)
WHERE important_notes IS NOT NULL AND array_length(important_notes, 1) > 0;