-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the auto-cancel job to run every hour
SELECT cron.schedule(
  'auto-cancel-pending-assessments',
  '0 * * * *', -- Every hour on the hour
  $$
  SELECT
    net.http_post(
        url:='https://cmnnzyhncxkjyikjmpef.supabase.co/functions/v1/auto-cancel-pending-assessments',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbm56eWhuY3hranlpa2ptcGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNDE2NDgsImV4cCI6MjA3NjkxNzY0OH0.9WVHKObSp6K--mh80UlvBMmSPkjREUGkrtbf9n450qc"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);