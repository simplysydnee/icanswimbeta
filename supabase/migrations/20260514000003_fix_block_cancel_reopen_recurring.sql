-- Fix block cancel: reopen recurring slots instead of creating floating sessions
-- When a parent cancels their entire recurring block in a planned timely manner,
-- each cancelled session should be reopened with status = 'open' so it's
-- available for a new family to pick up as a recurring slot.

CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id uuid,
  p_cancelled_by uuid,
  p_cancel_reason text DEFAULT NULL,
  p_cancel_source text DEFAULT 'admin',
  p_is_late_cancel boolean DEFAULT false,
  p_late_cancel_type text DEFAULT NULL,
  p_late_cancel_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_session sessions%ROWTYPE;
  v_swimmer record;
  v_floating_session_id uuid;
  v_hours_before_session numeric;
  v_cancellation_type text;
  v_should_create_floating boolean;
  v_should_mark_flexible boolean;
  v_instructor_name text;
  v_swimmer_name text;
  v_has_funding_source boolean;
BEGIN
  -- Lock and read the booking
  SELECT * INTO v_booking FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'booking_not_found');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object('error', 'already_cancelled');
  END IF;

  IF v_booking.status = 'completed' THEN
    RETURN jsonb_build_object('error', 'cannot_cancel_completed');
  END IF;

  -- Only admins can cancel pending_auth bookings
  IF v_booking.status = 'pending_auth' AND p_cancel_source != 'admin' THEN
    RETURN jsonb_build_object('error', 'pending_auth_admin_only');
  END IF;

  -- Lock and read the session
  SELECT * INTO v_session FROM sessions
  WHERE id = v_booking.session_id
  FOR UPDATE;

  -- Calculate hours before session
  v_hours_before_session := EXTRACT(EPOCH FROM (v_session.start_time - NOW())) / 3600;

  -- Update booking to cancelled
  UPDATE bookings SET
    status = 'cancelled',
    cancel_reason = COALESCE(p_cancel_reason, cancel_reason),
    cancel_source = p_cancel_source,
    canceled_at = NOW(),
    canceled_by = p_cancelled_by,
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- Decrement session booking count
  UPDATE sessions SET
    booking_count = GREATEST(0, booking_count - 1),
    is_full = false,
    updated_at = NOW()
  WHERE id = v_booking.session_id;

  -- Reopen recurring slot for planned block cancellations
  -- (parent cancels recurring block on time, not late/unexcused)
  IF v_session.is_recurring AND p_cancel_source = 'parent' AND NOT p_is_late_cancel THEN
    UPDATE sessions SET status = 'open' WHERE id = v_booking.session_id;
  END IF;

  -- Decide whether to create a floating session
  v_should_create_floating := p_is_late_cancel
    OR p_late_cancel_type IN ('block_cancel', 'session_closed', 'admin_cancel', 'unexcused');

  -- Decide whether to mark swimmer as flexible (only on true late cancel)
  v_should_mark_flexible := p_is_late_cancel
    AND p_late_cancel_type IS NULL;

  -- Floating session creation (only for future sessions)
  IF v_should_create_floating AND v_session.start_time > NOW() THEN
    INSERT INTO floating_sessions (
      original_session_id, original_booking_id,
      available_until, month_year, status
    ) VALUES (
      v_booking.session_id, p_booking_id,
      v_session.start_time,
      TO_CHAR(v_session.start_time AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM'),
      'available'
    ) RETURNING id INTO v_floating_session_id;

    -- Mark swimmer as flexible only for true late cancellations
    IF v_should_mark_flexible THEN
      UPDATE swimmers SET
        flexible_swimmer = true,
        flexible_swimmer_reason = COALESCE(p_late_cancel_note, 'late_cancellation'),
        flexible_swimmer_set_at = NOW()
      WHERE id = v_booking.swimmer_id;
    END IF;
  END IF;

  -- Increment unexcused late cancel counter (when type is 'unexcused')
  IF p_late_cancel_type = 'unexcused' THEN
    UPDATE swimmers SET
      unexcused_late_cancel_count = COALESCE(unexcused_late_cancel_count, 0) + 1
    WHERE id = v_booking.swimmer_id;
  END IF;

  -- Determine cancellation_type for analytics
  v_cancellation_type := CASE
    WHEN v_session.is_recurring THEN 'block'
    WHEN v_booking.booking_type = 'assessment' THEN 'assessment'
    ELSE 'single'
  END;

  -- Get instructor name
  BEGIN
    SELECT full_name INTO v_instructor_name
    FROM profiles
    WHERE id = v_session.instructor_id;
  EXCEPTION WHEN OTHERS THEN
    v_instructor_name := NULL;
  END;

  -- Get swimmer info
  BEGIN
    SELECT first_name || ' ' || last_name, funding_source_id IS NOT NULL
    INTO v_swimmer_name, v_has_funding_source
    FROM swimmers
    WHERE id = v_booking.swimmer_id;
  EXCEPTION WHEN OTHERS THEN
    v_swimmer_name := 'Unknown';
    v_has_funding_source := false;
  END;

  -- Insert cancellations record
  INSERT INTO cancellations (
    booking_id, session_id, swimmer_id, parent_id,
    canceled_by, cancellation_type, block_id,
    session_date, session_start_time, session_end_time,
    session_location, instructor_id, instructor_name,
    swimmer_name, swimmer_has_funding_source,
    hours_before_session, was_late_cancellation,
    cancel_reason, cancel_source,
    created_floating_session, floating_session_id
  ) VALUES (
    p_booking_id, v_booking.session_id, v_booking.swimmer_id, v_booking.parent_id,
    p_cancelled_by, v_cancellation_type,
    CASE WHEN v_session.is_recurring THEN v_booking.id ELSE NULL END,
    v_session.start_time, v_session.start_time, v_session.end_time,
    v_session.location, v_session.instructor_id, v_instructor_name,
    v_swimmer_name, v_has_funding_source,
    ROUND(v_hours_before_session::numeric, 2),
    p_is_late_cancel,
    p_cancel_reason, p_cancel_source,
    v_floating_session_id IS NOT NULL,
    v_floating_session_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'created_floating_session', v_floating_session_id IS NOT NULL,
    'floating_session_id', v_floating_session_id,
    'new_booking_count', GREATEST(0, (SELECT booking_count FROM sessions WHERE id = v_booking.session_id))
  );
END;
$$;
