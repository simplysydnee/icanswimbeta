-- Migration: 20260203_add_admin_select_policy_page_content.sql
-- Description: Adds SELECT policy for admins to view all page_content (including unpublished)

-- Policy: Admins can view all page content (including unpublished)
CREATE POLICY "Admins can view all page content"
  ON public.page_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );