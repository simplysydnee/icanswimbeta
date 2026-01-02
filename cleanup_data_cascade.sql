-- ============================================
-- Cleanup SQL for I Can Swim Database
-- Alternative version using strategic deletions
-- ============================================

-- Profile IDs to keep (DO NOT DELETE THESE):
-- 1. sydnee@vmrc.net (9307a07c-1dd4-4c32-8b17-324b0910b3c3)
-- 2. sydneesmerchant@gmail.com (0f64dfff-6a96-4d32-af21-142b62d80c9c)
-- 3. sutton@icanswim209.com (00fbcc63-4fe9-4069-b03c-4476e2b26aa8)

-- ============================================
-- SIMPLER APPROACH: Delete swimmers first, then profiles
-- This leverages foreign key constraints with ON DELETE CASCADE
-- ============================================

-- First, delete swimmers that don't belong to the 3 kept profiles
-- This will cascade to many dependent tables
DELETE FROM swimmers
WHERE parent_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete sessions created by instructors other than the 3 kept profiles
DELETE FROM sessions
WHERE instructor_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete bookings for parents other than the 3 kept profiles
DELETE FROM bookings
WHERE parent_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete assessments completed by others
DELETE FROM assessments
WHERE completed_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR approved_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete purchase orders coordinated by others
DELETE FROM purchase_orders
WHERE coordinator_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete progress notes by other instructors
DELETE FROM progress_notes
WHERE instructor_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete referral requests by other coordinators
DELETE FROM referral_requests
WHERE coordinator_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete parent referral requests by other coordinators
DELETE FROM parent_referral_requests
WHERE coordinator_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete parent invitations by others
DELETE FROM parent_invitations
WHERE claimed_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR created_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete assessment reports by others
DELETE FROM assessment_reports
WHERE instructor_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR created_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete tasks by others
DELETE FROM tasks
WHERE assigned_to NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR created_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete time entries by others
DELETE FROM time_entries
WHERE instructor_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR payroll_processed_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete time off requests by others
DELETE FROM time_off_requests
WHERE instructor_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR reviewed_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Delete swimmer instructor assignments by others
DELETE FROM swimmer_instructor_assignments
WHERE instructor_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR assigned_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- Finally, delete all profiles except the 3 specified ones
DELETE FROM profiles
WHERE id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check remaining profiles
SELECT 'Profiles remaining:' as check_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT '  - sydnee@vmrc.net' as check_name, COUNT(*) as count FROM profiles WHERE email = 'sydnee@vmrc.net'
UNION ALL
SELECT '  - sydneesmerchant@gmail.com' as check_name, COUNT(*) as count FROM profiles WHERE email = 'sydneesmerchant@gmail.com'
UNION ALL
SELECT '  - sutton@icanswim209.com' as check_name, COUNT(*) as count FROM profiles WHERE email = 'sutton@icanswim209.com';

-- Quick count of remaining data
SELECT 'user_roles' as table_name, COUNT(*) as row_count FROM user_roles
UNION ALL
SELECT 'swimmers' as table_name, COUNT(*) as row_count FROM swimmers
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) as row_count FROM sessions
UNION ALL
SELECT 'bookings' as table_name, COUNT(*) as row_count FROM bookings
UNION ALL
SELECT 'assessments' as table_name, COUNT(*) as row_count FROM assessments
UNION ALL
SELECT 'purchase_orders' as table_name, COUNT(*) as row_count FROM purchase_orders
UNION ALL
SELECT 'progress_notes' as table_name, COUNT(*) as row_count FROM progress_notes
ORDER BY table_name;

-- ============================================
-- NOTES:
-- ============================================
-- 1. This approach assumes foreign key constraints will handle cascading deletes
-- 2. Some tables may need manual cleanup if they don't have ON DELETE CASCADE
-- 3. Always test in a development environment first
-- 4. Consider adding ON DELETE CASCADE to foreign keys for future cleanup
-- ============================================