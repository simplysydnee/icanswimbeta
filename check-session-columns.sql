-- Check if hold columns exist in sessions table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions'
  AND table_schema = 'public'
  AND column_name IN ('held_by', 'held_until')
ORDER BY column_name;