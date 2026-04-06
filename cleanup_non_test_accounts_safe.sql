-- Migration: Clean up database - remove all non-test accounts (SAFE VERSION)
-- Date: 2026-03-07
-- Description: Delete all user accounts except specified test accounts
-- This version uses a transaction and provides detailed before/after reports

-- ============================================
-- PREVIEW: See what will be deleted
-- ============================================

DO $$
DECLARE
  accounts_to_delete_count INTEGER;
  accounts_to_keep_count INTEGER;
  total_accounts_count INTEGER;
BEGIN
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

  RAISE NOTICE '============================================';
  RAISE NOTICE 'DATABASE CLEANUP PREVIEW';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total accounts in database: %', total_accounts_count;
  RAISE NOTICE 'Accounts to KEEP: %', accounts_to_keep_count;
  RAISE NOTICE 'Accounts to DELETE: %', accounts_to_delete_count;
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
  RAISE NOTICE 'ACCOUNTS TO DELETE (first 10):';

  -- Show first 10 accounts to delete
  FOR delete_rec IN (
    SELECT u.email, p.full_name, u.created_at::date as created_date
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
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
    ORDER BY u.created_at DESC
    LIMIT 10
  ) LOOP
    RAISE NOTICE '  - % (% - created: %)', delete_rec.email, COALESCE(delete_rec.full_name, 'no name'), delete_rec.created_date;
  END LOOP;

  IF accounts_to_delete_count > 10 THEN
    RAISE NOTICE '  ... and % more accounts', accounts_to_delete_count - 10;
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'TO EXECUTE DELETION:';
  RAISE NOTICE '1. Review the accounts above';
  RAISE NOTICE '2. Uncomment the transaction block below';
  RAISE NOTICE '3. Run this migration again';
  RAISE NOTICE '============================================';
END $$;

-- ============================================
-- ACTUAL DELETION - UNCOMMENT TO EXECUTE
-- ============================================

/*
DO $$
DECLARE
  deleted_users_count INTEGER;
  deleted_profiles_count INTEGER;
BEGIN
  RAISE NOTICE 'Starting database cleanup...';

  -- Start transaction
  BEGIN
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

    -- Commit transaction
    COMMIT;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'CLEANUP COMPLETE';
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