-- Migration: Fix referral_requests UPDATE policy
-- Description: Replace overly permissive UPDATE policy with role-based policy
--              allowing admins and assigned coordinators to update

BEGIN;

-- Drop the existing overly permissive UPDATE policy
DROP POLICY IF EXISTS "referral_requests_update_authenticated" ON referral_requests;

-- Create new UPDATE policy: admins and coordinators can update
CREATE POLICY "referral_requests_update_admins_and_coordinators"
ON referral_requests FOR UPDATE
TO authenticated
USING (
  -- Admins can update any referral request
  has_role(auth.uid(), 'admin')
  OR
  -- Coordinators can update referral requests assigned to them
  coordinator_id = auth.uid()
)
WITH CHECK (
  -- Same conditions for INSERT/UPDATE validation
  has_role(auth.uid(), 'admin')
  OR
  coordinator_id = auth.uid()
);

COMMIT;