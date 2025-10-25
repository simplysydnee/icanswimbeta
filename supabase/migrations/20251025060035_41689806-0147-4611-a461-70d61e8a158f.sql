-- Schedule auto-opening to run twice daily (5:55 PM and 6:05 PM PT)
-- These times account for the opening time of 6:00 PM PT with a safety window

-- First job: 5:55 PM PT = 1:55 AM UTC (next day) during PST, 12:55 AM UTC (next day) during PDT
SELECT cron.schedule(
  'open-draft-sessions-before',
  '55 1 * * *', -- 1:55 AM UTC (PST) / 12:55 AM UTC (PDT)
  $$
  SELECT net.http_post(
    url:='https://cmnnzyhncxkjyikjmpef.supabase.co/functions/v1/open-draft-sessions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbm56eWhuY3hranlpa2ptcGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNDE2NDgsImV4cCI6MjA3NjkxNzY0OH0.9WVHKObSp6K--mh80UlvBMmSPkjREUGkrtbf9n450qc"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Second job: 6:05 PM PT safety window  
SELECT cron.schedule(
  'open-draft-sessions-after',
  '5 2 * * *', -- 2:05 AM UTC (PST) / 1:05 AM UTC (PDT)
  $$
  SELECT net.http_post(
    url:='https://cmnnzyhncxkjyikjmpef.supabase.co/functions/v1/open-draft-sessions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbm56eWhuY3hranlpa2ptcGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNDE2NDgsImV4cCI6MjA3NjkxNzY0OH0.9WVHKObSp6K--mh80UlvBMmSPkjREUGkrtbf9n450qc"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);