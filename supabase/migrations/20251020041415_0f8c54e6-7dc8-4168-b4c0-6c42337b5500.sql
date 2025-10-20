-- Create enum for article status
CREATE TYPE article_status AS ENUM ('draft', 'pending_review', 'published', 'archived');

-- Create enum for categories
CREATE TYPE news_category AS ENUM ('world', 'business', 'technology', 'sports', 'entertainment', 'science', 'politics', 'ai_innovation', 'lifestyle');

-- Create trending_topics table to store Google Trends data
CREATE TABLE public.trending_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  search_volume INTEGER,
  region TEXT DEFAULT 'global',
  category news_category,
  trend_data JSONB,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create articles table for generated news content
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  category news_category NOT NULL,
  author TEXT DEFAULT 'Cardinal AI',
  tags TEXT[],
  
  -- SEO fields
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  schema_markup JSONB,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  
  -- Article metadata
  trending_topic_id UUID REFERENCES public.trending_topics(id),
  status article_status DEFAULT 'draft',
  read_time TEXT,
  views_count INTEGER DEFAULT 0,
  
  -- Publishing control
  publish_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create publication_queue for automated publishing
CREATE TABLE public.publication_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  published BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_category ON public.articles(category);
CREATE INDEX idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX idx_trending_topics_processed ON public.trending_topics(processed);
CREATE INDEX idx_trending_topics_fetched_at ON public.trending_topics(fetched_at DESC);

-- Enable Row Level Security
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access (SEO-friendly)
CREATE POLICY "Anyone can read published articles"
  ON public.articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Anyone can read trending topics"
  ON public.trending_topics FOR SELECT
  USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  ) || '-' || substring(md5(random()::text) from 1 for 6);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate read time
CREATE OR REPLACE FUNCTION calculate_read_time(content TEXT)
RETURNS TEXT AS $$
DECLARE
  word_count INTEGER;
  minutes INTEGER;
BEGIN
  word_count := array_length(regexp_split_to_array(content, '\s+'), 1);
  minutes := GREATEST(1, ROUND(word_count / 200.0));
  RETURN minutes || ' min read';
END;
$$ LANGUAGE plpgsql;