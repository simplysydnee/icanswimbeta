-- Migration: Fix parent_referral_requests UPDATE policy
-- Description: Replace overly permissive UPDATE policy with role-based policy
--              allowing admins to update any, and parents to update their own requests

BEGIN;

-- Drop the existing overly permissive UPDATE policy
DROP POLICY IF EXISTS "parent_referral_requests_update_authenticated" ON parent_referral_requests;

-- Create new UPDATE policy: admins can update any, parents can update their own
CREATE POLICY "parent_referral_requests_update_admins_and_parents"
ON parent_referral_requests FOR UPDATE
TO authenticated
USING (
  -- Admins can update any parent referral request
  has_role(auth.uid(), 'admin')
  OR
  -- Parents can update their own referral requests (matched by email)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = parent_referral_requests.parent_email
  )
)
WITH CHECK (
  -- Same conditions for INSERT/UPDATE validation
  has_role(auth.uid(), 'admin')
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = parent_referral_requests.parent_email
  )
);

COMMIT;