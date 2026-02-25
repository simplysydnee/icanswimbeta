-- Create coordinator_has_swimmer_access() function
-- Migration: 20260225092827_create_coordinator_has_swimmer_access_function.sql
-- Description: Create function to check if a coordinator has access to a swimmer

-- Create coordinator_has_swimmer_access function
-- Similar to instructor_has_swimmer_access but for coordinators
CREATE OR REPLACE FUNCTION public.coordinator_has_swimmer_access(
  p_coordinator_id uuid,
  p_swimmer_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER -- Runs with privileges of function creator (bypasses RLS)
AS $$
  -- Coordinators have access to swimmers where they are assigned as coordinator
  SELECT EXISTS (
    SELECT 1
    FROM swimmers
    WHERE id = p_swimmer_id
      AND coordinator_id = p_coordinator_id
  );
$$;

-- Update RLS policies to use coordinator_has_swimmer_access() function
-- Note: We should check which policies need updating

-- 1. Update swimmers table - "Coordinators can view assigned swimmers" policy
-- This policy already exists from Phase 1 fixes, but we can make it more consistent
-- Current policy: ((coordinator_id = auth.uid()) OR has_role(auth.uid(), 'admin') OR (parent_id = auth.uid()) OR (has_role(auth.uid(), 'instructor'::text) AND instructor_has_swimmer_access(auth.uid(), id)))
-- We'll keep it as is since it already uses coordinator_id = auth.uid() directly

-- 2. Update purchase_orders table - "Coordinators can view purchase orders for their swimmers" policy
-- This policy already exists from Phase 1 fixes
-- Current policy: (has_role(auth.uid(), 'admin'::text) OR (EXISTS (SELECT 1 FROM swimmers s WHERE ((s.id = purchase_orders.swimmer_id) AND (s.coordinator_id = auth.uid())))))
-- We can update it to use coordinator_has_swimmer_access() for consistency

DROP POLICY IF EXISTS "Coordinators can view purchase orders for their swimmers" ON public.purchase_orders;
CREATE POLICY "Coordinators can view purchase orders for their swimmers" ON public.purchase_orders
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR coordinator_has_swimmer_access(auth.uid(), swimmer_id)
  );

-- 3. Create similar policies for other tables where coordinators should have access
-- Based on the audit report, coordinators need access to various tables

-- Add coordinator access policies for key tables

-- Assessments table - Coordinators can view assessments for their swimmers
DROP POLICY IF EXISTS "Coordinators can view assessments for their swimmers" ON public.assessments;
CREATE POLICY "Coordinators can view assessments for their swimmers" ON public.assessments
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR coordinator_has_swimmer_access(auth.uid(), swimmer_id)
  );

-- Bookings table - Coordinators can view bookings for their swimmers
-- Note: There's already an "Instructors can view bookings for their sessions" policy
-- We need to add coordinator access without interfering with existing policies
DROP POLICY IF EXISTS "Coordinators can view bookings for their swimmers" ON public.bookings;
CREATE POLICY "Coordinators can view bookings for their swimmers" ON public.bookings
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR coordinator_has_swimmer_access(auth.uid(), swimmer_id)
  );

-- Progress notes table - Coordinators can view progress notes for their swimmers
-- Note: There's already a "Users can view appropriate progress notes" policy
-- We need to extend it to include coordinators
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

-- Verification: Test the function
COMMENT ON FUNCTION public.coordinator_has_swimmer_access(uuid, uuid) IS 'Checks if a coordinator has access to a swimmer. Returns true if coordinator_id matches the swimmer''s coordinator_id.';