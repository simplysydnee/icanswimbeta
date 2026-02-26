-- Migration: Fix swimmer_targets INSERT policy
-- Description: Add explicit INSERT policy for swimmer_targets table
--              Allow admins and instructors to insert target records

BEGIN;

-- Create INSERT policy: admins and instructors can insert
CREATE POLICY "swimmer_targets_insert_admins_and_instructors"
ON swimmer_targets FOR INSERT
TO authenticated
WITH CHECK (
  -- Admins and instructors can insert swimmer targets
  has_role(auth.uid(), 'admin')
  OR
  has_role(auth.uid(), 'instructor')
);

COMMIT;