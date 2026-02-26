-- Migration: Fix purchase_orders INSERT policy
-- Description: Add explicit INSERT policy for purchase_orders table
--              Only admins can insert directly, system functions handle automatic creation

BEGIN;

-- Create INSERT policy: admins only can insert purchase orders directly
CREATE POLICY "purchase_orders_insert_admins_only"
ON purchase_orders FOR INSERT
TO authenticated
WITH CHECK (
  -- Only admins can insert purchase orders directly
  has_role(auth.uid(), 'admin')
);

COMMIT;