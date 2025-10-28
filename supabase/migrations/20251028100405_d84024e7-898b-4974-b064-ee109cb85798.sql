-- Enable pg_cron and pg_net extensions for automation
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule trending topics refresh every hour
SELECT cron.schedule(
  'fetch-trending-topics-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uxmrmiuwpofulgfjckzy.supabase.co/functions/v1/automation-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bXJtaXV3cG9mdWxnZmpja3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTQ5OTEsImV4cCI6MjA3NjQ3MDk5MX0.CvzxQltAZ8IUYfIsbKDfaRgmJ_VnfNkyAfgOShIsZTA"}'::jsonb,
    body := '{"task": "trending"}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule weather updates every 15 minutes
SELECT cron.schedule(
  'update-global-weather-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uxmrmiuwpofulgfjckzy.supabase.co/functions/v1/fetch-global-weather',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bXJtaXV3cG9mdWxnZmpja3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTQ5OTEsImV4cCI6MjA3NjQ3MDk5MX0.CvzxQltAZ8IUYfIsbKDfaRgmJ_VnfNkyAfgOShIsZTA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule Jamaica weather story generation every 30 minutes
SELECT cron.schedule(
  'jamaica-weather-story-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uxmrmiuwpofulgfjckzy.supabase.co/functions/v1/generate-jamaica-weather-story',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bXJtaXV3cG9mdWxnZmpja3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTQ5OTEsImV4cCI6MjA3NjQ3MDk5MX0.CvzxQltAZ8IUYfIsbKDfaRgmJ_VnfNkyAfgOShIsZTA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule diverse article generation every 2 hours
SELECT cron.schedule(
  'generate-diverse-articles-2hours',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uxmrmiuwpofulgfjckzy.supabase.co/functions/v1/generate-diverse-articles',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bXJtaXV3cG9mdWxnZmpja3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTQ5OTEsImV4cCI6MjA3NjQ3MDk5MX0.CvzxQltAZ8IUYfIsbKDfaRgmJ_VnfNkyAfgOShIsZTA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);