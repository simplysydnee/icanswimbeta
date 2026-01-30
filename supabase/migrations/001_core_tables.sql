-- Core Database Schema for I Can Swim Application
-- Migration: 001_core_tables.sql
-- Description: Creates all core tables for swim lesson booking and progress tracking

-- Table 1: swimmers (Central swimmer data)
CREATE TABLE public.swimmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Basic Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  height TEXT,
  weight TEXT,
  photo_url TEXT,
  client_number TEXT UNIQUE,

  -- Medical & Safety
  has_allergies BOOLEAN DEFAULT false,
  allergies_description TEXT,
  has_medical_conditions BOOLEAN DEFAULT false,
  medical_conditions_description TEXT,
  diagnosis TEXT[], -- Array: Autism, Speech Delay, ADD/ADHD, etc.
  history_of_seizures BOOLEAN DEFAULT false,
  seizures_description TEXT,
  toilet_trained TEXT, -- 'yes', 'no', 'in_progress'
  non_ambulatory BOOLEAN DEFAULT false,

  -- Behavioral
  self_injurious_behavior BOOLEAN DEFAULT false,
  self_injurious_behavior_description TEXT,
  aggressive_behavior BOOLEAN DEFAULT false,
  aggressive_behavior_description TEXT,
  elopement_history BOOLEAN DEFAULT false,
  elopement_history_description TEXT,
  has_behavior_plan BOOLEAN DEFAULT false,
  restraint_history BOOLEAN DEFAULT false,
  restraint_history_description TEXT,

  -- Swimming Background
  previous_swim_lessons BOOLEAN DEFAULT false,
  comfortable_in_water TEXT, -- 'very', 'somewhat', 'not_at_all'
  swim_goals TEXT[], -- Array of goals
  current_level_id UUID REFERENCES public.swim_levels(id),
  strengths_interests TEXT,

  -- Communication & Functional
  communication_type TEXT[], -- 'verbal', 'signs', 'gestures', 'PECS/AAC'
  other_therapies BOOLEAN DEFAULT false,
  therapies_description TEXT,

  -- Scheduling
  availability TEXT[], -- Array: 'monday_am', 'tuesday_pm', etc.
  preferred_start_date DATE,
  client_booking_limit INTEGER DEFAULT 4,

  -- Payment & VMRC
  payment_type TEXT DEFAULT 'private_pay', -- 'private_pay', 'vmrc', 'scholarship'
  is_vmrc_client BOOLEAN DEFAULT false,
  vmrc_coordinator_name TEXT,
  vmrc_coordinator_email TEXT,
  vmrc_coordinator_phone TEXT,
  vmrc_sessions_used INTEGER DEFAULT 0,
  vmrc_sessions_authorized INTEGER DEFAULT 0,
  vmrc_current_pos_number TEXT,
  vmrc_pos_expires_at DATE,

  -- Status
  enrollment_status TEXT DEFAULT 'waitlist', -- 'waitlist', 'pending', 'enrolled', 'dropped'
  assessment_status TEXT DEFAULT 'not_scheduled', -- 'not_scheduled', 'scheduled', 'completed'
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'declined'
  flexible_swimmer BOOLEAN DEFAULT false,

  -- Waivers & Agreements
  photo_video_permission BOOLEAN DEFAULT false,
  photo_video_signature TEXT,
  liability_waiver_signature TEXT,
  cancellation_policy_signature TEXT,
  signed_waiver BOOLEAN DEFAULT false,
  signed_liability BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,

  -- Admin tracking
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id)
);

-- Table 2: swim_levels (Progression system)
CREATE TABLE public.swim_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'White', 'Red', 'Yellow', 'Green', 'Blue'
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- Hex color code
  sequence INTEGER NOT NULL, -- Order: 1, 2, 3, 4, 5
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default levels
INSERT INTO public.swim_levels (name, display_name, description, color, sequence) VALUES
('white', 'White', 'Water Readiness - Asking permission to get in the water', '#f1f5f9', 1),
('red', 'Red', 'Body Position and Air Exchange - Wearing lifejacket and jump in', '#fee2e2', 2),
('yellow', 'Yellow', 'Forward Movement and Direction Change - Tread water for 10 seconds', '#fef9c3', 3),
('green', 'Green', 'Water Competency - Disorientating entries and recover', '#dcfce7', 4),
('blue', 'Blue', 'Streamlines and Side Breathing - Reach and throw with assist flotation', '#dbeafe', 5);

