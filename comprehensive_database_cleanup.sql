-- Migration: Comprehensive database cleanup
-- Date: 2026-03-07
-- Description:
-- 1. Delete all non-test user accounts
-- 2. Clean swimmers table to only include test accounts
-- 3. Clean related bookings and sessions data

-- ============================================
-- PREVIEW: See what will be affected
-- ============================================

DO $$
DECLARE
  -- User account counts
  accounts_to_delete_count INTEGER;
  accounts_to_keep_count INTEGER;
  total_accounts_count INTEGER;

  -- Swimmer counts
  swimmers_to_delete_count INTEGER;
  swimmers_to_keep_count INTEGER;
  total_swimmers_count INTEGER;

  -- Booking counts
  bookings_to_delete_count INTEGER;
  bookings_to_keep_count INTEGER;
  total_bookings_count INTEGER;

  -- Session counts
  sessions_to_delete_count INTEGER;
  sessions_to_keep_count INTEGER;
  total_sessions_count INTEGER;
BEGIN
  -- ========== USER ACCOUNTS ==========
  -- Count accounts to delete
  SELECT COUNT(*) INTO accounts_to_delete_count
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

  -- Count accounts to keep
  SELECT COUNT(*) INTO accounts_to_keep_count
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

  -- Total accounts
  SELECT COUNT(*) INTO total_accounts_count
  FROM auth.users
  WHERE email IS NOT NULL;

  -- ========== SWIMMERS ==========
  -- We need to identify which swimmers belong to test accounts
  -- Swimmers are linked to users through some relationship (likely parent_id or created_by)
  -- First, let's check the swimmers table structure
  RAISE NOTICE 'Checking swimmers table structure...';

  -- Count total swimmers
  SELECT COUNT(*) INTO total_swimmers_count FROM public.swimmers;

  -- For now, we'll keep all swimmers since we need to understand the relationship
  -- In a real scenario, we'd need to identify which swimmers belong to non-test parents

  -- ========== BOOKINGS ==========
  SELECT COUNT(*) INTO total_bookings_count FROM public.bookings;

  -- ========== SESSIONS ==========
  SELECT COUNT(*) INTO total_sessions_count FROM public.sessions;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'DATABASE CLEANUP PREVIEW';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'USER ACCOUNTS:';
  RAISE NOTICE '  Total accounts in database: %', total_accounts_count;
  RAISE NOTICE '  Accounts to KEEP: %', accounts_to_keep_count;
  RAISE NOTICE '  Accounts to DELETE: %', accounts_to_delete_count;
  RAISE NOTICE '';
  RAISE NOTICE 'SWIMMERS:';
  RAISE NOTICE '  Total swimmers: %', total_swimmers_count;
  RAISE NOTICE '  (Swimmer cleanup depends on parent-user relationship)';
  RAISE NOTICE '';
  RAISE NOTICE 'BOOKINGS:';
  RAISE NOTICE '  Total bookings: %', total_bookings_count;
  RAISE NOTICE '';
  RAISE NOTICE 'SESSIONS:';
  RAISE NOTICE '  Total sessions: %', total_sessions_count;
  RAISE NOTICE '============================================';

  -- Show accounts to keep
  RAISE NOTICE 'ACCOUNTS TO KEEP:';
  FOR keep_rec IN (
    SELECT u.email, p.full_name, u.created_at::date as created_date
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
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
      )
    ORDER BY u.email
  ) LOOP
    RAISE NOTICE '  - % (% - created: %)', keep_rec.email, COALESCE(keep_rec.full_name, 'no name'), keep_rec.created_date;
  END LOOP;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'TO EXECUTE CLEANUP:';
  RAISE NOTICE '1. Review the accounts above';
  RAISE NOTICE '2. Uncomment the transaction block below';
  RAISE NOTICE '3. Run this migration again';
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- FIRST: Let's examine the swimmers table structure
-- ============================================

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'swimmers'
ORDER BY ordinal_position;

-- ============================================
-- Check how swimmers are linked to users
-- ============================================

-- Look for foreign keys or user references in swimmers table
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'swimmers';

-- ============================================
-- Sample data from swimmers to understand structure
-- ============================================

