-- Migration: Fix swim_levels INSERT policy
-- Description: Add INSERT policy for swim_levels table
--              Only admins can insert swim levels (reference data)

BEGIN;

-- Create INSERT policy: admins only can insert swim levels
CREATE POLICY "swim_levels_insert_admins_only"
ON swim_levels FOR INSERT
TO authenticated
WITH CHECK (
  -- Only admins can insert swim levels (reference data)
  has_role(auth.uid(), 'admin')
);

COMMIT;