-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to fetch trends every hour
SELECT cron.schedule(
  'fetch-trending-topics-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url:='https://uxmrmiuwpofulgfjckzy.supabase.co/functions/v1/fetch-trends',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:='{"region": "us", "limit": 20}'::jsonb
    ) as request_id;
  $$
);

-- Also schedule one for global trends every 2 hours
SELECT cron.schedule(
  'fetch-global-trends',
  '30 */2 * * *', -- Every 2 hours at minute 30
  $$
  SELECT
    net.http_post(
      url:='https://uxmrmiuwpofulgfjckzy.supabase.co/functions/v1/fetch-trends',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:='{"region": "global", "limit": 15}'::jsonb
    ) as request_id;
  $$
);