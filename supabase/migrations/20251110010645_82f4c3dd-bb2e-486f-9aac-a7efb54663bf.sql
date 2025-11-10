-- Create notifications table for instructor alerts
CREATE TABLE IF NOT EXISTS public.instructor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID NOT NULL REFERENCES public.swimmers(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('progress_update_needed', 'pos_expiring', 'assessment_pending')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Create index for faster queries
CREATE INDEX idx_instructor_notifications_read ON public.instructor_notifications(read, created_at DESC);
CREATE INDEX idx_instructor_notifications_swimmer ON public.instructor_notifications(swimmer_id);

-- Enable RLS
ALTER TABLE public.instructor_notifications ENABLE ROW LEVEL SECURITY;

-- Instructors and admins can view all notifications
CREATE POLICY "Instructors can view notifications"
ON public.instructor_notifications
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Instructors and admins can update notifications (mark as read)
CREATE POLICY "Instructors can update notifications"
ON public.instructor_notifications
FOR UPDATE
USING (
  has_role(auth.uid(), 'instructor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- System can create notifications
CREATE POLICY "System can create notifications"
ON public.instructor_notifications
FOR INSERT
WITH CHECK (true);

-- Create progress update requests table
CREATE TABLE IF NOT EXISTS public.progress_update_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID NOT NULL REFERENCES public.swimmers(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES auth.users(id),
  coordinator_email TEXT NOT NULL,
  coordinator_name TEXT,
  current_pos_number TEXT,
  progress_summary TEXT NOT NULL,
  skills_summary JSONB,
  lessons_completed INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  new_pos_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_progress_update_requests_swimmer ON public.progress_update_requests(swimmer_id);
CREATE INDEX idx_progress_update_requests_status ON public.progress_update_requests(status, created_at DESC);

-- Enable RLS
ALTER TABLE public.progress_update_requests ENABLE ROW LEVEL SECURITY;

-- Instructors and admins can view all requests
CREATE POLICY "Instructors can view progress requests"
ON public.progress_update_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Instructors can create requests
CREATE POLICY "Instructors can create progress requests"
ON public.progress_update_requests
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Instructors and admins can update requests
CREATE POLICY "Instructors can update progress requests"
ON public.progress_update_requests
FOR UPDATE
USING (
  has_role(auth.uid(), 'instructor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create function to automatically notify instructors when swimmer needs progress update
CREATE OR REPLACE FUNCTION notify_instructor_progress_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a VMRC swimmer reaches 11 or 12 lessons used
  IF NEW.is_vmrc_client = true AND 
     NEW.vmrc_sessions_used >= 11 AND
     OLD.vmrc_sessions_used < 11 THEN
    
    INSERT INTO instructor_notifications (
      swimmer_id,
      notification_type,
      message,
      metadata
    ) VALUES (
      NEW.id,
      'progress_update_needed',
      format('%s %s has used %s/%s sessions and needs a progress update for POS renewal',
        NEW.first_name, NEW.last_name, NEW.vmrc_sessions_used, NEW.vmrc_sessions_authorized),
      jsonb_build_object(
        'sessions_used', NEW.vmrc_sessions_used,
        'sessions_authorized', NEW.vmrc_sessions_authorized,
        'pos_number', NEW.vmrc_current_pos_number
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic notifications
DROP TRIGGER IF EXISTS trigger_notify_progress_update ON public.swimmers;
CREATE TRIGGER trigger_notify_progress_update
  AFTER UPDATE OF vmrc_sessions_used
  ON public.swimmers
  FOR EACH ROW
  EXECUTE FUNCTION notify_instructor_progress_update();

-- Add updated_at trigger for progress_update_requests
CREATE TRIGGER update_progress_update_requests_updated_at
  BEFORE UPDATE ON public.progress_update_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();