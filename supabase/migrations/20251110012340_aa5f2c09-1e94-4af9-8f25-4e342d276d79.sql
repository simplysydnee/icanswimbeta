-- Update the trigger function to set correct assessment status
CREATE OR REPLACE FUNCTION public.notify_instructor_progress_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When a VMRC swimmer reaches 11 or 12 lessons used
  IF NEW.is_vmrc_client = true AND 
     NEW.vmrc_sessions_used >= 11 AND
     OLD.vmrc_sessions_used < 11 THEN
    
    -- Create notification for instructors
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
    
    -- Set assessment status to pos_authorization_needed
    NEW.assessment_status := 'pos_authorization_needed';
    NEW.last_status_update := now();
  END IF;
  
  RETURN NEW;
END;
$$;