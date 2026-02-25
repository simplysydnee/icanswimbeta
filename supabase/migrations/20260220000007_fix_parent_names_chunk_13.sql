-- Chunk 13: Update 100 parent names from Airtable
-- Records 1321 to 1420 of 1616

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('d48425c2-1328-47f1-8461-59fdf9dce5be', 'Jessica Rosales'),
  ('ba5057e5-b77c-4f55-8f3a-5a04e498da7a', 'Laura Barreto'),
  ('da595698-e4f8-4387-8158-a7485e670277', 'Jennifer Chang'),
  ('47be70ba-0a9c-4857-af8d-a2d315d571e0', 'Kelli Mobley'),
  ('f77696c4-c22e-4da8-94ed-898f5975bbd0', 'Kayla Donahou-steele'),
  ('60fa02cd-aa20-451c-a2c9-c291b82df055', 'TANIA GONCALVES'),
  ('584ab7d1-a2e1-40f2-8c51-8ee149e3fd51', 'Lucia Mendez'),
  ('c690dfd1-a690-4e43-a468-9c846b993f83', 'BRISEIDA MAYORGA'),
  ('e6140be8-e540-4b90-bdfb-2b07ba02fc45', 'Tairy Cuevas'),
  ('82075a63-ce06-4bc9-8f26-e64e64505018', 'Blanca Gudino (spanish Speaking)'),
  ('fb9055a8-3cc8-4bed-b7ea-c71bc7821ea3', 'Nora Jauregui'),
  ('8583ebf0-114d-4595-ad00-8a9753e43a10', 'Ana Ruiz'),
  ('2cadfc6e-6b33-4e62-a285-78c7256f2ffe', 'FABIOLA CARRERA VALENZUELA'),
  ('07a1bf2c-1c32-46bd-8f6f-0c0eccc5c9ff', 'Kimberly Cuevas'),
  ('bad7c7a2-3bf6-4467-a1fa-0d177d43e335', 'JENNIFER LEE'),
  ('724c9a64-767b-4c9b-8884-e35e87e76196', 'DIANE BAKER'),
  ('f884c18d-9298-47e2-96e3-694b581fe65d', 'Savanna Garcia'),
  ('49915e8a-092a-49b9-bbb2-7eb1c6e0d1c9', 'Brisayra Zuniga'),
  ('06ec9017-4665-482f-9684-233eddd2d985', 'MARIA OROZCO'),
  ('dc161cbb-2d34-45b1-8dfc-794bdb13a12a', 'Jenny Draffen'),
  ('6e766aa5-53b2-4e1c-83b1-8127edf6dad3', 'Sandra Navarro'),
  ('4742b6e3-7d0f-4114-ba98-b37446bff12b', 'Jaime Tosado, Grandmother/Guardian'),
  ('97dc5235-4cd8-4064-b353-54612c4690ad', 'Tania Gonzalez'),
  ('77748a9b-469d-4630-927f-7962940a938e', 'Gloria Mungia'),
  ('7615f32a-d651-47d9-a01b-75ab6f9b79bd', 'Cristina Padilla'),
  ('094d90a5-de5b-4fbc-8293-2e9fac078483', 'Rubi Guerrero'),
  ('3fd253e0-9be8-4325-96fc-a45ba78b5e25', 'JENNIE SPENCE'),
  ('bf8709c6-7ae5-4a4c-adc9-df1401836cc9', 'Holli Webb'),
  ('78da15e6-ac98-438c-b3f2-c39499b92059', 'Ashleigh Schulze'),
  ('68894eb8-714d-4df8-b1e5-391be419f206', 'Alondra Valdivia'),
  ('b4c4d8cd-c3f3-4ce8-a1b6-b358d80b331b', 'Sasonia Zavala'),
  ('7324299d-5b68-43ee-a2b2-8efe06e5fd2c', 'Khrisace Blalock'),
  ('48505f1e-20fe-4b3a-aa11-e5e6fdfcdb8f', 'Josephine Quintero'),
  ('27e15f24-0efa-4be5-bc95-f105694af276', 'Elidia De La Torre'),
  ('4c809202-b549-4b9b-a591-e3feaf0d9aa4', 'Makayla White'),
  ('de1cc4df-f795-446e-bc22-5785520fb9a9', 'Cinthia Carillo'),
  ('d177c81c-edb5-465e-b736-2d2c2ff429db', 'Violet Smith'),
  ('c905f0c2-98f3-4933-83f7-ec6031f98b38', 'Yolanda Orozco'),
  ('9c18af69-8690-4435-bd21-c617e34b9cd4', 'Dominique Mellion'),
  ('d19121ee-5174-4c91-8f7d-8f421b92bc89', 'Sharmaine Roberts'),
  ('b2d75667-d8c1-4985-ab41-a27129fe41ca', 'Erin Johnson'),
  ('7528e3d9-0d04-4dd6-b095-5051dc5f671b', 'Araceli Altamirano'),
  ('33f4e6df-fc3b-4abe-a791-b2b0a7f73598', 'Cassandra Bost'),
  ('66da4487-40b3-46fe-bd65-cb946e20d57b', 'Jennifer Torres'),
  ('be17da8f-0088-4c5c-9113-772b137da91b', 'Thalia Virrueta'),
  ('d1251815-9ba1-4ab8-bfee-dc6d88f6e565', 'Ana Valdovinos'),
  ('9a95318f-0475-4a2f-a887-7b4eb717415f', 'Yoshelin navarro'),
  ('10f4b12d-8710-4b46-9922-e3691becb118', 'Beverly Tyler'),
  ('8471d8d6-78f7-492e-8fba-d77ad4733025', 'DANIELLE GAINEY'),
  ('7001a0a7-0cb5-4fd4-8772-7180f22395b9', 'Kayla Owens'),
  ('7f7869bd-1875-47ed-b8c6-57f0fffce5ec', 'Sharmaine Roberts'),
  ('f1f5cbcc-ed27-4dab-9fd1-acceecd27391', 'Sharmaine Roberts'),
  ('9abec397-6ded-4c39-a6a7-86d8b9f30063', 'Vii Royal'),
  ('88e28d3c-f6a3-4428-8444-902b2ea5df03', 'Adrienne Buckholtz'),
  ('496d41e9-22a2-4a62-848e-dbdff1eb6440', 'Bailey Hartman'),
  ('027e79ae-6d46-4e48-845c-26c30e2a02a9', 'RASMIA JAWED'),
  ('9f05a7e6-ba17-4aa1-8875-e365697c62c8', 'Gloria Figueroa'),
  ('45e14b58-c6a3-4b86-8d4f-70ce9a5ab817', 'Meagann Shinaver'),
  ('30724e49-825d-40f1-b0d9-1875093a79cc', 'Desiree Hurt'),
  ('b1a9c17d-6223-4e89-b349-33fef6d0cb47', 'Caitlin Chouk'),
  ('365d2326-1f5e-480d-90a0-77d59e4c1e9b', 'ELIA ALFARO & RAUL MORENO'),
  ('b96a0b2d-77a8-43f8-89f3-e627504f4829', 'Mayra Robinson'),
  ('f050f540-fe83-4344-b634-fe8ed4e976ce', 'Inez Karina Soto'),
  ('1aa70800-8e01-42d2-80d2-f01235f4d88a', 'Yesenia Farias'),
  ('a1a6d890-5318-4873-ad02-3e7efa03d93d', 'Jaqueline Pacheco'),
  ('e76933ad-f75d-4ed7-aaa8-5437105a049f', 'Rosa Rios'),
  ('6dcf1c2a-52b3-45ff-8c15-5b151523262e', 'Linda Men'),
  ('de59b8bb-7ae0-440d-bac6-c0efa9eebafb', 'Kellie and Ross McKenzie'),
  ('7638cb7b-fa71-421f-8c25-8315b3df8440', 'Jessica Montanio'),
  ('69886a70-ce91-4d47-b477-1880b7b86258', 'Maria Chavez'),
  ('4036a2ec-e997-45a5-bb81-16fc2a8e1b20', 'Arlene Lara'),
  ('90603fcb-a8b4-4882-9cb3-dc0b107191b0', 'Patricia Sousa'),
  ('6169a94c-b08e-4327-95dc-399f53ee028f', 'Carolyn Branshaw'),
  ('0d2e69c3-a34a-4e85-8696-a506a4d2f606', 'Ana Ibarra'),
  ('8a7084f0-c281-4c3d-809d-f5f3f43914b4', 'Jazmin Mejia'),
  ('339fcfa4-0c18-43f2-a35b-56aef85a0f16', 'Griselda Jauregui'),
  ('17a66ddb-bcaa-48c4-a037-af1f360b9eb7', 'Rachel McClure'),
  ('b1ef0f63-1d96-4186-8ac6-544d3ce17947', 'Isaac Yacoub'),
  ('1396b358-62cd-4a9f-b928-f5e19eb43332', 'Mariela Rosas'),
  ('1805d6c7-bb99-4cdb-ad5c-e7ae65366e42', 'Itzel Esquivel'),
  ('047621cf-480f-48fe-811e-ce440280c7a3', 'ELSA BAIRESBUEGO'),
  ('72e6c92e-80e2-4b34-9c88-bb1bc17ad232', 'Tatiana Magana'),
  ('d878897b-1840-4f53-a456-18ad202d0819', 'Janet Aguilar'),
  ('851db9ae-1723-4d88-b491-6af0967d4f15', 'Yoshelin Navarro'),
  ('d060f2e9-f02d-4071-8be6-e5a04bb0f557', 'Steven Bergin'),
  ('f09eb9bd-0a3d-4a7d-98d7-3ac0cc743d9d', 'Jasmine Gonzales'),
  ('9a84e23b-9887-4a99-ac51-82858e9fefa9', 'Samantha Zaslove'),
  ('0d7e69b9-b9fd-4c7e-a7ca-be19e3781a58', 'Manle Do'),
  ('50fc1edf-cc80-445e-a64b-8abe39e304c6', 'Ashley Gonzalez'),
  ('ac27b45a-7480-474c-9cbf-d80f8cc791a3', 'Teresa Salcedo'),
  ('ba1bc896-b559-4cca-b7f4-4f33d9cf1e93', 'Jeannie Cerda'),
  ('5b68d7de-4322-4da7-b67c-faea8588acf6', 'AMANDA GONZALES'),
  ('95f42a43-2da1-4680-9561-af5c2fc77d9b', 'Eric Ruiz'),
  ('0ee22f5a-b85e-43a6-aabf-50e2a269b82d', 'Monica Gonzalez'),
  ('d438b011-5ef7-4fac-b913-5faa51cac339', 'Martha Espinoza'),
  ('8f008f51-6d0a-4c4a-8646-864a04efc128', 'Lupe Nunez'),
  ('c4e95ab8-972d-4a64-bbde-cb4a2a19b899', 'TERESA RODRIGUEZ'),
  ('54a03aec-16c9-489b-a5e4-bf1d14fa8a08', 'TERESA RODRIGUEZ'),
  ('31e79d02-3728-4ef4-97e2-c8d67fe823a4', 'Cesar Suarez'),
  ('4acef598-4db4-48d2-bae8-6cf2299c049c', 'Ariel Lopez');

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
