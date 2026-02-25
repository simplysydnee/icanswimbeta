-- Chunk 2: Update 100 parent names from Airtable
-- Records 221 to 320 of 1616

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('2caca044-e167-4b50-a9c8-1b73cb3385d9', 'Angela Morales'),
  ('a25814f9-0a7d-45f2-9796-927e9d4a8ea4', 'Katie Miller'),
  ('066b73c2-fd36-4a69-b9fd-980632fa3760', 'Lucho Valenzuela'),
  ('070aa9eb-0588-4d6e-a6a7-46c526ce48ff', 'Alicia Pacheco-Canepa'),
  ('23eab8ac-f547-4b22-8173-d15994c64068', 'Alba Cagle'),
  ('b05285f7-f35d-4e39-9202-954fdb354e06', 'Fabiola Sawiki Prieto'),
  ('553e0041-5c41-4eb7-9e07-f363f952c0e3', 'Caroline'),
  ('58994052-eb50-40b9-a803-cd4a912c43b8', 'Alejandra Tompkins'),
  ('28648071-6cb6-4805-9e6a-ce7973d4de23', 'Tashia Thomas'),
  ('2c87cfe3-0d77-4c6b-9323-a1effc3855eb', 'Brittany Morgan'),
  ('7c78ebb5-0516-44b0-aefb-0d98317cf9c9', 'Ashlee Pacheco'),
  ('0c400374-d9ef-4e50-a99c-8fb7efdbf5d6', 'Guadalupe Espinoza'),
  ('b802fe57-6401-4ace-ab54-2bf1b7c96141', 'Makenzie Armer'),
  ('f5002c78-b649-4722-ba55-ab246c33d294', 'Andrea villagran'),
  ('a701ebd9-72d6-4a36-9914-32d680a717fc', 'Marissa Lopez'),
  ('95e304da-8e92-434f-a95e-f349cb67d594', 'Ruby Anguiano'),
  ('21ba85e2-4b81-4629-a6c4-b8399d190938', 'Silvia Vasquez'),
  ('ebfe6d42-dba8-4783-9e79-38aa00a5f884', 'Lorena Lizama'),
  ('19bd1afe-7b81-4b6a-8676-4b39682cf4c1', 'Alicia Alvarez'),
  ('9a846296-8fb7-4311-add9-8279be34db41', 'Saira DeLeon'),
  ('98f09e06-ea98-4c24-b1a4-59e9372c1fb0', 'Crystal George'),
  ('5da9e768-e484-476d-be6a-e3f7648b3907', 'Graciela Herrera'),
  ('46b153b2-d9bf-4a49-836d-c7a556b0c10b', 'Veronica Preciado'),
  ('f2c4d76c-9f73-4d94-99c9-a6f63fb72f12', 'Diane Quindoy'),
  ('cdf41861-edd0-4c72-bbf4-653700f88ad4', 'Gloria Barajas'),
  ('66d5e598-6184-466c-9910-4b1306a1b666', 'Maricela Calderon'),
  ('df866a4a-e81d-4741-bd3c-fc2eb452a467', 'Isela Becerra'),
  ('e9e47c8e-03b6-4f8d-9826-bcb385d5ad48', 'Petres Tamerzrihanabad'),
  ('d2493eec-b97a-47ad-ac6d-b102f3e28a16', 'Marisela Solis'),
  ('571f9cc5-7530-4041-b3c6-1f1794aae440', 'Johana Machain'),
  ('ac0a5e9a-b658-44ba-8993-65e914e90019', 'Lisbeth Garcia'),
  ('75ce4e37-073d-443e-9a14-7aa25917e95e', 'Brenda Cabrales'),
  ('82773f69-8ad0-4a6a-896f-0050b056871a', 'Maribel Figueroa Mora'),
  ('f7325b6d-1bc3-46db-8c85-a3441a9d43b4', 'Margaret Polous-Homa'),
  ('64e0c106-f064-4850-948a-da66d3e34e1e', 'Lizet Estrada'),
  ('177cde46-6965-4c2d-a998-fbc99a1da551', 'Marina Cabrera'),
  ('f41d43c8-0507-4106-b306-8125eadf5667', 'Netasha Sarmento'),
  ('88cb887c-1ec8-48f7-8b1a-9767df24cc81', 'Alejandra Garcia'),
  ('3b63e6da-a010-4def-aa69-57b7d0953bf4', 'Azucena Ojeda'),
  ('e05350c0-bee8-4845-8b5e-b7624c0a0446', 'Alma Tapia'),
  ('ff274ea5-7555-427f-a3a7-c42e492381a5', 'ADILENES NUNEZ'),
  ('b258e404-5b42-4fe5-8b55-19bcbdcd9eb2', 'Isabel Roth'),
  ('6b53dc63-9b15-4f81-9735-b056a125dd6f', 'Susan Lu'),
  ('4465ef0e-da41-49bb-842b-e7ec320881bc', 'Lisa Murphy'),
  ('00b9ef7c-a3a3-4d9c-9c17-68bdadea07f5', 'Tanya Hopkins'),
  ('e3aa2afc-7262-4080-afe0-4fd3f778aaae', 'Sara Baker'),
  ('4b2e2872-3ee2-4fc1-9f5e-eb4357ee6d00', 'Vanessa De Paz Ayala'),
  ('508548ba-2594-4464-bc0c-445d45a8406c', 'Somaly Jasso'),
  ('e9c2c58d-1286-4079-a215-9969c2f42a64', 'Stephanie Torrez'),
  ('0e542b88-4af6-4829-8cc4-4c41904535e2', 'Cristal Partida'),
  ('ee11339b-6784-4aa1-8368-3d624fd655ff', 'Veronica Garcia'),
  ('1b3c9b9e-56a1-4bd1-af1e-410950804fa1', 'Lucy Moreno'),
  ('d169dd66-c1cd-4e66-819f-01671340edaa', 'Cristal Partida'),
  ('0ba01f78-e977-4a87-9b48-4d42979e14d8', 'Raquel Ferry'),
  ('000656db-d6e3-409c-b691-9f6221d7a2bc', 'Vanessa Dart'),
  ('b0307b26-2ac1-49c8-8e4d-4790bf1b40f8', 'BRIANNA VALIENTE'),
  ('87d1aea7-5dbd-4604-a1c4-b0cf82fd8afd', 'Brenda Fernandez'),
  ('06c20776-e8bf-41bd-9c93-ae2ba55eb525', 'Jordan Steffen'),
  ('6485e119-3544-4379-a6c7-994d13553442', 'Araseli Castellanos'),
  ('6dcf0114-3bc9-44d1-9e79-2fbb6bcaf627', 'Emily Ramos'),
  ('49265473-fd17-4dba-9dca-cd09a74bb435', 'Richard Orwin'),
  ('2ed0f522-9ac7-47da-9bc5-cf150998119f', 'Fatima Bandilla Tapia'),
  ('09449517-a347-4a66-9019-068e26e6e08f', 'Kathina Calip'),
  ('99695e11-be55-4821-beff-730787e8564b', 'Briana Lastra'),
  ('2dbbc257-2f97-47ea-b402-63810c287386', 'Amanda Pease'),
  ('59193b9f-5cae-48d4-8822-27301b1c5eac', 'Harjinder Kaur'),
  ('ac99733e-0088-46d4-b5dc-2d3ef2a161b5', 'Pedro Oropeza II'),
  ('54931633-fc72-4e81-92d0-b74742246670', 'Stephanie Dixon'),
  ('80a76351-b5d6-4efb-859c-77d45fcb1230', 'Meredith Raven'),
  ('c4edac0c-a111-4eaf-b5c6-9aad69ca598e', 'Tiffany Simmer'),
  ('adb0edf8-bf57-4ff4-806c-a760d7d560ff', 'LAURA SOLORIO'),
  ('fa01be9f-aa1f-4766-bbbc-2d29236dd8c7', 'Maria Cervantez'),
  ('d7873f9a-91d1-4b09-b721-08b5638527fa', 'Raquel Ferry'),
  ('f84c8227-078a-4ee4-aaa4-c1bc0277068f', 'Victoria Viveros'),
  ('f974aa1f-3650-44c1-b2ba-33039653bf17', 'Kayla Ferreira'),
  ('512a9d4a-2bec-4a14-aabe-887968f20a57', 'Michelle Berry'),
  ('52a11e2c-1000-4ba6-aa30-0f61526809b6', 'Maira Castellanos'),
  ('c8bf2299-69d2-4777-9e6f-0056cd6652a3', 'Joyce Valencia'),
  ('02190073-c3db-4edb-b653-4e420f455d8b', 'Jennifer Wright'),
  ('2ba47c5e-c8a4-47bb-9e9f-024a063a086e', 'Maia Rosales'),
  ('3fbfbe87-07d5-4899-85d0-fa1fc86a8b03', 'Parke Davis'),
  ('5020a465-5420-4f27-873d-ed598a0e22d3', 'Maribel gutierrez'),
  ('93cd57db-21d5-4c63-9e0d-265b3967dc01', 'Claudia Ochoa'),
  ('485a7739-e65a-4a45-a216-f278465f1057', 'Roxana Rainone'),
  ('c6dfd539-a89a-4b75-8406-a904c053319d', 'Roxie Nunis'),
  ('dcd35cd1-471d-4718-b1da-10ea4607c834', 'Stacie Adams'),
  ('bd3405ff-f053-4c8e-90b2-a2794aa28263', 'Brandee Alfaro'),
  ('3fb5313a-7fdd-4ba5-a794-306fbdb70899', 'Estrella Andrade'),
  ('d0493bd9-ba4c-4b81-9479-4ae3c653dd94', 'FAVIOLA MURPHY'),
  ('8e959ef1-6bb3-4517-9d00-95bec9c7f2a4', 'Berenice Manzo'),
  ('8cf5cf31-07e6-42d0-af01-67d5ed87d8cd', 'Karina Escareno'),
  ('49049b04-2bbd-420c-bb0f-fc61b8015156', 'Kimberly Navarro'),
  ('52a2c46f-2a93-46e5-88e2-df81eadcefb1', 'Jessica Lacombe'),
  ('2e0bbc6a-bfe4-4c90-bb2f-038ebdb01dc6', 'Ana Escalante'),
  ('0ecc3aee-ad67-4b93-9a47-d6ca690d39ac', 'Kristi Ramos'),
  ('d502cf86-b899-437c-9de9-f9c544d7f15a', 'Bobbie Jo Chavez'),
  ('a7e8e2a0-00f9-415c-8daf-851c476c01dc', 'Sharandip Kaur'),
  ('cf27b9c4-42ee-4728-93ed-5e400d43a271', 'Yuliana Esquivel'),
  ('b1136169-ca26-4e7a-9a73-5b5e1222e981', 'Maria Oliveros'),
  ('874bf673-151d-458b-9894-b85d652d8317', 'CYNTHIA MCGINTY');

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
