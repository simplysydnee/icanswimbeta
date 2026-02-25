-- Chunk 5: Update 100 parent names from Airtable
-- Records 521 to 620 of 1616

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('19cdd215-e2db-41df-8ac9-589908eb002e', 'Eloisa Moreno'),
  ('1e63af19-4995-412c-80a7-dbf4ea421d6f', 'Alondra Murillo'),
  ('2395a78b-6501-48a5-80d5-80595b362ddc', 'Kari Grant'),
  ('ee9b2cdd-1727-4530-ae8e-22ab40f7b681', 'Valerie Espadinha'),
  ('c79acadd-40e9-4206-834f-810ce13efd86', 'Adrianna Gutierrez'),
  ('a6f088d1-69d1-48a9-a788-cd8c41eea789', 'Elizabeth Nonato'),
  ('de45bb04-1815-4a7b-9ca8-5cdbab9323ac', 'Jasmine Amezcua'),
  ('2a281314-6450-4352-8911-dae5b2d1cd2b', 'Maria Ramirez'),
  ('ce5d2607-cdea-4ff8-9f95-acf08818edc0', 'MELISSA HUBER'),
  ('5580f5ed-fdea-48e7-a330-f15289616737', 'Jakel Hughes'),
  ('0ffd6981-16c9-44e2-a01f-73effd123582', 'DULCE ANGEL'),
  ('50cce4ce-708c-4b1d-8f74-9ec640e88e73', 'Sandra Trujillo'),
  ('3fa4a9ac-8a83-4b98-8856-7f71758c0240', 'Razia Nizaam'),
  ('7ed1ed9c-1a08-4acc-94ba-e4f84ea2a44a', 'Marisol Madrigal'),
  ('101b5dd7-8fbd-4538-96bb-148f7eddd4fa', 'KATHERINE LLAMAS'),
  ('c495055b-06dc-4d5c-8b41-a81c17ce7ec9', 'Reynalda Zapien'),
  ('1832231a-7beb-4b98-aa5e-8186abb7ffae', 'Ysela Plascencia'),
  ('0b2e9191-d1e4-4ddb-9d74-a072f7e27183', 'Karen Medina'),
  ('7f39b003-ed56-4410-bfd7-75cee9add255', 'Roxana Navarro'),
  ('25317048-64b0-4fc1-b7ee-c7c2b4fa0726', 'Roxanne Azevedo'),
  ('19d94276-2134-4868-9188-10f4a0bf44ed', 'Alyssa Babauta'),
  ('9fd488a0-6695-4d36-9a7a-d533224cb5dc', 'Keriann Fitzpatrick'),
  ('29f99ba1-5c55-417c-912f-e3ad2c6dcc51', 'Caitlin Braden'),
  ('a4df96ea-2bbe-47de-b3e9-5619076ebdad', 'Yvette BAUTISTA'),
  ('4f33c7f8-f656-4474-a01f-6904008e2f1d', 'Maricruz Carbajal'),
  ('a07d40d6-bd9b-4faf-983a-5be56cfa4860', 'Rajwant Sandhu'),
  ('28d7fd8c-b23b-476c-b436-aa1e6cd4cf18', 'Joceline Gomez'),
  ('f467f202-2714-4051-8b80-94a6384f4d9c', 'Jarika Fernandes'),
  ('77370b1c-879c-49b4-b734-4c3b86e61a21', 'Zuleima Flores-Abid'),
  ('c0ada41d-91db-42ef-8142-b118e716ad44', 'Michelle Ishaya'),
  ('bce27303-c02c-4449-9cc0-8c16cdc78561', 'Caylin Montano'),
  ('d9f33b6f-29fa-4cbf-a7bf-616b44ac425f', 'Melissa Hernandez'),
  ('2995f729-0d2c-44f9-a5f4-3d63b87eacec', 'Suleny Ruiz'),
  ('40a2c0c6-712c-4c5a-919d-de4064a63e28', 'Davina Loredo'),
  ('c1873804-9bc9-414e-b2f1-d7332054e22a', 'Carmen Madriz'),
  ('bb9c16b9-38ea-45ab-bebd-e559999bbf49', 'Lisa Koehmstedt'),
  ('f4f16082-c121-455c-9127-967aa7f6e062', 'Joanna Albarran'),
  ('dc6f5125-3b84-458f-b675-9de434942d89', 'Shannon Nobles'),
  ('4be13cd5-5539-4ca9-bc13-34e69f38167d', 'Katie Bomer'),
  ('f2977532-a7b8-4966-a4a8-f19ebc006bb9', 'Feryal Sulieman'),
  ('25496be3-6a45-462c-99d4-135a5377b5b2', 'JASMIN VALENCIA MUNGUIA'),
  ('6c21f80d-2620-40c9-b8dc-d9548ebce232', 'Jessica Perez'),
  ('d7fe8025-27f2-42b1-9b77-694382ac84a9', 'MARIE GARCIA & WILLIAM DERBY'),
  ('88758cf9-32b3-4157-8e43-9dfa907f3a42', 'Mandilynn Allenbaugh'),
  ('ce640ae1-129b-47e6-baae-3061ec63c0c6', 'Laura Vidrio'),
  ('6c0b1a1a-d8d7-41eb-b97b-52d6a01d4432', 'Yuliana Hernandez'),
  ('7eca7eba-437a-428e-93f2-c04810794715', 'Micaela Sandoval'),
  ('2f4cf353-dcf1-473e-850a-c6f112d362d4', 'JENNIFER BULLOCK'),
  ('e9e83b82-4676-4403-bed7-8f73c3ce55a9', 'Sarah Petereson'),
  ('1373adfc-6bd1-42bf-b400-739c368a3988', 'Cynthia Mulgado'),
  ('facdce3f-0fb7-4ef7-b5fa-e6ebcb3012ac', 'Chanell Torres Mofhitz'),
  ('3f6c80fa-b30d-48ef-882e-c520a57ac1aa', 'Sujey Velazquez'),
  ('123f89e6-b5c2-4091-abd0-dd8ed13f48fb', 'Yuliana Hernandez'),
  ('22baff53-d7ce-4051-9dcb-fe6cd762a6ed', 'Alejandra Singh'),
  ('61614592-0ae5-43a1-ad0e-0d553139f06b', 'Cruz'),
  ('56f0b121-1ef9-4cd3-8b77-4a978bd55679', 'Candelaria Machain'),
  ('b4a30602-065e-4d9c-8ef5-abcceba31d49', 'Candelaria Machain'),
  ('d240fd24-65e5-438f-9504-396ea0ecd09a', 'Jennifer Thomas'),
  ('d09d52bf-6ec1-4f2b-aac3-e41bf5b624e0', 'Erika Martin'),
  ('abac9084-c70c-4002-b692-4b772d13d05d', 'Lizbeth Gomez'),
  ('cf5cae13-3c14-476e-85cf-de200f666f1c', 'Mercedes Vega'),
  ('e21a934a-eacc-451a-9ea0-3fc640ee7ec2', 'Yolanda Corona-Rose'),
  ('fef3ecaf-fba4-469a-9cb8-e0703fed3401', 'Cheyenne Rutherford'),
  ('9cb85ad6-3944-44b3-a6fd-50c53e8add59', 'Karen Maradiaga'),
  ('a4f910aa-d299-42b7-849d-5da5f2a78210', 'DOROTHY SAAVEDRA'),
  ('5c717bc4-2f53-4754-8883-42b34b6d3234', 'Helen Czap'),
  ('5379c17d-efe6-4ff7-a19f-b0228f475d0c', 'Desirae Porras'),
  ('ce885ad1-04b7-4f6a-8745-063bc5c82e27', 'Jennifer Leavens'),
  ('38bff89b-e403-4167-89fe-0f6158af3353', 'Rukshaar Begum'),
  ('95d41449-6a33-46f1-bdf6-12be973784a0', 'Reynalda Zapien'),
  ('f945f0e8-9133-4087-a90e-91ecef66a8b4', 'Alexandra Carter'),
  ('fa4b7fbb-657c-4272-903f-5712eab9d78e', 'Marina Valencia'),
  ('c75ed866-626a-44ae-9ecc-b109da28ec82', 'Anastasia Grover'),
  ('47c5d0f5-5171-4697-bb8f-6431026b4aca', 'Sara tello'),
  ('965d019a-4265-48ca-b716-4cd5274ff486', 'Annie Vang'),
  ('9d861249-c912-47c2-a8ba-394eb298e770', 'ADELIA ROSE SOBREO'),
  ('9e6c02f1-5e38-4fca-8600-32c1e3bff49e', 'Sabrina Mendiola'),
  ('f1b968b3-50a9-4295-8a7e-d37e62766273', 'Claudia Hurtado'),
  ('d14919ce-c822-4c8e-a5bd-9c2885a8a13b', 'Carina Azevedo'),
  ('2bfaed0e-6514-4430-9efd-6f221717fb24', 'Ashley Chavez'),
  ('55d0624c-c393-485c-8fc4-3315a226b8d8', 'Ashley Armijo'),
  ('5b58e91e-a47d-4f84-a9c9-65c88be6577a', 'Carina Azevedo'),
  ('3230b90d-9afe-4341-96e1-7d40ea3a1354', 'Eaha Castle'),
  ('0ceaeb61-113a-48b5-a51c-ac475e8327fe', 'Silva Bahi'),
  ('6ef8579d-4db0-4f9f-9c9f-0827d3228012', 'Lauren Tyler'),
  ('412c96b9-1542-42de-a78a-bff9e83645a8', 'Jamie Reisdorff'),
  ('2e3d9b31-8a62-40b9-90ea-42ab0030835d', 'Michelle Poaster'),
  ('9232fc72-845c-4f14-8ceb-d57badb49892', 'Rheannon Parrett-Everson'),
  ('aceb0cd7-75e8-4cba-a511-44925759c75d', 'Yazmine Davalos'),
  ('18a5beac-e87a-4d79-924c-08c4d68a54b4', 'Lizbeth Flores'),
  ('b9d9296f-65ea-409a-b91e-640ef7feccb8', 'Aileen Delaney'),
  ('449cea6e-9cd9-415d-bad5-760b2c20095c', 'Laura Gonzales'),
  ('a0c622cb-3aff-44fc-9be4-47ce80614eec', 'Stefanie Lopez'),
  ('102ebf68-65d6-4723-8f59-edfa7ad9a9ad', 'Stephanie Martin'),
  ('b5c79b23-171c-4cbb-a8b2-79cc07a11102', 'Veronica Hildreth'),
  ('98aeecaf-b775-4b5e-8ea0-8647752e8f9b', 'Esha castle'),
  ('dac8d460-1560-44df-b99d-7ce8542110e5', 'Esha castle'),
  ('787faeb2-5dc8-4910-98db-ee738a59d69b', 'Nicole Huot'),
  ('6b68c92d-0104-4aa0-b1fc-b29864425788', 'Kristin Ackerman'),
  ('8cf55ac7-8e80-4bdd-ba44-0ef41cd2caff', 'Esha castle');

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
