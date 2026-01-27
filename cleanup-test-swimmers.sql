-- SQL to clean up test swimmers from the database
-- WARNING: Backup your database before running these queries
-- Run in Supabase SQL Editor

-- 1. FIRST: Identify test swimmers (SAFE - view only)
SELECT
  s.id,
  s.first_name,
  s.last_name,
  s.date_of_birth,
  s.parent_email,
  s.enrollment_status,
  'DELETE THIS SWIMMER' as action
FROM swimmers s
LEFT JOIN profiles p ON s.parent_id = p.id
WHERE
  -- Test names
  (s.first_name ILIKE '%test%' OR s.last_name ILIKE '%test%') OR
  -- Generic birth date used in test scripts
  s.date_of_birth = '2020-01-01' OR
  -- Test parent emails
  (s.parent_email ILIKE '%@test.com' OR s.parent_email ILIKE '%@example.com') OR
  -- Linked to test parents
  (p.email ILIKE '%@test.com' OR p.email ILIKE '%@example.com')
ORDER BY s.last_name, s.first_name;

-- 2. Check for dependent data before deletion
SELECT
  'Bookings for test swimmers' as category,
  COUNT(*) as count
FROM bookings b
JOIN swimmers s ON b.swimmer_id = s.id
WHERE
  s.first_name ILIKE '%test%' OR
  s.last_name ILIKE '%test%' OR
  s.date_of_birth = '2020-01-01';

SELECT
  'Progress notes for test swimmers' as category,
  COUNT(*) as count
FROM progress_notes pn
JOIN swimmers s ON pn.swimmer_id = s.id
WHERE
  s.first_name ILIKE '%test%' OR
  s.last_name ILIKE '%test%' OR
  s.date_of_birth = '2020-01-01';

SELECT
  'Swimmer skills for test swimmers' as category,
  COUNT(*) as count
FROM swimmer_skills ss
JOIN swimmers s ON ss.swimmer_id = s.id
WHERE
  s.first_name ILIKE '%test%' OR
  s.last_name ILIKE '%test%' OR
  s.date_of_birth = '2020-01-01';

-- 3. OPTION A: Deactivate test swimmers (safer - keeps data)
-- Update enrollment_status to 'inactive' for test swimmers
/*
UPDATE swimmers
SET enrollment_status = 'inactive'
WHERE
  first_name ILIKE '%test%' OR
  last_name ILIKE '%test%' OR
  date_of_birth = '2020-01-01' OR
  parent_email ILIKE '%@test.com' OR
  parent_email ILIKE '%@example.com';
*/

-- 4. OPTION B: Delete test swimmers and related data (destructive)
-- WARNING: This will permanently delete data
-- Step 1: Delete dependent records first (due to foreign key constraints)
/*
-- Delete progress notes for test swimmers
DELETE FROM progress_notes
WHERE swimmer_id IN (
  SELECT id FROM swimmers
  WHERE
    first_name ILIKE '%test%' OR
    last_name ILIKE '%test%' OR
    date_of_birth = '2020-01-01' OR
    parent_email ILIKE '%@test.com' OR
    parent_email ILIKE '%@example.com'
);

-- Delete swimmer skills for test swimmers
DELETE FROM swimmer_skills
WHERE swimmer_id IN (
  SELECT id FROM swimmers
  WHERE
    first_name ILIKE '%test%' OR
    last_name ILIKE '%test%' OR
    date_of_birth = '2020-01-01' OR
    parent_email ILIKE '%@test.com' OR
    parent_email ILIKE '%@example.com'
);

-- Delete bookings for test swimmers
DELETE FROM bookings
WHERE swimmer_id IN (
  SELECT id FROM swimmers
  WHERE
    first_name ILIKE '%test%' OR
    last_name ILIKE '%test%' OR
    date_of_birth = '2020-01-01' OR
    parent_email ILIKE '%@test.com' OR
    parent_email ILIKE '%@example.com'
);

-- Finally, delete the test swimmers
DELETE FROM swimmers
WHERE
  first_name ILIKE '%test%' OR
  last_name ILIKE '%test%' OR
  date_of_birth = '2020-01-01' OR
  parent_email ILIKE '%@test.com' OR
  parent_email ILIKE '%@example.com';
*/

-- 5. Verify cleanup
SELECT
  'Remaining swimmers with test patterns' as category,
  COUNT(*) as count
FROM swimmers
WHERE
  first_name ILIKE '%test%' OR
  last_name ILIKE '%test%' OR
  date_of_birth = '2020-01-01' OR
  parent_email ILIKE '%@test.com' OR
  parent_email ILIKE '%@example.com';

-- 6. Summary of real swimmers (non-test)
SELECT
  'Real swimmers (non-test)' as category,
  COUNT(*) as count,
  STRING_AGG(CONCAT(first_name, ' ', last_name), ', ' ORDER BY last_name, first_name) as sample_names
FROM swimmers
WHERE NOT (
  first_name ILIKE '%test%' OR
  last_name ILIKE '%test%' OR
  date_of_birth = '2020-01-01' OR
  parent_email ILIKE '%@test.com' OR
  parent_email ILIKE '%@example.com'
);