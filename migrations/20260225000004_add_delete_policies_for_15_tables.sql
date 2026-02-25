-- Migration: Add DELETE policies for 15 tables missing them
-- Date: 2026-02-25
-- Description: Add restrictive DELETE policies to prevent unauthorized data deletion

-- 1. assessments table
CREATE POLICY "Only admins can delete assessments"
ON public.assessments FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 2. billing_line_items table
CREATE POLICY "Only admins can delete billing line items"
ON public.billing_line_items FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 3. billing_periods table
CREATE POLICY "Only admins can delete billing periods"
ON public.billing_periods FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 4. bookings table
CREATE POLICY "Only admins can delete bookings"
ON public.bookings FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 5. coordinator_escalations table
CREATE POLICY "Only admins can delete coordinator escalations"
ON public.coordinator_escalations FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 6. funding_sources table
CREATE POLICY "Only admins can delete funding sources"
ON public.funding_sources FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 7. parent_invitations table
CREATE POLICY "Only admins can delete parent invitations"
ON public.parent_invitations FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 8. purchase_orders table
CREATE POLICY "Only admins can delete purchase orders"
ON public.purchase_orders FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 9. referral_requests table
CREATE POLICY "Only admins can delete referral requests"
ON public.referral_requests FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 10. sessions table
CREATE POLICY "Only admins can delete sessions"
ON public.sessions FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 11. skills table
CREATE POLICY "Only admins can delete skills"
ON public.skills FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 12. swim_levels table
CREATE POLICY "Only admins can delete swim levels"
ON public.swim_levels FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 13. swimmer_instructor_assignments table
CREATE POLICY "Only admins can delete swimmer instructor assignments"
ON public.swimmer_instructor_assignments FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 14. swimmer_strategies table
CREATE POLICY "Only admins can delete swimmer strategies"
ON public.swimmer_strategies FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 15. swimmer_targets table
CREATE POLICY "Only admins can delete swimmer targets"
ON public.swimmer_targets FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Note: These policies implement the principle of least privilege by
-- restricting DELETE operations to admin users only, preventing
-- accidental or malicious data deletion by other user roles.