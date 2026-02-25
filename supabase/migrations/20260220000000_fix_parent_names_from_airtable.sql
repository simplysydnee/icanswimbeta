-- Migration: Fix parent names from Airtable
-- This migration updates the parent_name field in swimmers table with correct names from Airtable
-- The parent names were incorrectly migrated as email prefixes instead of actual parent names

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert sample updates (these would come from Airtable export)
-- In production, this would be populated from a CSV export of Airtable data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('939f1ab4-217a-4d3c-acf5-9608854a8579', 'Jeanette Moreno'),
  ('41fe4838-4f93-4bfc-8781-9908cff177fe', 'Melissa Gonzales'),
  ('d48425c2-1328-47f1-8461-59fdf9dce5be', 'Jessica Rosales'),
  ('61614592-0ae5-43a1-ad0e-0d553139f06b', 'Cruz'),
  ('c1873804-9bc9-414e-b2f1-d7332054e22a', 'Carmen Madriz'),
  ('68f20b9b-2cb2-4052-98c9-d83def6bbca6', 'Taylor Bennett'),
  ('c40281d3-8707-4081-b24e-1443f02533f0', 'Marielene Gosai')
ON CONFLICT (supabase_id) DO NOTHING;

-- Update swimmers with correct parent names
UPDATE swimmers s
SET parent_name = pnu.correct_parent_name
FROM parent_name_updates pnu
WHERE s.id = pnu.supabase_id
  AND s.parent_name IS DISTINCT FROM pnu.correct_parent_name;

-- Count how many records were updated
SELECT
  COUNT(*) as total_updates_applied,
  (SELECT COUNT(*) FROM parent_name_updates) as total_updates_available
FROM swimmers s
JOIN parent_name_updates pnu ON s.id = pnu.supabase_id
WHERE s.parent_name = pnu.correct_parent_name;

-- Show sample of updated records
SELECT
  s.id,
  s.first_name,
  s.last_name,
  s.parent_name as new_parent_name,
  pnu.correct_parent_name as expected_parent_name,
  s.parent_email
FROM swimmers s
JOIN parent_name_updates pnu ON s.id = pnu.supabase_id
WHERE s.parent_name = pnu.correct_parent_name
LIMIT 10;

-- Clean up temporary table
DROP TABLE IF EXISTS parent_name_updates;

-- Note: For a complete migration, you would need to:
-- 1. Export all records from Airtable with Supabase ID and Parent Name fields
-- 2. Convert to CSV format
-- 3. Use Supabase's import feature or write a script to update all records
-- 4. Run the update in batches to avoid timeouts