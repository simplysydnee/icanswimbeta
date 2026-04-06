-- Migration: Fix progress notes parent filter
-- Date: 2026-03-05
-- Description: Fix RLS policy for progress_notes table
-- Issue: Parents can see ALL notes for their swimmers, including internal ones
--        Missing shared_with_parent = true filter in parent branch
--        Coordinator branch uses wrong join via swimmer_instructor_assignments

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view appropriate progress notes" ON public.progress_notes;

-- Create corrected policy with proper filters
CREATE POLICY "Users can view appropriate progress notes" ON public.progress_notes
FOR SELECT TO authenticated
USING (
  -- Admins can view all notes
  has_role(auth.uid(), 'admin')
  -- Instructors can view notes for their sessions
  OR instructor_id = auth.uid()
  -- Coordinators can view notes for their swimmers
  OR coordinator_has_swimmer_access(auth.uid(), swimmer_id)
  -- Parents can view ONLY notes shared with them
  OR (
    shared_with_parent = true
    AND auth.uid() IN (
      SELECT swimmers.parent_id
      FROM swimmers
      WHERE swimmers.id = progress_notes.swimmer_id
    )
  )
);

-- Verify shared_with_parent column exists and defaults to false
-- If not, we should add it:
-- ALTER TABLE progress_notes ADD COLUMN IF NOT EXISTS shared_with_parent BOOLEAN DEFAULT false;

-- Test query for verification (run as parent user):
-- SELECT pn.* FROM progress_notes pn
-- JOIN swimmers s ON pn.swimmer_id = s.id
-- WHERE s.parent_id = '9b8a4ba0-dbd1-4eaa-9d42-bb54fb870f49'  -- test parent ID
--   AND pn.shared_with_parent = true;
-- Should return only progress notes explicitly shared with parents