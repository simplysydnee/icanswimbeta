-- Migration: Normalize swimmer names (capitalize first letter)
-- Description: Fix swimmer names that are ALL CAPS by capitalizing first letter of each word

BEGIN;

-- Update first names: Convert from UPPERCASE to Proper Case
UPDATE swimmers
SET first_name = INITCAP(LOWER(first_name)),
    last_name = INITCAP(LOWER(last_name))
WHERE first_name = UPPER(first_name)
   OR last_name = UPPER(last_name);

-- Also update parent names for consistency (profiles table)
UPDATE profiles
SET full_name = INITCAP(full_name)
WHERE full_name = UPPER(full_name)
   AND full_name != LOWER(full_name);

-- Log the changes
DO $$
DECLARE
  swimmer_first_name_count INTEGER;
  swimmer_last_name_count INTEGER;
  parent_first_name_count INTEGER;
  parent_last_name_count INTEGER;
BEGIN
  -- Count affected swimmer records
  SELECT COUNT(*) INTO swimmer_first_name_count
  FROM swimmers
  WHERE first_name = UPPER(first_name)
    AND first_name != LOWER(first_name);

  SELECT COUNT(*) INTO swimmer_last_name_count
  FROM swimmers
  WHERE last_name = UPPER(last_name)
    AND last_name != LOWER(last_name);

  -- Count affected parent records
  SELECT COUNT(*) INTO parent_first_name_count
  FROM parents
  WHERE first_name = UPPER(first_name)
    AND first_name != LOWER(first_name);

  SELECT COUNT(*) INTO parent_last_name_count
  FROM parents
  WHERE last_name = UPPER(last_name)
    AND last_name != LOWER(last_name);

  RAISE NOTICE 'Normalized % swimmer first names and % swimmer last names',
    swimmer_first_name_count, swimmer_last_name_count;
  RAISE NOTICE 'Normalized % parent first names and % parent last names',
    parent_first_name_count, parent_last_name_count;
END $$;

COMMIT;