-- SQL script to clean up test users from the database
-- Run this in Supabase SQL Editor to remove test users

-- Option 1: Deactivate test users (safer - keeps data but hides them)
UPDATE profiles
SET is_active = false
WHERE email IN (
  'instructor@test.com',
  'admin@test.com',
  'vmrc-coordinator@test.com'
);

-- Verify the deactivation
SELECT id, email, full_name, is_active
FROM profiles
WHERE email LIKE '%test.com'
ORDER BY email;

-- Option 2: Remove test users completely (more destructive)
-- WARNING: This will delete all data associated with these users
/*
-- First, find the user IDs
SELECT id, email FROM auth.users
WHERE email IN (
  'instructor@test.com',
  'admin@test.com',
  'vmrc-coordinator@test.com'
);

-- Then delete from user_roles
DELETE FROM user_roles
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'instructor@test.com',
    'admin@test.com',
    'vmrc-coordinator@test.com'
  )
);

-- Delete from profiles
DELETE FROM profiles
WHERE email IN (
  'instructor@test.com',
  'admin@test.com',
  'vmrc-coordinator@test.com'
);

-- Finally, delete from auth.users (requires admin privileges)
-- This should be done through Supabase Auth admin API or dashboard
*/

-- Check current active instructors for staff mode
SELECT
  p.id,
  p.email,
  p.full_name,
  p.is_active,
  ur.role,
  COUNT(s.id) as session_count
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN sessions s ON p.id = s.instructor_id
  AND s.start_time >= CURRENT_DATE
  AND s.start_time < CURRENT_DATE + INTERVAL '1 day'
  AND s.status IN ('booked', 'open', 'available')
WHERE p.is_active = true
  AND ur.role = 'instructor'
GROUP BY p.id, p.email, p.full_name, p.is_active, ur.role
ORDER BY p.full_name;