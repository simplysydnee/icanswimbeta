-- Allow instructors to read purchase orders for swimmers they teach (renewal queue + prefill).
-- Allow instructors to insert renewal PO rows (pending, linked to parent PO).

CREATE POLICY "Instructors can view POs for accessible swimmers"
  ON public.purchase_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'instructor'
    )
    AND public.instructor_has_swimmer_access(auth.uid(), swimmer_id)
  );

CREATE POLICY "Instructors can insert renewal purchase orders"
  ON public.purchase_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'instructor'
    )
    AND public.instructor_has_swimmer_access(auth.uid(), swimmer_id)
    AND COALESCE(status, '') = 'pending'
    AND parent_po_id IS NOT NULL
  );
