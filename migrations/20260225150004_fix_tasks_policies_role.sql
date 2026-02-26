-- Migration: Fix tasks policies role
-- Date: 2026-02-25
-- Description: Change task policies role from 'public' to 'authenticated' for tasks table

-- Drop all existing task policies
DROP POLICY IF EXISTS "Task creation" ON public.tasks;
DROP POLICY IF EXISTS "Task deletion" ON public.tasks;
DROP POLICY IF EXISTS "Task updates" ON public.tasks;
DROP POLICY IF EXISTS "Task visibility" ON public.tasks;

-- Recreate policies with authenticated role instead of public

-- Task creation policy
CREATE POLICY "Task creation"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Task deletion policy
CREATE POLICY "Task deletion"
ON public.tasks FOR DELETE
TO authenticated
USING ((created_by = auth.uid()) OR is_admin(auth.uid()));

-- Task updates policy
CREATE POLICY "Task updates"
ON public.tasks FOR UPDATE
TO authenticated
USING ((assigned_to = auth.uid()) OR (created_by = auth.uid()) OR is_admin(auth.uid()))
WITH CHECK ((assigned_to = auth.uid()) OR (created_by = auth.uid()) OR is_admin(auth.uid()));

-- Task visibility policy
CREATE POLICY "Task visibility"
ON public.tasks FOR SELECT
TO authenticated
USING ((assigned_to = auth.uid()) OR (created_by = auth.uid()) OR is_admin(auth.uid()));