-- Batch 2 Corrected: Update 20 parent names from Airtable
-- Only real UUIDs from CSV data

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data (only real UUIDs)
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('4f946f9d-f86b-4737-9a46-a50955e70874', 'Monique Helfer'),
  ('06fb9789-bca3-47b5-9dd7-c1597eb0a270', 'Dilcia Madero'),
  ('7006eb6e-67d5-4e85-8496-4459dbd19efb', 'Jeanette Moreno'),
  ('7e04c803-e495-4f65-87c9-5f600583050b', 'Selena Aguirre'),
  ('b46bfc17-2be0-4b8d-b6f4-6269dd68d8b0', 'Alyssa Babauta'),
  ('4b5cb966-73d8-4937-9cc5-04af264c937a', 'Carlee Beason'),
  ('d9f6c692-e9a6-4171-960c-6daba4581190', 'Rodrigo Flores'),
  ('260eb07b-b361-4631-a671-d8191536ddaa', 'Vanessa Masi'),
  ('5e1cc00b-fa15-478e-8fba-a06a5c482633', 'Julia Tejeda'),
  ('714ff0a0-a4ef-441f-b8c3-5353d4eafe47', 'Reyna Morales'),
  ('6e288c68-3cca-4fb7-95dc-176b813a60cc', 'Bridget Richard'),
  ('bfd6e169-ea0e-4aa2-a63a-3ecf0682a9c7', 'Veronica Hildreth'),
  ('76b84f51-31b6-40e3-b41b-672ddfe1caa9', 'Cinthya Linares'),
  ('5894dcd1-0dda-4f8b-b3eb-ffa7d25141cd', 'Sabrina Robinson'),
  ('0d47271e-407a-4751-99e9-9cd15778e589', 'Jessica Villasenor'),
  ('ee483866-7b40-43b0-b704-e23e8a0e9e89', 'Lupita Oregel'),
  ('fedbc502-10af-4071-94bc-699218826a3f', 'Dulce Gomez'),
  ('f7887181-1b28-4851-90c3-2656758f7239', 'MARISOL REYES LOPEZ'),
  ('06f93320-ccb8-43c3-bdd3-48d6f7710afa', 'Eilbra Yacoub'),
  ('f339039f-d65a-4d36-8ae6-2b6d9e99b809', 'Luisa Baeza');

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

-- Show a few updated records for verification
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
LIMIT 5;

-- Clean up temporary table
DROP TABLE IF EXISTS parent_name_updates;