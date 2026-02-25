-- Batch 17: Update 16 parent names from Airtable

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('f94dd372-492a-49c8-bc2c-3be19f54b93e', 'Kat Tucker'),
  ('ec636ade-aa8d-4138-b9ac-b38864213fde', 'Berenice Galvan'),
  ('8ae31d86-29a1-42c0-83c9-ce4f7d063358', 'Benita Zarate'),
  ('b5f1ec16-fe54-44fb-98d6-236155afe402', 'Andrea Castro'),
  ('87e164cc-4732-405a-b19c-f9e2812ddf52', 'Katie Lara'),
  ('94f8558a-2862-4afb-b257-7c9b177cb7e0', 'Maria Avalos'),
  ('77916a69-56df-45f2-b3b9-58cb3cda2d83', 'Holly Williams'),
  ('4a929cda-ba27-48e0-91be-3b862d09c76d', 'Cora Amezcua'),
  ('f16dc345-69b1-4b59-9bce-aa61afb14fec', 'Jocelyn Guerrero'),
  ('5ab42db3-7552-4fcc-948e-88579503a23d', 'Samantha Ormonde'),
  ('56248673-ac30-413a-85da-580e84b7f6df', 'Britany Pridmore'),
  ('7048a3b5-9720-44a0-84ed-669a133a50a4', 'Brenda García'),
  ('eb0e2656-5011-4286-ac52-a34414ce2806', 'Liana Bulger'),
  ('9cf6dcc8-0494-47fc-b5ed-3780a568aa3b', 'Brooklyn Holt'),
  ('1d1ce5ea-cf2b-4ce8-a945-b1d087fc2597', 'Maria Mora'),
  ('53e6d1c2-341a-42b8-9da7-5a523168cf93', 'Crystal Fletcher');

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

-- Clean up temporary table
DROP TABLE IF EXISTS parent_name_updates;
