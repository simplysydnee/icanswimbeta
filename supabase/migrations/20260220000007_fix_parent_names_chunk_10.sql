-- Chunk 10: Update 100 parent names from Airtable
-- Records 1021 to 1120 of 1616

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('67546d98-74a5-4e0f-8a3b-e67ae1f9bc78', 'Alondra Valdovinos'),
  ('50e38d1c-39a4-4560-b3e0-a5a4c166b2e8', 'Alma Perez'),
  ('bdec319c-a770-4b77-bd81-8a9fe572d74c', 'Emoni Jones'),
  ('60080f1b-c13c-4d3a-af5d-761f819ea1c9', 'Monica Lujan'),
  ('fc5782bb-5ccd-4f20-b271-0849e13fb878', 'Shayna Clark'),
  ('fcd9bfde-88a2-4cd8-bdb9-b4711699ae60', 'Maria Betancourt'),
  ('730ba908-4e6c-49b7-a37a-0e68d5b7fb43', 'Elizabeth Ortiz'),
  ('22b58761-a3ec-4cd7-af41-d94dfa943c4d', 'Yolanda Hernandez'),
  ('e1bd56aa-3202-4da3-9e9f-d5439088c39d', 'Nancie Chavez'),
  ('85eae09b-d74b-4aa6-9e6c-bbe48d0e5ad3', 'Martha Valdespino'),
  ('31470b4f-7b11-4086-b6e5-bce27fc651b8', 'Dejanay Mercer'),
  ('28f3045b-d638-4f04-9e24-43e97db72801', 'Marilyn Quintero'),
  ('f932b3e3-0994-4d60-8d15-fa7a345747b3', 'Ofelia Gonzalez'),
  ('2ecb55ac-6079-4d6c-9da5-6592ef85b2e2', 'Christine Schickedanz'),
  ('9152465b-03b9-4ac8-b24d-b99c5822e4ee', 'Ariana Cortes'),
  ('af30c783-5ae7-4261-8345-e27692ac8e46', 'Jennifer Thach'),
  ('21f5780b-9f7a-4e79-bc5e-521dc001c1f9', 'JENIFER STONE'),
  ('b2cb2080-245d-47b2-bc7c-49ef66a9c0c3', 'Alejandra Lugardo'),
  ('3dae23dc-ae95-465a-b7c8-e15fc4449836', 'Britani Nydahl'),
  ('369ce7ef-72a9-4d67-a96d-9f5f4108a1bb', 'Cailagh Elliott'),
  ('a898e60c-555d-4563-a96f-59499f7547a1', 'Marlen Marquez'),
  ('1bea3284-c8fe-4f64-9a69-62645df3019f', 'Valeria Guerrero'),
  ('d55c18bc-6539-4129-8c78-70c295e6efb6', 'Wendy Alcala'),
  ('f73a443c-d0c4-4a63-96da-5afae15617d3', 'ALYSSA ELLIOTT'),
  ('eac34182-6d04-4838-9b67-a9f08394c39a', 'Guadalupe Barragan'),
  ('b1f2b07b-1465-41ac-a0e7-3e42086f459e', 'Davinder Kaur'),
  ('1598fcce-0577-4304-9fd2-17fc56f2358a', 'Leighann Eldridge'),
  ('3c8ca8d3-57dc-42d1-b9d7-2f710e52ff0c', 'Gina Anaya'),
  ('c94e4175-ac95-4c12-a92f-0f125feb5c2b', 'Julie Rosas'),
  ('dec4432b-c0f4-41ac-ae12-f7760dc6c651', 'Jennifer'),
  ('92c8505a-3a4b-4306-ac89-f701d8fc6265', 'Brenda Hernandez'),
  ('c40b4620-235e-446f-8b14-f4f35506c595', 'Alyssa Morales'),
  ('e8289a98-30bc-4290-ad21-6b3db1a01299', 'Amanda Miller'),
  ('e2b4bf94-46db-4931-bca1-4d62fe9cb582', 'Nora Gonzalez Martinez'),
  ('4bd0f467-7d6c-4f6f-9780-e49462c6b33b', 'anjelica locke'),
  ('3ada0a5d-6f2c-4629-8667-708847073ef1', 'Selene Mendoza'),
  ('944fd2d7-f9c8-4857-9056-4ceb84e50c23', 'Theavy Thaing'),
  ('b7c9ef72-1548-491e-95a2-4ffc3222cd6e', 'Silvia Valverde'),
  ('d4d58627-5169-4f96-97ac-ab59a412b87c', 'Yesenia Cambron'),
  ('335434d0-bb2a-4906-ad5f-61fd641e3aec', 'Aracely Ramirez'),
  ('de88c556-8e35-4193-8451-a3dca44b7291', 'Maria Yepez Sierra'),
  ('320039b7-28d7-4bdc-b0c8-d4fd95c34501', 'Angelica Mejia'),
  ('59ddd257-2b2f-4343-8cdc-347f96633956', 'Virginia Garcia'),
  ('07d24ce6-5208-41d3-a803-53806ab1e07e', 'Annalee White'),
  ('2962e32f-2b7e-4c5a-80d3-e2eea5680c4d', 'JAHAIRA GALLEGOS'),
  ('d78af3c7-dbdb-44b3-8a5d-bdda65aa87c8', 'Kristina Vigil'),
  ('41fe4838-4f93-4bfc-8781-9908cff177fe', 'Melissa Gonzales'),
  ('d454e3dc-1f1d-44e3-b984-4a03a39bb288', 'Zenaida Ledezma'),
  ('93df2037-bc7e-48bf-a141-126cf13e71f0', 'Alejandra Lugardo Puerta'),
  ('3c41fc91-24f2-4c53-b2b5-e0615258aa7b', 'Anna Valencia'),
  ('91b1585f-d9f5-49fd-92ac-83bab42b500c', 'Soraida Escobar'),
  ('797c223e-3650-4087-b2ef-2f8cb491d33b', 'ESMERALDA SANDOVAL'),
  ('a02dc82a-87cc-4310-abea-bb54ad97df5a', 'Carol Garcia'),
  ('0e4a0a1f-5d82-45d7-bd47-ea8c52a4c759', 'Maribel Torres-Cisneros'),
  ('bafdfa97-af0f-4924-91ec-9cab7cc8deeb', 'Denise Moseley'),
  ('22486445-94cf-4777-9ac6-406a4be0f60b', 'Ruth Salinas'),
  ('2ac170f1-ce7f-40a8-b9e5-4832f63f7097', 'Bertha Sandoval'),
  ('612a7145-469e-4376-8a8c-deb8b8127676', 'Karla Garcia'),
  ('c22fa14d-cd85-454b-adaa-a11a49579a2a', 'Linda Gomez'),
  ('d0a6209a-cec9-4d36-a907-fb86da588975', 'ELENA BAUTISTA'),
  ('5e1002ad-bc80-46c5-bdfa-c433037f4428', 'LIPZY SOBALVARRO'),
  ('0c81db61-f03c-4a2e-87da-8016e475b5fb', 'Jessica Alba'),
  ('14444221-ddfb-42c4-b36c-fc0ebc9a05e1', 'Alejandra Manduijano'),
  ('67f44a44-6fad-4ea4-aba8-dd5c7ae41aba', 'Guadalupe Arteaga'),
  ('79deb6b8-a3d0-4fd4-a561-89ef41937821', 'Maria Torres'),
  ('dadcca85-eee4-45d9-8832-7b74f52fd0ee', 'Amber Guzman'),
  ('6f1a8e85-5c85-43c3-a0e5-7d30a69ac142', 'Juliana Rosas'),
  ('f86e7f83-4fba-4a0d-b8ad-580f06aa4189', 'Paula Rivera'),
  ('12119ff5-50d0-424e-83ea-00dc62e9e825', 'Jocelyn Carrillo'),
  ('740c426f-c486-41f2-b2b9-04263ab43d42', 'Cathryna Acosta'),
  ('42982baa-97cd-4fab-a3c2-d72072307d25', 'Karen maradiaga'),
  ('727f23cb-16fa-4b51-bec9-f6208a588a9d', 'Tina Valenzuela'),
  ('ae5521c9-cd53-43fb-86a4-d604e2514ac4', 'Antonia Lopez Guzman'),
  ('8e35fb7f-5ae7-42d7-9593-4f1ea948d8aa', 'Blanca Ramirez'),
  ('2bda331a-94cf-4a64-82e4-efe3148d1db9', 'Delilah De La Cruz'),
  ('f2d7c66d-77fe-49d4-96fc-ecc37524dfd2', 'HILDE QUINTERO'),
  ('7f507e5a-b88a-42ca-8613-15757e7f5a33', 'Adamaris Gallardo'),
  ('3b0b773c-371e-43a6-afa8-54c7f77ca9d9', 'HIRAYS BUSTOS-RAMIREZ'),
  ('9779f77c-fb7d-47f6-ace5-4154f6177a8d', 'Nora Zamudio'),
  ('2de4ba3f-35b2-492d-bfcf-08dcbdaeaaf9', 'Alejandra Lopez'),
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
  ('be7720fa-864b-41d8-abdd-3dc54de452e6', 'Jewelya Jones');

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
