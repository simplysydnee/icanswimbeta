-- Batch 9: Update 100 parent names from Airtable

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('13327ec2-6b17-480c-8980-3ed39c9fe1ab', 'Juarez Jimenez'),
  ('e064b8ae-3c57-4844-808d-9c1b89dbfca2', 'Liliana Jimenez'),
  ('456f4a59-7f8e-48c1-8a1a-bfa4471318fc', 'Taylor Leedom'),
  ('72eac763-77a3-4222-af4e-a04c2c264495', 'Jeannie Vargas'),
  ('33d8d0d1-8540-49ee-9a11-39f972a6185d', 'JESSE COVARRUBIAS'),
  ('f5e4fab7-4c20-4596-8e5f-dd71ef0fe60b', 'Casey Turner'),
  ('0b60108c-cc8b-4e8a-b1bf-b2839bffcb82', 'Joan Lubembe, Guardian'),
  ('b2f0321b-cacc-4184-aa02-1bcbb0a5cd61', 'CINDY MERCADO'),
  ('c6eb6983-a797-4150-ab37-1288ab80d284', 'Alejandra Alvarado'),
  ('75b6f38e-5aa2-438a-bfb8-c7c5b3020738', 'LIZETTE LOPEZ GARCIA'),
  ('5a685536-af7a-478a-9517-dc1938156020', 'April Maeyama'),
  ('da71fa83-71fc-449a-ad1f-93db2adf0713', 'Yasmin Nunez *Spanish speaking*'),
  ('a8125d41-dd0e-4968-8b6e-512433f9ef34', 'Norma Rodriguez'),
  ('ea3bb970-488a-4192-aaf6-98ae2daa9b3c', 'Norma Rodriguez'),
  ('ee9f253f-6d40-4aa6-937f-c1ca2255f56a', 'Alejandro Valdez'),
  ('5f492b57-05a3-43f7-8a95-157fcea77d1f', 'Palomares'),
  ('5f0307fd-8ef6-4d61-a14c-72bf2be24248', 'Justine Gil'),
  ('ade0fb3f-8b47-4b0a-8da5-eea58c439387', 'Justine Gil'),
  ('f14b0662-1c68-4eee-965f-9b11c005f7f4', 'Tameka Martinez'),
  ('71bf5ef1-b3fe-4c28-bc89-4a49f6294b5c', 'Tameka Martinez'),
  ('851a0d7f-5cb1-43ba-a9ef-ee251677740a', 'Michelle Bounsana'),
  ('986828e9-ced2-4bf9-91f8-c919ecff095f', 'Maria HUIZAR'),
  ('d578a86e-6908-4691-bfd9-13c6eb5eb81f', 'Adrianna Duffy'),
  ('b69dadac-0e84-42e7-9d5a-150c7b23e386', 'Rangel'),
  ('324a4055-7bdd-4c12-a5b9-9d08210a12e1', 'Miriam Ramirez'),
  ('28c32710-adec-4c85-9126-e9e13c1fc981', 'Lashondra Patrick'),
  ('dc919d0d-bf92-4afc-8558-590feaaa2330', 'KATIE JOHNSON'),
  ('93a05a43-0352-487b-ba44-58dfc6ca1b09', 'Selena Chaven'),
  ('15e9ac7c-d85b-4c0d-82b0-e3210819fbce', 'Tania Carrasco'),
  ('4c9e8c83-2d70-48cf-b4bc-6e061be9230f', 'Humberto Linares'),
  ('ce888d13-d73f-4fe6-b8a0-fd4520a57f44', 'ROSA MONTIJO'),
  ('cec58d17-7696-47f2-a2e3-0ebcfac7c507', 'Selene Mendoza'),
  ('b5fbca87-3677-498f-be54-cd7a69ba01c9', 'Erica Cloird'),
  ('5876749e-92f6-4fad-b349-367a899b950c', 'Maribel Torres-Cisneros'),
  ('6ccd6d4c-a839-42f1-8c43-1a8cfaa0cdda', 'Marceny Martinez'),
  ('63e0aeac-1d2b-49c5-a7c8-0d3c347e3057', 'Vanessa Canady'),
  ('65bad680-fa57-4002-af0f-1f4432ba9bbb', 'Teresa Diaz'),
  ('39f77752-43e9-4d7e-95ef-1efaaf45156e', 'Whitney Shugart'),
  ('54c1a2b1-c51e-4437-aa13-6a4226395e49', 'Rylan Santos'),
  ('0ed215ce-fe01-4338-b3ff-8684e796c10b', 'MARIA RICO CALDERON'),
  ('15ebfd8d-2439-402d-b5b8-5d510cc211df', 'Camila Carrillo'),
  ('c5d308fa-dd43-4442-b0ff-95ba7d6cf4c0', 'Bianca Soto'),
  ('db75a917-5f37-417f-9686-d12b163f8dd0', 'Lena Schuchterman'),
  ('e26049ab-5c09-463f-b0a7-aad12bc2e7c3', 'Teresa Diaz'),
  ('b43ddbf4-9366-454f-8e4e-7da5fb486731', 'Teresa Diaz'),
  ('16a8acca-a5c6-4d22-906b-b491a54f3d44', 'Rachelle Munoz'),
  ('c6567b37-6b7f-449c-85d5-04032d96fc54', 'Melissa Kirk'),
  ('9549ede4-9dc8-488a-8da4-fd0234cdfdaf', 'Angelina Lozano'),
  ('328288b9-43b1-4ab5-8362-9958614b97ca', 'Chheng Sun'),
  ('236658ad-0b59-4213-8782-669b7fab8826', 'Elida Mora'),
  ('4252dfe8-c2ac-4cf3-9c7e-d78ceb1434b5', 'FRANCISCO MALDONADO'),
  ('9ea163b0-6555-4aa7-8e7e-0648e643c94b', 'Laura Galvan'),
  ('a40778fb-e00b-458f-adfa-2df16c1fbf37', 'Laura Galvan'),
  ('95a4c4d3-9111-4dcf-bb23-628f2f8c266c', 'Jose Villa'),
  ('30b78786-4912-494c-b790-79b45e0a22e7', 'Marisela Cordova'),
  ('e601b097-8c4a-49ba-90bb-46b5cb64408b', 'Paola Valencia'),
  ('a360cf15-739a-4706-aec8-6d2263ba3c46', 'BRITTANY HOLLY'),
  ('8775a2b8-7263-4ac3-b5d2-75802f752740', 'Jenny Fitch'),
  ('8b0d2973-5ccd-44f6-8c38-4b97f3fbf064', 'Martha Pulido'),
  ('60b7980f-2e18-4488-93dd-79f3f45178bc', 'Martha Lopez'),
  ('9bdb5ece-6363-4823-abdc-33e3220576a5', 'Erenderia Garcia'),
  ('d0769525-8555-43e3-9053-ea27b0a50103', 'Mina Rizo'),
  ('6557998b-0c24-4b6b-a1d1-478ea5d89bb8', 'Len Santos'),
  ('aa7adbc4-48c6-4493-8c8a-95ff610e1f0a', 'Mckayla Castro'),
  ('def21ee7-5f4d-4f4d-b8b6-f8ce73f51cfd', 'Azucena Gonzalez  spanish speaking only*'),
  ('54536587-eb00-4476-b504-a82b34a6af13', 'Simarjit Kaur'),
  ('51f5998a-016f-4bf6-aabb-21077c1a9720', 'Lourdes Lopez'),
  ('8993d315-c27e-4fc8-bd20-692925a8684b', 'Nestor Ruiz'),
  ('05183524-c6aa-4873-8fc5-20a7f06f4769', 'Gabriela Rodriguez'),
  ('12136ecf-ee4f-4344-afc7-506d821a4613', 'Nora Pineda'),
  ('759c2158-a6aa-41d6-b8e5-ffeef43659a6', 'Tanya Reyes'),
  ('a4f37f19-2fbe-4f18-becb-a6cb73e95a3e', 'Dulce Gonzalez'),
  ('cf3b3d46-4288-495c-a7d9-91e97a4cf8df', 'Nikki Mellow'),
  ('c52db254-6e79-4d8a-8c5a-4b874c44c378', 'Patricia Valdez'),
  ('5a520050-41e5-4707-a1c0-8a3bc3fa331a', 'Adeana Schippert'),
  ('53d229ee-f04f-433b-a98e-edb53440e2f1', 'Raean Parker'),
  ('f7e963e1-0220-4348-a95e-59ddc0b3ee90', 'Elizabeth Roman'),
  ('a9d4768f-27c8-4231-a7a7-7834cd11f12f', 'Alma Nancy Cruz'),
  ('806e57db-4fc9-460f-8ce3-2ca7fa96dc32', 'Antonia Guzman'),
  ('9907542c-15b8-4846-9e92-b6d08e099180', 'Maria Mora-Vitela'),
  ('f3819cbc-e4b2-4cb1-894e-0c66dc1ab08a', 'Coreina Abila'),
  ('14559a0b-26bd-4a30-a971-bd82088deb00', 'Jacqueline Chavez'),
  ('cc328503-06e5-4150-b596-48cc5b0b3c8a', 'Nora Gonzalez Martinez'),
  ('a0133c16-82ee-4608-9f74-a79e3fa81416', 'Poonam Deshmukh'),
  ('d046ddef-3354-4b78-9137-e3c7665830d5', 'Sandra  Conover'),
  ('d6264294-f8a9-42ed-a682-4190baed560f', 'Melina Joaquin'),
  ('ac6594d1-63e6-41d2-8f02-144eaa82152f', 'Anna Vargas'),
  ('9f99fecf-6ccf-4e95-a029-f8bf94b2c29a', 'Monica Aguilera'),
  ('cb3d42af-1e37-4db4-8d22-4ee50b5d395b', 'Stephanie Hoyos'),
  ('7e14250d-0f5a-4735-9451-b62dc6c7c310', 'Sindy Deras'),
  ('0a581bb4-d822-45f2-8ed5-6c03e9acef33', 'Lissette Echeverria'),
  ('be821f07-6d9d-42a3-9213-5b022e390be9', 'Coreina Abila'),
  ('c7cc1f33-2fb1-4ab5-8b1e-38b20e45323e', 'Felicia Hernandez'),
  ('34c25f4d-313e-4ae3-98fd-9674a53a67b8', 'Jazmin Palomino'),
  ('d09fdc4d-32eb-4faf-a75e-d3094b82c0e6', 'Veronica Pace'),
  ('04672d54-8f1b-4711-95f5-1d8d4c2ab087', 'Maria Chavez'),
  ('cd5fc59a-e8c3-4ab4-af57-ed9d2d21199b', 'Cesar Suarez'),
  ('6ab3beb6-648d-4272-8aa2-1ec4993a798c', 'Stephanie Macias'),
  ('18f8884f-cbcb-4671-bdd8-650fcc4248c2', 'Lianne Smith'),
  ('ee7ce58e-d7c5-4bd1-9a44-1942e383a9f7', 'JASKIRANJEET KAUR');

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
