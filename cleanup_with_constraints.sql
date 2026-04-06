-- Migration: Cleanup database with foreign key constraint handling
-- Date: 2026-03-07
-- Description: Clean up database in correct order to handle foreign key constraints

-- ============================================
-- STEP 1: Identify users to delete
-- ============================================

-- Create a temporary table to store user IDs to delete
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

SELECT 'Users to delete:' as action, COUNT(*) as count FROM users_to_delete;

-- ============================================
-- STEP 2: Clean up tables that reference profiles
-- We need to handle these in order from leaves to root
-- ============================================

-- Start transaction
BEGIN;

-- 1. First, clean up tables that don't have other dependencies
-- billing_periods has created_by reference to profiles
DELETE FROM public.billing_periods
WHERE created_by IN (SELECT id FROM users_to_delete);

-- 2. Clean up other tables with profile references
-- (Add more tables here as needed based on foreign key constraints)

-- 3. Clean up swimmers table (has parent_id reference to profiles)
DELETE FROM public.swimmers
WHERE parent_id IN (SELECT id FROM users_to_delete);

-- 4. Clean up bookings (has parent_id reference to profiles)
DELETE FROM public.bookings
WHERE parent_id IN (SELECT id FROM users_to_delete);

-- 5. Clean up sessions that have no bookings
DELETE FROM public.sessions
WHERE id NOT IN (SELECT session_id FROM public.bookings WHERE session_id IS NOT NULL);

-- 6. Now we can delete from profiles
DELETE FROM public.profiles
WHERE id IN (SELECT id FROM users_to_delete);

-- 7. Finally delete from auth.users
DELETE FROM auth.users
WHERE id IN (SELECT id FROM users_to_delete);

-- Commit transaction
COMMIT;

-- ============================================
-- STEP 3: Verify cleanup
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

-- Clean up temporary table
DROP TABLE users_to_delete;