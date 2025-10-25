-- Fix security: Set search_path for functions (drop trigger first)
DROP TRIGGER IF EXISTS trigger_set_client_number ON public.swimmers;

DROP FUNCTION IF EXISTS set_client_number();
DROP FUNCTION IF EXISTS generate_client_number();

-- Recreate generate_client_number with proper security
CREATE OR REPLACE FUNCTION generate_client_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number text;
  max_number integer;
BEGIN
  -- Get the highest existing client number
  SELECT COALESCE(MAX(CAST(SUBSTRING(client_number FROM '[0-9]+') AS integer)), 0)
  INTO max_number
  FROM swimmers
  WHERE client_number ~ '^[0-9]+$';
  
  -- Generate new number with leading zeros
  new_number := LPAD((max_number + 1)::text, 5, '0');
  
  RETURN new_number;
END;
$$;

-- Recreate set_client_number with proper security
CREATE OR REPLACE FUNCTION set_client_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.client_number IS NULL THEN
    NEW.client_number := generate_client_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_set_client_number
BEFORE INSERT ON public.swimmers
FOR EACH ROW
EXECUTE FUNCTION set_client_number();