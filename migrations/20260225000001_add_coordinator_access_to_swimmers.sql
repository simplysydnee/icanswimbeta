-- Migration: Add coordinator RLS policy for swimmers table
-- Date: 2026-02-25
-- Description: Coordinators can view swimmers assigned to them via coordinator_id column

-- Create policy for coordinators to view assigned swimmers
CREATE POLICY "Coordinators can view assigned swimmers"
ON public.swimmers FOR SELECT
TO authenticated
USING (
  -- Coordinators can view swimmers where they are assigned as coordinator
  coordinator_id = auth.uid()
  -- Admins can view all swimmers
  OR has_role(auth.uid(), 'admin')
  -- Parents can view their own swimmers
  OR parent_id = auth.uid()
  -- Instructors can view swimmers they have access to
  OR (has_role(auth.uid(), 'instructor') AND instructor_has_swimmer_access(auth.uid(), id))
);

-- Note: This policy complements existing policies and ensures coordinators
-- can access swimmers assigned to them in the coordinator hub.