-- Table 3: skills (Skills per level)
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID REFERENCES public.swim_levels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sequence INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert White level skills
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Safely entering and exiting', 1 FROM public.swim_levels WHERE name = 'white';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Pour water on face and head', 2 FROM public.swim_levels WHERE name = 'white';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Breath hold and look under water', 3 FROM public.swim_levels WHERE name = 'white';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Tuck and stand from front', 4 FROM public.swim_levels WHERE name = 'white';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Relaxed body position', 5 FROM public.swim_levels WHERE name = 'white';

-- Insert Red level skills
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Blow bubbles', 1 FROM public.swim_levels WHERE name = 'red';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Front float with assistance', 2 FROM public.swim_levels WHERE name = 'red';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Back float with assistance', 3 FROM public.swim_levels WHERE name = 'red';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Kicking with board', 4 FROM public.swim_levels WHERE name = 'red';

-- Insert Yellow level skills
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Front float unassisted', 1 FROM public.swim_levels WHERE name = 'yellow';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Back float unassisted', 2 FROM public.swim_levels WHERE name = 'yellow';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Treading water 10 seconds', 3 FROM public.swim_levels WHERE name = 'yellow';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Front crawl arms', 4 FROM public.swim_levels WHERE name = 'yellow';

-- Insert Green level skills
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, '3 stroke - stop drill', 1 FROM public.swim_levels WHERE name = 'green';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, '3 stroke - roll and rest', 2 FROM public.swim_levels WHERE name = 'green';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, '3x3 swim drill', 3 FROM public.swim_levels WHERE name = 'green';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Tread water 40 seconds', 4 FROM public.swim_levels WHERE name = 'green';

-- Insert Blue level skills
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Streamline push-offs', 1 FROM public.swim_levels WHERE name = 'blue';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Side breathing', 2 FROM public.swim_levels WHERE name = 'blue';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Front crawl 25 yards', 3 FROM public.swim_levels WHERE name = 'blue';
INSERT INTO public.skills (level_id, name, sequence)
SELECT id, 'Backstroke 25 yards', 4 FROM public.swim_levels WHERE name = 'blue';

-- Table 4: swimmer_skills (Track individual progress)
CREATE TABLE public.swimmer_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID REFERENCES public.swimmers(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'mastered'
  date_mastered DATE,
  instructor_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(swimmer_id, skill_id)
);

-- Table 5: sessions (Lesson time slots)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  day_of_week TEXT, -- 'monday', 'tuesday', etc.
  month_year TEXT, -- '2024-01' for grouping

  -- Assignment
  instructor_id UUID REFERENCES public.profiles(id),
  location TEXT, -- 'Modesto', 'Merced'

  -- Capacity
  max_capacity INTEGER DEFAULT 1,
  booking_count INTEGER DEFAULT 0,
  is_full BOOLEAN DEFAULT false,

  -- Type
  session_type TEXT DEFAULT 'lesson', -- 'lesson', 'assessment'
  session_type_detail TEXT, -- 'initial', 'follow_up'

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'available', 'open', 'booked', 'cancelled', 'completed'

  -- Pricing
  price_cents INTEGER DEFAULT 7500, -- $75.00 for private pay

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  batch_id UUID,

  -- Level restrictions
  allowed_swim_levels UUID[],

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  open_at TIMESTAMPTZ
);

