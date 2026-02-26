-- Migration: Fix coordinator_escalations INSERT policy
-- Description: Add INSERT policy for coordinator_escalations table
--              Allow coordinators and admins to insert escalation records

BEGIN;

-- Create INSERT policy: coordinators and admins can insert
CREATE POLICY "coordinator_escalations_insert_coordinators_and_admins"
ON coordinator_escalations FOR INSERT
TO authenticated
WITH CHECK (
  -- Admins and coordinators can insert escalation records
  has_role(auth.uid(), 'admin')
  OR
  has_role(auth.uid(), 'coordinator')
);

COMMIT;