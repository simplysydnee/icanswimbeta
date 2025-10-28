-- Add approval tracking fields to swimmers table
ALTER TABLE public.swimmers
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'declined')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS declined_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Add cancellation tracking fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS cancel_source TEXT CHECK (cancel_source IN ('parent', 'admin', 'system'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_swimmers_approval_status ON public.swimmers(approval_status);
CREATE INDEX IF NOT EXISTS idx_swimmers_enrollment_status ON public.swimmers(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_canceled_at ON public.bookings(canceled_at);

-- Function to check if cancellation is allowed (within 24 hours rule)
CREATE OR REPLACE FUNCTION public.can_cancel_booking(_booking_id UUID, _user_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get session start time
  SELECT s.start_time INTO session_start_time
  FROM bookings b
  JOIN sessions s ON s.id = b.session_id
  WHERE b.id = _booking_id;
  
  -- Admin can always cancel
  IF _user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Parents cannot cancel within 24 hours
  IF now() > (session_start_time - interval '24 hours') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- RLS policy for admins to manage all swimmers
CREATE POLICY "Admins can manage swimmer approvals"
ON public.swimmers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));