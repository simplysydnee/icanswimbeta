-- Migration: DB function to increment purchase_orders.sessions_booked
-- Description: Enables incrementing sessions_booked at DB level (no supabase.raw needed in TS).

CREATE OR REPLACE FUNCTION public.increment_purchase_order_sessions_booked(
  p_purchase_order_id uuid,
  p_increment integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_sessions_booked integer;
BEGIN
  UPDATE public.purchase_orders
  SET sessions_booked = COALESCE(sessions_booked, 0) + COALESCE(p_increment, 1),
      updated_at = now()
  WHERE id = p_purchase_order_id
  RETURNING sessions_booked INTO v_new_sessions_booked;

  RETURN v_new_sessions_booked;
END;
$$;

COMMENT ON FUNCTION public.increment_purchase_order_sessions_booked(uuid, integer) IS
  'Increments purchase_orders.sessions_booked and returns the new value.';

