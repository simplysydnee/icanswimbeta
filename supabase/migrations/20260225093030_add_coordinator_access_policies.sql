-- Add coordinator access policies for key tables
-- Migration: 20260225093030_add_coordinator_access_policies.sql
-- Description: Add RLS policies for coordinators to access assessments, bookings, and progress_notes

-- Note: coordinator_has_swimmer_access() function was created in previous migration

-- 1. Assessments table - Coordinators can view assessments for their swimmers
DROP POLICY IF EXISTS "Coordinators can view assessments for their swimmers" ON public.assessments;
CREATE POLICY "Coordinators can view assessments for their swimmers" ON public.assessments
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR coordinator_has_swimmer_access(auth.uid(), swimmer_id)
  );

-- 2. Bookings table - Coordinators can view bookings for their swimmers
-- Note: There's already an "Instructors can view bookings for their sessions" policy
-- This adds coordinator access without interfering with existing policies
DROP POLICY IF EXISTS "Coordinators can view bookings for their swimmers" ON public.bookings;
CREATE POLICY "Coordinators can view bookings for their swimmers" ON public.bookings
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR coordinator_has_swimmer_access(auth.uid(), swimmer_id)
  );

-- 3. Progress notes table - Update policy to include coordinators
-- Current policy: has_role(auth.uid(), 'admin') OR instructor_id = auth.uid() OR (shared_with_parent = true AND auth.uid() IN (SELECT swimmers.parent_id...))
-- Updated to include: OR coordinator_has_swimmer_access(auth.uid(), swimmer_id)
DROP POLICY IF EXISTS "Users can view appropriate progress notes" ON public.progress_notes;
CREATE POLICY "Users can view appropriate progress notes" ON public.progress_notes
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR instructor_id = auth.uid()
    OR coordinator_has_swimmer_access(auth.uid(), swimmer_id)
    OR (shared_with_parent = true AND auth.uid() IN (
      SELECT swimmers.parent_id
      FROM swimmers
      WHERE swimmers.id = progress_notes.swimmer_id
    ))
  );

-- Verification: Check that policies were created
-- Note: Coordinators can now view data for swimmers they are assigned to
-- This completes the coordinator access pattern started in Phase 1