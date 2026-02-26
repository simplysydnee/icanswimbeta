-- Migration: Fix all remaining public policies to authenticated
-- Date: 2026-02-26
-- Description: Change ALL remaining RLS policies from 'public' role to 'authenticated' role
-- This fixes 71 policies across 28 tables that were incorrectly using public role

-- Note: We drop and recreate each policy with authenticated role
-- Policy logic remains unchanged, only the role changes from public to authenticated

-- 1. assessment_reports table policies
DROP POLICY IF EXISTS "assessment_reports_delete_authenticated" ON public.assessment_reports;
CREATE POLICY "assessment_reports_delete_authenticated"
ON public.assessment_reports FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "assessment_reports_select_authenticated" ON public.assessment_reports;
CREATE POLICY "assessment_reports_select_authenticated"
ON public.assessment_reports FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "assessment_reports_insert_authenticated" ON public.assessment_reports;
CREATE POLICY "assessment_reports_insert_authenticated"
ON public.assessment_reports FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. assessments table policies
DROP POLICY IF EXISTS "Coordinators can view assessments for their swimmers" ON public.assessments;
CREATE POLICY "Coordinators can view assessments for their swimmers"
ON public.assessments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    JOIN public.user_roles ur ON ur.user_id = sia.instructor_id
    WHERE sia.swimmer_id = assessments.swimmer_id
    AND ur.role = 'coordinator'
    AND ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins have full access to assessments" ON public.assessments;
CREATE POLICY "Admins have full access to assessments"
ON public.assessments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Instructors can view assessments for their sessions" ON public.assessments;
CREATE POLICY "Instructors can view assessments for their sessions"
ON public.assessments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = assessments.session_id
    AND s.instructor_id = auth.uid()
  )
);

-- 3. billing_line_items table policies
DROP POLICY IF EXISTS "Admins have full access to billing_line_items" ON public.billing_line_items;
CREATE POLICY "Admins have full access to billing_line_items"
ON public.billing_line_items FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- 4. billing_periods table policies
DROP POLICY IF EXISTS "Admins have full access to billing_periods" ON public.billing_periods;
CREATE POLICY "Admins have full access to billing_periods"
ON public.billing_periods FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- 5. bookings table policies
DROP POLICY IF EXISTS "Coordinators can view bookings for their swimmers" ON public.bookings;
CREATE POLICY "Coordinators can view bookings for their swimmers"
ON public.bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    JOIN public.user_roles ur ON ur.user_id = sia.instructor_id
    WHERE sia.swimmer_id = bookings.swimmer_id
    AND ur.role = 'coordinator'
    AND ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Parents can view own bookings" ON public.bookings;
CREATE POLICY "Parents can view own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.swimmers s
    WHERE s.id = bookings.swimmer_id
    AND s.parent_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Parents can insert own bookings" ON public.bookings;
CREATE POLICY "Parents can insert own bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.swimmers s
    WHERE s.id = bookings.swimmer_id
    AND s.parent_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Instructors can view bookings for their sessions" ON public.bookings;
CREATE POLICY "Instructors can view bookings for their sessions"
ON public.bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = bookings.session_id
    AND s.instructor_id = auth.uid()
  )
);

-- 6. coordinator_escalations table policies
DROP POLICY IF EXISTS "Admins have full access to coordinator_escalations" ON public.coordinator_escalations;
CREATE POLICY "Admins have full access to coordinator_escalations"
ON public.coordinator_escalations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- 7. funding_sources table policies
DROP POLICY IF EXISTS "Anyone can view active funding sources" ON public.funding_sources;
CREATE POLICY "Anyone can view active funding sources"
ON public.funding_sources FOR SELECT
TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins have full access to funding sources" ON public.funding_sources;
CREATE POLICY "Admins have full access to funding sources"
ON public.funding_sources FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- 8. page_content table policies
DROP POLICY IF EXISTS "Admins can delete page content" ON public.page_content;
CREATE POLICY "Admins can delete page content"
ON public.page_content FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Anyone can view published page content" ON public.page_content;
CREATE POLICY "Anyone can view published page content"
ON public.page_content FOR SELECT
TO authenticated
USING (is_published = true);

