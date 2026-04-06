-- Migration: Clean up database - remove all non-test accounts
-- Date: 2026-03-07
-- Description: Delete all user accounts except specified test accounts
-- Accounts to KEEP:
-- 1. Anas-connected or our test accounts:
--    - anas.parent-vmrc@icanswim.com
--    - anas.parent@icanswim209.com
--    - anas.coordinator@icanswim.com
--    - anas.instructor@icanswim.com
-- 2. All @icanswim209.com instructors (Sutton, Lauren, Megan, Brooke, etc.)
-- 3. Personal accounts:
--    - sydnee@icanswim209.com
--    - sydnee@simplysydnee.com
-- 4. Standard test role accounts:
--    - admin@test.com
--    - coordinator-test@icanswim.local
--    - instructor-test@icanswim.local
--    - admin-test@icanswim.local
--    - parent-vmrc-test@icanswim.local
--    - parent-private-test@icanswim.local

-- First, let's see what we're going to delete
SELECT 'Accounts to be DELETED:' as action;
SELECT u.id, u.email, u.created_at, p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IS NOT NULL
  AND u.email NOT IN (
    -- Anas accounts
    'anas.parent-vmrc@icanswim.com',
    'anas.parent@icanswim209.com',
    'anas.coordinator@icanswim.com',
    'anas.instructor@icanswim.com',

    -- Sydnee accounts
    'sydnee@icanswim209.com',
    'sydnee@simplysydnee.com',

    -- Standard test accounts
    'admin@test.com',
    'coordinator-test@icanswim.local',
    'instructor-test@icanswim.local',
    'admin-test@icanswim.local',
    'parent-vmrc-test@icanswim.local',
    'parent-private-test@icanswim.local'
  )
  AND u.email NOT LIKE '%@icanswim209.com'  -- Keep all icanswim209.com accounts
ORDER BY u.created_at DESC;

-- Count of accounts to delete
SELECT 'Total accounts to DELETE:' as action, COUNT(*) as count
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

-- Count of accounts to KEEP
SELECT 'Total accounts to KEEP:' as action, COUNT(*) as count
FROM auth.users u
WHERE u.email IS NOT NULL
  AND (
    u.email IN (
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
    OR u.email LIKE '%@icanswim209.com'
  );

-- ============================================
-- ACTUAL DELETION - UNCOMMENT TO EXECUTE
-- ============================================

-- WARNING: This will permanently delete user accounts and their associated data
-- Make sure you have backups and have verified the accounts to keep above

/*
-- First, delete from public.profiles (cascading should handle related data)
DELETE FROM public.profiles
WHERE id IN (
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
);

-- Then delete from auth.users
DELETE FROM auth.users
WHERE email IS NOT NULL
  AND email NOT IN (
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
  AND email NOT LIKE '%@icanswim209.com';

-- Verify deletion
SELECT 'Remaining accounts after cleanup:' as action;
SELECT u.email, u.created_at, p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IS NOT NULL
ORDER BY u.email;

SELECT 'Total remaining accounts:' as action, COUNT(*) as count
FROM auth.users
WHERE email IS NOT NULL;
*/