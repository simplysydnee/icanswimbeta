-- Chunk 6: Update 100 parent names from Airtable
-- Records 621 to 720 of 1616

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('e3813d20-9a41-4608-9431-f3072e3bbd11', 'Silva Kachadorian'),
  ('0edf95fc-24f9-4790-ab45-8c7db5fcdb0f', 'Jessica "monique" Melena'),
  ('1a777af0-dde3-4f6a-85c4-9caecf92fc42', 'Caley Campos'),
  ('4b27e7bd-8746-42bf-ad57-c3e8eb0150e0', 'VANESSA VILLALVA'),
  ('1f4bc45d-cb91-47ff-81c5-f1bd05c4adf4', 'Danilo Parra'),
  ('b0cd0a14-4cfd-44ad-8d0f-a058d9820f3f', 'Ashley Hinshaw'),
  ('4347d49e-c73e-4903-a507-a2e4ee236520', 'Krista Daniels'),
  ('7b5f14f5-beba-4f91-a4bf-4993b7115b97', 'Karissa Whitlow'),
  ('fb0697cc-910c-4b1c-8165-eded6bfcbabc', 'Jaqueline Paiz Rivera'),
  ('a4aa81d3-ada1-4791-b320-63c3c757690c', 'Herlinda Covarrubias'),
  ('af990b7d-5762-4915-961d-dbbbe7303238', 'Megan Stevens'),
  ('41b7a8c4-541b-48f4-b018-6f5557c679ba', 'Angela Paige'),
  ('b5762c31-a29d-4526-9f74-f382241c8d80', 'Heaven Velazquez'),
  ('cafdb692-5377-46d8-8061-7482a39c1cd1', 'Elza Shaikh'),
  ('8e1a78bb-bdac-469c-973d-3a43e7b40c2c', 'Ashley Machado'),
  ('63b8a2af-6191-43e0-9775-29a2c5b6a8be', 'Sonia Asmar'),
  ('7a433065-fce5-4486-957b-02316e3cd102', 'Ashley Machado'),
  ('417c721a-7666-41f4-89c2-be7b6b3a3abe', 'Sonia Loya'),
  ('3cbec5a5-4a33-4ed3-a4dd-3b7958400f08', 'ELIZABETH PARADA'),
  ('2d3fed03-c9e0-4fee-8484-0bf94f24237f', 'Angelica Ortiz'),
  ('672f827e-8c1b-47ee-ad0d-b3c32d50b330', 'Rosa Hernandez'),
  ('0ac813c3-1f6f-4d2a-ace5-f1f289a17be5', 'Angela ward'),
  ('d8fa20da-1f86-4108-a334-b6aa2bf5927c', 'Angela ward'),
  ('8a9cb268-f08d-4222-ae88-93627312c447', 'Amanda Albritton'),
  ('c92ed0f6-0b55-4501-a5d7-db56785311d5', 'Sandra Barajas'),
  ('00319475-59c1-479f-9fc6-68a8ea3ff6bd', 'Racine and Michael Bogdanich'),
  ('e788f4cb-15ed-4413-b39c-554e88cd67a0', 'Ashley Chavez'),
  ('0ebffe72-455d-42fd-9412-ec0ced410be7', 'Laura Barreto'),
  ('b3faed8e-48cd-4dce-b1db-4dd04bf540c0', 'VERONICA VALENZUELA'),
  ('75af8a68-e16d-4727-b04b-a3c404d55455', 'SARVJEET NAHAL'),
  ('cf61e6aa-f153-4bdc-928c-8896b27c1fd3', 'Elsie Lazar'),
  ('63d1c795-6f28-427a-ba09-547cb55f9449', 'Nicole Peterson'),
  ('36d15405-6c40-4523-988a-1739a1524200', 'Nina Pfeiffer'),
  ('9f9dc913-9fdd-402d-9a1d-0707d1270014', 'Norma Gonzalez'),
  ('d64ed882-7ed0-4667-bf3f-3aa1b8eb56a0', 'Jeanette Farias'),
  ('2b1d411a-5a18-45bd-a347-cb9287f8d248', 'Kimberly Soto'),
  ('ba37f500-a026-4799-aaa4-a323e17b0c17', 'Reynalda Zapien'),
  ('9449f963-e598-4cbb-9b56-ac86d366a693', 'Adrienne Mccloud'),
  ('60f47e60-1d39-4a7a-a909-6c69ffc90dda', 'Silva Garcia'),
  ('f48c6ab5-be5c-4adc-b8f0-7c06dd43784e', 'Rosa Hernandez'),
  ('feea214f-8501-4f3c-b78c-818b573e9f1e', 'Wayne York'),
  ('6cfb1755-e471-4514-a1d6-932f193b1209', 'Brittany Wright'),
  ('8e3a6b5a-e5cb-4753-bcb6-3caae430db62', 'Amanda Albritton'),
  ('db3dd561-fa67-4007-a775-289b1a3dbb34', 'Jennifer Leavens'),
  ('c23fd223-f444-4b12-8a34-ea82a16bcc1f', 'Jessica Whiteman'),
  ('d9a2586c-4fd9-4c9e-b2c3-d5efaa137a3a', 'Linda Rose'),
  ('dc8f5f71-ea02-4ccb-ba80-5f45fffdfe05', 'Pharami Cham-Nguyen'),
  ('dc09720e-f470-41cc-a246-0ebd651c7435', 'Kristine Kiss'),
  ('770cd1ca-12d4-4d16-b553-9b506a78a0f2', 'Rosa Ramirez'),
  ('d4a5e6ea-921d-4bd6-88c0-bf145e6147fe', 'Bertha Ibarra'),
  ('67b47519-8a03-43dd-b971-e615a462befc', 'Ang Ieng'),
  ('2615946a-b11a-4405-9899-1f0d5ebfe3f6', 'Alyssa Willett'),
  ('e55e8b78-7de5-4a13-a62b-cb7df85d0176', 'Von-ne-sha Haynes'),
  ('4ac76e2a-2311-44c7-a9f1-5e53e79f0e80', 'Kristina Gutierrez'),
  ('285fa603-dee2-46cf-80ef-02ab64be4aca', 'Amanda Smith'),
  ('b6a92c8f-2e80-4826-a3a9-ccb50685b75d', 'Selena Sandoval'),
  ('effb642e-daa0-4a08-b523-d4806c2f8c07', 'Amayrany calles'),
  ('097b02f6-8291-48a8-8911-9d917fb709bb', 'Maritza Bejinez'),
  ('56a51713-9df9-4a7b-af79-5bc8716e1863', 'Mckayla'),
  ('4a4bea45-e755-462a-8fbc-e70211c402f0', 'Pamela Etchegoyen'),
  ('262ae3fe-1616-4734-a4f9-6723c60375ac', 'Karla Garcia'),
  ('317d4482-6887-438a-98fb-352c93abdac7', 'Matthew'),
  ('7b289364-b4b8-4246-abea-4aad02a1cfe0', 'Sylvia McLelland'),
  ('7399aad3-3122-408c-aaf7-d1a0070af1dc', 'Amy Bullock'),
  ('65d51d7e-ca32-4050-9b42-cf5bd9d8a5f9', 'Rishika Nendla'),
  ('94ed4846-84f9-4ba8-8c56-7decee9318a3', 'DARIUS BAEZ MOYET'),
  ('bbcac987-a225-440f-b3f3-e4d01832bd7a', 'Rebecca Cortez'),
  ('fd131a40-d362-476a-906e-8ef69522f9ce', 'Alicia Alvarez'),
  ('9036a1b6-db68-4087-8369-8aed83d465dd', 'Tyra Vega'),
  ('238d4247-efc5-47c4-b1b9-ad8d124ce9dc', 'MADISON PIMENTEL'),
  ('39da5cb6-a02f-4b27-965a-c24f69fb867a', 'Maxine Hernandez'),
  ('b331b849-c177-4540-8400-33a0ebe7c53d', 'Sasha Madrigal'),
  ('35d5a1cb-fdfd-4b61-abf6-4dac451dc9f8', 'Annie Ieng'),
  ('f137db0a-f490-472a-b321-8c171c37f797', 'Michelle Diego'),
  ('e8e11f09-37e7-4f6d-be98-547dfda877d5', 'Jacqueline Noguez'),
  ('aaedbfa2-9323-4cec-accb-b93e07b717b8', 'Lizette Velazco'),
  ('d62c03d0-efd5-4216-aceb-b0754ab2327a', 'CAROLINA CARVAJAL'),
  ('75e47192-fcd4-4ad8-a493-89bf9746abb4', 'Christy Rhodes'),
  ('1d4a5c29-6947-4289-8c42-7ca059d24a0e', 'MICHELLE GARCIA'),
  ('5f2de5f3-7222-4994-83c0-b40b896fde02', 'Margarita Zamora Sanchez'),
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
  ('a7ef7567-6d85-4db6-b0b9-31dfb783acb5', 'Wendy Bradley');

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