DROP POLICY IF EXISTS "Admins can view all page content" ON public.page_content;
CREATE POLICY "Admins can view all page content"
ON public.page_content FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Admins can update page content" ON public.page_content;
CREATE POLICY "Admins can update page content"
ON public.page_content FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Admins can insert page content" ON public.page_content;
CREATE POLICY "Admins can insert page content"
ON public.page_content FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- 9. parent_invitations table policies
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.parent_invitations;
CREATE POLICY "Users can view their own invitations"
ON public.parent_invitations FOR SELECT
TO authenticated
USING (parent_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins and coordinators can manage all invitations" ON public.parent_invitations;
CREATE POLICY "Admins and coordinators can manage all invitations"
ON public.parent_invitations FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::text) OR
  has_role(auth.uid(), 'coordinator'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::text) OR
  has_role(auth.uid(), 'coordinator'::text)
);

DROP POLICY IF EXISTS "Users can claim their own invitations" ON public.parent_invitations;
CREATE POLICY "Users can claim their own invitations"
ON public.parent_invitations FOR UPDATE
TO authenticated
USING (parent_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (parent_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 10. parent_referral_requests table policies
DROP POLICY IF EXISTS "parent_referral_requests_insert_authenticated" ON public.parent_referral_requests;
CREATE POLICY "parent_referral_requests_insert_authenticated"
ON public.parent_referral_requests FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "parent_referral_requests_select_authenticated" ON public.parent_referral_requests;
CREATE POLICY "parent_referral_requests_select_authenticated"
ON public.parent_referral_requests FOR SELECT
TO authenticated
USING (true);

-- 11. profiles table policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;
CREATE POLICY "Authenticated can read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 12. progress_notes table policies
DROP POLICY IF EXISTS "Users can view appropriate progress notes" ON public.progress_notes;
CREATE POLICY "Users can view appropriate progress notes"
ON public.progress_notes FOR SELECT
TO authenticated
USING (
  -- Admins can view all
  has_role(auth.uid(), 'admin'::text) OR
  -- Instructors can view notes for their sessions
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = progress_notes.session_id
    AND s.instructor_id = auth.uid()
  ) OR
  -- Parents can view notes for their swimmers
  EXISTS (
    SELECT 1 FROM public.swimmers s
    WHERE s.id = progress_notes.swimmer_id
    AND s.parent_id = auth.uid()
  ) OR
  -- Coordinators can view notes for their swimmers
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    JOIN public.user_roles ur ON ur.user_id = sia.instructor_id
    WHERE sia.swimmer_id = progress_notes.swimmer_id
    AND ur.role = 'coordinator'
    AND ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins have full access to progress_notes" ON public.progress_notes;
CREATE POLICY "Admins have full access to progress_notes"
ON public.progress_notes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Instructors can insert progress notes" ON public.progress_notes;
CREATE POLICY "Instructors can insert progress notes"
ON public.progress_notes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = progress_notes.session_id
    AND s.instructor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Instructors can update own progress notes" ON public.progress_notes;
CREATE POLICY "Instructors can update own progress notes"
ON public.progress_notes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = progress_notes.session_id
    AND s.instructor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = progress_notes.session_id
    AND s.instructor_id = auth.uid()
  )
);

-- 13. purchase_orders table policies
DROP POLICY IF EXISTS "Coordinators can view purchase orders for their swimmers" ON public.purchase_orders;
CREATE POLICY "Coordinators can view purchase orders for their swimmers"
ON public.purchase_orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    JOIN public.user_roles ur ON ur.user_id = sia.instructor_id
    WHERE sia.swimmer_id = purchase_orders.swimmer_id
    AND ur.role = 'coordinator'
    AND ur.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins have full access to purchase_orders" ON public.purchase_orders;
CREATE POLICY "Admins have full access to purchase_orders"
ON public.purchase_orders FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- 14. referral_requests table policies
DROP POLICY IF EXISTS "referral_requests_insert_authenticated" ON public.referral_requests;
CREATE POLICY "referral_requests_insert_authenticated"
ON public.referral_requests FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "referral_requests_select_authenticated" ON public.referral_requests;
CREATE POLICY "referral_requests_select_authenticated"
ON public.referral_requests FOR SELECT
TO authenticated
USING (true);

-- 15. sessions table policies
DROP POLICY IF EXISTS "Anyone can view available sessions" ON public.sessions;
CREATE POLICY "Anyone can view available sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (status = 'available');

