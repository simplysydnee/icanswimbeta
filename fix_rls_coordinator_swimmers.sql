-- Migration: Fix coordinator access on swimmers table
-- Date: 2026-03-05
-- Description: Fix RLS policy for coordinators on swimmers table
-- Issue: Current policy bundles coordinator + admin + parent into one PERMISSIVE policy
--        No INSERT/UPDATE/DELETE policies for coordinators
--        Policy uses has_role_2() instead of has_role()

-- Drop the existing coordinator policy
DROP POLICY IF EXISTS "Coordinators can view assigned swimmers" ON public.swimmers;

-- Create separate, scoped policies for each role
-- 1. Coordinators can view swimmers assigned to them
CREATE POLICY "Coordinators can view assigned swimmers" ON public.swimmers
FOR SELECT TO authenticated
USING (coordinator_id = auth.uid());

-- 2. Coordinators can update swimmers assigned to them (for basic info updates)
CREATE POLICY "Coordinators can update assigned swimmers" ON public.swimmers
FOR UPDATE TO authenticated
USING (coordinator_id = auth.uid())
WITH CHECK (coordinator_id = auth.uid());

-- Note: Coordinators should NOT be able to INSERT or DELETE swimmers
-- Those operations should be limited to admins and parents (for their own swimmers)

-- Test query for verification (run as coordinator user):
-- SELECT * FROM swimmers WHERE coordinator_id = '2d8d4f3f-13a6-463b-b5e8-53a5284099ec';
-- Should return only swimmers where coordinator_id matches the test coordinator