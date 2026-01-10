-- Migration Preparation for Airtable Import
-- Makes parent_id nullable and adds parent_email for matching

-- STEP 1: Make parent_id nullable (if it's not already)
ALTER TABLE swimmers ALTER COLUMN parent_id DROP NOT NULL;

-- STEP 2: Add parent_email field for matching during parent signup
ALTER TABLE swimmers ADD COLUMN IF NOT EXISTS parent_email TEXT;

-- STEP 3: Create index for fast lookup during signup
CREATE INDEX IF NOT EXISTS idx_swimmers_parent_email ON swimmers(parent_email) WHERE parent_id IS NULL;

-- STEP 4: Create auto-link trigger for when parents sign up later
CREATE OR REPLACE FUNCTION link_swimmers_to_parent()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new parent profile is created, link any swimmers with matching email
  UPDATE swimmers
  SET parent_id = NEW.id
  WHERE LOWER(parent_email) = LOWER(NEW.email)
    AND parent_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS on_parent_signup ON profiles;
CREATE TRIGGER on_parent_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_swimmers_to_parent();

-- STEP 5: Also create a trigger for when parent email is updated
CREATE OR REPLACE FUNCTION link_swimmers_on_parent_update()
RETURNS TRIGGER AS $$
BEGIN
  -- When a parent updates their email, link any swimmers with matching old email
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE swimmers
    SET parent_id = NEW.id
    WHERE LOWER(parent_email) = LOWER(NEW.email)
      AND parent_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_parent_email_update ON profiles;
CREATE TRIGGER on_parent_email_update
  AFTER UPDATE OF email ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_swimmers_on_parent_update();

-- STEP 6: Add comment to parent_email column for documentation
COMMENT ON COLUMN swimmers.parent_email IS 'Email of parent for matching during signup. Used to automatically link swimmers when parent creates account.';