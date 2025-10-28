-- Create progress_notes table for instructor updates
CREATE TABLE IF NOT EXISTS public.progress_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  swimmer_id UUID NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL,
  
  -- Lesson summary and level
  lesson_summary TEXT NOT NULL,
  current_level_id UUID REFERENCES swim_levels(id),
  
  -- Skills tracking
  skills_mastered UUID[] DEFAULT '{}',
  skills_working_on TEXT[] DEFAULT '{}',
  
  -- Notes
  instructor_notes TEXT,
  parent_notes TEXT,
  shared_with_parent BOOLEAN DEFAULT false,
  
  -- POS tracking for VMRC
  lesson_number INTEGER, -- e.g., 11 out of 12
  total_lessons INTEGER, -- e.g., 12
  next_pos_created BOOLEAN DEFAULT false,
  next_pos_id UUID REFERENCES purchase_orders(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Instructors can create progress notes"
ON public.progress_notes
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Instructors can view all progress notes"
ON public.progress_notes
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Parents can view their swimmers' progress notes"
ON public.progress_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM swimmers
    WHERE swimmers.id = progress_notes.swimmer_id
    AND swimmers.parent_id = auth.uid()
    AND progress_notes.shared_with_parent = true
  )
);

CREATE POLICY "Instructors can update progress notes"
ON public.progress_notes
FOR UPDATE
USING (
  has_role(auth.uid(), 'instructor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add index for better performance
CREATE INDEX idx_progress_notes_swimmer ON progress_notes(swimmer_id);
CREATE INDEX idx_progress_notes_session ON progress_notes(session_id);
CREATE INDEX idx_progress_notes_booking ON progress_notes(booking_id);

-- Trigger for updated_at
CREATE TRIGGER update_progress_notes_updated_at
BEFORE UPDATE ON progress_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to get active POS for a swimmer at a specific date
CREATE OR REPLACE FUNCTION public.get_active_pos_for_session(
  _swimmer_id UUID,
  _session_date DATE
)
RETURNS TABLE(
  pos_id UUID,
  lessons_used INTEGER,
  lessons_authorized INTEGER,
  lesson_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    po.id as pos_id,
    po.lessons_used,
    po.allowed_lessons as lessons_authorized,
    po.lessons_used + 1 as lesson_number
  FROM purchase_orders po
  WHERE po.swimmer_id = _swimmer_id
    AND po.po_type = 'lessons'
    AND po.start_date <= _session_date
    AND po.end_date >= _session_date
    AND po.status IN ('pending', 'in_progress', 'approved')
  ORDER BY po.start_date DESC
  LIMIT 1;
END;
$$;

-- Function to create next POS automatically
CREATE OR REPLACE FUNCTION public.create_next_vmrc_pos(
  _swimmer_id UUID,
  _current_pos_id UUID,
  _instructor_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_pos RECORD;
  new_pos_id UUID;
  coordinator_id UUID;
BEGIN
  -- Get current POS info
  SELECT * INTO current_pos
  FROM purchase_orders
  WHERE id = _current_pos_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current POS not found';
  END IF;
  
  -- Get coordinator (creator of the swimmer)
  SELECT created_by INTO coordinator_id
  FROM swimmers
  WHERE id = _swimmer_id;
  
  -- Create new POS
  INSERT INTO purchase_orders (
    swimmer_id,
    coordinator_id,
    po_type,
    start_date,
    end_date,
    allowed_lessons,
    lessons_booked,
    lessons_used,
    status,
    parent_po_id,
    notes
  ) VALUES (
    _swimmer_id,
    coordinator_id,
    'lessons',
    current_pos.end_date + INTERVAL '1 day',
    current_pos.end_date + INTERVAL '3 months',
    12,
    0,
    0,
    'pending',
    _current_pos_id,
    'Auto-created after lesson 11/12 completion'
  )
  RETURNING id INTO new_pos_id;
  
  -- Log the creation
  INSERT INTO session_logs (
    user_id,
    session_id,
    action,
    allowed,
    reason
  ) VALUES (
    _instructor_id,
    NULL,
    'next_pos_created',
    true,
    format('Next POS created for swimmer %s after lesson 11/12', _swimmer_id)
  );
  
  RETURN new_pos_id;
END;
$$;