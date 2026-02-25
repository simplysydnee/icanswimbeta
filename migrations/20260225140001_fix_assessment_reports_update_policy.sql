-- Migration: Fix assessment_reports UPDATE policy
-- Description: Replace overly permissive UPDATE policy with role-based policy
--              allowing only admins and the instructor who created the report to update

BEGIN;

-- Drop the existing overly permissive UPDATE policy
DROP POLICY IF EXISTS "assessment_reports_update_authenticated" ON assessment_reports;

-- Create new UPDATE policy: admins and instructors can update
CREATE POLICY "assessment_reports_update_admins_and_instructors"
ON assessment_reports FOR UPDATE
TO authenticated
USING (
  -- Admins can update any assessment report
  has_role(auth.uid(), 'admin')
  OR
  -- Instructors can update their own assessment reports
  instructor_id = auth.uid()
)
WITH CHECK (
  -- Same conditions for INSERT/UPDATE validation
  has_role(auth.uid(), 'admin')
  OR
  instructor_id = auth.uid()
);

COMMIT;