-- Chunk 14: Update 100 parent names from Airtable
-- Records 1421 to 1520 of 1616

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
  ('76326c8f-e5c3-442f-9d32-78a9c8606f01', 'CASSANDRA TELLEZ'),
  ('a746e9e2-3371-4555-a465-edb79916f380', 'Carolyn Almon'),
  ('2a6666c0-fbb5-405c-897a-f99c3e0c8ab5', 'Nataly Alvarez'),
  ('8732ba77-4ab8-42a6-ae4b-6dab612328e2', 'Nancy Ramirez'),
  ('17308c84-5d03-4583-8bdd-ee0d3443044f', 'GABRIELLA BARRIGA'),
  ('24b7d04e-b7f5-4e02-82cb-502e79035a28', 'Irma Espinoza'),
  ('81a10deb-1385-4b3a-b263-58ae9069bb98', 'Katie Holmes'),
  ('16801dd0-41e8-4c84-9eb1-edff32ba728d', 'Elizabeth Roman'),
  ('03a70c23-4491-47da-ab96-e955b37f69ce', 'Nancy Castro'),
  ('8adedec2-4e68-4b74-b3af-7e24cb3c1a74', 'Sirena Laban'),
  ('1333bbc7-6d87-4eb2-bc96-c740d7389c27', 'Berta Gil'),
  ('70405b81-c3a3-43bd-8605-a9454ae3817f', 'KAREN GONZALEZ PARRA'),
  ('b17f3059-08b8-477b-84ea-88cae5361aef', 'Norma Pimentel'),
  ('2d35a483-0394-47cc-86b7-d7ef6eb90f88', 'Johan Romero'),
  ('f2431831-9970-431a-9e4a-e6ceacd8476b', 'Elodia Sandoval'),
  ('00f8adf0-621a-45f2-a7d5-7a9ebbccfe9a', 'Matthew Ibarra, Sr.'),
  ('073cc237-28ff-435d-b64f-17d2abed2954', 'Evelia Mendoza'),
  ('24c07580-4a7d-48b8-af7f-7929fbe4bf1c', 'Marilyn Mosco'),
  ('b046b759-ff96-422b-b372-12efc9476213', 'Ashley Zuniga'),
  ('4d41465b-5b1a-4010-a753-f6e6301a9678', 'Nancy Nard'),
  ('a0644d51-ed60-4ca8-8596-aa415ce9ef8c', 'Naomi Campbell'),
  ('96b70580-ff9c-4c93-8676-142e45217b83', 'Lisbeth'),
  ('a98656a2-fdb5-4a66-a3e7-8e4d19bf9d6b', 'Mayra Romo'),
  ('3870fa1f-e109-41b2-b1c2-095d125fc479', 'Mayra romo'),
  ('68f86237-d5b4-4ee5-a8ce-950b691a0248', 'Laura Rios'),
  ('377a4327-72e7-43bd-9459-3408e7b2abfb', 'Karina Sandoval'),
  ('a1acaa11-cc51-457b-b798-ce99929b9ce4', 'Elida Mora'),
  ('4f0c192f-b021-4874-875f-752a1926597e', 'Ashley Sandoval'),
  ('5132897d-ccf7-4712-bce6-c6776b20e569', 'Soledad Navarro'),
  ('141569b1-962b-4332-b4d7-a793659190ef', 'Mckinzey Tellez'),
  ('faa3ffd8-cab2-4728-8b74-82e9b5302d9d', 'Viviana perez-Rodriguez'),
  ('3846f0da-b17f-4114-92e3-4d015ef1b569', 'Simranjeet Kaur'),
  ('27e42c15-1d7e-44bb-aa7e-379738b339bb', 'Ciara johnson'),
  ('257ed23e-b1da-4eb4-adc2-0c0798471595', 'Dieisy Alcala'),
  ('933973a8-a9bd-4544-9df0-c856bae2a3ce', 'Jacqueline Calderon'),
  ('ec89d4c0-0a63-4fd4-916d-7b49e4a799cb', 'Katie Holmes'),
  ('c60249aa-fb3a-4798-84a6-5fa9a1587b42', 'Sharelli Santoyo'),
  ('7aad6c51-e802-419e-b59d-6525c80284a3', 'Mariana rdoza'),
  ('71fa95d4-dada-45dc-a247-d19cfb2a9929', 'Jessica Logan'),
  ('0a3417dc-6fba-4348-9938-4725d42e3ca1', 'Stephania Va'),
  ('4509a97a-2328-460e-b8a7-d63a67ded39e', 'Nadia Zaragoza'),
  ('d84d5a60-8950-432f-93d3-ccf66444db56', 'ROSARIO MURILLO'),
  ('a35c2305-bb88-4a1b-82e1-20e4c562e22b', 'JUANITA AGUIRRE'),
  ('83ce6653-4344-4bc1-b688-bde0632a4fdb', 'Amanda Martinez'),
  ('ba3bcb5f-5645-43d2-b0bb-d51d1a997583', 'Maribel Figueroa Mora'),
  ('e0659196-7be7-4bac-939c-445f3d16fc78', 'MORRIS GARCIA'),
  ('099ec041-ab66-4295-8511-aea30f67f907', 'Zakia Miakhel'),
  ('f8c0e324-5044-4c3c-aa0e-07f3760ce996', 'Jasmine Herrera'),
  ('40ba36ca-dafd-441f-89ef-ff1f95fa664c', 'Teresa Harvick'),
  ('e9463d60-5f1e-4414-8a2d-430112d05cc8', 'Maria Prosper'),
  ('eaa43c22-6741-4961-bf46-a3ff1cf1b2df', 'Adriana Contreras'),
  ('7376af7e-3269-444c-a80c-d5cd77f0ee24', 'Cassandra Davis'),
  ('f1b04b19-820a-437e-9d6e-f280ca2c04b3', 'Cindy V. Naranjo'),
  ('6fd9b37c-356a-4384-acfd-3bd4fe2a71fa', 'Alexis heatley'),
  ('b9c41ba0-be58-4065-954b-d8579d92df77', 'SARAHI CUEVAS SEGURA'),
  ('3b5f2285-fbba-4a9c-8471-ccf2da7203f3', 'Juliana Martinez'),
  ('56f00143-2500-44cf-9cc1-fd7194327a92', 'MARIBEL HERNANDEZ MANZO'),
  ('1c0f1e1b-8531-4ccd-b131-3fe53508e222', 'Maricielo Lino'),
  ('02269608-0fee-4159-9037-96fc5e2dd773', 'Laura Aguilar'),
  ('05a5eb04-4199-4db1-a3c6-d0c29d80e612', 'JAMIE LEWIS'),
  ('af6733bc-1498-4960-a8f3-074ef4788890', 'Veronica Ortega'),
  ('61fa86f3-7394-46d9-be5e-58e9750b397d', 'Maria Chavolla'),
  ('67b81ad4-9b74-4d46-93e3-2044d5320932', 'Cheyenna Rutledge'),
  ('b388d181-55e5-41f2-bf08-2e8ee89f9f54', 'Elizabeth Zaragoza'),
  ('9e407009-22e8-4d13-8523-ede1db7cecf4', 'CRISTAL BAEZ'),
  ('d8d26e4a-4169-4ea0-8c41-09498f96f0a1', 'Vanessa Perez'),
  ('a2daeb9a-0003-491f-8d25-ff58e2cebe88', 'JEAN RAMIREZ'),
  ('d62c8800-1ddf-4900-9ea0-dcc5b0d21bdf', 'Marazul Mujadadi'),
  ('fdd990ea-67fa-40f0-af4a-3cbf7aeb0674', 'Jovana Padilla'),
  ('8d49a6cd-c8d7-4fd8-9eb6-59b6cc54ca62', 'Selena De La Torre'),
  ('623f6be6-9f9e-4dae-bb6e-d8a0208bfddd', 'Steven Bruggman'),
  ('dbcfdd4f-b923-47cc-8a52-2f97663bbed6', 'Michelle Murphy'),
  ('0dbb8781-9f2a-4f27-93ac-cfa01b674ac4', 'Inez Karina Soto'),
  ('43b7be1f-ce6e-48a5-b2f8-a27c702d9080', 'Maria Chavez'),
  ('869bb5dc-1e7c-4fc0-8e14-e3e87e1ff94b', 'Montoya'),
  ('5e01f094-ff6e-4e93-b141-c9594e7d1bd6', 'Heather Byrum'),
  ('32664ce5-2403-45d6-aa81-f69a09f1e65c', 'Tiffany McLaughlin'),
  ('92004ce2-a719-417f-b336-b77f943bda4f', 'Brenda Paredes'),
  ('294d7101-b6e5-4269-8d0a-123d1133d5cc', 'Adriana Rodriguez'),
  ('581f4987-28c1-4a7d-b286-d92f4d70249e', 'Jeymi Quijada'),
  ('124569c7-0f5d-44ad-a6cb-3705cb33a0a1', 'WENDY CLARK'),
  ('0b5e5e58-74da-49aa-9c32-fd2cd6898bc9', 'Brandy Rife'),
  ('f34c0c96-82e5-41c6-8601-917d440ef56d', 'Rahul Narayan'),
  ('ec08a589-c6de-4adf-ab68-e4ccc4a70201', 'Loretta Salinas'),
  ('1b94bf59-d84e-4e8a-8c26-7aab14163603', 'Sandra Carrillo'),
  ('4e383284-410a-4421-a39e-26d734fb1ac4', 'Lorena Suarez'),
  ('bf36ab88-2d25-477e-9a81-561734386c98', 'Brittany Melendez'),
  ('150b1246-3a52-4f02-affa-e71be5788bef', 'Chynna Murillo'),
  ('699900eb-4f64-4cb5-a075-b1947aa67899', 'Xitlaly Toscano'),
  ('5e0ef55d-be64-4310-ab0f-edade4641056', 'Lenzie Gisler'),
  ('caa05de3-3f44-47e7-b562-de48a00fd36c', 'Araceli Espinoza'),
  ('eaf86e63-e08b-4e7f-a876-c61ad94b48bc', 'Alexandra Gonzalez'),
  ('aa50ae42-a08a-4af1-9ac4-6299b16e4459', 'HAYLEE WEBB'),
  ('609a48da-bea1-4563-87e9-9c26594cc6c6', 'Jenifer Alsobrook'),
  ('0524ec3c-da71-4edd-b94e-caa292338a84', 'BIANCA AHMAD-WIGGINS'),
  ('a2d96481-bdfd-49bc-bedf-7ec84a2c15a0', 'Nicole Raduechel-Wilson'),
  ('4af8d415-7287-42cd-baad-fe2b2de95d66', 'Diana Rapaha'),
  ('112a8218-8c8d-47bb-b7ff-8c90c768a6c6', 'Mary Ornelas'),
  ('7f8eb2ac-7b4e-42c9-bf55-72bcae48725f', 'Maria Navarro'),
  ('17e0623c-85e1-4d49-8e6e-76c0633f63b1', 'Mari Li Duperron');

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
