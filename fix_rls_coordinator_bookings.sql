-- Migration: Fix coordinator access on bookings table
-- Date: 2026-03-05
-- Description: Fix RLS policy for coordinators on bookings table
-- Issue: Current policy uses wrong join via swimmer_instructor_assignments
--        Should use coordinator_has_swimmer_access() or direct swimmers.coordinator_id check

-- Drop the existing coordinator policy
DROP POLICY IF EXISTS "Coordinators can view bookings for their swimmers" ON public.bookings;

-- Create corrected policy using coordinator_has_swimmer_access() function
CREATE POLICY "Coordinators can view bookings for their swimmers" ON public.bookings
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR coordinator_has_swimmer_access(auth.uid(), swimmer_id)
);

-- Note: The coordinator_has_swimmer_access() function already exists and checks:
-- SELECT EXISTS (SELECT 1 FROM swimmers WHERE id = p_swimmer_id AND coordinator_id = p_coordinator_id)

-- Test query for verification (run as coordinator user):
-- SELECT b.* FROM bookings b
-- JOIN swimmers s ON b.swimmer_id = s.id
-- WHERE s.coordinator_id = '2d8d4f3f-13a6-463b-b5e8-53a5284099ec';
-- Should return only bookings for swimmers assigned to the test coordinator