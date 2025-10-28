-- Create weather data storage table
CREATE TABLE IF NOT EXISTS public.weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_weather_data_fetched_at ON public.weather_data(fetched_at DESC);

-- Enable RLS
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

-- Allow public read access to weather data
CREATE POLICY "Weather data is viewable by everyone"
  ON public.weather_data
  FOR SELECT
  USING (true);

-- Allow service role to insert weather data
CREATE POLICY "Service role can insert weather data"
  ON public.weather_data
  FOR INSERT
  WITH CHECK (true);