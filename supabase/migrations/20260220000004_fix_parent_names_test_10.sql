-- Test migration: Update first 10 parent names from Airtable (corrected)

-- Test updates for specific swimmers
UPDATE swimmers SET parent_name = 'Michelle Ramirez-Valenzuela' WHERE id = '87cd06fc-e529-49f1-a337-f2fb45c7cb0c';
UPDATE swimmers SET parent_name = 'Charice Fourre' WHERE id = '5a9c87f0-615c-4855-88ec-9397e2d603e9';
UPDATE swimmers SET parent_name = 'MICHAEL DISHLER' WHERE id = '94a0169a-d41f-448e-ba70-0c7167193724';
UPDATE swimmers SET parent_name = 'Gina Tostado' WHERE id = '5101f144-e7d0-49b7-9ca5-da6e7ff6bd22';
UPDATE swimmers SET parent_name = 'VANIA AQUINO' WHERE id = 'b57b0e8c-4b0a-46ac-86a1-8fc15213f8d3';
UPDATE swimmers SET parent_name = 'Nereida Hernandez' WHERE id = 'bc97f1db-cf74-496c-b6d9-63beb1c5738a';
UPDATE swimmers SET parent_name = 'AMY PATTERSON' WHERE id = '2feb9467-477f-4fdd-8627-3605afe138d7';
UPDATE swimmers SET parent_name = 'Adrienne Rivera' WHERE id = '3d195e8f-6eec-404f-a5ff-ae4098eb9467';
UPDATE swimmers SET parent_name = 'Brianna Siarot' WHERE id = 'b0f3a85b-ecde-42dd-97ca-d88111b74477';
UPDATE swimmers SET parent_name = 'Elizabeth Gracian' WHERE id = 'c0b9b637-cf57-4f90-8d12-0fc946301e2a';

-- Verify the updates
SELECT id, first_name, last_name, parent_name, parent_email
FROM swimmers
WHERE id IN (
  '87cd06fc-e529-49f1-a337-f2fb45c7cb0c',
  '5a9c87f0-615c-4855-88ec-9397e2d603e9',
  '94a0169a-d41f-448e-ba70-0c7167193724',
  '5101f144-e7d0-49b7-9ca5-da6e7ff6bd22',
  'b57b0e8c-4b0a-46ac-86a1-8fc15213f8d3',
  'bc97f1db-cf74-496c-b6d9-63beb1c5738a',
  '2feb9467-477f-4fdd-8627-3605afe138d7',
  '3d195e8f-6eec-404f-a5ff-ae4098eb9467',
  'b0f3a85b-ecde-42dd-97ca-d88111b74477',
  'c0b9b637-cf57-4f90-8d12-0fc946301e2a'
)
ORDER BY first_name;