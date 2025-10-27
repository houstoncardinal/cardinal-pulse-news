-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule automation to run every 2 hours
-- This will fetch trends and generate articles automatically
SELECT cron.schedule(
  'cardinal-news-automation',
  '0 */2 * * *', -- Every 2 hours at the top of the hour
  $$
  SELECT
    net.http_post(
      url := 'https://uxmrmiuwpofulgfjckzy.supabase.co/functions/v1/run-automation',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bXJtaXV3cG9mdWxnZmpja3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTQ5OTEsImV4cCI6MjA3NjQ3MDk5MX0.CvzxQltAZ8IUYfIsbKDfaRgmJ_VnfNkyAfgOShIsZTA"}'::jsonb,
      body := '{"type": "full"}'::jsonb
    ) as request_id;
  $$
);

-- View scheduled cron jobs
SELECT * FROM cron.job;