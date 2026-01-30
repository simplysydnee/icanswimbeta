-- Migration: 20260129_fix_rls_policies.sql
-- Description: Tighten overly permissive RLS policies to require authentication
-- This migration replaces "allow all" policies with policies that require authenticated users

-- ============================================================================
-- PART 1: assessment_reports table
-- ============================================================================

-- Drop existing permissive policy
DROP POLICY IF EXISTS "assessment_reports_allow_all_for_now" ON public.assessment_reports;

-- Create new policies requiring authentication
CREATE POLICY "assessment_reports_select_authenticated" ON public.assessment_reports
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "assessment_reports_insert_authenticated" ON public.assessment_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "assessment_reports_update_authenticated" ON public.assessment_reports
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "assessment_reports_delete_authenticated" ON public.assessment_reports
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 2: signature_audit table
-- ============================================================================

-- Drop existing permissive policy
DROP POLICY IF EXISTS "signature_audit_allow_all_for_now" ON public.signature_audit;

-- Create new policies requiring authentication
CREATE POLICY "signature_audit_select_authenticated" ON public.signature_audit
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "signature_audit_insert_authenticated" ON public.signature_audit
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "signature_audit_update_authenticated" ON public.signature_audit
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "signature_audit_delete_authenticated" ON public.signature_audit
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 3: parent_referral_requests table
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can create parent request" ON public.parent_referral_requests;
DROP POLICY IF EXISTS "Anyone can view parent requests" ON public.parent_referral_requests;
DROP POLICY IF EXISTS "Anyone can update parent requests" ON public.parent_referral_requests;

-- Create new policies requiring authentication
CREATE POLICY "parent_referral_requests_select_authenticated" ON public.parent_referral_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "parent_referral_requests_insert_authenticated" ON public.parent_referral_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "parent_referral_requests_update_authenticated" ON public.parent_referral_requests
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Note: No DELETE policy by default; add if needed

-- ============================================================================
-- PART 4: referral_requests table
-- Note: The actual table is "referral_requests" (not vmrc_referral_requests)
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can create vmrc referral" ON public.referral_requests;
DROP POLICY IF EXISTS "Anyone can view vmrc referrals" ON public.referral_requests;
DROP POLICY IF EXISTS "Anyone can update vmrc referrals" ON public.referral_requests;

-- Create new policies requiring authentication
CREATE POLICY "referral_requests_select_authenticated" ON public.referral_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "referral_requests_insert_authenticated" ON public.referral_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "referral_requests_update_authenticated" ON public.referral_requests
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 5: Comments for documentation
-- ============================================================================

COMMENT ON POLICY "assessment_reports_select_authenticated" ON public.assessment_reports IS 'Allow authenticated users to select assessment reports';
COMMENT ON POLICY "assessment_reports_insert_authenticated" ON public.assessment_reports IS 'Allow authenticated users to insert assessment reports';
COMMENT ON POLICY "assessment_reports_update_authenticated" ON public.assessment_reports IS 'Allow authenticated users to update assessment reports';
COMMENT ON POLICY "assessment_reports_delete_authenticated" ON public.assessment_reports IS 'Allow authenticated users to delete assessment reports';

COMMENT ON POLICY "signature_audit_select_authenticated" ON public.signature_audit IS 'Allow authenticated users to select signature audit entries';
COMMENT ON POLICY "signature_audit_insert_authenticated" ON public.signature_audit IS 'Allow authenticated users to insert signature audit entries';
COMMENT ON POLICY "signature_audit_update_authenticated" ON public.signature_audit IS 'Allow authenticated users to update signature audit entries';
COMMENT ON POLICY "signature_audit_delete_authenticated" ON public.signature_audit IS 'Allow authenticated users to delete signature audit entries';

COMMENT ON POLICY "parent_referral_requests_select_authenticated" ON public.parent_referral_requests IS 'Allow authenticated users to select parent referral requests';
COMMENT ON POLICY "parent_referral_requests_insert_authenticated" ON public.parent_referral_requests IS 'Allow authenticated users to insert parent referral requests';
COMMENT ON POLICY "parent_referral_requests_update_authenticated" ON public.parent_referral_requests IS 'Allow authenticated users to update parent referral requests';

COMMENT ON POLICY "referral_requests_select_authenticated" ON public.referral_requests IS 'Allow authenticated users to select referral requests';
COMMENT ON POLICY "referral_requests_insert_authenticated" ON public.referral_requests IS 'Allow authenticated users to insert referral requests';
COMMENT ON POLICY "referral_requests_update_authenticated" ON public.referral_requests IS 'Allow authenticated users to update referral requests';

-- ============================================================================
-- Migration completed successfully
-- ============================================================================