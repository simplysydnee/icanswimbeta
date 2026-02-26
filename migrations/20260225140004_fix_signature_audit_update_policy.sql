-- Migration: Fix signature_audit UPDATE policy
-- Description: Replace overly permissive UPDATE policy with admin-only policy
--              Audit records should only be modified by administrators

BEGIN;

-- Drop the existing overly permissive UPDATE policy
DROP POLICY IF EXISTS "signature_audit_update_authenticated" ON signature_audit;

-- Create new UPDATE policy: admins only can update audit records
CREATE POLICY "signature_audit_update_admins_only"
ON signature_audit FOR UPDATE
TO authenticated
USING (
  -- Only admins can update signature audit records
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  -- Same condition for INSERT/UPDATE validation
  has_role(auth.uid(), 'admin')
);

COMMIT;