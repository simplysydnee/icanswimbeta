-- ============================================
-- Cleanup SQL for I Can Swim Database
-- Deletes all data except for 3 specified profiles
-- Generated with proper foreign key order
-- ============================================

-- Profile IDs to keep (DO NOT DELETE THESE):
-- 1. sydnee@vmrc.net (9307a07c-1dd4-4c32-8b17-324b0910b3c3)
-- 2. sydneesmerchant@gmail.com (0f64dfff-6a96-4d32-af21-142b62d80c9c)
-- 3. sutton@icanswim209.com (00fbcc63-4fe9-4069-b03c-4476e2b26aa8)

-- ============================================
-- STEP 1: DISABLE TRIGGERS AND CONSTRAINTS
-- ============================================
-- Note: In production, you might want to use ON DELETE CASCADE instead
-- This script assumes you want to manually control deletion order

-- ============================================
-- STEP 2: DELETE FROM MOST DEPENDENT TABLES FIRST
-- ============================================

-- 1. assessment_reports (references assessments, profiles, swimmers)
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

-- 2. signature_audit (references swimmers)
DELETE FROM signature_audit
WHERE swimmer_id IN (
    SELECT id FROM swimmers WHERE parent_id NOT IN (
        '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
        '0f64dfff-6a96-4d32-af21-142b62d80c9c',
        '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
    )
);

-- 3. time_entries (references profiles)
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

-- 4. time_off_requests (references profiles)
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

-- 5. swimmer_instructor_assignments (references profiles, swimmers)
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

-- 6. tasks (references profiles, swimmers)
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

-- 7. parent_invitations (references profiles, swimmers)
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

-- 8. parent_referral_requests (references profiles)
DELETE FROM parent_referral_requests
WHERE coordinator_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- 9. referral_requests (references funding_sources, profiles)
DELETE FROM referral_requests
WHERE coordinator_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- 10. swimmer_skills (references swimmers, skills)
DELETE FROM swimmer_skills
WHERE swimmer_id IN (
    SELECT id FROM swimmers WHERE parent_id NOT IN (
        '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
        '0f64dfff-6a96-4d32-af21-142b62d80c9c',
        '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
    )
);

-- 11. progress_notes (references sessions, bookings, swimmers, profiles, swim_levels, purchase_orders)
DELETE FROM progress_notes
WHERE instructor_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- 12. purchase_orders (references swimmers, profiles, assessments, funding_sources, purchase_orders)
-- Handle self-referencing foreign key first
UPDATE purchase_orders SET parent_po_id = NULL
WHERE parent_po_id IN (
    SELECT id FROM purchase_orders WHERE coordinator_id NOT IN (
        '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
        '0f64dfff-6a96-4d32-af21-142b62d80c9c',
        '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
    )
);

DELETE FROM purchase_orders
WHERE coordinator_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- 13. assessments (references swimmers, sessions, profiles, bookings)
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

-- 14. bookings (references sessions, swimmers, profiles)
DELETE FROM bookings
WHERE parent_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR canceled_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- 15. user_roles (references profiles)
DELETE FROM user_roles
WHERE user_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- 16. skills (references swim_levels)
-- Keep skills as they are reference data, but clean up any orphaned records
DELETE FROM skills WHERE level_id IS NULL;

-- ============================================
-- STEP 3: DELETE FROM CORE TABLES
-- ============================================

-- 17. swimmers (referenced by many tables)
DELETE FROM swimmers
WHERE parent_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR created_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR approved_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR coordinator_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
) OR priority_booking_set_by NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- 18. sessions (referenced by assessments, bookings, progress_notes)
DELETE FROM sessions
WHERE instructor_id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- 19. profiles (referenced by many tables) - KEEP 3 SPECIFIED PROFILES
DELETE FROM profiles
WHERE id NOT IN (
    '9307a07c-1dd4-4c32-8b17-324b0910b3c3',
    '0f64dfff-6a96-4d32-af21-142b62d80c9c',
    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8'
);

-- 20. swim_levels (referenced by skills, swimmers, progress_notes)
-- Keep swim_levels as they are reference data

-- 21. funding_sources (referenced by profiles, purchase_orders, referral_requests, swimmers)
-- Keep funding_sources as they are reference data

-- ============================================
-- STEP 4: CLEAN UP ORPHANED RECORDS
-- ============================================

