-- Batch 13: Update 100 parent names from Airtable

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('0d64c5a4-8dc3-4fda-9314-94681ac950cd', 'Morales'),
  ('f4adf662-d833-44cc-9149-e06314032076', 'Maria Dominguez'),
  ('c4769c57-47aa-43ca-87ce-04b4ea63df09', 'Elizabeth Torres'),
  ('95bd0689-d3e1-4b82-899d-f723fdff4a26', 'Paola Isais'),
  ('bd3a245c-7ab6-4adc-a24f-de677e131a51', 'Lopez Sandoval'),
  ('327fd9e5-3763-4c2e-812a-242fb7e917ac', 'Mariana Mendoza'),
  ('a585f2ac-c64e-4d5b-b3c8-81762db53761', 'Marisa Pulido'),
  ('1415d566-2e44-477b-9451-45b4e7d7fab9', 'Amanda Ramponi'),
  ('c25f8dfc-a311-4ca2-9e7f-1ee483612c86', 'Karina Jimenez'),
  ('595be4f5-acfb-4be7-b65f-3097afa0f411', 'Pamela Etchegoyen'),
  ('2b61a73c-c2d0-4b2f-ae67-99e8a8019817', 'Pamela Etchegoyen'),
  ('d10ffd42-95bd-4ed3-92f7-e575a20882d8', 'Pamela Etcheyoyen'),
  ('adfa265e-dfaa-4b40-8152-120a4117de17', 'Tan & Bonny Ly'),
  ('5396193f-1bf8-45e9-aedc-3f09efc51a43', 'Maria Lopez Guerrero *Spanish speaking*'),
  ('032a72d6-7608-4a1a-b392-e36f67e45d71', 'Maria Barocio'),
  ('5cc98ca5-17b3-407a-8e1a-4165c4da65b7', 'Maria Barocio'),
  ('a4fb6b25-923f-48e5-a335-e2ceb6af625d', 'Aylin Solis'),
  ('84e254f5-aff7-4120-a786-22c2cbb014a3', 'Seirra & Charles'),
  ('bbbe8838-0c23-4077-872e-26bfd546d60f', 'Wendy castro'),
  ('804f8401-350c-4fb7-a801-6ea0b9f4f337', 'Juanita Hernandez'),
  ('38048a4c-7184-405c-b2fa-05a841b857b8', 'JUANITA HERNANDEZ'),
  ('1bc331ec-27e4-4f1c-8407-63d017eb2930', 'Monique Patton'),
  ('a7bb9814-408f-491e-bbdd-e1d2ecc66804', 'Corina Ruiz'),
  ('5cddffa7-e654-4045-8939-d6240a3ee0d1', 'Valerie Garcia'),
  ('15ff6d8f-5df3-4ceb-beb8-874f5a6d0264', 'Jeanessa Vigil'),
  ('71d9cc71-24b9-47e1-9ae0-478d161964d8', 'Jamie Kelly'),
  ('b3fc9661-c1da-4cc6-8a11-5de5b6c56e16', 'KRISTINA GUTIERREZ'),
  ('b8aadfa3-6dd2-4460-8e1f-edb82f100767', 'Abdul Alhassany'),
  ('c64ddc42-a70b-4dca-8500-dba217e91e4b', 'David Bond'),
  ('ffbff410-81ac-4746-8c88-00f0da556575', 'Cassandra Bost'),
  ('12215f1c-c205-49f8-b316-0a9106853903', 'Liliana Fernandez'),
  ('224ebf30-830d-441b-8a27-528808bd47bb', 'Arishna Chand'),
  ('edd46860-9a60-4d35-a656-2672baacc7aa', 'RAWAA  SOOD'),
  ('3105387a-c74b-496a-a8bf-89931ed6b69f', 'Maria Caro'),
  ('09ee8a6a-f6e0-48ad-9c7c-a6d6309411e5', 'Raquel Renteria'),
  ('7b780f30-f8da-44af-bbe0-17df01b929ac', 'Caitlynn Thompson'),
  ('ec118302-0a68-47b0-bb60-d894426d4093', 'Olvera'),
  ('60dbe9cf-fcd8-4b52-b6b5-bf42417ebdd3', 'Francisco'),
  ('bd106543-f694-4f02-be78-e698ebc8f433', 'Francisco Maldonado'),
  ('78e37af8-2df4-420e-bbfa-b6f95eb39f4d', 'Gabriela Arriola'),
  ('5267457d-2f37-4d0d-9fa8-67cbc5ce74b4', 'Lilah Smith'),
  ('5d149624-2938-4fde-8773-7c2a277039f7', 'Yesenia Alvarez'),
  ('c7da9856-2524-4878-957e-1f7b3337580f', 'Suleny Ruiz'),
  ('8bd26481-87e8-42a5-8061-c6d2ee5dc31f', 'Sandra Blancas'),
  ('10fa006a-eb9f-4edb-b838-27f13e0a533f', 'Anna Velarde'),
  ('1a9f8861-1a38-485e-bc8f-2f58c978b55f', 'VERONICA VELA'),
  ('50e92613-1397-4f86-b129-eb0eb29aecd4', 'Silvia Valverde'),
  ('2e541c63-09aa-4d5a-80f1-89c069ad10d4', 'Christina Cuevas'),
  ('dcf804b7-e6b4-43c4-9b48-854b93f499f0', 'Ashley Rivera'),
  ('6d8a73c3-80be-4832-9240-ff98fb0998d1', 'Yaritza Salguera'),
  ('e8fb377e-e5b3-4fc8-af56-27a4756f1cc7', 'ARIANA RODRIGUEZ'),
  ('770ca30e-5292-4455-8b79-c77a77a8a244', 'VANESSA CORTES'),
  ('6b5147de-7249-4b16-ac25-e49b4f9e4b63', 'Leslay Martinez'),
  ('cd529a6c-03e3-4d20-882e-cd1b31f81b1c', 'Laura Barreto'),
  ('0f2aa1a6-cfa5-41da-8031-696f9302f616', 'Grayson March'),
  ('0e1561a6-d968-4994-a56e-d7297dfd930d', 'Graciela Cristerna'),
  ('06cd250b-0707-4f76-8b4c-8e314042696a', 'Keyonna Lowery'),
  ('6942939d-a0c4-449d-860e-1da126211883', 'JENNIE SPENCE'),
  ('1bd99af0-bb0c-4b5d-b23a-198c2be0fadf', 'CHRISTINA MCARTHUR'),
  ('513e5e37-48d3-4ede-b79e-a08ae4aa0317', 'Patricia Hernandez'),
  ('4ebb7845-8fed-40d3-9441-033fc572691d', 'Yuri Alvarez'),
  ('cd52b272-3ce9-4a89-af3c-97b5128b2d18', 'TABITHA RODRIGUEZ'),
  ('dd71462d-beba-4606-a8d2-7a843e45288d', 'VISHA SINGH'),
  ('a552beb2-4d77-4fa1-855e-509b000ca558', 'Karina Vargas'),
  ('085de1e3-bfa5-48e9-851e-0b091283d4d6', 'Constance Owen'),
  ('33306865-14fd-4a41-a6b4-2f307833c370', 'MARIA OROZCO'),
  ('8003f9f8-26cd-43fe-8c89-518d4c2aa6df', 'Kamal Singh'),
  ('a31f5ecb-9474-44d4-b5b2-d76a89ec73b8', 'Jessica Greene'),
  ('5a8ba690-5047-4420-810c-5031920ebbf8', 'NICOLE VALDEZ'),
  ('3adf0e3e-fcee-4484-8cc1-30f4ca3101d9', 'Marisol Duran'),
  ('284fa766-edb2-4060-90f6-678326f74752', 'Lorena Paz'),
  ('f6e1b2fd-f723-43bb-b725-629ed8dd713d', 'Amanda Stallcup'),
  ('594e87bc-6e21-4690-96e4-472d70645d45', 'Molly White'),
  ('de3b4ba1-97f6-4ff7-81c0-170fed087a96', 'Yasmin Nunez *Spanish speaking*'),
  ('bb27e41a-f607-4e4e-8f50-5e943ca42ea7', 'Carol Ongwenyi'),
  ('40775e22-c798-4709-8d72-34a975f7c3af', 'Manvir Kaur'),
  ('dc71ff6d-93fb-4ec2-8c8d-69c7fda957db', 'Marisela Vazquez'),
  ('18515800-ca3b-4934-a2d3-b912fc54901a', 'Jacky Calderon'),
  ('ac0c79d4-e3db-48f6-b343-0ed980515240', 'Maria Aleman'),
  ('69095cd9-196e-4931-a1dd-4226edb61995', 'Berliz Rodriguez'),
  ('0fa040a7-e770-4db0-82bb-7b82e84585e2', 'Victoria Contreras'),
  ('6a1801b3-fdae-491c-9f3c-84bad09ad74b', 'Azucena Anguiano'),
  ('f572bc07-6820-4af4-b298-88c8fd841ed7', 'ANNA VAZQUEZ'),
  ('3a1ff71a-2655-476f-abfd-05f1f2320f40', 'Mayela Mares'),
  ('5bd438cc-3410-45e5-8246-f7cf8e24ffa3', 'De La Torre'),
  ('123192ba-3ede-4275-bf02-2c6b01ebb425', 'VICTORIA LOURENCO'),
  ('55c634e6-7908-40b3-b3d1-cb282df04260', 'Manuela Cardenas'),
  ('61c7ce35-1e42-48a4-8dc7-54df8e78cc5c', 'MARCELA SIERRA'),
  ('3a037d2b-ec9f-4a30-8948-e0fcd8b8ed89', 'Latoya Mccardie'),
  ('abc9d502-9483-4838-9a63-7ae85b6c059d', 'Odilia Isidoro'),
  ('4976a2d8-9d65-405c-8725-c041495fb0d3', 'Veronica Flores'),
  ('42fd66df-bd87-4f9c-b65f-8ed21fd9644a', 'Maria Aceves'),
  ('015513b8-b7c6-4253-9c65-a2027e93244a', 'Sarah Johnson'),
  ('e4cdf60d-5fd5-4bf7-a55f-0bc3c1290f5d', 'JENNIFER DRAFFEN'),
  ('c2b36732-a598-4d01-a7d1-57568717642c', 'Katelynn McElroy'),
  ('2344b6b9-413c-447b-a2d7-4923d3b25cbe', 'Rebecca Denton'),
  ('a089787f-dca5-4237-ae69-e3cc314c958d', 'Kyra Loretelli'),
  ('27109bb5-5ef7-4d22-bf30-13ac2fa038d8', 'VENEZIA GARCIA'),
  ('1c6eb944-0a0c-48bc-8343-0a4d8f528356', 'Mayra Contreras'),
  ('f9684bd2-b82b-4a15-be85-311e96f8c804', 'Delmira Aleman');

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
