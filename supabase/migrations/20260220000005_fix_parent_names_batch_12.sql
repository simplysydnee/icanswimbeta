-- Batch 12: Update 100 parent names from Airtable

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('15247879-449e-4c32-9c72-e951374050f6', 'Luz Maria Ruiz'),
  ('9a08fdd6-59ad-4c66-9792-773b45a4babc', 'Ofelia Reglado'),
  ('3e28cd8f-ceb6-472b-ba63-a42f6ab509be', 'Katherine Anson'),
  ('97475e93-3d08-425c-a48e-4c2cab21c513', 'Juanita Saldana'),
  ('0e4abd77-c310-444e-9911-62ff2ebce7ab', 'Marissa Pulido'),
  ('93a7b84f-8cd7-4752-a69c-a0b361b14b0c', 'Abigail Arias Bojorque'),
  ('4879141a-37b2-46e5-8f4c-be5df8cb00d5', 'Sugey Sanchez'),
  ('43ef73b5-17fe-4721-a894-ec414d1e507d', 'Ana shamon'),
  ('42e72f75-5c1a-483f-915f-689d1c123735', 'Marissa Jara'),
  ('cb1bbf06-70f4-40a9-8de6-31740790ad22', 'Amy Jones'),
  ('f25414f2-f5f0-4c53-90f6-6e09b9c3e326', 'Charles Plumee'),
  ('f0c22a81-918e-4ca4-b96e-ca4df8be884f', 'JOAN LEBEMBE'),
  ('c40281d3-8707-4081-b24e-1443f02533f0', 'Marielene Gosai'),
  ('4e6f2034-d563-4511-91fd-c7bf937e8c97', 'Stephanie Hernandez'),
  ('f0655fc4-3d68-496f-9734-4a33f4551d01', 'Nastajah Brown'),
  ('eec7c2cb-dda5-4925-aecb-2efc97aa339f', 'Brenda Jimenez'),
  ('7b089fab-b60d-4920-9cea-25b5f86cdd0d', 'Lizette Lopez'),
  ('537d86fd-c94e-4ca7-bcc7-579660270d49', 'Rosa Orozco'),
  ('4c7bcb14-560e-43e3-b2fb-4e5bb7c801d8', 'VENEZIA GARCIA'),
  ('be7720fa-864b-41d8-abdd-3dc54de452e6', 'Jewelya Jones'),
  ('8f0cdc48-5727-40fb-9197-7db6bfc905da', 'Elizabeth Zavala'),
  ('f8fc7a52-6740-4325-99c3-d8f1a8de2552', 'Luz Maria Hernandez'),
  ('594932a1-e6b7-41ea-ae4f-4059cb69ee79', 'Chinda Von'),
  ('c1f7e0df-601c-4e5e-9bca-d31ac6781d65', 'Kim Lewis'),
  ('3bb6078e-85aa-4aaa-bebd-be40fc0e61c7', 'Pedro Martinez'),
  ('124968fa-253f-4fbd-9af9-dfb38bf59daa', 'Theron Ledford'),
  ('a82f9200-6512-4b1f-9a0a-6b7cb6be183e', 'LEIDY GALDAMEZ'),
  ('15fc701d-6ce0-4ce8-9f95-af86720c5d1d', 'Breanna David'),
  ('e3811640-be4e-45c2-83e4-e06216a364da', 'Kaytlin Green'),
  ('b9220418-fb41-4745-bdd7-47b86508fd98', 'MARICRUZ GUTIERREZ'),
  ('2a5075e2-ed3a-4432-b89c-2292ba91bbd6', 'Anna Bria'),
  ('26afe6d9-6e73-471c-8cb4-fb11feeb5831', 'Chelse Ghiorso'),
  ('a6193e70-4918-4617-8c9d-414b33f0d806', 'Melissa Marie Shelton'),
  ('c0de196a-8ca9-40a7-af73-fb52c1fafe8c', 'Jessica Orozco'),
  ('e4408659-2794-4c91-9bdc-2dbbcacd085e', 'Julia Acosta'),
  ('0e5d3aa4-1d1d-4add-9df2-f45402c27ccb', 'Cassandra Bost'),
  ('b3d9c007-c820-4db0-bfa0-2772cebc9cd3', 'Laticia Marlett'),
  ('a83f505a-7379-4949-9990-37722ae9fd32', 'Briana Pedro'),
  ('6ceb3638-6002-4d48-a95d-6419a20723dc', 'Asia Rogers'),
  ('3ce8ac99-1d58-4bb7-b2fc-0b19d18812a0', 'Erica Guedea'),
  ('22151347-87a2-4b01-a784-49f6996a579a', 'HANNAIS TORRES'),
  ('dc768ba4-d322-4c89-be96-ad6aef8d6395', 'Elizabeth Flynn'),
  ('7a86cd44-241e-4820-8a41-1faf17c6204b', 'Alexis heatley'),
  ('fde2d5e7-0e3a-48ea-97e1-4a565be0efaa', 'Margarita Guerrero'),
  ('53135688-97ac-43c9-8353-2169ccc1fde7', 'Amparo Murillo'),
  ('6a55aa8b-5fd5-4adf-9313-0840d0f8819a', 'Melinda Cogburn'),
  ('b4294453-90a5-4289-8bdf-102dc5cd59a9', 'Melissa Tarter'),
  ('a81efdc3-0b69-4bd4-bf04-6e5c1b717239', 'Sierra Holmes'),
  ('f253097a-7dd3-4374-881d-5482fd0dc6fe', 'Claudia Aldrich'),
  ('f986ae66-9ccf-403a-a4d8-b0cbc3885f29', 'Amanda Holguin'),
  ('ae262108-2c01-4c9c-ad64-1c063feb2735', 'Savannah Steagall'),
  ('1803b8d5-8c5c-4faf-bb9b-5832ecc5e9e4', 'Gina Anaya'),
  ('da976483-77e3-4e37-9ce8-d5cb9a2165a8', 'Patricia Hernandez'),
  ('fa33eddb-56b2-4b5b-9761-87e147f68e12', 'Adriana Leverett'),
  ('59a3408b-cf3f-4370-8ab8-07fbaa68dd40', 'Monica Rogers'),
  ('d057578d-b81e-43bf-88b7-753fd4b929f9', 'Monica Powell'),
  ('e4a89685-0455-48c9-82f3-076b9aa0f0f2', 'Danielle Charitat'),
  ('68233295-569f-4fa5-bd56-696870391b7d', 'Brenda Contrares'),
  ('53fbb2b8-d020-45a2-b6ba-e523a89e2d15', 'Roxanna Sanchez'),
  ('1a63aff5-6cbe-4e38-ba81-8f42ddcc86b5', 'Gabriela Tadeo'),
  ('54e899b7-2547-4f22-b22e-e89aaa68141c', 'Renteria'),
  ('8693fa3e-6d97-48ba-8245-aa983fdb4264', 'Yesenia Cortez'),
  ('c82954b6-cc1d-4e2c-8ea4-a327e128af17', 'Linda Gardea'),
  ('058b828b-d688-4fd6-b742-93673d22c019', 'Biridiana Perez'),
  ('a512a906-6cb0-4a2a-9b5a-4117409d11eb', 'Asusena Ojeda Hernandez'),
  ('98ddb2a5-b031-4b3e-acbf-768b415d8a47', 'Keri Garcia'),
  ('c79991ec-820f-483d-a152-7649c0190a59', 'David Lopez'),
  ('5440338a-d58a-4b43-aaef-ae1f211b9c2c', 'Yolanda Salazar Ramirez'),
  ('a0be8413-8948-47af-989c-bd0e00582682', 'NOEMI GARCIA'),
  ('44e3c4da-dc83-42fc-aec8-3255a4cc9fb3', 'Stefani Araujo'),
  ('35ec38e6-e407-4a59-a0e1-9049298520d7', 'JULIANA MELGOZA'),
  ('440005fc-f0f7-41f0-8321-3f764d501a69', 'Amalia Castrejon'),
  ('278d33f3-eb8f-43cb-a3f1-fd34173099d9', 'Teresa Vasquez'),
  ('974bc85e-5c20-4f41-8ed5-9ef58273b74f', 'Mckinzey Tellez'),
  ('20e052dc-0528-4477-ba46-02f59342e2bb', 'Anna Marquez'),
  ('80f51dea-e02b-4421-b1e3-ba6ea6dfad2e', 'Lesette Castro'),
  ('d05ff2d6-3675-447f-a379-527fe7188e03', 'Elena Bautista'),
  ('bf588bb6-256f-469d-b28c-225056beca7b', 'Breanna Wolfe'),
  ('05806940-89df-4ffa-8662-1918e3cbf406', 'Nancy Alvarez'),
  ('ffcb6ec6-3b8f-4fca-b012-dd12ca58a0ac', 'Amanda Fears'),
  ('73ee46c8-3e87-4869-90fa-b95cba6e7913', 'KIMBERLY WISER'),
  ('bea85194-48a1-4290-97d5-9e92978a9ece', 'Maria Espinoza'),
  ('9a7f8bb7-b975-4f1c-8577-728f1d428450', 'Brittney Osborne'),
  ('f5874b9e-7fcb-4791-824b-ad93dbca0931', 'Raean Parker'),
  ('16c40a37-2ff2-4d1a-afba-a2b5c39313b1', 'Diana Bucio'),
  ('b714ee1a-1efd-4c2a-9c9f-369bb18e7c60', 'Reynalda Rangel- Macias'),
  ('a470ff31-b0f4-405d-9c82-bf008cb4cef5', 'Elizabeth Barragan Duran'),
  ('f31dd5e3-f3e7-4bf4-ab63-5e540a2e13e1', 'Alisa Lopez'),
  ('99335856-ae1c-4fed-a5b0-09526d08f6fe', 'RAJVIR SANGHA'),
  ('892f5bd0-1518-4a81-9fc5-af52bd4e5a53', 'Veronica Martinez'),
  ('e9e2d658-bf26-48ab-84e9-63ab77c41fb2', 'Araceli Ramirez'),
  ('071bde08-94ec-4f51-8e7a-42568a73b08e', 'Bajlit Gill'),
  ('9829dd72-b0e1-4940-b161-32bef540434d', 'Martha Cortez'),
  ('8abf012d-98c1-4ff9-9d8f-194f0c025b71', 'Victoria Deanda'),
  ('df6f5edc-781e-45a0-ae20-632eb44e73af', 'Tina Robison'),
  ('5e6eb386-3428-41fe-9294-0043cd48f294', 'Martha Aguiniga'),
  ('a8b8888b-ae98-4f64-b0a5-f8880c2d5bb9', 'Victoria Ambriz'),
  ('99a52793-9402-4743-b83d-59a807e03b3a', 'Jessica Mendoza'),
  ('d1857f86-9a51-4b82-a0cb-354dbb00fec7', 'Christina Mota'),
  ('0238fe18-c091-43f4-9293-9e9c90e1a811', 'Juan Islas');

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
