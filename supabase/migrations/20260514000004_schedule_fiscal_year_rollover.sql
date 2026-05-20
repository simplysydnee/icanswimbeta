-- Schedule fiscal year rollover for July 1 at 8am PT (15:00 UTC)
-- Exhausts old POs ending June 30, creates new POs (July 1 – October 1),
-- and sends batch coordinator emails with per-row approve buttons
SELECT cron.schedule(
  'fiscal_year_rollover_july1',
  '0 15 1 7 *',
  $$SELECT net.http_post(
    url:='https://jtqlamkrhdfwtmaubfrc.supabase.co/functions/v1/fiscal-year-rollover',
    headers:='{"Content-Type":"application/json"}'::jsonb
  )$$
);
