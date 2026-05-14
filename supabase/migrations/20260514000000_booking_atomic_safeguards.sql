-- Migration: Booking cancellation safeguard — decrement RPC for PO sessions_booked (BUG-00d)
-- Description:
--   Adds the symmetric counterpart of increment_purchase_order_sessions_booked() so the
--   cancellation service can keep funded clients' PO counters in sync after a booking is
--   cancelled. Without this, sessions_booked drifts upward forever and a swimmer can get
--   blocked from lessons they are entitled to.
--
-- Note on BUG-00b (race condition between two concurrent inserts):
--   A unique partial index on (session_id, swimmer_id) was considered for defense in
--   depth, but the recurring booking flow inserts multiple rows with the same session_id
--   (one per weekly occurrence, differentiated by session_date). A safe partial index
--   needs (session_id, swimmer_id, session_date) — deferred to a follow-up once the
--   session_date column type/presence is confirmed in production. For now the booking
--   routes rely on the shared checkBookingConflict() helper at the application layer.

-- Parameter order: required arg first, defaulted arg last (Postgres requires this).
-- PostgREST resolves the function by parameter NAMES, not position, so callers
-- can pass arguments in any order using named keys.
CREATE OR REPLACE FUNCTION public.decrement_purchase_order_sessions_booked(
  p_purchase_order_id uuid,
  p_decrement integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_sessions_booked integer;
BEGIN
  UPDATE public.purchase_orders
  SET sessions_booked = GREATEST(COALESCE(sessions_booked, 0) - COALESCE(p_decrement, 1), 0),
      updated_at = now()
  WHERE id = p_purchase_order_id
  RETURNING sessions_booked INTO v_new_sessions_booked;

  RETURN v_new_sessions_booked;
END;
$$;

COMMENT ON FUNCTION public.decrement_purchase_order_sessions_booked(uuid, integer) IS
  'Decrements purchase_orders.sessions_booked (clamped at 0) and returns the new value. Called from the cancellation service to keep funded-client counters consistent after a booking is cancelled.';
