-- Fix progress_notes API vs RLS conflict
-- Migration: 20260225092515_fix_progress_notes_api_rls_conflict.sql
-- Description: Remove redundant .or() filter from progress_notes API since RLS now handles authorization

-- Note: This is a documentation migration to track the API code change
-- The actual fix was applied to src/app/api/progress-notes/route.ts

-- Changes made:
-- 1. Removed redundant `.or(`instructor_id.eq.${user.id},shared_with_parent.eq.true`)` filter from GET endpoint
-- 2. Updated API to use has_role() RPC instead of direct user_roles table queries
-- 3. RLS policy "Users can view appropriate progress notes" already handles:
--    - Admins: has_role(auth.uid(), 'admin')
--    - Instructors: instructor_id = auth.uid()
--    - Parents: shared_with_parent = true AND auth.uid() IN (SELECT swimmers.parent_id FROM swimmers WHERE swimmers.id = progress_notes.swimmer_id)

-- Verification: API now relies entirely on RLS policies for authorization
-- No double-filtering that could cause conflicts or unexpected results