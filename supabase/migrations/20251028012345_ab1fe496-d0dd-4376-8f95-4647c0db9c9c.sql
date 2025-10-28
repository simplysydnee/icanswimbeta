-- Add constraint to prevent waitlist swimmers from being flexible
-- First, update any existing waitlist swimmers who are incorrectly marked as flexible
UPDATE swimmers 
SET flexible_swimmer = false, 
    flexible_swimmer_reason = NULL,
    flexible_swimmer_set_at = NULL,
    flexible_swimmer_set_by = NULL
WHERE enrollment_status = 'waitlist' 
  AND flexible_swimmer = true;

-- Add a check constraint to prevent future violations
ALTER TABLE swimmers 
ADD CONSTRAINT flexible_swimmer_enrollment_check 
CHECK (
  flexible_swimmer = false 
  OR enrollment_status IN ('enrolled', 'approved')
);