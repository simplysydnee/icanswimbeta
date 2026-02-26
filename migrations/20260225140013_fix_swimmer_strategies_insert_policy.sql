-- Migration: Fix swimmer_strategies INSERT policy
-- Description: Add explicit INSERT policy for swimmer_strategies table
--              Allow admins and instructors to insert strategy records

BEGIN;

-- Create INSERT policy: admins and instructors can insert
CREATE POLICY "swimmer_strategies_insert_admins_and_instructors"
ON swimmer_strategies FOR INSERT
TO authenticated
WITH CHECK (
  -- Admins and instructors can insert swimmer strategies
  has_role(auth.uid(), 'admin')
  OR
  has_role(auth.uid(), 'instructor')
);

COMMIT;