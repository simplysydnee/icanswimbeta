-- Add signature fields to swimmers table
ALTER TABLE swimmers
ADD COLUMN IF NOT EXISTS photo_video_signature TEXT,
ADD COLUMN IF NOT EXISTS liability_waiver_signature TEXT,
ADD COLUMN IF NOT EXISTS cancellation_policy_signature TEXT;

-- Update signed timestamps when signatures are provided
CREATE OR REPLACE FUNCTION public.update_waiver_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update photo release timestamp when signature is added
  IF NEW.photo_video_signature IS NOT NULL AND OLD.photo_video_signature IS NULL THEN
    NEW.signed_photo_release := now();
  END IF;
  
  -- Update liability timestamp when signature is added
  IF NEW.liability_waiver_signature IS NOT NULL AND OLD.liability_waiver_signature IS NULL THEN
    NEW.signed_liability := now();
    NEW.signed_waiver := true;
  END IF;
  
  -- Set cancellation policy agreement timestamp (using updated_at as proxy)
  IF NEW.cancellation_policy_signature IS NOT NULL AND OLD.cancellation_policy_signature IS NULL THEN
    NEW.agreed_to_cancellation_policy := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_waiver_timestamps_trigger ON swimmers;
CREATE TRIGGER update_waiver_timestamps_trigger
  BEFORE UPDATE ON swimmers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_waiver_timestamps();