-- Batch 10: Update 100 parent names from Airtable

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
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
  ('9d035465-d129-496c-90e4-193f9529ac72', 'Lexi Daclan'),
  ('98b20594-3c18-4281-85fd-4c3fb8c6433e', 'Breanna Lopez'),
  ('edc1f917-4ba9-42a3-9caa-b6d819ba6cbc', 'Katie Plank and Robert Plank'),
  ('8b2ce77e-c15a-49f9-b8f5-941f31731e0c', 'Alejandra Hermosillo'),
  ('2dd1119f-9267-429e-b1dd-4520fe76d1ad', '(209) 573-1840'),
  ('b5b83659-eea9-4515-bb41-e8fa5288ad7d', 'TRACI RAMIREZ'),
  ('19dd255d-cf12-4953-8c32-0442a798ccba', 'Khristine Santiago'),
  ('915725a0-3960-4331-b804-fc0171c0c56a', 'CESAR ALGALAN'),
  ('a1fe2afa-6fe1-4994-84e5-c8595b50d15a', 'Anna Ejoh'),
  ('113ab574-b36a-4f0d-a33c-9e36c83442cc', 'Lakisha Smith'),
  ('ae5175b6-6a37-4d06-8883-033f27c87afa', 'Lakisha Smith'),
  ('c97d4386-dc6b-49d6-8950-577aafab5fdd', 'Summer Randez'),
  ('143cd247-8966-417c-8851-8ddb8d07bf98', 'Amanda Henry'),
  ('681652d5-75bc-47a1-bdee-c2f936389553', 'Rebecca Cortez'),
  ('d5aa85dd-ac69-4272-96de-eadc04e4724b', 'SANDY SANCHEZ'),
  ('d973d070-0d38-43da-b461-40ff52385270', 'Amanda Martinez'),
  ('12d0d22a-e481-4f49-b453-76c1dac24b93', 'Rocio Chavez'),
  ('2c3dc988-19d3-4e5c-820f-b86560206ed6', 'Consuelo Moron'),
  ('f5149d0c-0958-4fff-b502-d221c7b4a745', 'Kayla Owens'),
  ('7eb8af11-52ad-4530-b795-bd95728f6b04', 'Jeannette  Ceja'),
  ('0754b7a8-40ad-475f-95f0-9c46853a7a24', 'Blanca Naranjo Valencia'),
  ('98dd478a-aeac-476b-af9b-8146603461c2', 'Pang Vang'),
  ('91600ed9-0263-4893-bd2c-e9d64b9027d1', 'Sydney Torres'),
  ('ac0eb694-8df7-41ae-8550-f97a1e2db788', 'Natalie Flores'),
  ('4a6bf89a-b080-409d-bb54-5182ba251844', 'Bobbie Ann Carpenter'),
  ('41cd0504-8617-4344-bbb7-834e8f191676', 'Bobbie Ann Carpenter'),
  ('04c734c9-2d08-42aa-b6e2-0b2d36800508', 'Martha Garcia'),
  ('dfe98c95-55e3-4ba3-a30b-2f3234bd8d21', 'Gia Gomez'),
  ('9b722b66-2dfc-4ab1-b489-3cc400111428', 'FLORENCIA VICTORIA'),
  ('22c0aaa7-e0a8-476e-96c4-1a28ca44a197', 'Adelene Zepeda'),
  ('a5873d87-846c-44ff-af4a-5289dfb5d07f', 'NAVDEEP KUAR'),
  ('bbc12121-ec5c-4b66-bc3a-22735a653dd3', 'Silviano Valencia'),
  ('dffca90c-3b0e-468c-b1b2-2d1b3c089a23', 'Raine Huerta'),
  ('5f612456-4329-4596-9cea-24db12026f08', 'Nicole Clark'),
  ('5e7ab570-612a-4de4-b49a-e35f080261ab', 'Brenda Montejano'),
  ('380b48eb-3c07-4883-ab94-873e3285da09', 'Elizabeth Montalbo'),
  ('1cf49e2c-b096-46bc-bae6-d6e7c01f8d09', 'Cierra Deaton'),
  ('98f6bee9-bd0b-44b7-8f54-a9ce295c2f4e', 'Linda David'),
  ('4f4a2d24-d011-4408-9847-1536b31dbfe8', 'KEONIE METOYER POLOAI'),
  ('3c9104bf-2d21-4bcc-a91c-9fb33993ec19', 'SHALMAE MORLOCK-FERDIN'),
  ('58c39236-e016-454f-af89-2b6c0c4c4e58', 'Julia Flanagan'),
  ('97ec1a73-b1e9-4f48-9402-12b27daa46b8', 'ANAKAREN MEJIA'),
  ('f3330b1a-2ab4-4bc9-99ff-875793b8e45e', 'Cristina Gomez'),
  ('687e2226-8062-4e26-9d28-496d05fa9a46', 'Lilia Calderon Flores'),
  ('c0c49172-c278-45ae-8a87-fa770529650e', 'MANUEL FRANCO'),
  ('cfa05461-c935-4969-b0f0-d33630ccb78f', 'Latasha Hernandez'),
  ('f488c5cd-1c20-4bbb-9026-10901c59af07', 'Hope Jones'),
  ('ba8e42b4-8ffb-46cf-b817-a502832c028e', 'Satvinder Singh'),
  ('a4487e61-8f50-4ffb-a4ba-496ea62ba6f1', 'Silva Gomez'),
  ('516bf3d4-e861-4236-849c-a9edbbd126fc', 'Heather Shoffner'),
  ('a2e35262-e5de-4f88-992d-35b66dc7b3b0', 'CLAUDIA LOPEZ'),
  ('953da874-c5ee-4281-ac5a-47b1e5e59d30', 'CLAUDIA LOPEZ'),
  ('5bb45c5b-c503-4dcc-a400-5d5da65e4ccc', 'Rolando Rodriguez'),
  ('3b9d90f1-2b0b-4559-89e4-1430a04a2625', 'Cynthia Villegas'),
  ('91ec2cc3-b6f0-4596-b8a4-923204bd0969', 'Gail Sasser'),
  ('7ae6f010-e772-4193-b492-c5e87c500795', 'Priscilla Grajeda'),
  ('2eb3bd35-125a-4dff-b92f-67aac4e52a81', 'Rosalva Garza'),
  ('d7fe51d0-a011-44c7-b319-ef81856dfe2a', 'Trella Galvez'),
  ('aa54f91d-b674-423f-9929-f0e74937f5c4', 'Victoria Contreras'),
  ('a4a8c602-6ee6-4a71-8a53-d46d94752555', 'Trella Galvez'),
  ('677a8f67-5f6a-417b-9e35-39d5d913526c', 'Elizabeth Zendejas'),
  ('6ffcce54-98b0-4ec1-a2d2-90e9ce557e57', 'Maira Aguayo'),
  ('5224fc4f-1942-4ebf-89e9-19189f81621f', 'Ariana Del Rio'),
  ('8111a80b-56f0-4587-aaca-46e87637c8b5', 'LUZMILA IBANEZ CARRAZCO'),
  ('39142b46-894e-4b36-bc99-aa758fe784ac', 'Lumila Ibanez'),
  ('6ebd5887-aa5e-4a7d-a5b4-53f2fb5f95da', 'Monica Kumar'),
  ('30bfeaf6-f5e8-45f9-811c-eaf4237b0ded', 'Marie Park'),
  ('650b0be4-8c08-443b-be1d-d9e687f64edb', 'Sendy Botello-Ceja'),
  ('ce9661d7-e7a2-4bb3-a601-58567bb41172', 'Cynthia Brace'),
  ('b85956e9-da37-4ea6-a426-3d02c65558b3', 'Liliana Mayoral'),
  ('399078de-12e9-452b-b166-131ca1f03155', 'Mayra Colmenares Cruz'),
  ('27cc3efc-1386-4b38-a24b-746fcdf125a8', 'Nancy Lopez'),
  ('46d3af21-5be9-47c5-9621-55887e2de8b6', 'DIANA MOLINA'),
  ('390c58ad-5b4b-45a1-9be4-314dc0756f72', 'Maria De Jesus Alvarez'),
  ('6a050627-d191-4b2e-b1bf-abc0687c75fd', 'Columba Leon'),
  ('1299010f-13ff-4fb7-bc2a-7ec11a41d114', 'Alma Silva'),
  ('d365299f-2a30-4696-9bc2-b8d99a3cecdd', 'Denise Esquivel'),
  ('cf864eb1-6024-41f4-a4a7-3470e493ada5', 'CHARLIE GAINES'),
  ('175303da-5025-47c5-bedf-90da3794e365', 'Maria Cabrera'),
  ('7fff184d-b03c-4053-9a9f-2692b022ea20', 'Heldy Corrales'),
  ('acf985b2-b67f-43a1-9567-b939f28f33d5', 'Megan Skinner');

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
