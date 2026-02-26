-- Migration: Fix swimmers RLS infinite recursion
-- Date: 2026-02-26
-- Description: Remove instructor_has_swimmer_access from "Coordinators can view assigned swimmers" policy
-- This fixes infinite recursion error 42P17 caused by circular dependency

-- The current policy causes infinite recursion because:
-- 1. swimmers policy calls instructor_has_swimmer_access()
-- 2. instructor_has_swimmer_access() queries swimmer_instructor_assignments
-- 3. swimmer_instructor_assignments policy queries swimmers
-- 4. Infinite loop!

-- Solution: Remove the instructor_has_swimmer_access condition since instructors
-- already have their own policy "Instructors can view swimmers they have access to"

DROP POLICY IF EXISTS "Coordinators can view assigned swimmers" ON public.swimmers;

CREATE POLICY "Coordinators can view assigned swimmers" ON public.swimmers
FOR SELECT TO authenticated
USING (
  coordinator_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::text)
  OR parent_id = auth.uid()
);