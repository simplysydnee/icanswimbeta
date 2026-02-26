-- Migration: Fix swimmer_strategies UPDATE policy
-- Description: Add explicit UPDATE policy for swimmer_strategies table
--              Existing ALL policy may not properly validate UPDATE operations

BEGIN;

-- First, check if there's already an explicit UPDATE policy
-- If not, create one with proper USING and WITH_CHECK clauses

-- Create explicit UPDATE policy: admins and instructors can update
CREATE POLICY "swimmer_strategies_update_admins_and_instructors"
ON swimmer_strategies FOR UPDATE
TO authenticated
USING (
  -- Admins and instructors can update swimmer strategies
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