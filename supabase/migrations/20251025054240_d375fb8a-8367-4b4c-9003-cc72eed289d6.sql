-- Add comprehensive enrollment fields to swimmers table
ALTER TABLE public.swimmers
  ADD COLUMN IF NOT EXISTS client_number text,
  ADD COLUMN IF NOT EXISTS parent_phone text,
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS height text,
  ADD COLUMN IF NOT EXISTS weight text,
  ADD COLUMN IF NOT EXISTS history_of_seizures boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_allergies boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allergies_description text,
  ADD COLUMN IF NOT EXISTS has_medical_conditions boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS medical_conditions_description text,
  ADD COLUMN IF NOT EXISTS diagnosis text[], -- array for multiple selections
  ADD COLUMN IF NOT EXISTS self_injurious_behavior boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS self_injurious_description text,
  ADD COLUMN IF NOT EXISTS aggressive_behavior boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS aggressive_behavior_description text,
  ADD COLUMN IF NOT EXISTS elopement_history boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS elopement_description text,
  ADD COLUMN IF NOT EXISTS has_behavior_plan boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS behavior_plan_description text,
  ADD COLUMN IF NOT EXISTS restraint_history boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS restraint_description text,
  ADD COLUMN IF NOT EXISTS previous_swim_lessons boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS comfortable_in_water text CHECK (comfortable_in_water IN ('very_comfortable', 'somewhat_comfortable', 'not_comfortable', 'afraid')),
  ADD COLUMN IF NOT EXISTS swim_goals text[],
  ADD COLUMN IF NOT EXISTS toilet_trained boolean,
  ADD COLUMN IF NOT EXISTS non_ambulatory boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS communication_type text CHECK (communication_type IN ('verbal', 'signs', 'gestures', 'pecs_aac', 'non_verbal')),
  ADD COLUMN IF NOT EXISTS other_therapies boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS therapies_description text,
  ADD COLUMN IF NOT EXISTS availability_general text[],
  ADD COLUMN IF NOT EXISTS availability_other text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS client_booking_limit integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS attendance_standing text CHECK (attendance_standing IN ('weekly', 'floating')) DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS agreed_to_cancellation_policy boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS signed_waiver boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_release boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS signed_liability timestamp with time zone,
  ADD COLUMN IF NOT EXISTS signed_photo_release timestamp with time zone,
  ADD COLUMN IF NOT EXISTS enrollment_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_enrolled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_policy_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_status_update timestamp with time zone,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Create index for faster client number lookups
CREATE INDEX IF NOT EXISTS idx_swimmers_client_number ON public.swimmers(client_number);

-- Create index for enrollment status
CREATE INDEX IF NOT EXISTS idx_swimmers_enrollment_status ON public.swimmers(enrollment_status);

-- Function to generate client number
CREATE OR REPLACE FUNCTION generate_client_number()
RETURNS text
LANGUAGE plpgsql
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

-- Trigger to auto-generate client number if not provided
CREATE OR REPLACE FUNCTION set_client_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.client_number IS NULL THEN
    NEW.client_number := generate_client_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_client_number
BEFORE INSERT ON public.swimmers
FOR EACH ROW
EXECUTE FUNCTION set_client_number();