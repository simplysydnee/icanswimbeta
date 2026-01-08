-- Standardize enrollment_status values
-- Convert "active" to "enrolled" for consistency

UPDATE swimmers 
SET enrollment_status = 'enrolled' 
WHERE enrollment_status = 'active';

-- Also move "pending_assessment" from enrollment_status to assessment_status
-- First update assessment_status for swimmers with pending_assessment enrollment
UPDATE swimmers 
SET assessment_status = 'scheduled'
WHERE enrollment_status = 'pending_assessment';

-- Then update enrollment_status to waitlist for these swimmers
UPDATE swimmers 
SET enrollment_status = 'waitlist'
WHERE enrollment_status = 'pending_assessment';

-- Add comment documenting valid statuses
COMMENT ON COLUMN swimmers.enrollment_status IS 
'Valid values: waitlist, pending_enrollment, enrolled, inactive. 
Workflow: waitlist -> (pending_enrollment) -> enrolled -> (inactive)';

COMMENT ON COLUMN swimmers.assessment_status IS 
'Valid values: not_scheduled, not_started, scheduled, completed, pending_approval.
Tracks assessment progress separately from enrollment.';

COMMENT ON COLUMN swimmers.approval_status IS 
'Valid values: pending, approved, declined.
Admin approval required before swimmer can book.';
