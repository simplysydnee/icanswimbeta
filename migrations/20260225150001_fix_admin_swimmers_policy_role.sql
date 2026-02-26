-- Migration: Fix admin swimmers policy role
-- Date: 2026-02-25
-- Description: Change admin policy role from 'public' to 'authenticated' for swimmers table

-- Drop the existing admin policy
DROP POLICY IF EXISTS "Admins have full access to swimmers" ON public.swimmers;

-- Recreate the policy with authenticated role instead of public
CREATE POLICY "Admins have full access to swimmers"
ON public.swimmers FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));