-- Migration: Fix swimmer_targets UPDATE policy
-- Description: Add explicit UPDATE policy for swimmer_targets table
--              Existing ALL policy may not properly validate UPDATE operations

BEGIN;

-- Create explicit UPDATE policy: admins and instructors can update
CREATE POLICY "swimmer_targets_update_admins_and_instructors"
ON swimmer_targets FOR UPDATE
TO authenticated
USING (
  -- Admins and instructors can update swimmer targets
  has_role(auth.uid(), 'admin')
  OR
  has_role(auth.uid(), 'instructor')
)
WITH CHECK (
  -- Same conditions for INSERT/UPDATE validation
  has_role(auth.uid(), 'admin')
  OR
  has_role(auth.uid(), 'instructor')
);

COMMIT;