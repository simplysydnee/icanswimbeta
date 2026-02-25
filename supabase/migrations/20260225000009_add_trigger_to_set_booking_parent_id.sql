-- Migration: 20260225000009_add_trigger_to_set_booking_parent_id.sql
-- Description: Add trigger to automatically set booking.parent_id from swimmer.parent_id
--              This ensures future data consistency

-- Create function to set booking.parent_id from swimmer.parent_id
CREATE OR REPLACE FUNCTION public.set_booking_parent_id_from_swimmer()
RETURNS TRIGGER AS $$
BEGIN
  -- If parent_id is not set, try to get it from the swimmer
  IF NEW.parent_id IS NULL AND NEW.swimmer_id IS NOT NULL THEN
    SELECT parent_id INTO NEW.parent_id
    FROM swimmers
    WHERE id = NEW.swimmer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before INSERT or UPDATE on bookings
DROP TRIGGER IF EXISTS set_booking_parent_id_trigger ON public.bookings;
CREATE TRIGGER set_booking_parent_id_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_parent_id_from_swimmer();

-- Note: This trigger ensures that booking.parent_id is always set to the swimmer's parent_id
-- when possible. This maintains data consistency for future bookings.