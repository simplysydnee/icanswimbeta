-- Add flexible_swimmer flag to swimmers table
ALTER TABLE public.swimmers
ADD COLUMN IF NOT EXISTS flexible_swimmer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flexible_swimmer_reason TEXT,
ADD COLUMN IF NOT EXISTS flexible_swimmer_set_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS flexible_swimmer_set_by UUID REFERENCES auth.users(id);

-- Create session logs table for tracking cancellation attempts
CREATE TABLE IF NOT EXISTS public.session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_id UUID REFERENCES public.sessions(id) NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  action TEXT NOT NULL,
  allowed BOOLEAN NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on session_logs
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_logs
CREATE POLICY "Admins can view all session logs"
ON public.session_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own session logs"
ON public.session_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create session logs"
ON public.session_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON public.session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON public.session_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_swimmers_flexible_swimmer ON public.swimmers(flexible_swimmer);

-- Function to handle late cancellation and set flexible swimmer status
CREATE OR REPLACE FUNCTION public.handle_late_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_start_time TIMESTAMP WITH TIME ZONE;
  swimmer_record RECORD;
BEGIN
  -- Only process if status changed to cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Get session start time
    SELECT start_time INTO session_start_time
    FROM sessions
    WHERE id = NEW.session_id;
    
    -- Check if cancellation is within 24 hours
    IF now() > (session_start_time - interval '24 hours') THEN
      -- Get swimmer info
      SELECT * INTO swimmer_record
      FROM swimmers
      WHERE id = NEW.swimmer_id;
      
      -- Set flexible swimmer status
      UPDATE swimmers
      SET 
        flexible_swimmer = TRUE,
        flexible_swimmer_reason = 'Late cancellation within 24 hours',
        flexible_swimmer_set_at = now(),
        flexible_swimmer_set_by = NEW.canceled_by
      WHERE id = NEW.swimmer_id
      AND flexible_swimmer = FALSE; -- Only set if not already flexible
      
      -- Log the action
      INSERT INTO session_logs (
        user_id,
        session_id,
        booking_id,
        action,
        allowed,
        reason
      ) VALUES (
        NEW.canceled_by,
        NEW.session_id,
        NEW.id,
        'late_cancellation_flexible_swimmer_set',
        TRUE,
        'Swimmer automatically moved to Flexible Swimmer status due to cancellation within 24 hours'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for late cancellation handling
DROP TRIGGER IF EXISTS handle_late_cancellation_trigger ON public.bookings;
CREATE TRIGGER handle_late_cancellation_trigger
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_late_cancellation();