DROP POLICY IF EXISTS "Instructors can view sessions they are assigned to" ON public.sessions;
CREATE POLICY "Instructors can view sessions they are assigned to"
ON public.sessions FOR SELECT
TO authenticated
USING (instructor_id = auth.uid());

-- 16. signature_audit table policies
DROP POLICY IF EXISTS "signature_audit_insert_authenticated" ON public.signature_audit;
CREATE POLICY "signature_audit_insert_authenticated"
ON public.signature_audit FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "signature_audit_select_authenticated" ON public.signature_audit;
CREATE POLICY "signature_audit_select_authenticated"
ON public.signature_audit FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "signature_audit_delete_authenticated" ON public.signature_audit;
CREATE POLICY "signature_audit_delete_authenticated"
ON public.signature_audit FOR DELETE
TO authenticated
USING (true);

-- 17. skills table policies
DROP POLICY IF EXISTS "Anyone can view skills" ON public.skills;
CREATE POLICY "Anyone can view skills"
ON public.skills FOR SELECT
TO authenticated
USING (true);

-- 18. swim_levels table policies
DROP POLICY IF EXISTS "Anyone can view swim levels" ON public.swim_levels;
CREATE POLICY "Anyone can view swim levels"
ON public.swim_levels FOR SELECT
TO authenticated
USING (true);

-- 19. swimmer_instructor_assignments table policies
DROP POLICY IF EXISTS "Instructors view own assignments" ON public.swimmer_instructor_assignments;
CREATE POLICY "Instructors view own assignments"
ON public.swimmer_instructor_assignments FOR SELECT
TO authenticated
USING (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access to assignments" ON public.swimmer_instructor_assignments;
CREATE POLICY "Admins full access to assignments"
ON public.swimmer_instructor_assignments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- 20. swimmer_skills table policies
DROP POLICY IF EXISTS "Parents can view their swimmers skills" ON public.swimmer_skills;
CREATE POLICY "Parents can view their swimmers skills"
ON public.swimmer_skills FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.swimmers s
    WHERE s.id = swimmer_skills.swimmer_id
    AND s.parent_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Instructors and admins can insert swimmer skills" ON public.swimmer_skills;
CREATE POLICY "Instructors and admins can insert swimmer skills"
ON public.swimmer_skills FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::text) OR
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    WHERE sia.swimmer_id = swimmer_skills.swimmer_id
    AND sia.instructor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Instructors and admins can update swimmer skills" ON public.swimmer_skills;
CREATE POLICY "Instructors and admins can update swimmer skills"
ON public.swimmer_skills FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::text) OR
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    WHERE sia.swimmer_id = swimmer_skills.swimmer_id
    AND sia.instructor_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::text) OR
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    WHERE sia.swimmer_id = swimmer_skills.swimmer_id
    AND sia.instructor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can delete swimmer skills" ON public.swimmer_skills;
CREATE POLICY "Admins can delete swimmer skills"
ON public.swimmer_skills FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Instructors and admins can view swimmer skills" ON public.swimmer_skills;
CREATE POLICY "Instructors and admins can view swimmer skills"
ON public.swimmer_skills FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::text) OR
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    WHERE sia.swimmer_id = swimmer_skills.swimmer_id
    AND sia.instructor_id = auth.uid()
  )
);

-- 21. swimmer_strategies table policies
DROP POLICY IF EXISTS "Instructors can manage strategies" ON public.swimmer_strategies;
CREATE POLICY "Instructors can manage strategies"
ON public.swimmer_strategies FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    WHERE sia.swimmer_id = swimmer_strategies.swimmer_id
    AND sia.instructor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    WHERE sia.swimmer_id = swimmer_strategies.swimmer_id
    AND sia.instructor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Instructors can view all strategies" ON public.swimmer_strategies;
CREATE POLICY "Instructors can view all strategies"
ON public.swimmer_strategies FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Parents can view own swimmer strategies" ON public.swimmer_strategies;
CREATE POLICY "Parents can view own swimmer strategies"
ON public.swimmer_strategies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.swimmers s
    WHERE s.id = swimmer_strategies.swimmer_id
    AND s.parent_id = auth.uid()
  )
);

