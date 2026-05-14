-- Atomic booking and cancellation functions
-- These use SELECT ... FOR UPDATE to prevent race conditions
-- from concurrent booking requests on the same session.

-- ── book_session ──────────────────────────────────────────────────────
-- Atomically validates capacity, checks for conflicts, creates booking,
-- and updates session.  Locks the session row so no other transaction
-- can insert a booking between the validation and the insert.

CREATE OR REPLACE FUNCTION book_session(
  p_session_id uuid,
  p_swimmer_id uuid,
  p_parent_id uuid,
  p_booking_type text DEFAULT 'lesson',
  p_purchase_order_id uuid DEFAULT NULL,
  p_status text DEFAULT 'confirmed'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session sessions%ROWTYPE;
  v_booking_id uuid;
  v_session_date date;
  v_conflict_count int;
BEGIN
  -- Lock the session row — no other transaction can modify it concurrently
  SELECT * INTO v_session FROM sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'session_not_found');
  END IF;

  -- Validate session is bookable
  IF v_session.status NOT IN ('available', 'open') THEN
    RETURN jsonb_build_object('error', 'session_not_available');
  END IF;

  -- Validate capacity
  IF v_session.is_full OR v_session.booking_count >= v_session.max_capacity THEN
    RETURN jsonb_build_object('error', 'session_full');
  END IF;

  -- Check hold (held by a different user and hold hasn't expired)
  IF v_session.held_by IS NOT NULL
     AND v_session.held_by != p_parent_id
     AND v_session.held_until > NOW() THEN
    RETURN jsonb_build_object(
      'error', 'session_held',
      'held_by', v_session.held_by,
      'held_until', v_session.held_until
    );
  END IF;

  -- Check for duplicate booking (same swimmer + session + non-cancelled status)
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE session_id = p_session_id
      AND swimmer_id = p_swimmer_id
      AND status NOT IN ('cancelled')
  ) THEN
    RETURN jsonb_build_object('error', 'duplicate_booking');
  END IF;

  -- Check for time conflicts (overlapping confirmed/pending bookings for same swimmer)
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings b
  JOIN sessions s ON s.id = b.session_id
  WHERE b.swimmer_id = p_swimmer_id
    AND b.status IN ('confirmed', 'pending', 'pending_auth')
    AND tstzrange(s.start_time, s.end_time) &&
        tstzrange(v_session.start_time, v_session.end_time);

  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object('error', 'swimmer_conflict');
  END IF;

  -- Compute session date in America/Los_Angeles timezone
  v_session_date := DATE(v_session.start_time AT TIME ZONE 'America/Los_Angeles');

  -- Insert the booking
  INSERT INTO bookings (
    session_id, swimmer_id, parent_id, booking_type,
    status, session_date, purchase_order_id
  ) VALUES (
    p_session_id, p_swimmer_id, p_parent_id, p_booking_type,
    p_status, v_session_date, p_purchase_order_id
  ) RETURNING id INTO v_booking_id;

  -- Update session atomically (row already locked, same transaction)
  UPDATE sessions SET
    booking_count = booking_count + 1,
    is_full = (booking_count + 1 >= max_capacity),
    status = CASE
      WHEN booking_count + 1 >= max_capacity THEN 'booked'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Clear hold if held by this parent
  IF v_session.held_by = p_parent_id THEN
    UPDATE sessions SET held_by = NULL, held_until = NULL
    WHERE id = p_session_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'session_date', v_session_date::text
  );
END;
$$;


-- ── cancel_booking ────────────────────────────────────────────────────
-- Atomically cancels a booking, decrements session capacity, and
-- conditionally creates a floating session (for late cancellations,
-- block cancellations, session closes, etc.).
--
-- p_is_late_cancel:
--   true  → create floating session + mark swimmer flexible
--   false → skip floating session / flexible mark (caller can pass flag
--            via p_late_cancel_type for special cases)
--
-- p_late_cancel_type:
--   'block_cancel'   → create floating session but DON'T mark flexible
--   'session_closed' → create floating session but DON'T mark flexible
--   NULL (standard)   → behavior follows p_is_late_cancel

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

  -- Decide whether to create a floating session
  v_should_create_floating := p_is_late_cancel
    OR p_late_cancel_type IN ('block_cancel', 'session_closed', 'admin_cancel');

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
