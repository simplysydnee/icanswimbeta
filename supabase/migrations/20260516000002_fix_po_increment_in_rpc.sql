-- Fix: Move purchase_orders.sessions_booked increment inside book_session RPC
--
-- Previously, the PO increment happened via a direct supabase client call in
-- single/route.ts and recurring/route.ts, OUTSIDE the database transaction.
-- This created a race condition: two concurrent booking requests for the same
-- swimmer's PO could both read the same sessions_booked value and write back
-- the same incremented value, losing one increment.
--
-- By moving the increment inside book_session RPC, it runs:
--   1. Inside the same implicit transaction as the booking insert
--   2. Under the FOR UPDATE lock on the session row, serializing access
--
-- Only increments when p_status = 'confirmed' (not pending_auth).
-- Increments sessions_booked by 1 (not a calculated value read earlier)
-- so concurrent calls each correctly add 1.

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

  -- Increment purchase order sessions_booked (only for confirmed bookings)
  -- This runs inside the FOR UPDATE lock, preventing the race condition
  -- where two concurrent bookings for the same PO both read the same count.
  IF p_purchase_order_id IS NOT NULL AND p_status = 'confirmed' THEN
    UPDATE purchase_orders
    SET sessions_booked = COALESCE(sessions_booked, 0) + 1,
        updated_at = NOW()
    WHERE id = p_purchase_order_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'session_date', v_session_date::text
  );
END;
$$;
