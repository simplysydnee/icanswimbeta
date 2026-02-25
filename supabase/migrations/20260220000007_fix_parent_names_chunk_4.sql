-- Chunk 4: Update 100 parent names from Airtable
-- Records 421 to 520 of 1616

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('6f22376f-10ed-4c51-95cb-47c97f6b84bd', 'Norma Mora'),
  ('4b277161-2c39-4710-83ed-d97b9dbe72d8', 'Jessica Tafolla'),
  ('5ffada3c-4ca4-4270-8136-e9f832e32c78', 'TANWI PAUL'),
  ('99fd06e4-c107-4558-a495-1e0441db926a', 'ELIZABETH PIERCE'),
  ('ac9f6f16-7bfc-4bf6-b226-c3bc8e9814e1', 'Somaly Sun'),
  ('30dd5eb8-2db5-46a3-9411-0d01f01e41fe', 'Juliana Melgoza'),
  ('7d4eb06c-4833-4904-8ea0-1a867f1de4ed', 'Cynthia Carranza'),
  ('ea51def2-db38-4f7e-9194-ea8ee059cd9f', 'Irma García Espinoza'),
  ('ee55b035-1bd9-45b4-91cb-1fca13e4401f', 'karen'),
  ('f7369cec-d7e2-4eca-9f21-0c03a5146a37', 'Charline Howe'),
  ('2ba88630-52e0-4ddd-a5f9-c55e41e88823', 'LAISA VILLALELA'),
  ('fd91f9cd-8356-4cc3-b1e6-75280f0501e1', 'Ursula Garcia'),
  ('ae9c4af3-d30d-4f48-b7d2-f5a01a57641a', 'Ninawa Karko'),
  ('e6546b54-70fd-4b70-a24e-677ef1a2e1ed', 'Rubia Romero'),
  ('49f8ef3a-17a2-4612-9e84-38b389427fbf', 'Bojorquez'),
  ('3b6047fa-10b3-406f-8def-0a219486a1ce', 'Teodoro Castillo'),
  ('604b1bc1-d532-4f01-8a85-7ddd5e56e08a', 'Deisi Santizo'),
  ('3242f18a-38c3-4168-bf69-1fa4fe59c7d2', 'VERONICA AYALA'),
  ('73e0cabd-f4ce-41c2-846e-1b20c638af20', 'Kimberly Potter'),
  ('6ec50ad8-3f03-4e97-b321-2793aa94d24f', 'Brooke Shively'),
  ('6e79ae5c-9f4c-4e81-baec-b63290071c78', 'Ruth Lopez Garcia'),
  ('a153f24a-4f05-4f6d-bb7a-2484f182e38a', 'Guadalupe Beach'),
  ('9d1c0ad2-335d-4cab-9d70-10f081cb8a94', 'Kirsten Strand'),
  ('340d172b-527d-4ead-9117-c339bc5d631a', 'Sandra Torres'),
  ('a92c95f1-bb2f-424a-88ef-d3a0e4a8de94', 'Esther Hunt'),
  ('1692ce00-8b9d-4dcc-840b-494dc9243f35', 'Desiree Garcia'),
  ('882275ee-c97c-49df-8f70-9561405ae7ad', 'Frances Conradsen'),
  ('6a717d34-b85d-4bee-b0e8-52a33e404df1', 'Cristina Reyes'),
  ('68a4bcc2-2052-4b60-bfee-0178375cc788', 'Ofelia Gomez'),
  ('23b7746a-b1f3-454f-95e4-0a37883a85d5', 'MIRIAM AGUIRRE'),
  ('086ed879-0500-49db-869e-18d13416eb9c', 'Ashlee Cawein'),
  ('f46a2bd4-0820-4f5d-bc85-0fad778f42ec', 'MARIA LIZOLA'),
  ('e3c287ca-53b6-4043-8cb1-c27cbf93771a', 'Jeannie Noa'),
  ('cf03af66-b816-42cd-9df9-86a82a1455bd', 'Srey Keo'),
  ('63b354d8-79e7-482e-ba63-1b868a238179', 'Amber Wilder'),
  ('08db1a08-aca5-40fd-a51f-b9c450f8492f', 'Rosario Cordova'),
  ('f2273a23-3276-4755-b82e-a0d64f4a354f', 'Susie Espinoza'),
  ('1d4cf55f-ac1e-4276-8659-32c734284e08', 'Leslie Olide'),
  ('60e9c7b4-229b-418b-b82d-634f2bd2f68b', 'Chandavone Thepkaysone'),
  ('26377e2f-3699-4d3d-afd6-1889dbdb0d97', 'Kaylee Carter'),
  ('413f57fc-3229-48d0-b848-04d275922f87', 'Alondra Quintana'),
  ('79f3b9cf-2827-468e-be81-8b2f089f12b4', 'TARA TURNQUIST'),
  ('24c35364-c904-4ed3-a75a-0a4cfd1efda5', 'Senthil Balandam'),
  ('5431bfae-b8c1-4377-aa9f-6298cbe627df', 'Angelique Acosta'),
  ('0022d670-7514-4efd-9393-f899e7617552', 'Crystal Celano'),
  ('786e5f26-da66-4365-91f9-01bb4529395b', 'Lina Solano'),
  ('085596b7-5710-403c-b95a-28d44bd70ac4', 'Tamika Wright'),
  ('a62bee87-8c79-433d-84f7-725207002a49', 'May Ashak'),
  ('19fa45af-5a92-4b18-9bb6-eb1b0ecfacb1', 'Analleli Fuentes'),
  ('b8fdd6f4-0351-4755-b789-f82f03000d53', 'Dennis Stone'),
  ('6a591ec2-012e-482d-bb74-1348a678ef84', 'Maria Granados'),
  ('c5cea374-e648-4b55-84fc-f7c682ac1d4d', 'Caroline Gonzalez'),
  ('3166fafa-2b5b-4cff-a795-82b7b314be19', 'Erika Adams'),
  ('9c7377bc-2565-4a8a-bca0-a79b046c25aa', 'Yadira Perez'),
  ('08d74c84-2a2e-4f0c-a94c-d851f67be85a', 'Stephanie Luke'),
  ('03676f9c-87f3-4780-95aa-1a3deab6b4c2', 'Lucy Navas'),
  ('6934d623-c54c-4c09-a42e-b6a121bdb01e', 'SHEILA BLACKMAN'),
  ('642406aa-52a3-47e0-8839-bd6fc09c039c', 'Erica Castro'),
  ('5fb3e9ec-9630-4c5c-9be8-428a274a94f3', 'Maryam Yousef'),
  ('e734c527-a294-46df-be5c-4010c002a13b', 'Charlotte Edgerton'),
  ('9b960bbc-7ede-4208-a7e7-1eecfae83e88', 'Janett Ornelas Navarro'),
  ('5e4ea317-0f61-4362-8f19-b415ebe527c0', 'Larrandza Crump'),
  ('7e7328a4-4dae-42f4-a608-0a7d2f164cb1', 'Larrandza Crump'),
  ('abaaeacf-d36e-4603-ab6f-ad335ac149a7', 'VANESSA FLORES'),
  ('31b84447-6b1e-4b9f-99c1-8d1bd2e21327', 'Kevin Padden'),
  ('98839596-b83a-4632-8177-dda3ca563a29', 'Kianah Brown'),
  ('d1c95cf1-9863-4834-91fb-2ec7a661ba07', 'Nubia clarkson'),
  ('b066cb23-90d7-41fd-ba86-94e7b9c1bb85', 'Clarissa Guzman'),
  ('1863f3f9-fef1-4039-adde-016618d0605e', 'Beverlyn Crisanto'),
  ('bca960a3-1303-4dc8-a8b6-ea69bec33ca2', 'Daniela Suarez Paz'),
  ('d001c63c-4d5a-4bc0-9988-4161645c4b69', 'Daniel Frederick'),
  ('ccc19289-12ae-424f-b288-979d249bbf40', 'SABRINA HERNANDEZ'),
  ('b69961c5-1818-48f8-9aa1-0fe73e93664c', 'Yareri Moreno'),
  ('91299902-780b-462d-986f-20bc5b37bdd3', 'Mayra Fuentes'),
  ('92af55e0-925d-4176-9969-74fc9590c263', 'Georgeann Speth'),
  ('e3941ca8-8244-4c5c-be0b-d9b9570a2148', 'Amy Westin'),
  ('12abdfd3-2214-4e87-a88e-a0e25758d269', 'Krista Raper'),
  ('7c46d7d5-8e1a-495d-83a6-37fa4e3f7f25', 'Gladis Barajas'),
  ('ef9c5c37-f04d-4ac0-a8f5-7b8d33f45902', 'Adriana Gil'),
  ('c93ab903-6d85-4fc9-9676-6266d1feb5a4', 'Beatriz Vega'),
  ('bb2f6d1f-f96e-40fd-b285-98608639c27a', 'Melissa Torres'),
  ('36c75dc5-1b6b-4131-a307-0ea60d32d940', 'TABITHA REYES'),
  ('2cf62783-c6ae-4e96-af48-dcd31a9486fc', 'Lourdes Rosario'),
  ('5e879014-95f9-45a8-9e62-7efe4402ec43', 'ASHLEY GREENE MALONE & PATRIC MALONE'),
  ('dd5f49ff-7e2c-4d6f-a0cd-e99b3b5a2270', 'Angel Anderson'),
  ('4e64e663-728d-4a5d-a3e7-2928fbee701d', 'Alma García'),
  ('70c95aaa-2b26-4b42-a52a-6731630e4d79', 'Emily Ruiz'),
  ('4d7f760e-7dcb-4ad8-9ee5-e97666694506', 'Esmeralda Lemus'),
  ('aae1e9a2-da13-404c-872c-1b22d7c7e9a1', 'Mayra Corona'),
  ('08ab7d7d-f3ac-4053-bb0a-0aacbf9ada65', 'Taylor Flint'),
  ('a20aa618-1136-4123-94b2-d63945fee050', 'Jenny Khut'),
  ('88d920cf-cf0b-427d-9c6f-9a07dcda665d', 'GUADALUPE CARDENAS'),
  ('8fcee47d-0001-49d0-873d-1abab0e559f6', 'Guadalupe Cardenas'),
  ('55debc63-ef82-4976-9598-952491768d6f', 'Miriah Vallejo'),
  ('65f30813-818c-4ee8-8df6-a4156e94bae8', 'Shalmae Ferdin'),
  ('8d63df3d-bdbb-4138-b557-90f465f4d296', 'Dormae King'),
  ('11346db2-7d6a-47c6-99eb-2b7eff70a8ec', 'spogmay betanai'),
  ('2aeee0a3-393c-41ce-8ffe-0476ee5f49a4', 'Angel Andersen'),
  ('d35b7a64-968f-4c3b-9808-e782d2ed56f8', 'Todd Pham'),
  ('6dba54ad-915b-4244-9b2e-f3df05fe59ac', 'Nancy Pineda');

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