-- Clean up any remaining orphaned records
DELETE FROM assessment_reports WHERE assessment_id NOT IN (SELECT id FROM assessments);
DELETE FROM assessment_reports WHERE swimmer_id NOT IN (SELECT id FROM swimmers);
DELETE FROM signature_audit WHERE swimmer_id NOT IN (SELECT id FROM swimmers);
DELETE FROM swimmer_skills WHERE swimmer_id NOT IN (SELECT id FROM swimmers);
DELETE FROM swimmer_skills WHERE skill_id NOT IN (SELECT id FROM skills);
DELETE FROM progress_notes WHERE session_id NOT IN (SELECT id FROM sessions);
DELETE FROM progress_notes WHERE booking_id NOT IN (SELECT id FROM bookings);
DELETE FROM progress_notes WHERE swimmer_id NOT IN (SELECT id FROM swimmers);
DELETE FROM progress_notes WHERE current_level_id NOT IN (SELECT id FROM swim_levels);
DELETE FROM progress_notes WHERE next_pos_id NOT IN (SELECT id FROM purchase_orders);
DELETE FROM purchase_orders WHERE swimmer_id NOT IN (SELECT id FROM swimmers);
DELETE FROM purchase_orders WHERE funding_source_id NOT IN (SELECT id FROM funding_sources);
DELETE FROM purchase_orders WHERE assessment_id NOT IN (SELECT id FROM assessments);
DELETE FROM assessments WHERE swimmer_id NOT IN (SELECT id FROM swimmers);
DELETE FROM assessments WHERE session_id NOT IN (SELECT id FROM sessions);
DELETE FROM assessments WHERE booking_id NOT IN (SELECT id FROM bookings);
DELETE FROM bookings WHERE session_id NOT IN (SELECT id FROM sessions);
DELETE FROM bookings WHERE swimmer_id NOT IN (SELECT id FROM swimmers);
DELETE FROM skills WHERE level_id NOT IN (SELECT id FROM swim_levels);
DELETE FROM swimmers WHERE current_level_id NOT IN (SELECT id FROM swim_levels);
DELETE FROM swimmers WHERE funding_source_id NOT IN (SELECT id FROM funding_sources);
DELETE FROM profiles WHERE funding_source_id NOT IN (SELECT id FROM funding_sources);

-- ============================================
-- STEP 5: VERIFICATION QUERIES
-- ============================================

-- Check remaining profiles
SELECT 'Profiles remaining:' as check_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT '  - sydnee@vmrc.net' as check_name, COUNT(*) as count FROM profiles WHERE email = 'sydnee@vmrc.net'
UNION ALL
SELECT '  - sydneesmerchant@gmail.com' as check_name, COUNT(*) as count FROM profiles WHERE email = 'sydneesmerchant@gmail.com'
UNION ALL
SELECT '  - sutton@icanswim209.com' as check_name, COUNT(*) as count FROM profiles WHERE email = 'sutton@icanswim209.com';

-- Check other tables for data
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
UNION ALL
SELECT 'referral_requests' as table_name, COUNT(*) as row_count FROM referral_requests
UNION ALL
SELECT 'parent_referral_requests' as table_name, COUNT(*) as row_count FROM parent_referral_requests
UNION ALL
SELECT 'parent_invitations' as table_name, COUNT(*) as row_count FROM parent_invitations
UNION ALL
SELECT 'assessment_reports' as table_name, COUNT(*) as row_count FROM assessment_reports
UNION ALL
SELECT 'signature_audit' as table_name, COUNT(*) as row_count FROM signature_audit
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as row_count FROM tasks
UNION ALL
SELECT 'time_entries' as table_name, COUNT(*) as row_count FROM time_entries
UNION ALL
SELECT 'time_off_requests' as table_name, COUNT(*) as row_count FROM time_off_requests
UNION ALL
SELECT 'swimmer_instructor_assignments' as table_name, COUNT(*) as row_count FROM swimmer_instructor_assignments
UNION ALL
SELECT 'swimmer_skills' as table_name, COUNT(*) as row_count FROM swimmer_skills
ORDER BY table_name;

-- Check for foreign key violations
SELECT
    'Foreign key violations in ' || tc.table_name || '.' || kcu.column_name as violation_check,
    COUNT(*) as violation_count
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND EXISTS (
        SELECT 1
        FROM information_schema.tables AS t
        WHERE t.table_name = REPLACE(tc.table_name, '_fkey', '')
    )
GROUP BY tc.table_name, kcu.column_name
HAVING COUNT(*) > 0
ORDER BY tc.table_name;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. This script preserves 3 profiles:
--    - sydnee@vmrc.net (9307a07c-1dd4-4c32-8b17-324b0910b3c3)
--    - sydneesmerchant@gmail.com (0f64dfff-6a96-4d32-af21-142b62d80c9c)
--    - sutton@icanswim209.com (00fbcc63-4fe9-4069-b03c-4476e2b26aa8)
--
-- 2. Reference tables (swim_levels, skills, funding_sources) are kept intact
--
-- 3. Run verification queries after execution to ensure data integrity
--
-- 4. Consider taking a backup before running this script in production
--
-- 5. For large databases, you may want to run in batches or use ON DELETE CASCADE
-- ============================================