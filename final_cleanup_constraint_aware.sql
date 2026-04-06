-- Migration: Final database cleanup with constraint awareness
-- Date: 2026-03-07
-- Description: Clean up database handling all foreign key constraints

-- ============================================
-- STEP 1: Create temporary table of users to delete
-- ============================================

CREATE TEMPORARY TABLE users_to_delete AS
SELECT u.id, u.email
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
  AND u.email NOT LIKE '%@icanswim209.com';

SELECT 'Users marked for deletion:' as action, COUNT(*) as count FROM users_to_delete;

-- ============================================
-- STEP 2: Handle tables with NO ACTION constraints first
-- These need to be cleaned before deleting profiles
-- ============================================

-- Start transaction
BEGIN;

RAISE NOTICE 'Starting cleanup of tables with NO ACTION constraints...';

-- 1. billing_periods (created_by has NO ACTION)
UPDATE public.billing_periods
SET created_by = NULL
WHERE created_by IN (SELECT id FROM users_to_delete);

-- 2. swimmers (created_by, approved_by, coordinator_id, priority_booking_set_by have NO ACTION)
UPDATE public.swimmers
SET created_by = NULL,
    approved_by = NULL,
    coordinator_id = NULL,
    priority_booking_set_by = NULL
WHERE created_by IN (SELECT id FROM users_to_delete)
   OR approved_by IN (SELECT id FROM users_to_delete)
   OR coordinator_id IN (SELECT id FROM users_to_delete)
   OR priority_booking_set_by IN (SELECT id FROM users_to_delete);

-- 3. swimmer_skills (updated_by has NO ACTION)
UPDATE public.swimmer_skills
SET updated_by = NULL
WHERE updated_by IN (SELECT id FROM users_to_delete);

-- 4. sessions (closed_by, instructor_id have NO ACTION)
UPDATE public.sessions
SET closed_by = NULL,
    instructor_id = NULL
WHERE closed_by IN (SELECT id FROM users_to_delete)
   OR instructor_id IN (SELECT id FROM users_to_delete);

-- 5. bookings (canceled_by has NO ACTION)
UPDATE public.bookings
SET canceled_by = NULL
WHERE canceled_by IN (SELECT id FROM users_to_delete);

-- 6. assessments (approved_by, completed_by have NO ACTION)
UPDATE public.assessments
SET approved_by = NULL,
    completed_by = NULL
WHERE approved_by IN (SELECT id FROM users_to_delete)
   OR completed_by IN (SELECT id FROM users_to_delete);

-- 7. purchase_orders (coordinator_id has NO ACTION)
UPDATE public.purchase_orders
SET coordinator_id = NULL
WHERE coordinator_id IN (SELECT id FROM users_to_delete);

-- 8. progress_notes (updated_by, instructor_id have NO ACTION)
UPDATE public.progress_notes
SET updated_by = NULL,
    instructor_id = NULL
WHERE updated_by IN (SELECT id FROM users_to_delete)
   OR instructor_id IN (SELECT id FROM users_to_delete);

-- 9. parent_referral_requests (coordinator_id has NO ACTION)
UPDATE public.parent_referral_requests
SET coordinator_id = NULL
WHERE coordinator_id IN (SELECT id FROM users_to_delete);

-- 10. referral_requests (coordinator_id has NO ACTION)
UPDATE public.referral_requests
SET coordinator_id = NULL
WHERE coordinator_id IN (SELECT id FROM users_to_delete);

-- 11. funding_sources (created_by has NO ACTION)
UPDATE public.funding_sources
SET created_by = NULL
WHERE created_by IN (SELECT id FROM users_to_delete);

-- 12. parent_invitations (created_by, claimed_by have NO ACTION)
UPDATE public.parent_invitations
SET created_by = NULL,
    claimed_by = NULL
WHERE created_by IN (SELECT id FROM users_to_delete)
   OR claimed_by IN (SELECT id FROM users_to_delete);

-- 13. assessment_reports (created_by has NO ACTION)
UPDATE public.assessment_reports
SET created_by = NULL
WHERE created_by IN (SELECT id FROM users_to_delete);

