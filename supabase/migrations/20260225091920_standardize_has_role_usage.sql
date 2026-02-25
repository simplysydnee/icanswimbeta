-- Standardize has_role() usage across RLS policies
-- Migration: 20260225091920_standardize_has_role_usage.sql
-- Description: Update RLS policies to use has_role() function instead of direct user_roles queries

-- Note: The has_role() function already exists as a SECURITY DEFINER function
-- We're updating policies that still use direct user_roles queries to use has_role() instead

-- Update policies that use direct user_roles queries to use has_role() function

-- 1. Update assessments table - "Instructors can view assessments for their sessions" policy
DROP POLICY IF EXISTS "Instructors can view assessments for their sessions" ON public.assessments;
CREATE POLICY "Instructors can view assessments for their sessions" ON public.assessments
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM sessions s WHERE s.id = assessments.session_id AND s.instructor_id = auth.uid())
    OR completed_by = auth.uid()
  );

-- 2. Update bookings table - "Instructors can view bookings for their sessions" policy
DROP POLICY IF EXISTS "Instructors can view bookings for their sessions" ON public.bookings;
CREATE POLICY "Instructors can view bookings for their sessions" ON public.bookings
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM sessions s WHERE s.id = bookings.session_id AND s.instructor_id = auth.uid())
    OR auth.uid() = parent_id
  );

-- 3. Update coordinator_escalations table - "Admins have full access to coordinator_escalations" policy
DROP POLICY IF EXISTS "Admins have full access to coordinator_escalations" ON public.coordinator_escalations;
CREATE POLICY "Admins have full access to coordinator_escalations" ON public.coordinator_escalations
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 4. Update funding_sources table - "Admins have full access to funding sources" policy
DROP POLICY IF EXISTS "Admins have full access to funding sources" ON public.funding_sources;
CREATE POLICY "Admins have full access to funding sources" ON public.funding_sources
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 5. Update page_content table policies
DROP POLICY IF EXISTS "Admins can delete page content" ON public.page_content;
CREATE POLICY "Admins can delete page content" ON public.page_content
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update page content" ON public.page_content;
CREATE POLICY "Admins can update page content" ON public.page_content
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all page content" ON public.page_content;
CREATE POLICY "Admins can view all page content" ON public.page_content
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 6. Update progress_notes table - "Instructors can update own progress notes" policy
DROP POLICY IF EXISTS "Instructors can update own progress notes" ON public.progress_notes;
CREATE POLICY "Instructors can update own progress notes" ON public.progress_notes
  FOR UPDATE USING (auth.uid() = instructor_id OR has_role(auth.uid(), 'admin'));

-- 7. Update sessions table - "Instructors can view sessions they are assigned to" policy
DROP POLICY IF EXISTS "Instructors can view sessions they are assigned to" ON public.sessions;
CREATE POLICY "Instructors can view sessions they are assigned to" ON public.sessions
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR instructor_id = auth.uid()
    OR status = ANY (ARRAY['available', 'open'])
  );

-- 8. Update swimmer_instructor_assignments table policies
DROP POLICY IF EXISTS "Admins full access to assignments" ON public.swimmer_instructor_assignments;
CREATE POLICY "Admins full access to assignments" ON public.swimmer_instructor_assignments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Instructors view own assignments" ON public.swimmer_instructor_assignments;
CREATE POLICY "Instructors view own assignments" ON public.swimmer_instructor_assignments
  FOR SELECT USING (instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- 9. Update swimmer_skills table policies
DROP POLICY IF EXISTS "Admins can delete swimmer skills" ON public.swimmer_skills;
CREATE POLICY "Admins can delete swimmer skills" ON public.swimmer_skills
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Instructors and admins can update swimmer skills" ON public.swimmer_skills;
CREATE POLICY "Instructors and admins can update swimmer skills" ON public.swimmer_skills
  FOR UPDATE USING (has_role(auth.uid(), 'instructor') OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Instructors and admins can view swimmer skills" ON public.swimmer_skills;
CREATE POLICY "Instructors and admins can view swimmer skills" ON public.swimmer_skills
  FOR SELECT USING (has_role(auth.uid(), 'instructor') OR has_role(auth.uid(), 'admin'));

-- 10. Update swimmer_strategies table policies
DROP POLICY IF EXISTS "Instructors can manage strategies" ON public.swimmer_strategies;
CREATE POLICY "Instructors can manage strategies" ON public.swimmer_strategies
  FOR ALL USING (has_role(auth.uid(), 'instructor') OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Instructors can view all strategies" ON public.swimmer_strategies;
CREATE POLICY "Instructors can view all strategies" ON public.swimmer_strategies
  FOR SELECT USING (has_role(auth.uid(), 'instructor') OR has_role(auth.uid(), 'admin'));

-- 11. Update swimmer_targets table policies
DROP POLICY IF EXISTS "Instructors can manage targets" ON public.swimmer_targets;
CREATE POLICY "Instructors can manage targets" ON public.swimmer_targets
  FOR ALL USING (has_role(auth.uid(), 'instructor') OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Instructors can view all targets" ON public.swimmer_targets;
CREATE POLICY "Instructors can view all targets" ON public.swimmer_targets
  FOR SELECT USING (has_role(auth.uid(), 'instructor') OR has_role(auth.uid(), 'admin'));

-- 12. Update swimmers table - "Instructors can view swimmers they have access to" policy
DROP POLICY IF EXISTS "Instructors can view swimmers they have access to" ON public.swimmers;
CREATE POLICY "Instructors can view swimmers they have access to" ON public.swimmers
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR parent_id = auth.uid()
    OR (has_role(auth.uid(), 'instructor') AND instructor_has_swimmer_access(auth.uid(), id))
  );

-- 13. Update time_entries table policies
DROP POLICY IF EXISTS "Admins can update all time entries" ON public.time_entries;
CREATE POLICY "Admins can update all time entries" ON public.time_entries
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all time entries" ON public.time_entries;
CREATE POLICY "Admins can view all time entries" ON public.time_entries
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 14. Update time_off_requests table policies
DROP POLICY IF EXISTS "Admins update all" ON public.time_off_requests;
CREATE POLICY "Admins update all" ON public.time_off_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all" ON public.time_off_requests;
CREATE POLICY "Admins view all" ON public.time_off_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 15. Update waiver_update_log table - "Admins can view all logs" policy
DROP POLICY IF EXISTS "Admins can view all logs" ON public.waiver_update_log;
CREATE POLICY "Admins can view all logs" ON public.waiver_update_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Verification query to check that policies have been updated
COMMENT ON FUNCTION public.has_role(uuid, text) IS 'Checks if a user has a specific role. Uses SECURITY DEFINER to bypass RLS. Standardized usage across all RLS policies.';