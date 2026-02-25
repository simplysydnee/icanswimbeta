-- Batch 11: Update 100 parent names from Airtable

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('7d5c621c-8fdd-438b-b759-1873c23f9caa', 'Esperanza Acevedo'),
  ('ca45d94c-67b9-40e3-8061-c5d71a46bea7', 'Gemelia White'),
  ('56539084-6e8a-44eb-8409-d141cf47536b', 'Guadalupe Maria Sandoval'),
  ('0618d14d-682e-4423-816c-ee87aaa99494', 'Michael Perales'),
  ('4dcd214b-af5d-45ca-bb1b-9b8ba5c042ce', 'Jazmin Montoya'),
  ('97730717-b590-4b7a-8355-586331b7362c', 'Marisol Vazquez'),
  ('ad7d0c4c-6c21-4358-9c12-cac76c49f64c', 'Rachel Madrigal'),
  ('fef1303b-998d-467e-85a4-08f4e7d41df1', 'Megan Herrera'),
  ('c8c67474-82fe-4aef-9cf1-c68ddc96a2fd', 'ANA ARGUETA'),
  ('4ab821bb-4088-48e8-b7e3-63df18977d9d', 'MARGARITA TINOCO'),
  ('5459cb7f-5650-4ca6-9e70-75721d6e1ca6', 'Karem Cajero'),
  ('0141ce44-1833-4fe1-b91e-d17a07cf7692', 'Mayra Heredia'),
  ('e8e9d66a-0efc-4076-8b6c-daade4be1be2', 'Olivia Hernandez'),
  ('fea78f5e-f092-4cc4-a454-609dc3360a4b', 'Maria Corona'),
  ('1e06bfe8-3295-4a1d-b0e7-de8e22db76b4', 'Leonardo Cordero'),
  ('75b467b5-e8d5-4c81-b589-ecd9d8d7876c', 'Romelia Zendejas'),
  ('b3fbc516-0362-4b1f-8a8f-6f02b4c38d86', 'Belem Lozano'),
  ('32b62599-567a-4be2-82ea-a780aea48cb8', 'Rebeca Muneton'),
  ('f5fdc85d-971d-407c-99c4-bc706d731928', 'Maria Hernandez'),
  ('f6c675c5-a3ca-41e9-b05f-4748368cc098', 'Gutierrez'),
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
  ('2de4ba3f-35b2-492d-bfcf-08dcbdaeaaf9', 'Alejandra Lopez');

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
