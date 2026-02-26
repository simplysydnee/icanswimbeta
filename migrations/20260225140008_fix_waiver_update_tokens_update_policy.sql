-- Migration: Fix waiver_update_tokens UPDATE policy
-- Description: Replace overly permissive UPDATE policy with admin-only policy
--              Waiver update tokens should only be modified by administrators

BEGIN;

-- Drop the existing overly permissive UPDATE policy
DROP POLICY IF EXISTS "System can update tokens" ON waiver_update_tokens;

-- Create new UPDATE policy: admins only can update waiver update tokens
CREATE POLICY "waiver_update_tokens_update_admins_only"
ON waiver_update_tokens FOR UPDATE
TO authenticated
USING (
  -- Only admins can update waiver update tokens
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  -- Same condition for INSERT/UPDATE validation
  has_role(auth.uid(), 'admin')
);

COMMIT;