-- SQL to analyze swimmer origins: old database import vs new/test swimmers
-- Helps identify which swimmers came from migration vs were created later

-- 1. Characteristics of migrated swimmers (from old database)
-- Based on MIGRATION_SUMMARY.md, migrated swimmers have:
-- - Real parent emails (not @test.com or @example.com)
-- - Complete data (medical conditions, allergies, etc.)
-- - Funding source information (VMRC funded, private pay)
-- - Parent_id may be NULL (awaiting parent link)
-- - parent_email field populated

-- 2. Characteristics of test/new swimmers
-- - Test names ("Test", "Example", etc.)
-- - Generic birth dates (2020-01-01)
-- - Test parent emails (@test.com, @example.com)
-- - Minimal data (missing medical/allergy info)
-- - Created after migration date (2026-01-09)

-- 3. Analyze swimmer origins
SELECT
  CASE
    -- Likely test swimmers
    WHEN first_name ILIKE '%test%' OR last_name ILIKE '%test%' THEN 'Test Swimmer'
    WHEN date_of_birth = '2020-01-01' THEN 'Test Swimmer (generic birth date)'
    WHEN parent_email ILIKE '%@test.com' OR parent_email ILIKE '%@example.com' THEN 'Test Swimmer (test parent email)'

    -- Likely migrated swimmers (from old database)
    WHEN parent_email IS NOT NULL AND parent_email NOT ILIKE '%@test.com' AND parent_email NOT ILIKE '%@example.com' THEN 'Likely Migrated (has parent_email)'
    WHEN (medical_conditions_description IS NOT NULL AND medical_conditions_description != '') OR
         (allergies_description IS NOT NULL AND allergies_description != '') THEN 'Likely Migrated (has medical data)'

    -- Unknown/New swimmers
    ELSE 'Unknown/New Swimmer'
  END as origin_category,
  COUNT(*) as swimmer_count,
  STRING_AGG(CONCAT(first_name, ' ', last_name), ', ' ORDER BY last_name, first_name) as example_names
FROM swimmers
GROUP BY origin_category
ORDER BY
  CASE origin_category
    WHEN 'Test Swimmer' THEN 1
    WHEN 'Test Swimmer (generic birth date)' THEN 2
    WHEN 'Test Swimmer (test parent email)' THEN 3
    WHEN 'Likely Migrated (has parent_email)' THEN 4
    WHEN 'Likely Migrated (has medical data)' THEN 5
    ELSE 6
  END;

-- 4. Detailed analysis of potential test swimmers
SELECT
  s.id,
  s.first_name,
  s.last_name,
  s.date_of_birth,
  s.parent_email,
  s.enrollment_status,
  CASE
    WHEN s.first_name ILIKE '%test%' OR s.last_name ILIKE '%test%' THEN 'Test name'
    WHEN s.date_of_birth = '2020-01-01' THEN 'Generic birth date'
    WHEN s.parent_email ILIKE '%@test.com' OR s.parent_email ILIKE '%@example.com' THEN 'Test parent email'
    WHEN s.medical_conditions_description IS NULL OR s.medical_conditions_description = '' THEN 'Missing medical data'
    WHEN s.allergies_description IS NULL OR s.allergies_description = '' THEN 'Missing allergy data'
    ELSE 'Other'
  END as test_indicator,
  CASE
    WHEN s.parent_email IS NOT NULL AND s.parent_email NOT ILIKE '%@test.com' AND s.parent_email NOT ILIKE '%@example.com' THEN 'Has real parent email'
    WHEN s.parent_id IS NOT NULL THEN 'Linked to parent'
    ELSE 'No parent link'
  END as parent_status,
  'Consider deletion if test swimmer' as recommendation
FROM swimmers s
WHERE
  s.first_name ILIKE '%test%' OR
  s.last_name ILIKE '%test%' OR
  s.date_of_birth = '2020-01-01' OR
  s.parent_email ILIKE '%@test.com' OR
  s.parent_email ILIKE '%@example.com' OR
  (s.medical_conditions_description IS NULL OR s.medical_conditions_description = '') OR
  (s.allergies_description IS NULL OR s.allergies_description = '')
ORDER BY
  CASE
    WHEN s.first_name ILIKE '%test%' OR s.last_name ILIKE '%test%' THEN 1
    WHEN s.date_of_birth = '2020-01-01' THEN 2
    WHEN s.parent_email ILIKE '%@test.com' OR s.parent_email ILIKE '%@example.com' THEN 3
    ELSE 4
  END,
  s.last_name, s.first_name;

-- 5. Swimmers likely from old database (migration)
SELECT
  'Swimmers likely from old database migration' as category,
  COUNT(*) as count,
  'These have real parent emails and/or complete medical data' as criteria,
  STRING_AGG(CONCAT(first_name, ' ', last_name), ', ' ORDER BY last_name, first_name) as sample_names
FROM swimmers
WHERE
  (parent_email IS NOT NULL AND parent_email NOT ILIKE '%@test.com' AND parent_email NOT ILIKE '%@example.com') OR
  (medical_conditions_description IS NOT NULL AND medical_conditions_description != '') OR
  (allergies_description IS NOT NULL AND allergies_description != '')
  AND NOT (
    first_name ILIKE '%test%' OR
    last_name ILIKE '%test%' OR
    date_of_birth = '2020-01-01'
  );

-- 6. Recommendations summary
SELECT
  'Total swimmers in database' as metric,
  (SELECT COUNT(*) FROM swimmers) as value
UNION ALL
SELECT
  'Estimated migrated swimmers (from old DB)',
  (SELECT COUNT(*) FROM swimmers WHERE parent_email IS NOT NULL AND parent_email NOT ILIKE '%@test.com' AND parent_email NOT ILIKE '%@example.com')
UNION ALL
SELECT
  'Estimated test swimmers',
  (SELECT COUNT(*) FROM swimmers WHERE first_name ILIKE '%test%' OR last_name ILIKE '%test%' OR date_of_birth = '2020-01-01' OR parent_email ILIKE '%@test.com' OR parent_email ILIKE '%@example.com')
UNION ALL
SELECT
  'Swimmers with minimal data (possible tests)',
  (SELECT COUNT(*) FROM swimmers WHERE (medical_conditions_description IS NULL OR medical_conditions_description = '') AND (allergies_description IS NULL OR allergies_description = ''));