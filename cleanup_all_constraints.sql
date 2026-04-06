-- Cleanup script that handles ALL foreign key constraints
-- Step 1: NULL out all NO ACTION constraints
-- Step 2: Delete profiles (CASCADE will handle CASCADE constraints)
-- Step 3: Delete users
-- Step 4: Clean up orphaned data

BEGIN;

-- Get users to delete once and use it in all queries
WITH users_to_delete AS (
  SELECT u.id
  FROM auth.users u
  WHERE u.email IS NOT NULL
    AND u.email NOT IN (
      'anas.parent-vmrc@icanswim.com',
      'anas.parent@icanswim209.com',
      'anas.coordinator@icanswim.com',
      'anas.instructor@icanswim.com',
      'sydnee@icanswim209.com',
      'sydnee@simplysydnee.com',
      'admin@test.com',
      'coordinator-test@icanswim.local',
      'instructor-test@icanswim.local',
      'admin-test@icanswim.local',
      'parent-vmrc-test@icanswim.local',
      'parent-private-test@icanswim.local'
    )
    AND u.email NOT LIKE '%@icanswim209.com'
)
-- Handle ALL tables with NO ACTION constraints
-- List from the foreign key constraint analysis
UPDATE public.billing_periods SET created_by = NULL WHERE created_by IN (SELECT id FROM users_to_delete);
UPDATE public.swimmers SET created_by = NULL, approved_by = NULL, coordinator_id = NULL, priority_booking_set_by = NULL WHERE created_by IN (SELECT id FROM users_to_delete) OR approved_by IN (SELECT id FROM users_to_delete) OR coordinator_id IN (SELECT id FROM users_to_delete) OR priority_booking_set_by IN (SELECT id FROM users_to_delete);
UPDATE public.swimmer_skills SET updated_by = NULL WHERE updated_by IN (SELECT id FROM users_to_delete);
UPDATE public.sessions SET closed_by = NULL, instructor_id = NULL WHERE closed_by IN (SELECT id FROM users_to_delete) OR instructor_id IN (SELECT id FROM users_to_delete);
UPDATE public.bookings SET canceled_by = NULL WHERE canceled_by IN (SELECT id FROM users_to_delete);
UPDATE public.assessments SET approved_by = NULL, completed_by = NULL WHERE approved_by IN (SELECT id FROM users_to_delete) OR completed_by IN (SELECT id FROM users_to_delete);
UPDATE public.purchase_orders SET coordinator_id = NULL WHERE coordinator_id IN (SELECT id FROM users_to_delete);
UPDATE public.progress_notes SET updated_by = NULL, instructor_id = NULL WHERE updated_by IN (SELECT id FROM users_to_delete) OR instructor_id IN (SELECT id FROM users_to_delete);
UPDATE public.parent_referral_requests SET coordinator_id = NULL WHERE coordinator_id IN (SELECT id FROM users_to_delete);
UPDATE public.referral_requests SET coordinator_id = NULL WHERE coordinator_id IN (SELECT id FROM users_to_delete);
UPDATE public.funding_sources SET created_by = NULL WHERE created_by IN (SELECT id FROM users_to_delete);
UPDATE public.parent_invitations SET created_by = NULL, claimed_by = NULL WHERE created_by IN (SELECT id FROM users_to_delete) OR claimed_by IN (SELECT id FROM users_to_delete);
UPDATE public.assessment_reports SET created_by = NULL WHERE created_by IN (SELECT id FROM users_to_delete);
UPDATE public.tasks SET created_by = NULL, assigned_to = NULL WHERE created_by IN (SELECT id FROM users_to_delete) OR assigned_to IN (SELECT id FROM users_to_delete);
UPDATE public.time_entries SET payroll_processed_by = NULL WHERE payroll_processed_by IN (SELECT id FROM users_to_delete);
UPDATE public.time_off_requests SET reviewed_by = NULL WHERE reviewed_by IN (SELECT id FROM users_to_delete);
UPDATE public.swimmer_instructor_assignments SET assigned_by = NULL WHERE assigned_by IN (SELECT id FROM users_to_delete);
UPDATE public.coordinator_escalations SET escalated_by = NULL WHERE escalated_by IN (SELECT id FROM users_to_delete);
UPDATE public.swimmer_targets SET updated_by = NULL WHERE updated_by IN (SELECT id FROM users_to_delete);
UPDATE public.swimmer_strategies SET updated_by = NULL WHERE updated_by IN (SELECT id FROM users_to_delete);
UPDATE public.page_content SET updated_by = NULL WHERE updated_by IN (SELECT id FROM users_to_delete);
UPDATE public.waiver_update_log SET parent_id = NULL WHERE parent_id IN (SELECT id FROM users_to_delete);

-- Now delete profiles (CASCADE will handle CASCADE constraints)
DELETE FROM public.profiles WHERE id IN (SELECT id FROM users_to_delete);

-- Delete from auth.users
DELETE FROM auth.users WHERE id IN (SELECT id FROM users_to_delete);

-- Clean up orphaned data
DELETE FROM public.swimmers WHERE parent_id IS NULL;
DELETE FROM public.bookings WHERE swimmer_id NOT IN (SELECT id FROM public.swimmers);
DELETE FROM public.sessions WHERE id NOT IN (SELECT session_id FROM public.bookings WHERE session_id IS NOT NULL);

COMMIT;

SELECT 'Cleanup completed!' as status;