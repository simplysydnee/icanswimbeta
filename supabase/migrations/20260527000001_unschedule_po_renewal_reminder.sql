-- Unschedule the daily PO renewal reminder cron.
-- Renewal emails are now fully manual: admin clicks the Send button in /admin/pos.
-- Original schedule was added in 20260513000001_add_reminder_columns.sql.
-- Safe to re-run: errors are swallowed if the job doesn't exist or pg_cron is absent.
DO $$
BEGIN
  PERFORM cron.unschedule('po_renewal_reminder_daily');
EXCEPTION WHEN OTHERS THEN
  -- Ignore if cron extension absent or job already removed.
  NULL;
END $$;