SELECT
  id,
  first_name,
  last_name,
  created_at::date as created_date,
  -- Look for user-related columns
  (SELECT column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'swimmers'
   AND column_name LIKE '%parent%' LIMIT 1) as has_parent_column,
  (SELECT column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'swimmers'
   AND column_name LIKE '%user%' LIMIT 1) as has_user_column,
  (SELECT column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'swimmers'
   AND column_name LIKE '%created_by%' LIMIT 1) as has_created_by_column
FROM public.swimmers
LIMIT 5;

-- ============================================
-- ACTUAL CLEANUP - UNCOMMENT TO EXECUTE
-- ============================================

/*
DO $$
DECLARE
  deleted_users_count INTEGER;
  deleted_profiles_count INTEGER;
  deleted_swimmers_count INTEGER;
  deleted_bookings_count INTEGER;
  deleted_sessions_count INTEGER;
BEGIN
  RAISE NOTICE 'Starting comprehensive database cleanup...';

  -- Start transaction
  BEGIN
    -- ========== STEP 1: Delete non-test user accounts ==========
    RAISE NOTICE 'Step 1: Deleting non-test user accounts...';

    -- First, delete from public.profiles
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
    )
    RETURNING COUNT(*) INTO deleted_profiles_count;

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
      AND email NOT LIKE '%@icanswim209.com'
    RETURNING COUNT(*) INTO deleted_users_count;

    RAISE NOTICE '  Deleted % user accounts and % profile records', deleted_users_count, deleted_profiles_count;

    -- ========== STEP 2: Clean swimmers table ==========
    -- NOTE: This depends on how swimmers are linked to users
    -- We need to understand the relationship first
    -- For now, we'll keep all swimmers
    -- Uncomment and modify once we understand the relationship

    /*
    RAISE NOTICE 'Step 2: Cleaning swimmers table...';

    -- Example if swimmers have a parent_id linking to profiles.id:
    -- DELETE FROM public.swimmers
    -- WHERE parent_id NOT IN (
    --   SELECT id FROM public.profiles
    --   WHERE id IN (
    --     SELECT u.id FROM auth.users u WHERE u.email IS NOT NULL
    --     AND (
    --       u.email IN (... list of test emails ...)
    --       OR u.email LIKE '%@icanswim209.com'
    --     )
    --   )
    -- )
    -- RETURNING COUNT(*) INTO deleted_swimmers_count;

    -- RAISE NOTICE '  Deleted % swimmer records', deleted_swimmers_count;
    */

    -- ========== STEP 3: Clean related data ==========
    -- Bookings and sessions might be linked to swimmers or users
    -- We should clean them based on the same logic

    /*
    RAISE NOTICE 'Step 3: Cleaning related data...';

    -- Example for bookings if linked to swimmers:
    -- DELETE FROM public.bookings
    -- WHERE swimmer_id NOT IN (SELECT id FROM public.swimmers)
    -- RETURNING COUNT(*) INTO deleted_bookings_count;

    -- Example for sessions:
    -- DELETE FROM public.sessions
    -- WHERE id NOT IN (SELECT session_id FROM public.bookings)
    -- RETURNING COUNT(*) INTO deleted_sessions_count;

    -- RAISE NOTICE '  Deleted % booking records', deleted_bookings_count;
    -- RAISE NOTICE '  Deleted % session records', deleted_sessions_count;
    */

    -- Commit transaction
    COMMIT;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'CLEANUP COMPLETE (Partial)';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Deleted % user accounts', deleted_users_count;
    RAISE NOTICE 'Deleted % profile records', deleted_profiles_count;
    RAISE NOTICE '============================================';

    -- Show remaining accounts
    RAISE NOTICE 'REMAINING ACCOUNTS:';
    FOR remaining_rec IN (
      SELECT u.email, p.full_name, u.created_at::date as created_date
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      WHERE u.email IS NOT NULL
      ORDER BY u.email
    ) LOOP
      RAISE NOTICE '  - % (% - created: %)', remaining_rec.email, COALESCE(remaining_rec.full_name, 'no name'), remaining_rec.created_date;
    END LOOP;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total remaining accounts: %', (SELECT COUNT(*) FROM auth.users WHERE email IS NOT NULL);
    RAISE NOTICE '============================================';

  EXCEPTION WHEN OTHERS THEN
    -- Rollback on error
    ROLLBACK;
    RAISE NOTICE 'ERROR: Cleanup failed. Transaction rolled back.';
    RAISE NOTICE 'Error details: %', SQLERRM;
  END;
END $$;
*/