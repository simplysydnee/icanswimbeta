-- Add VMRC and enrollment fields to swimmers table
ALTER TABLE public.swimmers
ADD COLUMN IF NOT EXISTS is_vmrc_client boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS vmrc_coordinator_name text,
ADD COLUMN IF NOT EXISTS vmrc_coordinator_email text,
ADD COLUMN IF NOT EXISTS vmrc_coordinator_phone text,
ADD COLUMN IF NOT EXISTS vmrc_referral_url text,
ADD COLUMN IF NOT EXISTS enrollment_status text DEFAULT 'waitlist' CHECK (enrollment_status IN ('waitlist', 'approved', 'enrolled')),
ADD COLUMN IF NOT EXISTS assessment_status text DEFAULT 'not_started' CHECK (assessment_status IN ('not_started', 'scheduled', 'complete'));

-- Create assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  swimmer_id uuid NOT NULL REFERENCES public.swimmers(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  scheduled_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  instructor_notes text,
  completed_at timestamp with time zone,
  completed_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies for assessments
CREATE POLICY "Parents can view their swimmers' assessments"
ON public.assessments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.swimmers
    WHERE swimmers.id = assessments.swimmer_id
    AND swimmers.parent_id = auth.uid()
  )
);

CREATE POLICY "Parents can create assessments for their swimmers"
ON public.assessments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.swimmers
    WHERE swimmers.id = assessments.swimmer_id
    AND swimmers.parent_id = auth.uid()
  )
);

CREATE POLICY "Instructors can view all assessments"
ON public.assessments FOR SELECT
USING (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can update assessments"
ON public.assessments FOR UPDATE
USING (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add recurring session fields to sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern text,
ADD COLUMN IF NOT EXISTS month_year text,
ADD COLUMN IF NOT EXISTS day_of_week integer,
ADD COLUMN IF NOT EXISTS location text;

-- Update floating_sessions to include month context
ALTER TABLE public.floating_sessions
ADD COLUMN IF NOT EXISTS month_year text,
ADD COLUMN IF NOT EXISTS notification_sent boolean DEFAULT false;

-- Create session_attendance table
CREATE TABLE IF NOT EXISTS public.session_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  swimmer_id uuid NOT NULL REFERENCES public.swimmers(id) ON DELETE CASCADE,
  attended boolean DEFAULT false,
  instructor_notes text,
  marked_by uuid REFERENCES auth.users(id),
  marked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_attendance
CREATE POLICY "Parents can view their swimmers' attendance"
ON public.session_attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.swimmers
    WHERE swimmers.id = session_attendance.swimmer_id
    AND swimmers.parent_id = auth.uid()
  )
);

CREATE POLICY "Instructors can manage attendance"
ON public.session_attendance FOR ALL
USING (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at triggers
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for VMRC referrals
INSERT INTO storage.buckets (id, name, public)
VALUES ('vmrc-referrals', 'vmrc-referrals', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for VMRC referrals
CREATE POLICY "Parents can upload VMRC referrals for their swimmers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vmrc-referrals'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Parents can view their own VMRC referrals"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vmrc-referrals'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can view all VMRC referrals"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vmrc-referrals'
  AND (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);