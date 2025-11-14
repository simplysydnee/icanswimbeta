-- Add booking_count field to sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS booking_count INTEGER NOT NULL DEFAULT 0;

-- Create function to increment booking count
CREATE OR REPLACE FUNCTION public.increment_booking_count(session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sessions
  SET booking_count = booking_count + 1
  WHERE id = session_id;
END;
$$;

-- Create trigger to automatically increment booking count when assessment is created
CREATE OR REPLACE FUNCTION public.handle_assessment_booking_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only increment if session_id is provided and status is 'scheduled'
  IF NEW.session_id IS NOT NULL AND NEW.status = 'scheduled' THEN
    PERFORM public.increment_booking_count(NEW.session_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for automatic booking count increment
DROP TRIGGER IF EXISTS increment_booking_count_trigger ON public.assessments;
CREATE TRIGGER increment_booking_count_trigger
  AFTER INSERT ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_assessment_booking_count();