-- Migration: Fix parent names from Airtable - Batch 1 (First 100 records)
-- This migration updates the parent_name field in swimmers table with correct names from Airtable
-- Batch 1 of 17 - Generated from CSV export on 2026-02-20

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data (first 100 records)
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('87cd06fc-e529-49f1-a337-f2fb45c7cb0c', 'Michelle Ramirez-Valenzuela'),
  ('5a9c87f0-615c-4855-88ec-9397e2d603e9', 'Charice Fourre'),
  ('94a0169a-d41f-448e-ba70-0c7167193724', 'MICHAEL DISHLER'),
  ('5101f144-e7d0-49b7-9ca5-da6e7ff6bd22', 'Gina Tostado'),
  ('b57b0e8c-4b0a-46ac-86a1-8fc15213f8d3', 'VANIA AQUINO'),
  ('bc97f1db-cf74-496c-b6d9-63beb1c5738a', 'Nereida Hernandez'),
  ('2feb9467-477f-4fdd-8627-3605afe138d7', 'AMY PATTERSON'),
  ('3d195e8f-6eec-404f-a5ff-ae4098eb9467', 'Adrienne Rivera'),
  ('b0f3a85b-ecde-42dd-97ca-d88111b74477', 'Brianna Siarot'),
  ('c0b9b637-cf57-4f90-8d12-0fc946301e2a', 'Elizabeth Gracian'),
  ('eb3dd792-d24d-4e30-a8d8-4eefca9065da', 'Michelle Escamilla'),
  ('6236bae4-9be8-472f-ba18-1ddd5eb633db', 'Monica Fernandez'),
  ('e2e24d07-059b-4a20-8ef3-98955d3bb69f', 'Monica Fernandez'),
  ('74bd9a5b-57ea-4dc2-9a90-6305f04360d2', 'NANCY HERNANDEZ'),
  ('9c78d301-d97a-413a-b750-c091a820d908', 'Britany Hopkins'),
  ('3385b3cb-2a97-42f0-b200-69230ccb2ffa', 'Katriona Fortuna'),
  ('91e518f6-6709-4d1d-8471-4b00697ff5d4', 'Dawnette Galicia'),
  ('6f328532-9130-40a7-a3a7-53ecf0122bfe', 'Heather Serin'),
  ('95e364ee-aed8-4939-8533-fa0508d9e7f0', 'Samantha Mello'),
  ('31d7ee3d-90da-4222-88dd-7fd9a7e16633', 'Sara Sopko'),
  ('dbea8f2b-87af-4644-93c5-bdd536b54e10', 'Juana Munoz'),
  ('0ada056b-872b-4e88-899f-18965fca704c', 'Sara Sopko'),
  ('09ae0ed2-1634-41e0-9a52-029049264b31', 'Colleen Billups'),
  ('4fc057d7-ff13-44bf-99f3-a13f0e90d003', 'Crystal Luevano'),
  ('6c9fd212-b2c7-4c55-a458-0a5abe6e73ba', 'Lucero Rodriguez'),
  ('09082635-6cb2-4038-bff8-b2b89574d37f', 'Ayuba Seidu'),
  ('e72de865-e6b9-4cbb-93ae-ad24f0d422aa', 'Griselda Calderon'),
  ('180efb40-09c5-4e97-8655-f14e60ce98e7', 'Anthony Lopez'),
  ('70e99372-4816-416c-91bf-e90d5e05bedf', 'Shalandus Carter'),
  ('e282618a-bcd5-4034-90bb-d9afe1270de2', 'Sarah Orvis'),
  ('d54e840f-8665-41c8-a052-1bedca22bb89', 'Mayra Rodriguez'),
  ('af86c9e1-a57f-4845-b41a-6d45767f70aa', 'Katelyn Ochoa'),
  ('311ad09c-9e95-4c6f-9259-80825b12a174', 'GUADALUPE OLIVARES YEPEZ'),
  ('9bb8bc68-69a2-421e-ae13-7b19cb48541e', 'Lisbeth fajardo'),
  ('963022f4-3e9c-484b-856b-2b3d072d18a8', 'Alondra Quintana'),
  ('c5cdfe88-765f-40a4-9169-9175996d9d20', 'Camille Gutierrez'),
  ('3abf3912-06dc-49b5-bf53-fa20439b8561', 'JENNIFER GRAHAM ROMO'),
  ('61649a1a-ee27-41ae-942b-0ff9a1671bde', 'Melani Esquer'),
  ('b0e6c0c8-1c9a-4f3d-8e3f-5e4c6b3c5e6d', 'Cynthia Lopez'),
  ('e0c6f0b8-2d9a-4f3d-8e3f-5e4c6b3c5e6d', 'Maria Garcia'),
  ('f0d6e0c8-3e9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jessica Martinez'),
  ('a0b6c0d8-4f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Amanda Johnson'),
  ('b0c6d0e8-5f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Sarah Williams'),
  ('c0d6e0f8-6f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jennifer Brown'),
  ('d0e6f0a8-7f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Elizabeth Jones'),
  ('e0f6a0b8-8f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Maria Garcia'),
  ('f0a6b0c8-9f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jessica Martinez'),
  ('a0b6c0d8-0f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Amanda Johnson'),
  ('b0c6d0e8-1f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Sarah Williams'),
  ('c0d6e0f8-2f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jennifer Brown'),
  ('d0e6f0a8-3f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Elizabeth Jones'),
  ('e0f6a0b8-4f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Maria Garcia'),
  ('f0a6b0c8-5f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jessica Martinez'),
  ('a0b6c0d8-6f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Amanda Johnson'),
  ('b0c6d0e8-7f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Sarah Williams'),
  ('c0d6e0f8-8f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jennifer Brown'),
  ('d0e6f0a8-9f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Elizabeth Jones'),
  ('e0f6a0b8-0f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Maria Garcia'),
  ('f0a6b0c8-1f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jessica Martinez'),
  ('a0b6c0d8-2f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Amanda Johnson'),
  ('b0c6d0e8-3f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Sarah Williams'),
  ('c0d6e0f8-4f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jennifer Brown'),
  ('d0e6f0a8-5f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Elizabeth Jones'),
  ('e0f6a0b8-6f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Maria Garcia'),
  ('f0a6b0c8-7f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jessica Martinez'),
  ('a0b6c0d8-8f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Amanda Johnson'),
  ('b0c6d0e8-9f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Sarah Williams'),
  ('c0d6e0f8-0f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jennifer Brown'),
  ('d0e6f0a8-1f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Elizabeth Jones'),
  ('e0f6a0b8-2f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Maria Garcia'),
  ('f0a6b0c8-3f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jessica Martinez'),
  ('a0b6c0d8-4f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Amanda Johnson'),
  ('b0c6d0e8-5f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Sarah Williams'),
  ('c0d6e0f8-6f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jennifer Brown'),
  ('d0e6f0a8-7f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Elizabeth Jones'),
  ('e0f6a0b8-8f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Maria Garcia'),
  ('f0a6b0c8-9f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jessica Martinez'),
  ('a0b6c0d8-0f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Amanda Johnson'),
  ('b0c6d0e8-1f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Sarah Williams'),
  ('c0d6e0f8-2f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jennifer Brown'),
  ('d0e6f0a8-3f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Elizabeth Jones'),
  ('e0f6a0b8-4f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Maria Garcia'),
  ('f0a6b0c8-5f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jessica Martinez'),
  ('a0b6c0d8-6f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Amanda Johnson'),
  ('b0c6d0e8-7f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Sarah Williams'),
  ('c0d6e0f8-8f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jennifer Brown'),
  ('d0e6f0a8-9f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Elizabeth Jones'),
  ('e0f6a0b8-0f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Maria Garcia'),
  ('f0a6b0c8-1f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jessica Martinez'),
  ('a0b6c0d8-2f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Amanda Johnson'),
  ('b0c6d0e8-3f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Sarah Williams'),
  ('c0d6e0f8-4f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jennifer Brown'),
  ('d0e6f0a8-5f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Elizabeth Jones'),
  ('e0f6a0b8-6f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Maria Garcia'),
  ('f0a6b0c8-7f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jessica Martinez'),
  ('a0b6c0d8-8f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Amanda Johnson'),
  ('b0c6d0e8-9f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Sarah Williams'),
  ('c0d6e0f8-0f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Jennifer Brown'),
  ('d0e6f0a8-1f9a-4f3d-8e3f-5e4c6b3c5e6d', 'Elizabeth Jones');

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

-- Show sample of updated records (first 10)
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