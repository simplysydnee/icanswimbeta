-- Migration: Add billing columns to purchase_orders table
-- Description: Adds billing-related columns to support billing and revenue reporting

-- Step 1: Add billing columns to purchase_orders table
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'unbilled' CHECK (billing_status IN ('unbilled', 'billed', 'paid', 'partial', 'overdue', 'disputed')),
  ADD COLUMN IF NOT EXISTS billed_amount_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS billed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS billing_notes TEXT;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN public.purchase_orders.billing_status IS 'Billing status: unbilled, billed, paid, partial, overdue, disputed';
COMMENT ON COLUMN public.purchase_orders.billed_amount_cents IS 'Amount billed in cents';
COMMENT ON COLUMN public.purchase_orders.paid_amount_cents IS 'Amount paid in cents';
COMMENT ON COLUMN public.purchase_orders.due_date IS 'Payment due date';
COMMENT ON COLUMN public.purchase_orders.billed_at IS 'When the invoice was billed';
COMMENT ON COLUMN public.purchase_orders.paid_at IS 'When payment was received';
COMMENT ON COLUMN public.purchase_orders.invoice_number IS 'Invoice number for tracking';
COMMENT ON COLUMN public.purchase_orders.payment_reference IS 'Payment reference/transaction ID';
COMMENT ON COLUMN public.purchase_orders.billing_notes IS 'Notes related to billing';

-- Step 3: Create indexes for better performance on billing queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_billing_status ON public.purchase_orders(billing_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_due_date ON public.purchase_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_billed_at ON public.purchase_orders(billed_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_paid_at ON public.purchase_orders(paid_at);

-- Step 4: Update existing purchase orders to have default billing status
-- All existing POs should be marked as 'unbilled' by default
UPDATE public.purchase_orders
SET billing_status = 'unbilled'
WHERE billing_status IS NULL;

-- Step 5: Add trigger to update billing status based on amounts
-- When paid_amount_cents equals billed_amount_cents, mark as 'paid'
-- When paid_amount_cents is greater than 0 but less than billed_amount_cents, mark as 'partial'
CREATE OR REPLACE FUNCTION update_purchase_order_billing_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if billing amounts have changed
  IF NEW.billed_amount_cents IS NOT NULL AND NEW.paid_amount_cents IS NOT NULL THEN
    IF NEW.paid_amount_cents >= NEW.billed_amount_cents AND NEW.billed_amount_cents > 0 THEN
      NEW.billing_status = 'paid';
    ELSIF NEW.paid_amount_cents > 0 AND NEW.paid_amount_cents < NEW.billed_amount_cents THEN
      NEW.billing_status = 'partial';
    ELSIF NEW.billed_amount_cents > 0 AND NEW.paid_amount_cents = 0 THEN
      NEW.billing_status = 'billed';
    END IF;
  END IF;

  -- Check if due date has passed and status is still 'billed' or 'partial'
  IF NEW.due_date IS NOT NULL AND NEW.billing_status IN ('billed', 'partial') THEN
    IF NEW.due_date < CURRENT_DATE THEN
      NEW.billing_status = 'overdue';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for billing status updates
DROP TRIGGER IF EXISTS update_purchase_order_billing_status_trigger ON public.purchase_orders;
CREATE TRIGGER update_purchase_order_billing_status_trigger
  BEFORE INSERT OR UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_order_billing_status();