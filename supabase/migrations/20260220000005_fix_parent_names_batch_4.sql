-- Batch 4: Update 100 parent names from Airtable

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('3fbfbe87-07d5-4899-85d0-fa1fc86a8b03', 'Parke Davis'),
  ('5020a465-5420-4f27-873d-ed598a0e22d3', 'Maribel gutierrez'),
  ('93cd57db-21d5-4c63-9e0d-265b3967dc01', 'Claudia Ochoa'),
  ('485a7739-e65a-4a45-a216-f278465f1057', 'Roxana Rainone'),
  ('c6dfd539-a89a-4b75-8406-a904c053319d', 'Roxie Nunis'),
  ('dcd35cd1-471d-4718-b1da-10ea4607c834', 'Stacie Adams'),
  ('bd3405ff-f053-4c8e-90b2-a2794aa28263', 'Brandee Alfaro'),
  ('3fb5313a-7fdd-4ba5-a794-306fbdb70899', 'Estrella Andrade'),
  ('d0493bd9-ba4c-4b81-9479-4ae3c653dd94', 'FAVIOLA MURPHY'),
  ('8e959ef1-6bb3-4517-9d00-95bec9c7f2a4', 'Berenice Manzo'),
  ('8cf5cf31-07e6-42d0-af01-67d5ed87d8cd', 'Karina Escareno'),
  ('49049b04-2bbd-420c-bb0f-fc61b8015156', 'Kimberly Navarro'),
  ('52a2c46f-2a93-46e5-88e2-df81eadcefb1', 'Jessica Lacombe'),
  ('2e0bbc6a-bfe4-4c90-bb2f-038ebdb01dc6', 'Ana Escalante'),
  ('0ecc3aee-ad67-4b93-9a47-d6ca690d39ac', 'Kristi Ramos'),
  ('d502cf86-b899-437c-9de9-f9c544d7f15a', 'Bobbie Jo Chavez'),
  ('a7e8e2a0-00f9-415c-8daf-851c476c01dc', 'Sharandip Kaur'),
  ('cf27b9c4-42ee-4728-93ed-5e400d43a271', 'Yuliana Esquivel'),
  ('b1136169-ca26-4e7a-9a73-5b5e1222e981', 'Maria Oliveros'),
  ('874bf673-151d-458b-9894-b85d652d8317', 'CYNTHIA MCGINTY'),
  ('508dc6fd-fc30-49db-8c21-d95020cdee8a', 'Sydnee Merchant'),
  ('d8842fd1-dd81-4079-9637-476c1bd2d6c1', 'Amanpreet Boparai'),
  ('c178c84c-574a-4c3e-9f6f-08f15355c092', 'Diana Gonzalez'),
  ('bb1c99c1-88ab-4304-98c4-b95711b874d7', 'Lenit Yohanna'),
  ('a49202be-3e18-4b3c-991e-136c484e869f', 'RAIANA & CHRISTOPHER JOHNSON'),
  ('dbfba573-516c-439d-ac81-5a52e592e94b', 'IRENE MINOZA'),
  ('65f43b16-91d8-4e27-a387-fb6176120737', 'Edelmira Perez'),
  ('9cb3d374-1706-4aa2-bf2e-2dc6b669569b', 'Blanca Sanchez'),
  ('5c4f0daa-d0ed-4f8c-b818-ce1e9543028b', 'Maksym Moroz'),
  ('5a1f904c-c1b2-496e-b987-0fee32e620e7', 'Tiffany Hess'),
  ('a1bba853-19d3-407f-97f1-205695fd3a2b', 'Tiffany Hess'),
  ('78331423-0ae5-40fa-a6e9-a55d35c63db1', 'Sydnee Merchant'),
  ('1a302ae7-f0ad-4476-98c8-6a3311d9cbad', 'Alicia Wallace'),
  ('3824ec20-a478-4a2c-9888-abf4ab7c5bbd', 'Sara Little'),
  ('93a78020-0c9a-4223-aceb-51eb191657e1', 'BRIANNA VALIENTE'),
  ('f25ddf95-efbc-488e-bec4-6182308be6b8', 'Corina Nieto'),
  ('c8f39fa2-0bc9-4b7d-8dde-aa99ffd7a7f0', 'Debra Vargas'),
  ('c376108d-0246-4c63-bb0a-830da64e8c93', 'Trinity Parada'),
  ('ef1ef018-6ba6-4560-8cad-b56a767c15f1', 'Estephany Utrera Gonzalez'),
  ('3d646400-11fb-4fdc-ba4a-29e8819c4c99', 'Andrea Masson'),
  ('05f319ba-8d9c-486e-b0a6-ebac336b61e7', 'Walter Garret'),
  ('d70cd3fe-7d0b-47e6-a20a-d42052c07b4c', 'Lizette Navarro'),
  ('a7ec6038-b2d8-4553-af84-693977864171', 'Margeaux Silva'),
  ('cf04c5b9-0a93-4196-8da3-ff04771c463b', 'Ermelinda Arroyo'),
  ('2b7f6ddf-9bd3-4899-9cf5-29a9a22b9a07', 'Martha Gonzalez'),
  ('d10bd7fd-da6e-429b-badc-ac0eed9d6034', 'Elizabeth Schick'),
  ('5c498989-e5a7-4ac9-8ec3-89ce08b0ae82', 'Eloisa Cornejo'),
  ('08e9e58f-95bd-4f69-8201-1fdec535ff1d', 'Ashley Armijo'),
  ('81dd85df-3db4-4f10-b21e-bdc1c2c96d37', 'Esther Fierros'),
  ('f202f8c0-1b9e-4782-9ec0-64049fa96080', 'Heather Olivo'),
  ('8d2cd2a9-255c-4c4d-a7da-958e78dcae1a', 'Laura Jones'),
  ('2a2b3b53-3d24-4a4f-ac8d-4605c4f1e4fd', 'Erika Zavala Ramos'),
  ('31212d9a-467c-4843-901f-a6df04d5c5a7', 'Selena Vargas'),
  ('6798eef4-74a8-478c-a444-60e9cf9abed3', 'Samantha Ormonde'),
  ('cf700525-99a2-4344-90fa-d54fd5307fe4', 'SAMANTHA ORMONDE'),
  ('d3529c5a-652e-4192-8ca0-e51be7011bd7', 'Nicole Gonzalez'),
  ('f1b77f3c-1cd9-4570-8fb7-8c6eba196921', 'Elizabeth Schick'),
  ('c514738d-3be2-49ec-9c83-f6002a05385c', 'Erika Zavala Ramos'),
  ('f3f2d780-e8ae-425c-a0f9-7b50354b0076', 'Jessica Serna'),
  ('9518c321-86b8-4a80-a49d-d9f1f8fc9f90', 'Liliana Rios'),
  ('0c9d94d5-decf-481c-85b1-e4ff6c9b1185', 'Vanessa cazares'),
  ('68f20b9b-2cb2-4052-98c9-d83def6bbca6', 'Taylor Bennett'),
  ('678c34a2-8206-4713-b285-12d8f9c516e7', 'Lulani Neff'),
  ('0e88826f-3f66-464e-9016-6bc1c9fc5133', 'Beatriz Caravantes'),
  ('1e54c541-3780-4d94-8eac-82ce7042d2cf', 'Christiana Spence'),
  ('25da803c-0621-46ab-9d9c-255457b9b962', 'Beatriz Cobian'),
  ('bf05a5fa-a6d1-4564-9164-c722615f9e58', 'PRACHI TRIPATHI'),
  ('57007856-dc06-4ac3-a24f-dc93bbf06cbc', 'Melissa Kasinger'),
  ('1347cf94-0a8a-47ac-a527-04cfc2c3e435', 'Daren Kountz'),
  ('d70abfd5-5e84-48d9-bb60-4d4d6dd917a3', 'Rosa Galan'),
  ('48664836-8b16-4dbe-b633-c294770303ca', 'Davina Toves'),
  ('5beeaf19-2d2a-45a7-848e-d2575f585a8e', 'Karina Navarro'),
  ('83865f5c-1592-4900-bb95-50ed10df5517', 'Essence Sparks'),
  ('c235e53f-d399-4d15-9a14-6ea99450477a', 'Yazmin Orozco'),
  ('684ba3aa-89df-4b16-87e3-38814a7af703', 'Ana Valdez Castro'),
  ('c6042919-8599-4629-b66d-3f08af987004', 'Chrishnique Robinson'),
  ('4136ba51-336b-4a50-afcf-11c6d8cc19ed', 'Maria Cruz'),
  ('05be56a0-e752-4a92-80b8-2ff8edff1842', 'XENIA INTERIANO/ELIAS TURCIOS (Spanish Speaking)'),
  ('935b057f-be35-4a3d-bdb0-c57c72ea28ce', 'Anita'),
  ('34d55aa6-75ae-43cc-9aee-3f4388855e52', 'Briana Cameron'),
  ('e3b38311-6bcc-40e8-9b1e-37b3f776bfba', 'Shehnaz Omar'),
  ('71863dd2-9733-4faf-b2bc-a4a914b3263f', 'Robert Garcia'),
  ('8646956d-fbb7-40b2-9c8f-edb232d7bd90', 'Sara Tello'),
  ('eb636f10-3120-46b9-afb0-6fb8ce5e3357', 'Sara Tello'),
  ('0bc3e7e3-210f-46e1-bab9-24b55eea5b89', 'Lourdes Rosario'),
  ('6b8b1058-7c10-463c-be20-126a6de05456', 'Denice Salazar'),
  ('8d34dcc4-b849-48af-9b33-1b916e4c9b62', 'ANNA HERNANDEZ'),
  ('b892f81b-1ec8-458e-8e73-4c101e74f4a2', 'Dena Anderson'),
  ('ea3b8900-e137-49a6-8798-a8ee85f62dc0', 'Eleydi Preito'),
  ('475269ed-9bf6-4760-b8da-bd80a5b14264', 'ROCIO "ROSY" ROCHA'),
  ('fbf98b77-e39e-47f5-842f-4dba70b5f761', 'Emma Jaramillo'),
  ('c8b08441-2b4b-4c28-ac7a-8a606f4b0a54', 'Estefania Vigil'),
  ('ebf76680-c350-4460-956d-9b9290bc52b6', 'Lourdes Rosa'),
  ('85de3ba2-627a-4c01-be8f-36c0b8a48f26', 'Nicole Peterson'),
  ('156831db-2ce7-43d7-9090-ba6f06f9f7cb', 'Jennifer Stegner'),
  ('4011d494-e98c-4ae6-9f77-2445c8623a48', 'Basilio'),
  ('58cfc2cd-3625-46b9-8131-34b47ed7e070', 'Irma G Espinoza'),
  ('491efa5e-64c6-45dd-982e-8a113bf72ef8', 'Bianca Flores'),
  ('f60da911-86e5-41ba-9862-990592c52b97', 'Evelyn Calderon'),
  ('8afa8770-be94-4b77-9b91-c7660f3d9588', 'Teresa Salcedo');

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
