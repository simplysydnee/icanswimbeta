-- Update handle_late_cancellation to only apply to enrolled/approved swimmers
CREATE OR REPLACE FUNCTION public.handle_late_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      
      -- Only set flexible swimmer if client is enrolled/approved
      IF swimmer_record.enrollment_status IN ('enrolled', 'approved') THEN
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
          'Swimmer automatically moved to Flexible Swimmer status due to cancellation within 24 hours (Enrolled/Approved client only)'
        );
      ELSE
        -- Log that flexible status was not set due to enrollment status
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
          'late_cancellation_no_flexible_set',
          TRUE,
          'Late cancellation occurred but Flexible Swimmer status NOT set (client is not Enrolled/Approved)'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;