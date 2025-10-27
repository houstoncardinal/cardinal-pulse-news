-- Create jobs table for tracking all automation operations
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('fetch_trends', 'generate_article', 'publish_article', 'manual_generate')),
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create settings table for platform configuration
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
  ('autopublish_enabled', 'true', 'Enable automatic publishing of generated articles'),
  ('fetch_interval_hours', '2', 'Hours between trend fetching runs'),
  ('generate_interval_hours', '2', 'Hours between article generation runs'),
  ('default_region', '"global"', 'Default region for trend fetching'),
  ('max_articles_per_run', '5', 'Maximum articles to generate per automation run'),
  ('article_min_words', '700', 'Minimum word count for generated articles'),
  ('article_max_words', '1200', 'Maximum word count for generated articles')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for jobs (read-only for authenticated users, full access for service role)
CREATE POLICY "Anyone can view jobs"
  ON public.jobs
  FOR SELECT
  USING (true);

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policy for settings (read for all, update requires auth)
CREATE POLICY "Anyone can view settings"
  ON public.settings
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can update settings"
  ON public.settings
  FOR UPDATE
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_type_status ON public.jobs(type, status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

-- Add function to update settings timestamp
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for settings updates
DROP TRIGGER IF EXISTS update_settings_timestamp_trigger ON public.settings;
CREATE TRIGGER update_settings_timestamp_trigger
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_timestamp();