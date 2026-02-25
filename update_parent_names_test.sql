-- Update parent names from Airtable data (test with 5 records)
-- This SQL updates the parent_name field in swimmers table with correct names from Airtable

-- Test updates for specific swimmers
UPDATE swimmers
SET parent_name = 'Jeanette Moreno'
WHERE id = '939f1ab4-217a-4d3c-acf5-9608854a8579';

UPDATE swimmers
SET parent_name = 'Melissa Gonzales'
WHERE id = '41fe4838-4f93-4bfc-8781-9908cff177fe';

UPDATE swimmers
SET parent_name = 'Jessica Rosales'
WHERE id = 'd48425c2-1328-47f1-8461-59fdf9dce5be';

UPDATE swimmers
SET parent_name = 'Cruz'
WHERE id = '61614592-0ae5-43a1-ad0e-0d553139f06b';

UPDATE swimmers
SET parent_name = 'Carmen Madriz'
WHERE id = 'c1873804-9bc9-414e-b2f1-d7332054e22a';

-- Verify the updates
SELECT id, first_name, last_name, parent_name, parent_email
FROM swimmers
WHERE id IN (
  '939f1ab4-217a-4d3c-acf5-9608854a8579',
  '41fe4838-4f93-4bfc-8781-9908cff177fe',
  'd48425c2-1328-47f1-8461-59fdf9dce5be',
  '61614592-0ae5-43a1-ad0e-0d553139f06b',
  'c1873804-9bc9-414e-b2f1-d7332054e22a'
)
ORDER BY first_name;