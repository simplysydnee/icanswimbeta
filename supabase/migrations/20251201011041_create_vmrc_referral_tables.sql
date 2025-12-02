-- Parent referral requests (simple request to coordinator)
CREATE TABLE IF NOT EXISTS public.parent_referral_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  child_name TEXT NOT NULL,
  child_date_of_birth DATE,
  coordinator_name TEXT NOT NULL,
  coordinator_email TEXT NOT NULL,
  referral_token UUID DEFAULT gen_random_uuid() UNIQUE,
  status TEXT DEFAULT 'pending',
  vmrc_referral_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  email_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Full VMRC referral requests (coordinator fills this)
CREATE TABLE IF NOT EXISTS public.vmrc_referral_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_request_id UUID,

  -- Section 1: Client Information
  child_name TEXT NOT NULL,
  child_date_of_birth DATE NOT NULL,
  diagnosis TEXT NOT NULL, -- ADD/ADHD, Autism, Developmental Disability, Learning Disability, Sensory Processing, Speech Delay
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT NOT NULL,

  -- Section 2: Client Medical and Physical Profile
  non_ambulatory TEXT NOT NULL, -- 'yes' or 'no'
  has_seizure_disorder TEXT NOT NULL, -- 'yes' or 'no'
  height TEXT,
  weight TEXT,
  toilet_trained TEXT NOT NULL, -- 'yes' or 'no'
  has_medical_conditions TEXT NOT NULL, -- 'yes' or 'no'
  medical_conditions_description TEXT,
  has_allergies TEXT NOT NULL, -- 'yes' or 'no'
  allergies_description TEXT,
  has_other_therapies TEXT NOT NULL, -- 'yes' or 'no'
  other_therapies_description TEXT,

  -- Section 3: Behavioral & Safety Information
  comfortable_in_water TEXT NOT NULL, -- 'yes' or 'no'
  self_injurious_behavior TEXT NOT NULL, -- 'yes' or 'no'
  self_injurious_description TEXT,
  aggressive_behavior TEXT NOT NULL, -- 'yes' or 'no'
  aggressive_behavior_description TEXT,
  elopement_behavior TEXT NOT NULL, -- 'yes' or 'no'
  elopement_description TEXT,
  has_safety_plan TEXT NOT NULL, -- 'yes' or 'no'
  safety_plan_description TEXT,

  -- Section 4: Referral Information
  referral_type TEXT NOT NULL, -- 'vmrc_client', 'scholarship_applicant', 'coordinator_referral', 'other'
  coordinator_name TEXT,
  coordinator_email TEXT,

  -- Section 5: Consent & Optional Info
  photo_release TEXT NOT NULL, -- 'yes' or 'no'
  liability_agreement BOOLEAN NOT NULL DEFAULT false,
  swimmer_photo_url TEXT,
  additional_info TEXT,

  -- Status Tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'declined'
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  decline_reason TEXT,
  swimmer_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_referral_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vmrc_referral_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can create parent request" ON public.parent_referral_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view parent requests" ON public.parent_referral_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can update parent requests" ON public.parent_referral_requests FOR UPDATE USING (true);

CREATE POLICY "Anyone can create vmrc referral" ON public.vmrc_referral_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view vmrc referrals" ON public.vmrc_referral_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can update vmrc referrals" ON public.vmrc_referral_requests FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_parent_requests_token ON public.parent_referral_requests(referral_token);
CREATE INDEX idx_parent_requests_status ON public.parent_referral_requests(status);
CREATE INDEX idx_vmrc_referrals_status ON public.vmrc_referral_requests(status);