-- Table 6: bookings (Session reservations)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  swimmer_id UUID REFERENCES public.swimmers(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Status
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed', 'no_show'

  -- Cancellation
  cancel_reason TEXT,
  cancel_source TEXT, -- 'parent', 'admin', 'instructor'
  canceled_at TIMESTAMPTZ,
  canceled_by UUID REFERENCES public.profiles(id),

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 7: assessments (Initial evaluations)
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID REFERENCES public.swimmers(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id),
  scheduled_date DATE,

  -- Status
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'declined'

  -- Completion
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  instructor_notes TEXT,

  -- Approval
  approval_deadline DATE,
  approval_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 8: purchase_orders (VMRC authorization)
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID REFERENCES public.swimmers(id) ON DELETE CASCADE,
  coordinator_id UUID REFERENCES public.profiles(id),
  assessment_id UUID REFERENCES public.assessments(id),
  parent_po_id UUID REFERENCES public.purchase_orders(id),

  -- Type
  po_type TEXT NOT NULL, -- 'assessment', 'lessons'

  -- Authorization
  authorization_number TEXT,
  allowed_lessons INTEGER DEFAULT 12,
  start_date DATE,
  end_date DATE,

  -- Usage
  lessons_booked INTEGER DEFAULT 0,
  lessons_used INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'approved', 'expired'

  -- Notes
  notes TEXT,
  comments TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 9: progress_notes (Post-lesson documentation)
CREATE TABLE public.progress_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id),
  booking_id UUID REFERENCES public.bookings(id),
  swimmer_id UUID REFERENCES public.swimmers(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.profiles(id),

  -- Content
  lesson_summary TEXT,
  lesson_number INTEGER,
  total_lessons INTEGER,
  instructor_notes TEXT,
  parent_notes TEXT,

  -- Skills
  skills_working_on UUID[],
  skills_mastered UUID[],
  current_level_id UUID REFERENCES public.swim_levels(id),

  -- POS management
  next_pos_created BOOLEAN DEFAULT false,
  next_pos_id UUID REFERENCES public.purchase_orders(id),

  -- Sharing
  shared_with_parent BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.swimmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swim_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swimmer_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies

-- Swim levels and skills are readable by everyone
CREATE POLICY "Anyone can view swim levels" ON public.swim_levels FOR SELECT USING (true);
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);

-- Parents can view their own swimmers
CREATE POLICY "Parents can view own swimmers" ON public.swimmers
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert own swimmers" ON public.swimmers
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update own swimmers" ON public.swimmers
  FOR UPDATE USING (auth.uid() = parent_id);

-- Parents can view their own bookings
CREATE POLICY "Parents can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

-- Everyone can view open sessions
CREATE POLICY "Anyone can view available sessions" ON public.sessions
  FOR SELECT USING (status IN ('available', 'open'));

-- Add admin policies (admins can do everything)
CREATE POLICY "Admins have full access to swimmers" ON public.swimmers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins have full access to sessions" ON public.sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins have full access to bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins have full access to assessments" ON public.assessments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins have full access to purchase_orders" ON public.purchase_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins have full access to progress_notes" ON public.progress_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_swimmers_updated_at BEFORE UPDATE ON public.swimmers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_notes_updated_at BEFORE UPDATE ON public.progress_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_swimmers_parent_id ON public.swimmers(parent_id);
CREATE INDEX idx_swimmers_current_level_id ON public.swimmers(current_level_id);
CREATE INDEX idx_swimmers_enrollment_status ON public.swimmers(enrollment_status);
CREATE INDEX idx_swimmers_payment_type ON public.swimmers(payment_type);

CREATE INDEX idx_skills_level_id ON public.skills(level_id);
CREATE INDEX idx_swimmer_skills_swimmer_id ON public.swimmer_skills(swimmer_id);
CREATE INDEX idx_swimmer_skills_skill_id ON public.swimmer_skills(skill_id);

CREATE INDEX idx_sessions_instructor_id ON public.sessions(instructor_id);
CREATE INDEX idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_sessions_location ON public.sessions(location);

CREATE INDEX idx_bookings_session_id ON public.bookings(session_id);
CREATE INDEX idx_bookings_swimmer_id ON public.bookings(swimmer_id);
CREATE INDEX idx_bookings_parent_id ON public.bookings(parent_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

CREATE INDEX idx_assessments_swimmer_id ON public.assessments(swimmer_id);
CREATE INDEX idx_assessments_status ON public.assessments(status);

CREATE INDEX idx_purchase_orders_swimmer_id ON public.purchase_orders(swimmer_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);

CREATE INDEX idx_progress_notes_swimmer_id ON public.progress_notes(swimmer_id);
CREATE INDEX idx_progress_notes_instructor_id ON public.progress_notes(instructor_id);
CREATE INDEX idx_progress_notes_session_id ON public.progress_notes(session_id);