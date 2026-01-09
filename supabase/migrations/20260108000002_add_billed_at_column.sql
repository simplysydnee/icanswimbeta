-- Migration: Add billed_at column to billing_line_items
-- Description: Adds billed_at timestamp to track when line items were billed
-- Also creates function to handle billing updates during XML export

-- Step 1: Add billed_at column to billing_line_items
ALTER TABLE public.billing_line_items
  ADD COLUMN IF NOT EXISTS billed_at TIMESTAMPTZ;

-- Step 2: Create function to mark line items as billed and update purchase orders
CREATE OR REPLACE FUNCTION mark_billing_line_items_as_billed(
  p_billing_period_id UUID
)
RETURNS TABLE (
  billed_count INTEGER,
  total_billed_amount_cents INTEGER,
  updated_po_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_billed_count INTEGER := 0;
  v_total_billed_amount_cents INTEGER := 0;
  v_updated_po_count INTEGER := 0;
BEGIN
  -- Update billing_line_items to mark as billed
  WITH updated_line_items AS (
    UPDATE public.billing_line_items
    SET
      status = 'included', -- Use 'included' status for billed items
      billed_at = now(),
      updated_at = now()
    WHERE billing_period_id = p_billing_period_id
      AND status = 'pending' -- Only update pending items
    RETURNING
      id,
      purchase_order_id,
      gross_amount_cents
  )
  SELECT
    COUNT(*),
    COALESCE(SUM(gross_amount_cents), 0)
  INTO v_billed_count, v_total_billed_amount_cents
  FROM updated_line_items;

  -- Update purchase_orders with billed amounts
  WITH po_updates AS (
    SELECT
      bli.purchase_order_id,
      SUM(bli.gross_amount_cents) as billed_amount
    FROM public.billing_line_items bli
    WHERE bli.billing_period_id = p_billing_period_id
      AND bli.status = 'included'
    GROUP BY bli.purchase_order_id
  )
  UPDATE public.purchase_orders po
  SET
    billed_amount_cents = COALESCE(po.billed_amount_cents, 0) + pu.billed_amount,
    billing_status = CASE
      WHEN COALESCE(po.billed_amount_cents, 0) + pu.billed_amount >= po.sessions_authorized * COALESCE(po.rate_cents, 9644) THEN 'billed'
      ELSE 'partial'
    END,
    billed_at = CASE
      WHEN po.billed_at IS NULL THEN now()
      ELSE po.billed_at
    END,
    updated_at = now()
  FROM po_updates pu
  WHERE po.id = pu.purchase_order_id;

  GET DIAGNOSTICS v_updated_po_count = ROW_COUNT;

  -- Update billing_periods status
  UPDATE public.billing_periods
  SET
    status = 'submitted',
    submitted_at = now(),
    updated_at = now()
  WHERE id = p_billing_period_id;

  RETURN QUERY SELECT v_billed_count, v_total_billed_amount_cents, v_updated_po_count;
END;
$$;

-- Step 3: Update generate_vmrc_ebilling_xml function to call mark_billing_line_items_as_billed
CREATE OR REPLACE FUNCTION generate_vmrc_ebilling_xml(
  p_billing_period_id UUID
)
RETURNS TABLE (
  xml_content TEXT,
  export_date TIMESTAMPTZ,
  record_count INTEGER,
  total_amount DECIMAL(10,2),
  billed_count INTEGER,
  total_billed_amount_cents INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xml TEXT;
  v_record_count INTEGER;
  v_total_amount DECIMAL(10,2);
  v_month INTEGER;
  v_year INTEGER;
  v_billed_count INTEGER;
  v_total_billed_amount_cents INTEGER;
BEGIN
  -- First mark line items as billed and update purchase orders
  SELECT billed_count, total_billed_amount_cents
  INTO v_billed_count, v_total_billed_amount_cents
  FROM mark_billing_line_items_as_billed(p_billing_period_id);

  -- Get billing period info
  SELECT month, year INTO v_month, v_year
  FROM public.billing_periods
  WHERE id = p_billing_period_id;

  -- Get billing line items for the period (now marked as included)
  SELECT
    COUNT(*),
    SUM(gross_amount_cents / 100.0),
    string_agg(
      format(
        '<ServiceRecord>
           <UCI>%s</UCI>
           <AuthorizationNumber>%s</AuthorizationNumber>
           <ServiceCode>%s</ServiceCode>
           <Subcode>%s</Subcode>
           <UnitType>%s</UnitType>
           <Units>%.2f</Units>
           <Rate>%.2f</Rate>
           <GrossAmount>%.2f</GrossAmount>
           <ServiceStartDate>%s</ServiceStartDate>
           <ServiceEndDate>%s</ServiceEndDate>
           <ConsumerName>%s</ConsumerName>
         </ServiceRecord>',
        bli.uci_number,
        bli.authorization_number,
        bli.service_code,
        bli.subcode,
        bli.unit_type,
        bli.units_billed,
        bli.rate_cents / 100.0,
        bli.gross_amount_cents / 100.0,
        to_char(bp.generated_at, 'YYYY-MM-DD'),
        to_char(bp.generated_at, 'YYYY-MM-DD'),
        bli.swimmer_name
      ),
      E'\n'
    )
  INTO v_record_count, v_total_amount, v_xml
  FROM public.billing_line_items bli
  JOIN public.billing_periods bp ON bli.billing_period_id = bp.id
  WHERE bli.billing_period_id = p_billing_period_id
    AND bli.status = 'included';

  -- Build complete XML document in DDS eBilling format
  v_xml := format(
    '<?xml version="1.0" encoding="UTF-8"?>
<DDS_eBilling_Export>
  <Header>
    <ProviderID>ICANSWIM</ProviderID>
    <BillingPeriod>%s-%02d</BillingPeriod>
    <ExportDate>%s</ExportDate>
    <RecordCount>%s</RecordCount>
    <TotalAmount>%.2f</TotalAmount>
  </Header>
  <ServiceRecords>
%s
  </ServiceRecords>
</DDS_eBilling_Export>',
    v_year,
    v_month,
    to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
    v_record_count,
    COALESCE(v_total_amount, 0),
    COALESCE(v_xml, '')
  );

  -- Update billing period with export info
  UPDATE public.billing_periods
  SET
    xml_file_name = format('VMRC_Billing_%s_%02d.xml', v_year, v_month),
    xml_exported_at = now()
  WHERE id = p_billing_period_id;

  RETURN QUERY SELECT v_xml, now(), v_record_count, COALESCE(v_total_amount, 0), v_billed_count, v_total_billed_amount_cents;
END;
$$;

-- Step 4: Create function to get billing summary for a period
CREATE OR REPLACE FUNCTION get_billing_period_summary(
  p_billing_period_id UUID
)
RETURNS TABLE (
  total_lessons_authorized INTEGER,
  total_lessons_billed INTEGER,
  total_lessons_remaining INTEGER,
  total_amount_billed_cents INTEGER,
  total_amount_pending_cents INTEGER,
  funding_source_summary JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get total lessons authorized from purchase orders linked to billing line items
  WITH po_summary AS (
    SELECT
      po.id,
      po.sessions_authorized,
      po.rate_cents,
      COUNT(bli.id) as lessons_billed,
      SUM(bli.gross_amount_cents) as amount_billed
    FROM public.billing_line_items bli
    JOIN public.purchase_orders po ON bli.purchase_order_id = po.id
    WHERE bli.billing_period_id = p_billing_period_id
      AND bli.status = 'included'
    GROUP BY po.id, po.sessions_authorized, po.rate_cents
  )
  SELECT
    COALESCE(SUM(sessions_authorized), 0),
    COALESCE(SUM(lessons_billed), 0),
    COALESCE(SUM(sessions_authorized - lessons_billed), 0),
    COALESCE(SUM(amount_billed), 0),
    COALESCE(SUM((sessions_authorized - lessons_billed) * rate_cents), 0),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'purchase_order_id', id,
          'lessons_authorized', sessions_authorized,
          'lessons_billed', lessons_billed,
          'lessons_remaining', sessions_authorized - lessons_billed,
          'amount_billed', amount_billed,
          'amount_pending', (sessions_authorized - lessons_billed) * rate_cents
        )
      ),
      '[]'::jsonb
    )
  INTO total_lessons_authorized, total_lessons_billed, total_lessons_remaining,
       total_amount_billed_cents, total_amount_pending_cents, funding_source_summary
  FROM po_summary;

  RETURN;
END;
$$;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN public.billing_line_items.billed_at IS 'Timestamp when this line item was billed and included in XML export';
COMMENT ON FUNCTION public.mark_billing_line_items_as_billed IS 'Marks billing line items as billed, updates purchase orders, and returns billing summary';
COMMENT ON FUNCTION public.get_billing_period_summary IS 'Returns billing summary including lessons authorized, billed, remaining, and amounts';