-- 22. swimmer_targets table policies
DROP POLICY IF EXISTS "Instructors can manage targets" ON public.swimmer_targets;
CREATE POLICY "Instructors can manage targets"
ON public.swimmer_targets FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    WHERE sia.swimmer_id = swimmer_targets.swimmer_id
    AND sia.instructor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    WHERE sia.swimmer_id = swimmer_targets.swimmer_id
    AND sia.instructor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Instructors can view all targets" ON public.swimmer_targets;
CREATE POLICY "Instructors can view all targets"
ON public.swimmer_targets FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Parents can view own swimmer targets" ON public.swimmer_targets;
CREATE POLICY "Parents can view own swimmer targets"
ON public.swimmer_targets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.swimmers s
    WHERE s.id = swimmer_targets.swimmer_id
    AND s.parent_id = auth.uid()
  )
);

-- 23. swimmers table policies
DROP POLICY IF EXISTS "Parents can insert own swimmers" ON public.swimmers;
CREATE POLICY "Parents can insert own swimmers"
ON public.swimmers FOR INSERT
TO authenticated
WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can view swimmers they have access to" ON public.swimmers;
CREATE POLICY "Instructors can view swimmers they have access to"
ON public.swimmers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.swimmer_instructor_assignments sia
    WHERE sia.swimmer_id = swimmers.id
    AND sia.instructor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Parents can view own swimmers" ON public.swimmers;
CREATE POLICY "Parents can view own swimmers"
ON public.swimmers FOR SELECT
TO authenticated
USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can update own swimmers" ON public.swimmers;
CREATE POLICY "Parents can update own swimmers"
ON public.swimmers FOR UPDATE
TO authenticated
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

-- 24. time_entries table policies
DROP POLICY IF EXISTS "Admins can view all time entries" ON public.time_entries;
CREATE POLICY "Admins can view all time entries"
ON public.time_entries FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Instructors can view their own time entries" ON public.time_entries;
CREATE POLICY "Instructors can view their own time entries"
ON public.time_entries FOR SELECT
TO authenticated
USING (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update all time entries" ON public.time_entries;
CREATE POLICY "Admins can update all time entries"
ON public.time_entries FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Instructors can insert their own time entries" ON public.time_entries;
CREATE POLICY "Instructors can insert their own time entries"
ON public.time_entries FOR INSERT
TO authenticated
WITH CHECK (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can update their own pending time entries" ON public.time_entries;
CREATE POLICY "Instructors can update their own pending time entries"
ON public.time_entries FOR UPDATE
TO authenticated
USING (
  instructor_id = auth.uid()
  AND status = 'pending'
)
WITH CHECK (
  instructor_id = auth.uid()
  AND status = 'pending'
);

-- 25. time_off_requests table policies
DROP POLICY IF EXISTS "Instructors create own" ON public.time_off_requests;
CREATE POLICY "Instructors create own"
ON public.time_off_requests FOR INSERT
TO authenticated
WITH CHECK (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Instructors view own" ON public.time_off_requests;
CREATE POLICY "Instructors view own"
ON public.time_off_requests FOR SELECT
TO authenticated
USING (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all" ON public.time_off_requests;
CREATE POLICY "Admins view all"
ON public.time_off_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));

DROP POLICY IF EXISTS "Admins update all" ON public.time_off_requests;
CREATE POLICY "Admins update all"
ON public.time_off_requests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- 26. user_roles table policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own default role" ON public.user_roles;
CREATE POLICY "Users can insert own default role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'parent');

DROP POLICY IF EXISTS "Admins have full access to user_roles" ON public.user_roles;
CREATE POLICY "Admins have full access to user_roles"
ON public.user_roles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- 27. waiver_update_log table policies
DROP POLICY IF EXISTS "Admins can view all logs" ON public.waiver_update_log;
CREATE POLICY "Admins can view all logs"
ON public.waiver_update_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));

-- 28. waiver_update_tokens table policies
DROP POLICY IF EXISTS "System can insert tokens" ON public.waiver_update_tokens;
CREATE POLICY "System can insert tokens"
ON public.waiver_update_tokens FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public token validation" ON public.waiver_update_tokens;
CREATE POLICY "Allow public token validation"
ON public.waiver_update_tokens FOR SELECT
TO authenticated
USING (true);