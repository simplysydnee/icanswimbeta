-- SQL to identify test swimmers and swimmers not from old database import
-- Run this in Supabase SQL Editor

-- 1. Find swimmers with test names
SELECT
  'Test Name Swimmers' as category,
  COUNT(*) as count,
  STRING_AGG(CONCAT(first_name, ' ', last_name, ' (ID: ', id, ')'), ', ') as swimmers
FROM swimmers
WHERE
  first_name ILIKE '%test%' OR
  last_name ILIKE '%test%' OR
  first_name ILIKE '%example%' OR
  last_name ILIKE '%example%' OR
  CONCAT(first_name, ' ', last_name) ILIKE '%test child%' OR
  CONCAT(first_name, ' ', last_name) ILIKE '%completed child%';

-- 2. Find swimmers with generic/suspicious birth dates
SELECT
  'Generic Birth Date (2020-01-01)' as category,
  COUNT(*) as count,
  STRING_AGG(CONCAT(first_name, ' ', last_name, ' (Born: ', date_of_birth, ')'), ', ') as swimmers
FROM swimmers
WHERE date_of_birth = '2020-01-01';

-- 3. Find swimmers created after migration date (2026-01-09)
-- Note: created_at column might not exist, using alternative approach
SELECT
  'Created After Migration (2026-01-09)' as category,
  COUNT(*) as count,
  'Check created_at or inserted_at timestamp if available' as note
FROM swimmers
WHERE FALSE; -- Placeholder - adjust based on actual timestamp column

-- 4. Find swimmers with minimal data (possible test entries)
-- Look for swimmers missing key fields that real clients would have
SELECT
  'Minimal Data Swimmers' as category,
  COUNT(*) as count,
  STRING_AGG(CONCAT(first_name, ' ', last_name), ', ') as swimmers
FROM swimmers
WHERE
  (medical_conditions_description IS NULL OR medical_conditions_description = '') AND
  (allergies_description IS NULL OR allergies_description = '') AND
  (communication_type IS NULL OR communication_type = '') AND
  (swim_goals IS NULL OR swim_goals = '[]') AND
  (strengths_interests IS NULL OR strengths_interests = '');

-- 5. Find swimmers linked to test parent emails
SELECT
  'Linked to Test Parent Emails' as category,
  COUNT(DISTINCT s.id) as count,
  STRING_AGG(DISTINCT CONCAT(s.first_name, ' ', s.last_name), ', ') as swimmers
FROM swimmers s
JOIN profiles p ON s.parent_id = p.id
WHERE p.email ILIKE '%@test.com' OR p.email ILIKE '%@example.com';

-- 6. Find swimmers with parent_email containing test domains
SELECT
  'Parent Email Test Domains' as category,
  COUNT(*) as count,
  STRING_AGG(CONCAT(first_name, ' ', last_name, ' (Email: ', parent_email, ')'), ', ') as swimmers
FROM swimmers
WHERE parent_email ILIKE '%@test.com' OR parent_email ILIKE '%@example.com';

-- 7. Comprehensive test swimmer identification
SELECT
  s.id,
  s.first_name,
  s.last_name,
  s.date_of_birth,
  s.parent_email,
  s.enrollment_status,
  s.created_at,
  CASE
    WHEN s.first_name ILIKE '%test%' OR s.last_name ILIKE '%test%' THEN 'Test Name'
    WHEN s.date_of_birth = '2020-01-01' THEN 'Generic Birth Date'
    WHEN s.parent_email ILIKE '%@test.com' OR s.parent_email ILIKE '%@example.com' THEN 'Test Parent Email'
    WHEN p.email ILIKE '%@test.com' OR p.email ILIKE '%@example.com' THEN 'Linked to Test Parent'
    ELSE 'Other'
  END as test_indicator,
  CASE
    WHEN s.medical_conditions_description IS NULL OR s.medical_conditions_description = '' THEN 'Minimal Medical Data'
    WHEN s.allergies_description IS NULL OR s.allergies_description = '' THEN 'Minimal Allergy Data'
    ELSE 'Complete Data'
  END as data_completeness
FROM swimmers s
LEFT JOIN profiles p ON s.parent_id = p.id
WHERE
  s.first_name ILIKE '%test%' OR
  s.last_name ILIKE '%test%' OR
  s.date_of_birth = '2020-01-01' OR
  s.parent_email ILIKE '%@test.com' OR
  s.parent_email ILIKE '%@example.com' OR
  p.email ILIKE '%@test.com' OR
  p.email ILIKE '%@example.com'
ORDER BY test_indicator, s.last_name, s.first_name;

-- 8. Count real vs test swimmers (estimated)
SELECT
  'Estimated Real Swimmers (from migration)' as category,
  350 as count,
  'Based on MIGRATION_SUMMARY.md - 350 clients migrated' as source
UNION ALL
SELECT
  'Estimated Test Swimmers' as category,
  (
    SELECT COUNT(*)
    FROM swimmers
    WHERE
      first_name ILIKE '%test%' OR
      last_name ILIKE '%test%' OR
      date_of_birth = '2020-01-01' OR
      parent_email ILIKE '%@test.com' OR
      parent_email ILIKE '%@example.com'
  ) as count,
  'Based on test patterns identified' as source
UNION ALL
SELECT
  'Total Swimmers in Database' as category,
  (SELECT COUNT(*) FROM swimmers) as count,
  'Current database total' as source;