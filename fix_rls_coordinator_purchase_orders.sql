-- Migration: Fix coordinator access on purchase_orders table
-- Date: 2026-03-05
-- Description: Fix RLS policy for coordinators on purchase_orders table
-- Issue: Current policy uses wrong join via swimmer_instructor_assignments
--        Should use coordinator_has_swimmer_access() or direct swimmers.coordinator_id check

-- Drop the existing coordinator policy
DROP POLICY IF EXISTS "Coordinators can view purchase orders for their swimmers" ON public.purchase_orders;

-- Create corrected policy using coordinator_has_swimmer_access() function
CREATE POLICY "Coordinators can view purchase orders for their swimmers" ON public.purchase_orders
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR coordinator_has_swimmer_access(auth.uid(), swimmer_id)
);

-- Note: The coordinator_has_swimmer_access() function already exists and checks:
-- SELECT EXISTS (SELECT 1 FROM swimmers WHERE id = p_swimmer_id AND coordinator_id = p_coordinator_id)

-- Test query for verification (run as coordinator user):
-- SELECT po.* FROM purchase_orders po
-- JOIN swimmers s ON po.swimmer_id = s.id
-- WHERE s.coordinator_id = '2d8d4f3f-13a6-463b-b5e8-53a5284099ec';
-- Should return only purchase orders for swimmers assigned to the test coordinator