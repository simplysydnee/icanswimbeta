-- Check current instructors for staff mode
-- Shows all active instructors that would appear in StaffInstructorSelect

SELECT
  p.id,
  p.email,
  p.full_name,
  p.title,
  p.is_active,
  p.display_on_team,
  ur.role,
  -- Count today's sessions
  (
    SELECT COUNT(*)
    FROM sessions s
    WHERE s.instructor_id = p.id
      AND s.start_time >= CURRENT_DATE
      AND s.start_time < CURRENT_DATE + INTERVAL '1 day'
      AND s.status IN ('booked', 'open', 'available')
  ) as today_sessions
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.is_active = true
  AND ur.role = 'instructor'
ORDER BY p.full_name;

-- Check for test users
SELECT
  'Test Users' as category,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM profiles
WHERE email LIKE '%test.com'
  AND is_active = true

UNION ALL

SELECT
  'Real Instructors (@icanswim209.com)' as category,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM profiles
WHERE email LIKE '%@icanswim209.com'
  AND is_active = true

UNION ALL

SELECT
  'All Active Instructors' as category,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM profiles
WHERE is_active = true
  AND id IN (
    SELECT user_id FROM user_roles WHERE role = 'instructor'
  );