-- Create purchase_orders table for POS tracking
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  swimmer_id UUID NOT NULL REFERENCES public.swimmers(id) ON DELETE CASCADE,
  coordinator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  po_type TEXT NOT NULL CHECK (po_type IN ('assessment', 'lessons')),
  authorization_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  allowed_lessons INTEGER NOT NULL DEFAULT 1,
  lessons_booked INTEGER NOT NULL DEFAULT 0,
  lessons_used INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  parent_po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on purchase_orders
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- Coordinators can view their assigned POS
CREATE POLICY "Coordinators can view their POS"
ON public.purchase_orders
FOR SELECT
USING (
  has_role(auth.uid(), 'vmrc_coordinator'::app_role) 
  AND coordinator_id = auth.uid()
);

-- Admins can view all POS
CREATE POLICY "Admins can view all POS"
ON public.purchase_orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Coordinators can update their POS
CREATE POLICY "Coordinators can update their POS"
ON public.purchase_orders
FOR UPDATE
USING (
  has_role(auth.uid(), 'vmrc_coordinator'::app_role) 
  AND coordinator_id = auth.uid()
);

-- Admins can manage all POS
CREATE POLICY "Admins can manage all POS"
ON public.purchase_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for performance
CREATE INDEX idx_purchase_orders_swimmer ON public.purchase_orders(swimmer_id);
CREATE INDEX idx_purchase_orders_coordinator ON public.purchase_orders(coordinator_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_orders_dates ON public.purchase_orders(start_date, end_date);

-- Add updated_at trigger
CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create Assessment POS when assessment is scheduled
CREATE OR REPLACE FUNCTION public.create_assessment_pos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coordinator_user_id UUID;
BEGIN
  -- Only create POS for VMRC clients when assessment is scheduled
  IF NEW.status = 'scheduled' AND NEW.approval_status = 'approved' THEN
    -- Get the coordinator from the swimmer
    SELECT s.created_by INTO coordinator_user_id
    FROM swimmers s
    WHERE s.id = NEW.swimmer_id
    AND s.is_vmrc_client = true;
    
    IF coordinator_user_id IS NOT NULL THEN
      -- Create Assessment POS
      INSERT INTO public.purchase_orders (
        swimmer_id,
        coordinator_id,
        po_type,
        start_date,
        end_date,
        allowed_lessons,
        status,
        assessment_id
      )
      VALUES (
        NEW.swimmer_id,
        coordinator_user_id,
        'assessment',
        NEW.scheduled_date::date,
        (NEW.scheduled_date::date + interval '1 day')::date,
        1,
        'pending',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to auto-create Lessons POS when assessment is completed
CREATE OR REPLACE FUNCTION public.create_lessons_pos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coordinator_user_id UUID;
  assessment_date DATE;
BEGIN
  -- Only create Lessons POS when assessment is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get the coordinator and assessment date from the swimmer
    SELECT s.created_by, NEW.scheduled_date::date 
    INTO coordinator_user_id, assessment_date
    FROM swimmers s
    WHERE s.id = NEW.swimmer_id
    AND s.is_vmrc_client = true;
    
    IF coordinator_user_id IS NOT NULL THEN
      -- Create Lessons POS (starts day after assessment, 3 months duration, 12 lessons)
      INSERT INTO public.purchase_orders (
        swimmer_id,
        coordinator_id,
        po_type,
        start_date,
        end_date,
        allowed_lessons,
        status,
        assessment_id,
        parent_po_id
      )
      VALUES (
        NEW.swimmer_id,
        coordinator_user_id,
        'lessons',
        assessment_date + interval '1 day',
        assessment_date + interval '3 months',
        12,
        'pending',
        NEW.id,
        (SELECT id FROM purchase_orders WHERE assessment_id = NEW.id AND po_type = 'assessment' LIMIT 1)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER create_assessment_pos_trigger
AFTER INSERT OR UPDATE ON public.assessments
FOR EACH ROW
EXECUTE FUNCTION public.create_assessment_pos();

CREATE TRIGGER create_lessons_pos_trigger
AFTER UPDATE ON public.assessments
FOR EACH ROW
EXECUTE FUNCTION public.create_lessons_pos();

-- Function to validate booking against POS dates
CREATE OR REPLACE FUNCTION public.validate_booking_pos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_date DATE;
  active_pos RECORD;
BEGIN
  -- Get session date
  SELECT start_time::date INTO session_date
  FROM sessions
  WHERE id = NEW.session_id;
  
  -- Check if swimmer is VMRC client
  IF EXISTS (SELECT 1 FROM swimmers WHERE id = NEW.swimmer_id AND is_vmrc_client = true) THEN
    -- Find active POS for this swimmer covering the session date
    SELECT * INTO active_pos
    FROM purchase_orders
    WHERE swimmer_id = NEW.swimmer_id
    AND po_type = 'lessons'
    AND start_date <= session_date
    AND end_date >= session_date
    AND status IN ('pending', 'in_progress')
    LIMIT 1;
    
    IF active_pos IS NULL THEN
      RAISE EXCEPTION 'No valid POS found for this booking date. Please ensure there is an active purchase order covering %.', session_date;
    END IF;
    
    -- Increment booked counter
    UPDATE purchase_orders
    SET lessons_booked = lessons_booked + 1
    WHERE id = active_pos.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create booking validation trigger
CREATE TRIGGER validate_booking_pos_trigger
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.validate_booking_pos();