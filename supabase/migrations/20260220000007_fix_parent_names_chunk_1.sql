-- Chunk 1: Update 100 parent names from Airtable
-- Records 121 to 220 of 1616

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('e9f657eb-6aec-4439-8189-dcaaa84f2789', 'Sarahi Garcia'),
  ('49fe7f11-e671-49b0-b3cd-a5c4243d7af8', 'Gabriela Jimenez-Mendoza'),
  ('50be11bc-79ae-414b-8ef2-42a992057da4', 'Karina Gomez'),
  ('9a51df14-6144-4f88-9e51-a199e4f2f03d', 'Laura Villa'),
  ('93917bde-157e-4eca-8d1b-a4c4010d6728', 'Nicole Gonzalez'),
  ('7e75c150-87f3-4a2a-b0b2-9574f1815258', 'Erika Isquerido'),
  ('2fae4347-16d9-436c-9194-ef8f113472fd', 'Carol Mussman'),
  ('f8a6381e-4136-43b2-bcc3-f5f19f50edf2', 'Cristal Partida'),
  ('09694ea5-0f3f-4670-83a5-0838fde31dd6', 'Danelle McMillen'),
  ('311c07ee-bbae-466a-ba48-3b995a375b77', 'Jara Jones'),
  ('614a0dec-aeb0-4de5-b242-748fa3752fad', 'Anai Revuelta'),
  ('52cdd0e7-e2b4-48d2-8f80-d690b9c38454', 'Seelene De La Huerta-pena'),
  ('71d81a0d-5740-42fc-a59a-0c71a915efa1', 'Jennifer Moreno'),
  ('65c6fcfc-5781-48f7-bb95-43e409a66dd4', 'Erika Pedroza'),
  ('e9118721-30d3-4a9b-9679-ea32b6ef0d7b', 'Magali Cruz'),
  ('1dec7863-ceeb-47e9-887f-8fc9f5823041', 'Johnathan Rubio'),
  ('0779d9ea-cff4-4f34-b221-ac15c2b0d7c8', 'Anthony Sequeira'),
  ('04f2386c-7be1-4431-b7f4-3a6b6d69e148', 'Leticia Castillo ortega'),
  ('1f1873ec-28df-4629-b62a-6eba5e8ce103', 'Julissa Hernandez'),
  ('307aa20c-8de4-4ae2-bfa0-8a4ac47937a6', 'Polet Diaz'),
  ('9372539c-f18f-4cb9-a0f8-fcaf92294db6', 'KARINA PRADO'),
  ('90a8d1ab-7b5b-4528-a38e-38602b2bd562', 'Maribel Gutierrez'),
  ('6945ec84-65c5-4506-be0d-920bb16a7611', 'Rosalva Vasquez'),
  ('7a2ad133-9952-4e0f-8769-f40147cb6f33', 'Jennifer Olivo-Sanchez'),
  ('302802f0-ec36-4bf6-9612-4a68f2f5cbfc', 'MONICA RANGEL'),
  ('88c6a97f-23f9-47b1-a8eb-ef5f9338497e', 'Maria Garcia'),
  ('e6bb3bb6-2aee-4133-92b5-2cb3356ba912', 'Samantha Harvey'),
  ('d84c2c67-5eb2-43a7-b618-057c6b16fbc3', 'Anmaetzin Muniz'),
  ('07850da4-1155-4209-afc8-da26818b8b0e', 'Karla Rivera'),
  ('0659786a-4fa5-4048-be4d-ddd8ee0209b9', 'Megan Ybarra'),
  ('71b699ef-03be-4bac-8d4e-71526c785f3a', 'Keri McGee'),
  ('5ecabbcc-605b-4591-9c52-ce7e46993062', 'Lizz Mejia'),
  ('92d6ba7d-9b1e-4233-80c3-f2a5ae178500', 'Rupender Nijjar'),
  ('6b97e1e8-f8a2-4cee-af31-53f4ce0a21b3', 'Mellissa Proctor'),
  ('fa3abf87-1761-4dad-883a-b891ce969369', 'Prisma Tello'),
  ('b772407e-dd27-46e9-9148-32b10bee96d2', 'Jennifer Tyson'),
  ('2cafc018-003a-4f1c-a296-6a1330df8ad8', 'Suzie Espinoza'),
  ('ed8cd726-1862-4bf7-a2e7-655e9eaf42d4', 'Jocelyn Guerrero'),
  ('c185b38e-e595-4139-9d44-004ad0f8b2f3', 'Nicole Brooke'),
  ('1a54c484-a10e-4f4a-822b-2835e15468b7', 'Yaneth Lopez'),
  ('2c57f3dc-c0ab-41f4-87c3-ad7f39e448ba', 'Jessica Mendonca'),
  ('0f1cde96-5c7d-4e6d-90c3-78618a2bc35e', 'Nicole Pasillas'),
  ('dc26ac4a-6ee0-4213-8484-e64fed2a9da1', 'Maria Padilla'),
  ('8fc0bba9-b627-4cd1-a846-0603dae14355', 'Samanta Torres'),
  ('9344c776-8fe5-4767-9ada-6454d2fbdcf9', 'Monique Velasco'),
  ('f6dcf0f0-872d-4e20-9afe-54ec0c32c5b5', 'Steven & Katie Gross'),
  ('330208de-598c-4634-88cb-6167be9f5013', 'Maria Reyes'),
  ('14cbe136-f1e6-4818-bd64-fcea2a6c6fa5', 'Samantha Vongdara'),
  ('0121ac21-9920-44ed-9542-e2ef4fb8b551', 'Jasmine Murguia'),
  ('287527ee-0dc8-4306-8f0b-3503556d7cad', 'Susan Lu'),
  ('e34b5789-4b34-4b69-b78a-343d3996d07b', 'Monica Cooper'),
  ('201dde58-ab2a-4369-bbeb-1b9c4c1b16b9', 'Guadalupe Olivares'),
  ('a5df4d98-31cc-4a1c-bfd6-5f4a74acf4b6', 'Christine King'),
  ('1fda37ea-e618-4abd-8f46-8c4a5259f636', 'Elyzabeth Michael'),
  ('15e71499-90e9-4323-9026-7a1abe8294d0', 'Helen Matute'),
  ('085bae00-eb12-4180-b940-aa698a7550f0', 'Maria Reyes'),
  ('a126d1f0-20d9-4611-af10-0a2598894bad', 'Glenda Salcedo'),
  ('6318e2c6-520b-4a32-bcd0-3124bd116b40', 'Maria Reyes'),
  ('1ca26bc6-c08c-404e-916b-846b10e34e3a', 'Adriana Lara'),
  ('53f82a5f-37f4-4f9a-91fa-a9332dab2b49', 'Angela Duron'),
  ('c0d60310-3f46-4ed5-ac38-5f798c312c0e', 'JACQUELINE VASQUEZ'),
  ('10f81f01-f491-4385-8af4-11b19d5d469b', 'Shyanne Gonsalves'),
  ('dd117e61-0c1b-47e5-b186-526212f17ea1', 'Rosa Gonzalez'),
  ('4f929959-52dc-4626-a304-30a5073e113c', 'MARTHA QUINTANA FELIX'),
  ('8225c9b8-ce3d-4a30-ac74-48221b63bf98', 'Leticia Ortega-Castillo'),
  ('dd6c5793-dde1-4fcc-97c8-94b1df7fb87a', 'Teresa Ponce'),
  ('1ebbe077-4d5c-4683-8467-f83921c9affd', 'Samantha Borba'),
  ('726cfd90-5a4c-4fa4-8cf5-2580284a4b0c', 'Corrina Pebria'),
  ('65e494b2-b463-4116-9fff-6de9cf58e628', 'Maria Rodriguez'),
  ('ee76b13e-30c0-4bf6-b412-a449c1029034', 'Jasmine Murguia'),
  ('8fb7766f-5d81-41c7-9a6b-7df3767448eb', 'Josie sedillo'),
  ('71a2b64a-604f-4be4-b8e7-46f47b92691d', 'Arcelia Manzano'),
  ('ecd413f3-ef38-4e59-99a8-05c3417e0802', 'Mayra Torres'),
  ('41ac5cb3-db6b-4baa-ac1e-01c7887401e9', 'Jessica Erwin'),
  ('5cfbb21c-aade-43c0-b5d0-d18eda453b6f', 'Twyla Menezes'),
  ('436ed7b7-4b9d-472b-bce2-e5baa029a215', 'jazmin matthews'),
  ('67512c4d-df05-49ac-9b6f-ccbd6cde4ad6', 'Hilary Baity'),
  ('09b776fc-c923-48ad-b3f1-a09b14a32c69', 'Rebeca Millena'),
  ('83678010-568b-4de6-a139-f835e9284bb7', 'Jaspreet Kahlon'),
  ('ec031a61-7e8e-414d-8117-55b833e32457', 'Anabel Hernandez'),
  ('bd89a1f5-0a13-4bb7-8c53-472a0aaf6195', 'Kayana Alvarado'),
  ('8ae2669d-bb2d-48da-a2dd-66ccb2c78e59', 'Kasey Weil'),
  ('86e2b95e-8a8e-40d5-88fb-d9969fcdcdba', 'Katherine castle'),
  ('49e4d7d5-deb9-4dca-86e8-12073bf845a3', 'Brenda malfavon'),
  ('289bccf0-54a2-41af-93f6-924992c95a40', 'Emma Rich'),
  ('b03d728f-a272-4d35-b4f1-e19a635a7cc6', 'Jorge Avalos'),
  ('a2c4676a-b406-463a-b47e-31f3fea40ef5', 'Cindy Moreno'),
  ('b48275d9-37f4-4d83-9459-41908b2c8fca', 'Kelly & Alec Altamirano'),
  ('5c66409a-1737-4781-ac3d-23463777f23f', 'Colleen Alvarez'),
  ('3ff47eff-a37f-4405-84f4-8504476a0ae4', 'Mariela Becerra'),
  ('821ad900-e7a3-40d9-a4bd-394632508598', 'Emanuel Garduno Vega'),
  ('939f1ab4-217a-4d3c-acf5-9608854a8579', 'Jeanette Moreno'),
  ('1e17fc09-dbea-4f67-b0a4-58ed66bca093', 'Crystal Ayala'),
  ('74a52b10-4dbc-4629-b580-9d6a0151b2dd', 'Erica'),
  ('6d427b26-1b5c-4954-8bbd-4437267b02f2', 'Scolly Sandoval'),
  ('09e2f714-91b2-48ab-b2a6-38ab4aa8e2c7', 'Samanta Torres'),
  ('66d2b475-3e8f-40ed-81ec-2f534bca021b', 'Shannon Polugar'),
  ('f17314c6-f4d9-4531-8471-54e2e390feb2', 'Berneese Deguzman'),
  ('e79e59fa-10e2-409b-9c0e-5456377ce1a3', 'Alejandra Tompkins'),
  ('004316e0-cddf-4fe7-b40d-1d8421dec828', 'Monica Cooper');

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
