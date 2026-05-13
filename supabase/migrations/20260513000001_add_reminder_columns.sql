-- Add reminder tracking columns to purchase_orders

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auth_reminder_sent_at TIMESTAMPTZ;

-- Schedule the daily reminder job (10am PT = 5pm UTC)
SELECT cron.schedule(
  'po_renewal_reminder_daily',
  '0 17 * * *',
  $$SELECT net.http_post(
    url:='https://jtqlamkrhdfwtmaubfrc.supabase.co/functions/v1/po-renewal-reminder',
    headers:='{"Content-Type":"application/json"}'::jsonb
  )$$
);
