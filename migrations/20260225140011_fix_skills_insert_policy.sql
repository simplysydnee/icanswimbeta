-- Migration: Fix skills INSERT policy
-- Description: Add INSERT policy for skills table
--              Only admins can insert skills (reference data)

BEGIN;

-- Create INSERT policy: admins only can insert skills
CREATE POLICY "skills_insert_admins_only"
ON skills FOR INSERT
TO authenticated
WITH CHECK (
  -- Only admins can insert skills (reference data)
  has_role(auth.uid(), 'admin')
);

COMMIT;