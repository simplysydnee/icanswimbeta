-- Migration: Final comprehensive database cleanup
-- Date: 2026-03-07
-- Description:
-- 1. Delete all non-test user accounts
-- 2. Clean swimmers table to only include swimmers belonging to test accounts
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
  -- Count swimmers belonging to non-test accounts (to be deleted)
  SELECT COUNT(*) INTO swimmers_to_delete_count
  FROM public.swimmers s
  WHERE s.parent_id IS NOT NULL
    AND s.parent_id NOT IN (
      SELECT p.id
      FROM public.profiles p
      JOIN auth.users u ON p.id = u.id
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
    );

  -- Count swimmers belonging to test accounts (to be kept)
  SELECT COUNT(*) INTO swimmers_to_keep_count
  FROM public.swimmers s
  WHERE s.parent_id IS NOT NULL
    AND s.parent_id IN (
      SELECT p.id
      FROM public.profiles p
      JOIN auth.users u ON p.id = u.id
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
    );

  -- Count swimmers with no parent (orphaned)
  SELECT COUNT(*) INTO total_swimmers_count
  FROM public.swimmers;

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
  RAISE NOTICE '  Swimmers to KEEP (belonging to test accounts): %', swimmers_to_keep_count;
  RAISE NOTICE '  Swimmers to DELETE (belonging to non-test accounts): %', swimmers_to_delete_count;
  RAISE NOTICE '  Orphaned swimmers (no parent): %', total_swimmers_count - swimmers_to_keep_count - swimmers_to_delete_count;
  RAISE NOTICE '';
  RAISE NOTICE 'BOOKINGS:';
  RAISE NOTICE '  Total bookings: %', total_bookings_count;
  RAISE NOTICE '  (Bookings will be cleaned based on swimmer cleanup)';
  RAISE NOTICE '';
  RAISE NOTICE 'SESSIONS:';
  RAISE NOTICE '  Total sessions: %', total_sessions_count;
  RAISE NOTICE '  (Sessions will be cleaned based on booking cleanup)';
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
  RAISE NOTICE '1. Review the counts above';
  RAISE NOTICE '2. Uncomment the transaction block below';
  RAISE NOTICE '3. Run this migration again';
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- ACTUAL CLEANUP - UNCOMMENT TO EXECUTE
-- ============================================

DO $$
DECLARE
  deleted_users_count INTEGER;
  deleted_profiles_count INTEGER;
  deleted_swimmers_count INTEGER;
  deleted_bookings_count INTEGER;
  deleted_sessions_count INTEGER;
  orphaned_swimmers_count INTEGER;
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
    RAISE NOTICE 'Step 2: Cleaning swimmers table...';

    -- Delete swimmers belonging to non-test accounts
    DELETE FROM public.swimmers
    WHERE parent_id IS NOT NULL
      AND parent_id NOT IN (
        SELECT p.id
        FROM public.profiles p
        JOIN auth.users u ON p.id = u.id
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
      )
    RETURNING COUNT(*) INTO deleted_swimmers_count;

    -- Count orphaned swimmers (no parent)
    SELECT COUNT(*) INTO orphaned_swimmers_count
    FROM public.swimmers
    WHERE parent_id IS NULL;

    RAISE NOTICE '  Deleted % swimmer records (belonging to non-test accounts)', deleted_swimmers_count;
    RAISE NOTICE '  Orphaned swimmers (no parent): %', orphaned_swimmers_count;

    -- ========== STEP 3: Clean bookings table ==========
    RAISE NOTICE 'Step 3: Cleaning bookings table...';

    -- Delete bookings for deleted swimmers
    DELETE FROM public.bookings
    WHERE swimmer_id NOT IN (SELECT id FROM public.swimmers)
    RETURNING COUNT(*) INTO deleted_bookings_count;

    RAISE NOTICE '  Deleted % booking records', deleted_bookings_count;

    -- ========== STEP 4: Clean sessions table ==========
    RAISE NOTICE 'Step 4: Cleaning sessions table...';

    -- Delete sessions that have no bookings
    DELETE FROM public.sessions
    WHERE id NOT IN (SELECT session_id FROM public.bookings WHERE session_id IS NOT NULL)
    RETURNING COUNT(*) INTO deleted_sessions_count;

    RAISE NOTICE '  Deleted % session records', deleted_sessions_count;

    -- Commit transaction
    COMMIT;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'CLEANUP COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SUMMARY:';
    RAISE NOTICE '  Deleted % user accounts', deleted_users_count;
    RAISE NOTICE '  Deleted % profile records', deleted_profiles_count;
    RAISE NOTICE '  Deleted % swimmer records', deleted_swimmers_count;
    RAISE NOTICE '  Deleted % booking records', deleted_bookings_count;
    RAISE NOTICE '  Deleted % session records', deleted_sessions_count;
    RAISE NOTICE '  Orphaned swimmers remaining: %', orphaned_swimmers_count;
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

    -- Show remaining swimmers
    RAISE NOTICE 'REMAINING SWIMMERS:';
    FOR swimmer_rec IN (
      SELECT
        s.id,
        s.first_name || ' ' || s.last_name as swimmer_name,
        p.full_name as parent_name,
        u.email as parent_email,
        s.created_at::date as created_date
      FROM public.swimmers s
      LEFT JOIN public.profiles p ON s.parent_id = p.id
      LEFT JOIN auth.users u ON p.id = u.id
      ORDER BY COALESCE(parent_name, 'No Parent'), swimmer_name
      LIMIT 20
    ) LOOP
      RAISE NOTICE '  - % (Parent: % <%> - created: %)',
        swimmer_rec.swimmer_name,
        COALESCE(swimmer_rec.parent_name, 'No Parent'),
        COALESCE(swimmer_rec.parent_email, 'No Email'),
        swimmer_rec.created_date;
    END LOOP;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total remaining swimmers: %', (SELECT COUNT(*) FROM public.swimmers);
    RAISE NOTICE '============================================';

  EXCEPTION WHEN OTHERS THEN
    -- Rollback on error
    ROLLBACK;
    RAISE NOTICE 'ERROR: Cleanup failed. Transaction rolled back.';
    RAISE NOTICE 'Error details: %', SQLERRM;
  END;
END $$;