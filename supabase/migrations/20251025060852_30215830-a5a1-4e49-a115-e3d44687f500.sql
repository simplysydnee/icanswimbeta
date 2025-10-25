-- Create vmrc_referral_requests table to store referral form data
CREATE TABLE IF NOT EXISTS public.vmrc_referral_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Parent Information
  parent_name text NOT NULL,
  parent_email text NOT NULL,
  parent_phone text NOT NULL,
  
  -- Child Information
  child_name text NOT NULL,
  child_age integer NOT NULL,
  
  -- Referral Information
  referral_type text NOT NULL,
  coordinator_name text,
  coordinator_email text,
  
  -- Enrollment Questions
  previous_swim_lessons boolean,
  swim_goals text[], -- Array of selected goals
  strengths_interests text,
  motivation_factors text,
  availability_general text[], -- Array of availability options
  availability_other text,
  photo_release boolean,
  liability_agreement boolean NOT NULL DEFAULT false,
  swimmer_photo_url text,
  
  -- Additional Information
  additional_info text,
  
  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  admin_notes text,
  
  -- Link to created swimmer if approved
  swimmer_id uuid REFERENCES public.swimmers(id)
);

-- Enable RLS
ALTER TABLE public.vmrc_referral_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can submit referral requests"
ON public.vmrc_referral_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all referral requests"
ON public.vmrc_referral_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update referral requests"
ON public.vmrc_referral_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for status queries
CREATE INDEX idx_referral_requests_status ON public.vmrc_referral_requests(status);

-- Add index for created_at for sorting
CREATE INDEX idx_referral_requests_created_at ON public.vmrc_referral_requests(created_at DESC);