-- 14. tasks (created_by, assigned_to have NO ACTION)
UPDATE public.tasks
SET created_by = NULL,
    assigned_to = NULL
WHERE created_by IN (SELECT id FROM users_to_delete)
   OR assigned_to IN (SELECT id FROM users_to_delete);

-- 15. time_entries (payroll_processed_by has NO ACTION)
UPDATE public.time_entries
SET payroll_processed_by = NULL
WHERE payroll_processed_by IN (SELECT id FROM users_to_delete);

-- 16. time_off_requests (reviewed_by has NO ACTION)
UPDATE public.time_off_requests
SET reviewed_by = NULL
WHERE reviewed_by IN (SELECT id FROM users_to_delete);

-- 17. swimmer_instructor_assignments (assigned_by has NO ACTION)
UPDATE public.swimmer_instructor_assignments
SET assigned_by = NULL
WHERE assigned_by IN (SELECT id FROM users_to_delete);

-- 18. coordinator_escalations (escalated_by has NO ACTION)
UPDATE public.coordinator_escalations
SET escalated_by = NULL
WHERE escalated_by IN (SELECT id FROM users_to_delete);

-- 19. swimmer_targets (updated_by has NO ACTION)
UPDATE public.swimmer_targets
SET updated_by = NULL
WHERE updated_by IN (SELECT id FROM users_to_delete);

-- 20. swimmer_strategies (updated_by has NO ACTION)
UPDATE public.swimmer_strategies
SET updated_by = NULL
WHERE updated_by IN (SELECT id FROM users_to_delete);

-- 21. page_content (updated_by has NO ACTION)
UPDATE public.page_content
SET updated_by = NULL
WHERE updated_by IN (SELECT id FROM users_to_delete);

-- 22. waiver_update_log (parent_id has NO ACTION)
UPDATE public.waiver_update_log
SET parent_id = NULL
WHERE parent_id IN (SELECT id FROM users_to_delete);

RAISE NOTICE 'NO ACTION constraints handled.';

-- ============================================
-- STEP 3: Now delete profiles (CASCADE constraints will handle related tables)
-- ============================================

RAISE NOTICE 'Deleting profiles (CASCADE will handle related tables)...';

DELETE FROM public.profiles
WHERE id IN (SELECT id FROM users_to_delete);

RAISE NOTICE 'Profiles deleted.';

-- ============================================
-- STEP 4: Delete from auth.users
-- ============================================

RAISE NOTICE 'Deleting from auth.users...';

DELETE FROM auth.users
WHERE id IN (SELECT id FROM users_to_delete);

RAISE NOTICE 'Users deleted.';

-- ============================================
-- STEP 5: Clean up orphaned data
-- ============================================

RAISE NOTICE 'Cleaning up orphaned data...';

-- Delete swimmers that have no parent (orphaned after cascade)
DELETE FROM public.swimmers
WHERE parent_id IS NULL;

-- Delete bookings for deleted swimmers
DELETE FROM public.bookings
WHERE swimmer_id NOT IN (SELECT id FROM public.swimmers);

-- Delete sessions with no bookings
DELETE FROM public.sessions
WHERE id NOT IN (SELECT session_id FROM public.bookings WHERE session_id IS NOT NULL);

RAISE NOTICE 'Orphaned data cleaned.';

-- Commit transaction
COMMIT;

-- ============================================
-- STEP 6: Verify cleanup
-- ============================================

SELECT 'After cleanup counts:' as description;
SELECT 'Users' as table_name, COUNT(*) as count FROM auth.users WHERE email IS NOT NULL
UNION ALL
SELECT 'Profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'Swimmers', COUNT(*) FROM public.swimmers
UNION ALL
SELECT 'Bookings', COUNT(*) FROM public.bookings
UNION ALL
SELECT 'Sessions', COUNT(*) FROM public.sessions;

-- ============================================
-- STEP 7: Show remaining accounts
-- ============================================

SELECT 'Remaining accounts:' as header;
SELECT u.email, p.full_name, u.created_at::date as created_date
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IS NOT NULL
ORDER BY u.email;

-- Clean up temporary table
DROP TABLE users_to_delete;

SELECT 'Cleanup completed successfully!' as status;