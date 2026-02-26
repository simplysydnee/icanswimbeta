-- Migration: Fix waiver_update_log UPDATE policy
-- Description: Add UPDATE policy for waiver_update_log table
--              Audit/log tables should only be modified by administrators

BEGIN;

-- Create UPDATE policy: admins only can update waiver update logs
CREATE POLICY "waiver_update_log_update_admins_only"
ON waiver_update_log FOR UPDATE
TO authenticated
USING (
  -- Only admins can update waiver update log records
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  -- Same condition for INSERT/UPDATE validation
  has_role(auth.uid(), 'admin')
);

COMMIT;