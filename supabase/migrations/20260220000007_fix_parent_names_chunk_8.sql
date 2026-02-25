-- Chunk 8: Update 100 parent names from Airtable
-- Records 821 to 920 of 1616

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
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
  ('ee7ce58e-d7c5-4bd1-9a44-1942e383a9f7', 'JASKIRANJEET KAUR'),
  ('9f134dec-9f4e-4bdc-adcb-8967f7cbb8b9', 'KIMBERLY GARRETT'),
  ('188651e0-71d1-48e0-a834-693cb2da1484', 'Ariella McDonald'),
  ('cba0edd7-d494-48b8-9cf5-1774ae5bdbd2', 'Van Nguyen'),
  ('3b92f999-b19a-43a3-8179-061dfa655b24', 'Alvarado'),
  ('5107231c-323a-4539-a043-fc8e26c83cea', 'Maci King'),
  ('a0c355e7-6eba-481d-b53f-b0f492b7321c', 'Lucila Pulido'),
  ('c188695b-fc4d-4887-a659-97c5c8a5d2e8', 'Mary Souza'),
  ('e7db903b-77da-4746-a1a8-93be0a2bfd0a', 'AMANDA MOONEY'),
  ('bf67440b-0cea-48aa-bfcf-1f03ddee4733', 'Isavela Castro'),
  ('f524429d-96d0-431f-9e68-91ef62952b88', 'Rebecca Galvan'),
  ('11f83ee9-a6ca-4f24-9114-065ea2daa8bc', 'Lucia Mariano Narvaez'),
  ('0ef5935f-cf2e-452f-a808-908aa4315591', 'Maria De Los Santos'),
  ('70d41307-5b38-42ee-9747-592b1dd2eb0c', 'Wendy Pamatz'),
  ('6c8b20a8-14e1-4444-a78e-c172484c6d4f', 'Alma Kopitzke'),
  ('daad547e-383f-433f-b3dd-6f4974efa9ec', 'Adrianna Duran'),
  ('9a5731c0-0463-472b-a321-cae26abb451b', 'Danette Vazquez'),
  ('18525f8c-dac4-4272-b838-3bc8a7ae671e', 'Patricia Gomez-Valdez'),
  ('f9951a93-4459-4ac5-b9ac-7ee90653ebe1', 'Rajwinder Kaur'),
  ('e9292d52-5583-42e3-8458-3921cd9d52e5', 'Paige Amador'),
  ('9d035465-d129-496c-90e4-193f9529ac72', 'Lexi Daclan');

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
