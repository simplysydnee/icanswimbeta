-- Migration: Fix RPC function signature order for PostgREST matching
-- Description: Redefines increment_purchase_order_sessions_booked with parameter order:
--   (p_increment integer, p_purchase_order_id uuid)
-- This matches how PostgREST resolves function params based on the RPC payload order.

CREATE OR REPLACE FUNCTION public.increment_purchase_order_sessions_booked(
  p_increment integer DEFAULT 1,
  p_purchase_order_id uuid
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

COMMENT ON FUNCTION public.increment_purchase_order_sessions_booked(integer, uuid) IS
  'Increments purchase_orders.sessions_booked and returns the new value.';

