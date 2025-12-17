-- Fix RLS circular dependency for admin access
-- Migration: 20251217211305_fix_admin_rls_circular_dependency.sql
-- Description: Fix circular dependency where admin policy requires checking user_roles table,
--              but user_roles table RLS also requires admin access

-- Create a function that checks if a user is an admin without RLS restrictions
-- This function will be used in RLS policies to avoid circular dependencies
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Runs with privileges of function creator (bypasses RLS)
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = $1 AND user_roles.role = 'admin'
  );
$$;

-- First, drop the existing admin policies
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to user_roles" ON public.user_roles;

-- Create new policies using the is_admin function

-- For profiles table: Admins can do everything
CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL USING (public.is_admin(auth.uid()));

-- For user_roles table: Admins can do everything
CREATE POLICY "Admins have full access to user_roles" ON public.user_roles
  FOR ALL USING (public.is_admin(auth.uid()));

-- Note: The existing user policies remain unchanged:
-- "Users can insert own profile", "Users can view own profile", "Users can update own profile"
-- "Users can insert own role", "Users can view own roles"