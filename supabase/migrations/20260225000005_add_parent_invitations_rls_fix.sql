-- Migration: 20260225000005_add_parent_invitations_rls_fix.sql
-- Description: Fix RLS policy for parent_invitations to allow parents to view
--              swimmers referenced in invitations sent to their email

-- First, drop the existing SELECT policy on swimmers
DROP POLICY IF EXISTS "Instructors can view swimmers they have access to" ON public.swimmers;

-- Recreate the policy with additional condition for parent invitations
CREATE POLICY "Instructors can view swimmers they have access to" ON public.swimmers
  FOR SELECT USING (
    -- Allow admins
    has_role(auth.uid(), 'admin')
    OR
    -- Allow if parent is viewing their own swimmer
    parent_id = auth.uid()
    OR
    -- Allow if swimmer is referenced in a parent_invitation sent to the user's email
    EXISTS (
      SELECT 1 FROM public.parent_invitations pi
      WHERE pi.swimmer_id = swimmers.id
      AND LOWER(pi.parent_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
      AND pi.status IN ('pending', 'sent') -- Only allow for unclaimed invitations
    )
    OR
    -- Allow instructors with access
    (has_role(auth.uid(), 'instructor') AND instructor_has_swimmer_access(auth.uid(), id))
    OR
    -- Allow coordinators with access (if coordinator_has_swimmer_access function exists)
    (has_role(auth.uid(), 'coordinator') AND coordinator_has_swimmer_access(auth.uid(), id))
  );

-- Note: This replaces the existing policy from migration 20260225091920_standardize_has_role_usage.sql
-- It adds the parent_invitations condition to allow parents to view swimmers
-- that are referenced in invitations sent to their email.