-- Migration: Fix swimmer_targets and swimmer_strategies scope
-- Date: 2026-03-05
-- Description: Fix RLS policies for swimmer_targets and swimmer_strategies tables
-- Issue: Duplicate SELECT policies - one with proper check, one with USING (true)
--        The USING (true) policy allows ANY authenticated user to view ALL targets/strategies

-- ====== swimmer_targets table ======

-- Drop the overly permissive "Instructors can view all targets" policy
DROP POLICY IF EXISTS "Instructors can view all targets" ON public.swimmer_targets;

-- Verify the correct policy exists and has proper checks
-- The "Instructors can manage targets" policy should already exist with:
-- USING (EXISTS (SELECT 1 FROM swimmer_instructor_assignments sia WHERE sia.swimmer_id = swimmer_targets.swimmer_id AND sia.instructor_id = auth.uid()))
-- WITH CHECK (same condition)

-- If needed, we can recreate the correct policy:
-- DROP POLICY IF EXISTS "Instructors can manage targets" ON public.swimmer_targets;
-- CREATE POLICY "Instructors can manage targets" ON public.swimmer_targets
-- FOR ALL TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.swimmer_instructor_assignments sia
--     WHERE sia.swimmer_id = swimmer_targets.swimmer_id
--     AND sia.instructor_id = auth.uid()
--   )
-- )
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.swimmer_instructor_assignments sia
--     WHERE sia.swimmer_id = swimmer_targets.swimmer_id
--     AND sia.instructor_id = auth.uid()
--   )
-- );

-- ====== swimmer_strategies table ======

-- Drop the overly permissive "Instructors can view all strategies" policy
DROP POLICY IF EXISTS "Instructors can view all strategies" ON public.swimmer_strategies;

-- Verify the correct policy exists and has proper checks
-- The "Instructors can manage strategies" policy should already exist with:
-- USING (EXISTS (SELECT 1 FROM swimmer_instructor_assignments sia WHERE sia.swimmer_id = swimmer_strategies.swimmer_id AND sia.instructor_id = auth.uid()))
-- WITH CHECK (same condition)

-- If needed, we can recreate the correct policy:
-- DROP POLICY IF EXISTS "Instructors can manage strategies" ON public.swimmer_strategies;
-- CREATE POLICY "Instructors can manage strategies" ON public.swimmer_strategies
-- FOR ALL TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.swimmer_instructor_assignments sia
--     WHERE sia.swimmer_id = swimmer_strategies.swimmer_id
--     AND sia.instructor_id = auth.uid()
--   )
-- )
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.swimmer_instructor_assignments sia
--     WHERE sia.swimmer_id = swimmer_strategies.swimmer_id
--     AND sia.instructor_id = auth.uid()
--   )
-- );

-- Test query for verification (run as instructor user):
-- SELECT st.* FROM swimmer_targets st
-- JOIN swimmer_instructor_assignments sia ON st.swimmer_id = sia.swimmer_id
-- WHERE sia.instructor_id = 'instructor-user-id-here';
-- Should return only targets for swimmers assigned to the instructor

-- SELECT ss.* FROM swimmer_strategies ss
-- JOIN swimmer_instructor_assignments sia ON ss.swimmer_id = sia.swimmer_id
-- WHERE sia.instructor_id = 'instructor-user-id-here';
-- Should return only strategies for swimmers assigned to the instructor