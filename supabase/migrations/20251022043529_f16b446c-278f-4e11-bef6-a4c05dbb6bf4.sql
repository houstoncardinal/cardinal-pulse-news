-- Fix security issues from linter

-- 1. Add RLS policies for publication_queue table
CREATE POLICY "Service role can manage publication queue"
ON publication_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Fix security definer view by recreating without security definer
DROP VIEW IF EXISTS trending_analytics;
CREATE OR REPLACE VIEW trending_analytics 
WITH (security_invoker = true) AS
SELECT 
  region,
  category,
  COUNT(*) as total_trends,
  AVG(trend_strength) as avg_strength,
  SUM(CASE WHEN processed = true THEN 1 ELSE 0 END) as processed_count
FROM trending_topics
GROUP BY region, category;

-- 3. Fix function search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  ) || '-' || substring(md5(random()::text) from 1 for 6);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.calculate_read_time(content text)
RETURNS text AS $$
DECLARE
  word_count INTEGER;
  minutes INTEGER;
BEGIN
  word_count := array_length(regexp_split_to_array(content, '\s+'), 1);
  minutes := GREATEST(1, ROUND(word_count / 200.0));
  RETURN minutes || ' min read';
END;
$$ LANGUAGE plpgsql SET search_path = public;