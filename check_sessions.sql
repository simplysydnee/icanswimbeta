-- Check sessions for today (2026-01-15)
SELECT 
  id,
  instructor_id,
  start_time,
  end_time,
  status,
  session_type,
  location
FROM sessions 
WHERE DATE(start_time) = '2026-01-15'
ORDER BY start_time;
