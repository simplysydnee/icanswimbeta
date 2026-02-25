-- Chunk 15: Update 96 parent names from Airtable
-- Records 1521 to 1616 of 1616

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('9d249e77-efd7-4b21-8afa-9018ebaba7e3', 'CLAUDIA GARCIA'),
  ('feef01b3-8f85-42e0-a2dc-86504c173b3b', 'Maria Velasquez'),
  ('47630004-b268-4c93-87c4-49284bfa051d', 'Anne Fuentes'),
  ('eddd9287-ec5b-49fe-a1c7-272484c8c667', 'Carolina Mejia'),
  ('2e0eb42b-0a86-4c79-86fb-bbb6ec907014', 'America Ramirez'),
  ('9033cc73-215f-4fd0-899c-8754eed8fd08', 'Lizbeth Garibay'),
  ('8dc0199f-e220-4fec-a100-20abb60aecd5', 'Sylvia Jimenez'),
  ('6a1fad76-1cc2-4917-a710-fcebeb0386db', 'Mallory Page Clemens'),
  ('984bf6ab-aa98-4a30-9969-2d0b7d995edd', 'Ashanae Zeno'),
  ('67b93df9-066d-44a7-8f7c-0fae4631b77d', 'Renee Brown'),
  ('f2bfa976-f6b5-4000-8443-b12c8a928ca6', 'Mary Suarez'),
  ('2f5af3b3-5bcc-4e43-8dac-1dccf8274557', 'Maricela Barajas'),
  ('d0418b16-bb9a-491b-b38b-b9fa11ec05b4', 'David Rico'),
  ('fae4ad4a-72c8-45d8-95a8-6773bc3c5f9f', 'Felicity Stewart'),
  ('517f192c-61ac-4cfa-900a-739b727a4620', 'Serena Michael'),
  ('dccae125-c7bf-40f1-bcb7-297087f2c40d', 'ALEXIS GONZALES'),
  ('7899a187-3c7d-482e-8c6a-2d416bd400e1', 'HEATHER DOLZADELLI'),
  ('e7dead66-cdb4-4bda-8266-be6cd372b050', 'Hannah Freeman'),
  ('52a66e80-c8dd-49c1-8b40-1cb19302fdc9', 'Jessica Millonida'),
  ('eab6be2f-6527-434c-9a48-235819443ba3', 'Luisa Andrade'),
  ('58232fed-f863-4b69-9c69-5427a9841ff0', 'KATIE ADAMS'),
  ('41e41bfc-30e1-4ed0-afe1-578ac65a488a', 'Jessika Mccluskey'),
  ('f92c49ce-542a-4197-9d15-038a09fc3a57', 'Ashley Palacio'),
  ('d7006e79-cd79-41e7-a3a0-d71ea89033f8', 'Brielle Ciarlanti'),
  ('ffadd21b-7627-4e57-9272-ad105fe5158d', 'Leticia Moran-Hidalgo'),
  ('82c0d48a-4589-4535-8f8e-b7eff9dbb65b', 'Joanna Baal'),
  ('e0305c8b-9b5f-45fa-bd3d-780e671ce67f', 'Elizabeth beale'),
  ('37436c2f-a0b9-45df-8d67-cc567ea1f141', 'Elicia Almanza'),
  ('689af3c8-5234-4f5c-86ad-4973f088eb81', 'Jacqueline Vadillo'),
  ('0e333332-bab6-427c-9804-780bf8171570', 'Jacqueline Delgado'),
  ('7f63eb4a-f2af-4589-b237-7b4a67862970', 'Irais Piceno'),
  ('a670c01c-f63c-4a5d-88fc-5a2026065536', 'Mayra Pinon'),
  ('435d0900-7cc2-4592-a774-6ccf750b8a90', 'Kahlie Nash'),
  ('eebcfa2d-a404-4c42-b3aa-ca202565da95', 'MIRIAM GONZALEZ'),
  ('1844af57-559a-4c59-a013-fbb9cc84967a', 'Rebeka Lafond'),
  ('c9456b27-80c9-4d2f-ab7e-abd82f5ff66a', 'Rebecca Garcia'),
  ('591edd80-6938-46ac-9787-ddcfaa72b18d', 'Lopez'),
  ('dfc5455e-ee6d-45f3-9607-7ac0f107cb76', 'Maria Del Carmen Pena Villa'),
  ('ef4e8e7f-16cb-4642-9000-856906ded79d', 'Vanessa Sanchez'),
  ('49f5c1d4-63e5-4af1-b251-bbc49af07168', 'Guadalupe Cerro'),
  ('c1cac8be-8358-4693-ae4f-3ff4f6c4ad6a', 'Ziah Braizn'),
  ('af1c807e-3781-48b5-9d60-4b630b2c7a82', 'Ashley Williams'),
  ('c1659c5d-58d6-4668-b7bb-eba80aa1cea0', 'Rachel Hamilton'),
  ('6d800ef7-d72a-4e51-8cf7-4ab7cf2fd352', 'Monica Santamaria'),
  ('6c6519f7-e3c2-4502-b667-d6ca12afc1b2', 'Oralia Zurilgen'),
  ('7993069a-4e59-4b04-b911-bb9bda9c5caa', 'Jovina Mendoza'),
  ('b2ef5020-e452-4e1b-aaca-cd25081732f9', 'Rebekah Grimmett'),
  ('2cfc840e-da2b-49ee-89a5-d42e334c5c99', 'Jessica Escobedo'),
  ('efbe08a2-90da-44c0-b350-5b6688f6a2b0', 'ESHRAGE ABDULLA'),
  ('a6d929cb-8a57-4da9-bde6-9686004653d4', 'CECILIE HAVGAARD'),
  ('221e24fb-a6d4-429a-b47d-4588ec7d0155', 'Jazmin Mejia'),
  ('7864f106-ff56-4419-acc2-f267f55af15b', 'Juana Munoz'),
  ('842ea1b5-1a36-4c02-8d0b-6ed513f8b3e0', 'Emily De Leon'),
  ('f586ffaf-96cf-4a41-8df8-0944fa123015', 'Yasmin Becerra'),
  ('6a4174c0-684d-4567-8304-7c87cda729a2', 'Kristy Monschein'),
  ('d375f10d-a2b0-4a1a-bb2f-83f351e3347b', 'Sonia Saldivar'),
  ('f5f0012e-e25c-4362-ac0c-7575876b0871', 'Esther Korkis'),
  ('ee6e4c64-0ce7-4209-9d47-8711c848f560', 'Rameeza Ahmed'),
  ('4c19beb8-cbfe-4e89-8039-29edba6d3807', 'Jordanne Davis'),
  ('c7664f70-7138-47da-80b8-59fa4a2d99e2', 'Lesette Jimenez-Castro'),
  ('40dd8121-37a9-430b-8141-7c381ece8b32', 'Elizabeth Hayden'),
  ('595c8cc2-9acd-47c9-ad9e-37e0d48d5b91', 'Lauren Roseman'),
  ('1c1bd59c-a9ac-41cb-93c3-706c005b3e05', 'marie Park'),
  ('e66f5a9a-c812-42ab-bb2a-dfbe09677fd2', 'Yvonne Steglik'),
  ('63a28b0c-d981-4591-8c62-fe838e8ef179', 'Victoria Morales'),
  ('3c835843-ffbf-4c98-aabe-35d71e0f5e34', 'Lucy Guerrero'),
  ('724b917a-5f3b-4070-82a4-cd1228438f39', 'Kathy Arellano'),
  ('11a1ad09-e5ad-484e-a7cc-9b7feee2a84b', 'Julie Newton'),
  ('9cb5f9a2-a5c9-463b-be8e-67aef2c51675', 'Clarisa Schmidt'),
  ('752a2dca-8be3-4193-9c85-31e1e85e1733', 'Leighann Eldridge'),
  ('cbd32074-e79a-44c7-abae-8b232494cfe3', 'Myah Flores'),
  ('bacc0c6f-58a6-434a-8df1-03ea255077ad', 'Cheril Lane'),
  ('23a5e85a-c8e3-45bc-8be7-915839eb659d', 'Diasha McDonald'),
  ('42ed7f46-de7b-42af-80e4-4ab8acd4a369', 'Jovana Cervantez'),
  ('2c8ddb7b-e885-47b7-9e55-3a1a2f862c0e', 'Nicole Ruiz'),
  ('6dde10de-781e-49fd-aea1-0d5e1458c298', 'Yesenia Figone'),
  ('7db93da9-a6d5-4f6d-8a95-ceff257bff66', 'REBECA MONRROY'),
  ('5d399fb2-939d-453e-9ced-4d1d5982e892', 'Antonia Villarreal'),
  ('562a8e63-67f7-4d36-a4ed-25b42faa83e4', 'Patricia Espinoza'),
  ('296587f2-b16d-41aa-b5df-2805783bb45b', 'Tianna Williams'),
  ('f94dd372-492a-49c8-bc2c-3be19f54b93e', 'Kat Tucker'),
  ('ec636ade-aa8d-4138-b9ac-b38864213fde', 'Berenice Galvan'),
  ('8ae31d86-29a1-42c0-83c9-ce4f7d063358', 'Benita Zarate'),
  ('b5f1ec16-fe54-44fb-98d6-236155afe402', 'Andrea Castro'),
  ('87e164cc-4732-405a-b19c-f9e2812ddf52', 'Katie Lara'),
  ('94f8558a-2862-4afb-b257-7c9b177cb7e0', 'Maria Avalos'),
  ('77916a69-56df-45f2-b3b9-58cb3cda2d83', 'Holly Williams'),
  ('4a929cda-ba27-48e0-91be-3b862d09c76d', 'Cora Amezcua'),
  ('f16dc345-69b1-4b59-9bce-aa61afb14fec', 'Jocelyn Guerrero'),
  ('5ab42db3-7552-4fcc-948e-88579503a23d', 'Samantha Ormonde'),
  ('56248673-ac30-413a-85da-580e84b7f6df', 'Britany Pridmore'),
  ('7048a3b5-9720-44a0-84ed-669a133a50a4', 'Brenda García'),
  ('eb0e2656-5011-4286-ac52-a34414ce2806', 'Liana Bulger'),
  ('9cf6dcc8-0494-47fc-b5ed-3780a568aa3b', 'Brooklyn Holt'),
  ('1d1ce5ea-cf2b-4ce8-a945-b1d087fc2597', 'Maria Mora'),
  ('53e6d1c2-341a-42b8-9da7-5a523168cf93', 'Crystal Fletcher');

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
