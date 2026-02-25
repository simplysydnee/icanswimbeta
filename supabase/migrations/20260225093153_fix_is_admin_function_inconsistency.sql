-- Fix is_admin() function inconsistency
-- Migration: 20260225093153_fix_is_admin_function_inconsistency.sql
-- Description: Standardize on is_admin(user_id uuid) function and update tasks table policies

-- Note: There are two is_admin() functions:
-- 1. is_admin(user_id uuid) - Takes parameter, used in most policies
-- 2. is_admin() - No parameters, uses auth.uid() internally, used in tasks table
-- This inconsistency is a security concern and should be fixed

-- Update tasks table policies to use is_admin(auth.uid()) instead of is_admin()
-- This ensures consistency with other tables

-- 1. Update "Task updates" policy
DROP POLICY IF EXISTS "Task updates" ON public.tasks;
CREATE POLICY "Task updates" ON public.tasks
  FOR UPDATE USING (
    (assigned_to = auth.uid())
    OR (created_by = auth.uid())
    OR is_admin(auth.uid())
  );

-- 2. Update "Task deletion" policy
DROP POLICY IF EXISTS "Task deletion" ON public.tasks;
CREATE POLICY "Task deletion" ON public.tasks
  FOR DELETE USING (
    (created_by = auth.uid())
    OR is_admin(auth.uid())
  );

-- 3. Update "Task visibility" policy
DROP POLICY IF EXISTS "Task visibility" ON public.tasks;
CREATE POLICY "Task visibility" ON public.tasks
  FOR SELECT USING (
    (assigned_to = auth.uid())
    OR (created_by = auth.uid())
    OR is_admin(auth.uid())
  );

-- Note: We could consider dropping the is_admin() function (without parameters)
-- but we'll keep it for backward compatibility in case other code uses it
-- The function should be deprecated in favor of is_admin(user_id uuid) or has_role(auth.uid(), 'admin')

-- Verification: Check that tasks policies now use is_admin(auth.uid())
COMMENT ON FUNCTION public.is_admin() IS 'DEPRECATED: Use is_admin(user_id uuid) or has_role(auth.uid(), ''admin'') instead. Checks if current user (auth.uid()) is admin.';