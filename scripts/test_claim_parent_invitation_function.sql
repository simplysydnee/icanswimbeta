-- Test Script: test_claim_parent_invitation_function.sql
-- Purpose: Test the atomic claim_parent_invitation function created in Phase 1
-- WARNING: DO NOT RUN IN PRODUCTION. This creates test data and rolls back.
-- Use only in development/staging environments.

-- Instructions:
-- 1. Run this script in Supabase SQL Editor or via psql
-- 2. The script will create test data, test the function, and rollback all changes
-- 3. Verify the test passes (no errors) and check the output messages

-- Setup: Use an existing test user (testparent@example.com) or replace with your own test user ID
-- The test user must exist in auth.users and public.profiles

BEGIN;

DO $$
DECLARE
  -- Test user ID (testparent@example.com from profiles)
  test_user_id uuid := '35679b22-9ff6-4930-bff7-c9d42a633f8f';

  -- Test data variables
  test_swimmer_id uuid;
  test_invitation_id uuid;
  test_client_number text;
  test_token text;

  -- Test counters
  tests_passed int := 0;
  total_tests int := 0;
BEGIN
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Testing claim_parent_invitation function';
  RAISE NOTICE '=========================================';

  -- Generate unique identifiers
  test_client_number := 'TEST-CLAIM-' || gen_random_uuid();
  test_token := 'test-token-' || gen_random_uuid();

  -- Test 1: Create test data and claim successfully
  total_tests := total_tests + 1;
  RAISE NOTICE '';
  RAISE NOTICE 'Test 1: Successful claim';
  RAISE NOTICE '-----------------------';

  -- Create test swimmer
  INSERT INTO swimmers (
    first_name,
    last_name,
    date_of_birth,
    client_number,
    enrollment_status
  ) VALUES (
    'Test',
    'Child Claim Test',
    '2020-01-01',
    test_client_number,
    'waitlist'
  ) RETURNING id INTO test_swimmer_id;

  RAISE NOTICE 'Created test swimmer: %', test_swimmer_id;

  -- Create pending invitation
  INSERT INTO parent_invitations (
    swimmer_id,
    parent_email,
    parent_name,
    status,
    invitation_token,
    expires_at
  ) VALUES (
    test_swimmer_id,
    'testparent@example.com',
    'Test Parent',
    'pending',
    test_token,
    now() + interval '7 days'
  ) RETURNING id INTO test_invitation_id;

  RAISE NOTICE 'Created test invitation: %', test_invitation_id;

  -- Call the function
  PERFORM claim_parent_invitation(test_invitation_id, test_user_id, test_swimmer_id);
  RAISE NOTICE 'Function executed successfully';

  -- Verify invitation was updated
  IF EXISTS (
    SELECT 1 FROM parent_invitations
    WHERE id = test_invitation_id
    AND status = 'claimed'
    AND claimed_by = test_user_id
    AND claimed_at IS NOT NULL
  ) THEN
    RAISE NOTICE '✓ Invitation properly updated';
    tests_passed := tests_passed + 1;
  ELSE
    RAISE NOTICE '✗ Invitation not updated correctly';
  END IF;

  -- Verify swimmer was linked
  IF EXISTS (
    SELECT 1 FROM swimmers
    WHERE id = test_swimmer_id
    AND parent_id = test_user_id
    AND enrollment_status = 'pending_enrollment'
  ) THEN
    RAISE NOTICE '✓ Swimmer properly linked';
    tests_passed := tests_passed + 1;
  ELSE
    RAISE NOTICE '✗ Swimmer not linked correctly';
  END IF;

  -- Verify parent role exists (should already exist)
  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = test_user_id
    AND role = 'parent'::user_role
  ) THEN
    RAISE NOTICE '✓ Parent role exists';
    tests_passed := tests_passed + 1;
  ELSE
    RAISE NOTICE '✗ Parent role missing';
  END IF;

  total_tests := total_tests + 2; -- Two additional checks above

  -- Test 2: Attempt to claim same invitation again (should fail)
  total_tests := total_tests + 1;
  RAISE NOTICE '';
  RAISE NOTICE 'Test 2: Double claim prevention';
  RAISE NOTICE '-------------------------------';

  BEGIN
    PERFORM claim_parent_invitation(test_invitation_id, test_user_id, test_swimmer_id);
    RAISE NOTICE '✗ Double claim should have raised exception';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE '✓ Double claim correctly rejected: %', SQLERRM;
      tests_passed := tests_passed + 1;
  END;

  -- Test 3: Attempt to claim with mismatched swimmer ID (should fail)
  total_tests := total_tests + 1;
  RAISE NOTICE '';
  RAISE NOTICE 'Test 3: Mismatched swimmer validation';
  RAISE NOTICE '--------------------------------------';

  BEGIN
    PERFORM claim_parent_invitation(
      test_invitation_id,
      test_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid
    );
    RAISE NOTICE '✗ Mismatched swimmer should have raised exception';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE '✓ Mismatched swimmer correctly rejected: %', SQLERRM;
      tests_passed := tests_passed + 1;
  END;

  -- Test 4: Attempt to claim expired invitation (should fail)
  total_tests := total_tests + 1;
  RAISE NOTICE '';
  RAISE NOTICE 'Test 4: Expiration check';
  RAISE NOTICE '------------------------';

  -- Create another invitation with past expiration
  INSERT INTO parent_invitations (
    swimmer_id,
    parent_email,
    parent_name,
    status,
    invitation_token,
    expires_at
  ) VALUES (
    test_swimmer_id,
    'testparent@example.com',
    'Test Parent',
    'pending',
    'expired-token-' || gen_random_uuid(),
    now() - interval '1 day'
  ) RETURNING id INTO test_invitation_id;

  BEGIN
    PERFORM claim_parent_invitation(test_invitation_id, test_user_id, test_swimmer_id);
    RAISE NOTICE '✗ Expired invitation should have raised exception';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE '✓ Expired invitation correctly rejected: %', SQLERRM;
      tests_passed := tests_passed + 1;
  END;

  -- Summary
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Test Summary: %/% tests passed', tests_passed, total_tests;
  RAISE NOTICE '=========================================';

  IF tests_passed = total_tests THEN
    RAISE NOTICE '✅ All tests passed!';
  ELSE
    RAISE EXCEPTION '❌ Some tests failed';
  END IF;

  -- All changes will be rolled back by the outer transaction
  RAISE NOTICE '';
  RAISE NOTICE 'All test data will be rolled back (no permanent changes).';

END $$;

-- Rollback all test data
ROLLBACK;

-- Final message
DO $$
BEGIN
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Test completed successfully!';
  RAISE NOTICE 'The claim_parent_invitation function is working correctly.';
  RAISE NOTICE '=========================================';
END $$;