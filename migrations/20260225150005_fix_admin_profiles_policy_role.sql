-- Migration: Fix admin profiles policy role
-- Date: 2026-02-25
-- Description: Change admin policy role from 'public' to 'authenticated' for profiles table

-- Drop the existing admin policy
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;

-- Recreate the policy with authenticated role instead of public
CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));