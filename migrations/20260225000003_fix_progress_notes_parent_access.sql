-- Migration: Fix progress_notes parent access for shared_with_parent = true
-- Date: 2026-02-25
-- Description: Update SELECT policy to allow parents to view progress notes when shared_with_parent = true

-- First, drop the existing SELECT policy
DROP POLICY IF EXISTS "Instructors can view own progress notes" ON public.progress_notes;

-- Create updated policy with parent access
CREATE POLICY "Users can view appropriate progress notes"
ON public.progress_notes FOR SELECT
TO authenticated
USING (
  -- Admins can view all progress notes
  has_role(auth.uid(), 'admin')
  -- Instructors can view their own progress notes
  OR instructor_id = auth.uid()
  -- Parents can view progress notes for their swimmers when shared_with_parent = true
  OR (
    shared_with_parent = true
    AND auth.uid() IN (
      SELECT parent_id
      FROM public.swimmers
      WHERE swimmers.id = progress_notes.swimmer_id
    )
  )
);

-- Note: This fix resolves the issue where parents couldn't view progress notes
-- even when shared_with_parent was set to true.