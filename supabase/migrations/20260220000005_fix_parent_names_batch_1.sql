-- Batch 1: Update 100 parent names from Airtable

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('87cd06fc-e529-49f1-a337-f2fb45c7cb0c', 'Michelle Ramirez-Valenzuela'),
  ('5a9c87f0-615c-4855-88ec-9397e2d603e9', 'Charice Fourre'),
  ('94a0169a-d41f-448e-ba70-0c7167193724', 'MICHAEL DISHLER'),
  ('5101f144-e7d0-49b7-9ca5-da6e7ff6bd22', 'Gina Tostado'),
  ('b57b0e8c-4b0a-46ac-86a1-8fc15213f8d3', 'VANIA AQUINO'),
  ('bc97f1db-cf74-496c-b6d9-63beb1c5738a', 'Nereida Hernandez'),
  ('2feb9467-477f-4fdd-8627-3605afe138d7', 'AMY PATTERSON'),
  ('3d195e8f-6eec-404f-a5ff-ae4098eb9467', 'Adrienne Rivera'),
  ('b0f3a85b-ecde-42dd-97ca-d88111b74477', 'Brianna Siarot'),
  ('c0b9b637-cf57-4f90-8d12-0fc946301e2a', 'Elizabeth Gracian'),
  ('eb3dd792-d24d-4e30-a8d8-4eefca9065da', 'Michelle Escamilla'),
  ('6236bae4-9be8-472f-ba18-1ddd5eb633db', 'Monica Fernandez'),
  ('e2e24d07-059b-4a20-8ef3-98955d3bb69f', 'Monica Fernandez'),
  ('74bd9a5b-57ea-4dc2-9a90-6305f04360d2', 'NANCY HERNANDEZ'),
  ('9c78d301-d97a-413a-b750-c091a820d908', 'Britany Hopkins'),
  ('3385b3cb-2a97-42f0-b200-69230ccb2ffa', 'Katriona Fortuna'),
  ('91e518f6-6709-4d1d-8471-4b00697ff5d4', 'Dawnette Galicia'),
  ('6f328532-9130-40a7-a3a7-53ecf0122bfe', 'Heather Serin'),
  ('95e364ee-aed8-4939-8533-fa0508d9e7f0', 'Samantha Mello'),
  ('31d7ee3d-90da-4222-88dd-7fd9a7e16633', 'Sara Sopko'),
  ('dbea8f2b-87af-4644-93c5-bdd536b54e10', 'Juana Munoz'),
  ('0ada056b-872b-4e88-899f-18965fca704c', 'Sara Sopko'),
  ('09ae0ed2-1634-41e0-9a52-029049264b31', 'Colleen Billups'),
  ('4fc057d7-ff13-44bf-99f3-a13f0e90d003', 'Crystal Luevano'),
  ('6c9fd212-b2c7-4c55-a458-0a5abe6e73ba', 'Lucero Rodriguez'),
  ('09082635-6cb2-4038-bff8-b2b89574d37f', 'Ayuba Seidu'),
  ('e72de865-e6b9-4cbb-93ae-ad24f0d422aa', 'Griselda Calderon'),
  ('180efb40-09c5-4e97-8655-f14e60ce98e7', 'Anthony Lopez'),
  ('70e99372-4816-416c-91bf-e90d5e05bedf', 'Shalandus Carter'),
  ('e282618a-bcd5-4034-90bb-d9afe1270de2', 'Sarah Orvis'),
  ('d54e840f-8665-41c8-a052-1bedca22bb89', 'Mayra Rodriguez'),
  ('af86c9e1-a57f-4845-b41a-6d45767f70aa', 'Katelyn Ochoa'),
  ('311ad09c-9e95-4c6f-9259-80825b12a174', 'GUADALUPE OLIVARES YEPEZ'),
  ('9bb8bc68-69a2-421e-ae13-7b19cb48541e', 'Lisbeth fajardo'),
  ('963022f4-3e9c-484b-856b-2b3d072d18a8', 'Alondra Quintana'),
  ('c5cdfe88-765f-40a4-9169-9175996d9d20', 'Camille Gutierrez'),
  ('3abf3912-06dc-49b5-bf53-fa20439b8561', 'JENNIFER GRAHAM ROMO'),
  ('61649a1a-ee27-41ae-942b-0ff9a1671bde', 'Melani Esquer'),
  ('c55cb986-a2ae-4b85-af56-1799d4e4e3f7', 'Aime Arellano'),
  ('e3363b77-e945-4ae5-9f77-4f4c2f21c48c', 'NORMA YCIANO'),
  ('1764eba8-0395-45c6-a53e-943078d2a383', 'Joyce Valencia'),
  ('0210431c-5ca3-4973-bde7-01c65387c2ae', 'Janet Diaz'),
  ('ad33eebd-c399-47ea-813c-de5625ee2719', 'Maria Gomez'),
  ('3cf80149-450a-4d6a-8392-b554439a5e70', 'Amy Jones'),
  ('7f11f3f4-f904-462c-a653-65a41b2de1da', 'Maria sedano'),
  ('b437bc70-4a4c-4fe2-9057-c8afa6bebe4f', 'Angela Gutierrez'),
  ('1c6f7a12-7f16-42fd-82e7-80e8948518cc', 'Josefina Rodriguez'),
  ('e0e996de-fa5f-401e-aa01-dfbe7a04d54a', 'Marianet Ortiz'),
  ('21207380-df09-4d19-931c-d5918164cbb1', 'Alexandra Alvarado'),
  ('b770dd5a-3737-42dd-8cf3-733e55fe754a', 'Amanda Kang'),
  ('c81f2f56-c1ff-4b5e-811d-f871153b1c25', 'Brianna Woolen'),
  ('ad98ec0e-4ca9-4663-9e1a-e5d1f180d433', 'Ruby Harding'),
  ('a78c9d1c-ac52-4b41-815c-154801c30aa7', 'YVONNE DELEON'),
  ('79184e19-1096-43fc-9493-129707963368', 'MARIA ALEJANDRA DIAZ'),
  ('1e53fce4-2d78-4ffa-9e3d-ad6d2bdcfa1f', 'Katelyn Ochoa'),
  ('a09b0033-adbd-427a-8c29-e0c2a9d289f1', 'Reyna Morales'),
  ('3ee843f3-9595-4fa7-9953-bada71827f42', 'Prachi Tripathi'),
  ('2fdc8ccb-0013-41cd-abf7-4f84ff0a0c11', 'LIESHA DIAZ'),
  ('93067a42-1d65-4ae6-a400-5d12c1e88408', 'Nancy Michel'),
  ('d4482d50-39fe-4e06-9a01-d309263d6d9b', 'Lizet Estrada'),
  ('426bc44b-e74b-49ad-ab8b-6259e8f0b92b', 'Araseli Castellanos'),
  ('c1b46790-8f78-40bc-b82a-d7c01131346d', 'Liliana Sanchez'),
  ('6edab5b5-dc05-4d5d-825d-77c576457ddd', 'Marilyn Alcantara'),
  ('1d07fc40-51bc-458f-bdf1-c1f117be3fe0', 'Sanpreet Kaur'),
  ('9b7e464a-f78d-4e2f-8beb-aebde9f8de55', 'Bertha Arellano'),
  ('07615bca-b043-4338-948b-5ecf7dcf1da2', 'ANGELA MAYS'),
  ('4ffd07a4-bb53-4a0f-b2e4-6eba1b60b7f3', 'Luis Carlos'),
  ('9cbbec21-caf9-45d4-bc69-1cd0723dcfe2', 'Aqsa Naveed'),
  ('6d855ac3-cc18-43b5-8387-79ade0c13764', 'Samantha Serrano'),
  ('592032d6-f166-49ce-afd8-b6bb717893c7', 'Emma Rich'),
  ('e4a13ea3-11de-431f-82e0-f7604e21b086', 'Brianna Talamantes'),
  ('17803f47-36b7-4b16-937d-652e46fc9bee', 'Kayla Ribble'),
  ('fced458a-f0b2-45e8-b802-d3745d551238', 'Kristy Gardner'),
  ('df0f95e9-f895-450f-8b5e-33ed176b1914', 'Ashley Dias'),
  ('43472b3c-74a0-41c8-868e-4f7776eee6c7', 'Jasmine Valdez'),
  ('5f609f62-ce4a-4a9c-9e7a-f2e37e630082', 'Rachel Jain'),
  ('3100dad2-20fd-4664-a880-a195bf4e03ce', 'Alexandra Jackson'),
  ('b0f561e4-57bd-4041-a096-8b91725a7157', 'Celeste Miranda'),
  ('49943965-c194-433a-8f0c-d9e7d51c4557', 'Teresa Corsaut'),
  ('8c425df2-5c51-47dd-b41f-80dd2383ecfa', 'Silvia Nolasco'),
  ('bc3d3e9b-910e-4c4f-bdee-a4b5259c5786', 'elena mendoza'),
  ('8409e3b5-af6e-4c6c-ab03-9766c67df242', 'Charlene Stone'),
  ('5c8c25e9-a47b-4baf-8d6e-0a2a6812a16e', 'Stephanie Zelinsky'),
  ('32cef9a8-95ce-4c46-835e-1f348e5aedea', 'DEARRIONA SOLIS'),
  ('5db988f7-866d-4396-b8e0-9ea0091e1e0b', 'Katy Martin'),
  ('91015634-1b8d-4bfe-a059-8df696c5b9b0', 'Amy Buchholz'),
  ('d34da5b6-552f-4be2-9dfc-662942ab8961', 'Valerie Andrews'),
  ('20a8cc6a-4308-446c-8340-b6abcdfef410', 'Melanie Wilkins'),
  ('0a0dd973-2758-4eae-8bc7-19a067c4af6c', 'Heather Bauman'),
  ('4ef647f8-9e4e-4cda-9d41-c005a2fb1479', 'Vanessa Espinoza'),
  ('e0a6a94b-b6b9-4771-9861-11901dbc6d10', 'Esha Castle'),
  ('2f8ab0dc-0103-4b89-8925-f9027577c720', 'Sara Baker'),
  ('a48ae5ea-8afc-4d79-8590-c5ef5f4b7baa', 'Alvina Calderon'),
  ('eeb5c17e-cabd-4c19-94bb-076c5283d68c', 'Stephanie Zaragoza'),
  ('b0bb69b5-243b-4fdd-a020-b33166f828d9', 'Mayra Manzo'),
  ('66929a26-bf59-4cb4-844e-ba1a746cca0d', 'Blanca Pulido'),
  ('06ef6d51-b845-4855-9344-55f90f764817', 'Estefania Garcia'),
  ('aa333460-0a6c-48ce-9d20-b7d78f4f7062', 'Krissi Ackison'),
  ('2c7820ce-deb8-4da0-8084-8a69fae0199c', 'Michaela Moon'),
  ('0519375f-675f-4574-aedb-9e8df4d6146b', 'Nicole Brooke');

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
