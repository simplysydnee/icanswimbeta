-- Migration: Fix waiver_update_log INSERT policy
-- Description: Update INSERT policy for waiver_update_log table
--              Only system/admins should be able to insert log records

BEGIN;

-- Drop the existing overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert logs" ON waiver_update_log;

-- Create new INSERT policy: system/admins only can insert logs
CREATE POLICY "waiver_update_log_insert_system_and_admins"
ON waiver_update_log FOR INSERT
TO authenticated
WITH CHECK (
  -- Only admins can insert waiver update logs directly
  -- System functions should run with admin privileges or service role
  has_role(auth.uid(), 'admin')
);

COMMIT;