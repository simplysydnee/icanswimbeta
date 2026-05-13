-- Add PO extension tracking columns
-- When a PO's end_date has passed but sessions remain, the PO can be extended

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS is_extension BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS extension_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_end_date DATE;

-- Add FK from bookings to purchase_orders for audit trail
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
