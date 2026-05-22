-- Atomic transactional wrapper for booking N recurring sessions in one call.
--
-- Why this exists:
--   /api/bookings/recurring used to call book_session in a JS for-loop, with a
--   compensating cancel_booking loop on failure. That is non-atomic — a mid-loop
--   crash leaves orphaned bookings, and the rollback itself can fail.
--
-- What this does:
--   FOREACH session id, call book_session inside this function. PL/pgSQL function
--   calls share the outer statement's implicit transaction, so any RAISE EXCEPTION
--   below rolls back every prior INSERT and every booking_count++ / sessions_booked++
--   automatically — Postgres handles it.
--
-- book_session returns soft-fail JSON ({error: '...'} on failure). We convert that
-- into a hard RAISE so the transaction rolls back instead of partially succeeding.

CREATE OR REPLACE FUNCTION public.book_recurring_sessions(
  p_session_ids uuid[],
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
  v_session_id uuid;
  v_result jsonb;
  v_err text;
  v_booking_ids uuid[] := ARRAY[]::uuid[];
  v_session_dates text[] := ARRAY[]::text[];
BEGIN
  IF p_session_ids IS NULL OR array_length(p_session_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'p_session_ids cannot be empty';
  END IF;

  FOREACH v_session_id IN ARRAY p_session_ids
  LOOP
    v_result := book_session(
      p_session_id        := v_session_id,
      p_swimmer_id        := p_swimmer_id,
      p_parent_id         := p_parent_id,
      p_booking_type      := p_booking_type,
      p_purchase_order_id := p_purchase_order_id,
      p_status            := p_status
    );

    v_err := v_result->>'error';
    IF v_err IS NOT NULL THEN
      RAISE EXCEPTION 'book_session failed for %: %', v_session_id, v_err;
    END IF;

    v_booking_ids := v_booking_ids || (v_result->>'booking_id')::uuid;
    v_session_dates := v_session_dates || (v_result->>'session_date');
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'booking_ids', to_jsonb(v_booking_ids),
    'session_dates', to_jsonb(v_session_dates)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_recurring_sessions(uuid[], uuid, uuid, text, uuid, text)
  TO authenticated, service_role;
