-- Batch 8: Update 100 parent names from Airtable

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('fef5586f-71a5-4132-bda7-68fa66135b8c', 'Brianna Sousa'),
  ('e0777b7c-910c-4bd0-b876-f3ec1fd07953', 'Giomayra Martinez'),
  ('c1c47b96-534e-402e-a471-0fc62e0c985f', 'Maxwell'),
  ('f12ec5e1-b218-48fe-9085-0c9ffa5f1f10', 'Rosa Ochoa'),
  ('45ff8b29-754a-47ae-bca7-229a6248272c', 'Nicole Coleman'),
  ('fc91bfa4-3651-4852-99d0-428ac7882996', 'Melonie Ochoa'),
  ('5260cb57-97d7-443e-83d3-bb7e0ab8d4b9', 'Parnell Phengthirath'),
  ('5655fb95-3518-4929-8daa-37ca232e3825', 'Elaina Freitas'),
  ('6f69b09e-f4c0-4995-ae1c-b0a8c43fcabc', 'Teresa I De Dios Avia'),
  ('5b610600-6477-4563-b835-5ee54c8c0314', 'Leticia Palafox'),
  ('8d63c878-0542-4954-802d-4a76e2b83082', 'Araceli Mendoza'),
  ('cd17839f-6aa2-4b8f-8865-7ff8bbb5949c', 'Madelyn Bell'),
  ('66ebc5a5-1455-48c0-9c1e-8435e9565bc2', 'Katie Jones'),
  ('49c992b0-e0d3-4073-9138-41f00805f3b3', 'Selena Ortiz'),
  ('aca726bb-4f02-4227-a713-54a85be26a90', 'Claudette Cerda'),
  ('13baa6e1-82f3-4e65-bee7-4c4e954f2e73', 'Sofia Zepeda'),
  ('3a3686d1-4647-4c0d-badd-58dbe38e78a9', 'Alyssa Oliver'),
  ('a79f2271-e339-4c0a-a14f-21df9a733ccd', 'Claudia Ochoa'),
  ('7ae5bc25-e850-45b1-ab52-3cb76af2c90f', 'Beatriz Grajales'),
  ('a7ef7567-6d85-4db6-b0b9-31dfb783acb5', 'Wendy Bradley'),
  ('34d8a8c0-889b-4743-a226-f77ecec1beed', 'Wendy Bradley'),
  ('a1d7c1ac-b143-4dfe-b2c3-504962d1e882', 'Beatrice Valenzuela'),
  ('fdb7337f-6f72-40fd-98d1-527e696feee1', 'Cesar Algalan'),
  ('92c88926-e707-4f71-999e-9f0c0aa52617', 'Felicita Lopez'),
  ('acc95b78-12fb-4e31-adcc-c129af29f19c', 'Lucia Lopez'),
  ('8f7076d7-0cdd-4bd2-897b-52ffc58ed481', 'Maria Medina'),
  ('4a8dc450-903c-4a13-9d2e-529aecc69383', 'Veronica Linares'),
  ('5bfd2fc4-aa3d-4d9e-98d2-85482d8b026e', 'Loyda Ramirez'),
  ('73d9ebec-890a-46aa-8f8a-6f75d53e5308', 'Irlanda Arreola'),
  ('a9b0958a-78cc-4990-a39e-4a5a13a26c36', 'MARIA LOURDES ARGINIEGA'),
  ('d40e7c80-f00a-4a1c-8415-8ba230b5f5bb', 'MERCEDES CASTANEDA'),
  ('30cbde8b-3ecc-422d-b600-561b97237367', 'Shelby Haverson'),
  ('7d7de4e8-1311-452f-9d6e-ee2d7bdebbdc', 'Irene Rosales'),
  ('c37f8935-6435-4570-9093-cbc67fb295da', 'Jose Martinez'),
  ('07241695-d7e6-49f2-b6b1-950c86619a60', 'Kasandra Greenlee'),
  ('a9feb177-a630-48f1-a2b2-6820e151e253', 'Casey Camarda'),
  ('36f11649-0191-43a9-af8e-8039cdb7d452', 'ALICIA ACOSTA'),
  ('542e4aa4-659f-44f1-b220-e9e7aaad2a37', 'Ashley Cook'),
  ('cbb45cd4-43fc-4a0c-b5c0-11ef4f058162', 'Yuliana Zarate'),
  ('f08f75cf-193d-4442-a6ac-5c4a3524d803', 'Perez-Bautista'),
  ('73c0270c-f0bb-4e94-854d-626b417360c5', 'Stephanie Flores Alba'),
  ('beb93421-ed50-420b-ae98-c29867053b95', 'Jajaira Hernandez'),
  ('4f9012de-f682-441f-b58a-c2ea66aebd89', 'Garcia III'),
  ('9c12bdbb-4a67-4a94-9630-c3dc7bd34f53', 'Christine Vega'),
  ('fa4ee91d-c2a3-4fa8-9686-25304c3c75d3', 'MARIA ANGELICA RODRIGUEZ QUIRO'),
  ('5add300b-9f69-4fb4-b2c5-c3b2f8da4ad5', 'STEFANI KANG'),
  ('74220ab9-fbe8-493f-a7ad-f54a6e4ad08e', 'Ayala'),
  ('f5de301c-2c98-4e80-a820-8503696edeb9', 'Cassie Silva'),
  ('6abf9ea3-7672-48c3-8132-89e1d55581e0', 'Sara Avalos Castro'),
  ('7c27a816-a7fb-4e3d-8616-51acf77ea019', 'Sara Avalos Castro'),
  ('e964a9ec-8af5-4eae-b5ac-bf6a08fc00a5', 'Shawna Dolin'),
  ('3ee7dabe-1423-4dbe-84e3-5f6b0c6f76b4', 'Blanca Lopez'),
  ('b8fb9fb2-3f26-4a12-84b6-005cd018c0a4', 'Ana Martinez'),
  ('50776d58-8d42-4d1b-a3d1-704e015f0637', 'Yeny Romero'),
  ('b2f88c1b-9ff2-46be-8fe8-9fe99e1e8559', 'Leticia Barhona'),
  ('0c069f91-d3a4-4a39-a8c1-1d461f65d581', 'Dawnika Ford-Foreman'),
  ('5f8ed13d-a5ae-45dc-8293-c92820404bc5', 'Antoine Evins, Sr.'),
  ('1273126c-025e-4eb7-a56f-8e2682640f39', 'Cynthia Ortega'),
  ('ff3cfdee-a6a0-4f6b-ad42-e85738b9ad36', 'Hind Benhacene'),
  ('49f1ebf4-8ea8-4d61-9488-bf7be71e4253', 'Amelia Luz'),
  ('e85ee2af-410a-4e36-9821-5cfa34010350', 'Ana Martinez'),
  ('599f22bb-5159-476d-ac73-82e3bb132d8e', 'Rochelle Williams'),
  ('6ee1a8d1-fe4d-4899-b6da-93424830ff0a', 'Patricia Camargo'),
  ('9391460c-c071-4969-bdb0-7f0095222c8d', 'Edith Cornejo & Rene Benitez'),
  ('15cb8e57-2ad0-413c-9e91-2613b1639423', 'Corliss Robinson'),
  ('1d794302-2c28-4b3e-8206-2506051365a4', 'Kelsey & Nathaniel Mcmihelk'),
  ('b947de2e-6fbb-4e5c-ab10-2d6181457d0c', 'Jody & Rebecca Dozier'),
  ('1e7c3a1d-6256-445e-a2ca-1af4ad7bbc8a', 'Margarita Ramirez Toscano'),
  ('70e84ac7-4297-4c1d-89e5-798883cea92a', 'Maria Rivera'),
  ('9b1d2915-bee4-4849-9014-670c565931db', 'Kaylah Sweet'),
  ('642bff4e-1962-454e-adc7-6f0e55213052', 'Angelica Flores'),
  ('c428ee10-8f9a-4ce1-80ee-a07553201838', 'Esperanza Civitello'),
  ('c2ab02c2-f36e-4e19-b7f4-4989bb812ac1', 'Robyn Rose'),
  ('f14d9710-f527-40be-8283-18590f9600fb', 'Viridiana Guillen'),
  ('57229152-6cee-4ee4-ab1a-f7381a7f382a', 'Karina Melendez'),
  ('855e82e0-768f-4426-ada6-165b949727cb', 'Kyrsten Snodgrass'),
  ('e7d3bc79-91b4-469e-9a65-08754574630b', 'Holli Webb'),
  ('d6f6216a-4059-4df3-8f84-d57dda78e3fe', 'Maria Zavala'),
  ('9a9679e4-6106-42c2-8ee2-9e897e2fcb10', 'Yesenia Leon'),
  ('dab400dd-47f0-4287-bbd2-e58007167866', 'Maria Salazar'),
  ('e4c24ea9-b65f-45f0-99f7-b446297aff4e', 'Schafer'),
  ('0d1d7de9-86d1-4d6d-9a17-d04aa40e12bb', 'JAMIE WOOD'),
  ('56869f29-2a31-4772-8820-3cb96acd2e2a', 'Michelle Diego'),
  ('b02c7e18-2051-4604-ac32-5a88e7f0421c', 'Judith Juarez'),
  ('65421b19-c461-4bd2-b978-951cd1f54922', 'Thelma Villanueva'),
  ('f0098a5c-94f2-4c86-98bf-635d642edfcc', 'BRITTANY FANNON'),
  ('8e479d66-09d9-4bc1-a02f-6ab43e272b28', 'Ulany Ruiz'),
  ('c6fa5683-56b9-4765-b404-e17653077270', 'Jewelya Jones'),
  ('6ad26a73-0e75-4f58-9b7e-5fcb60095764', 'Monica Salcedo Lomeli'),
  ('bbdecdf8-468e-4f78-8dc6-105dd2262dc2', 'Berenice Rodriguez'),
  ('da4a5900-cf6e-44d6-b659-692637b8b786', 'Maira Guti='),
  ('d18ce948-48ea-4847-a5c3-af44f573793a', 'Blanca Juarez'),
  ('10370a3a-cfff-4295-9b7e-3303bb37974f', 'ELVIA BARAJAS'),
  ('eb667089-4211-47b8-acdd-a9658dda6560', 'Raquel Rodriguez'),
  ('6522c88a-6932-4608-9f4b-12e194395c2f', 'Nunes'),
  ('055bfb1a-4720-4acf-87d6-a0ef81d906ba', 'Marissa Nunes'),
  ('741e4c58-8365-4780-99b0-6126753740ea', 'Hart'),
  ('de2e6c0e-f2d9-42f0-a29e-a1229868753c', 'Amber Cardenas'),
  ('b7281085-eca9-4c2c-a68a-856036700f1b', 'Leticia Moran-Hidalgo'),
  ('720f9424-4106-4dd5-b60c-930f4bf29d72', 'Jessica Miller');

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
