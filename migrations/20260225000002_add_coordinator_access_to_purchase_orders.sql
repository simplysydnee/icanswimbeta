-- Migration: Add coordinator RLS policy for purchase_orders table
-- Date: 2026-02-25
-- Description: Coordinators can view purchase orders for swimmers they coordinate

-- Create policy for coordinators to view purchase orders for their swimmers
CREATE POLICY "Coordinators can view purchase orders for their swimmers"
ON public.purchase_orders FOR SELECT
TO authenticated
USING (
  -- Admins can view all purchase orders
  has_role(auth.uid(), 'admin')
  -- Coordinators can view purchase orders for swimmers they coordinate
  OR (
    EXISTS (
      SELECT 1 FROM public.swimmers s
      WHERE s.id = purchase_orders.swimmer_id
      AND s.coordinator_id = auth.uid()
    )
  )
);

-- Note: This policy allows coordinators to view purchase orders in the coordinator hub
-- for approval and tracking purposes.