-- Add enhanced fields to trending_topics for better trend management
ALTER TABLE trending_topics
ADD COLUMN IF NOT EXISTS trend_strength INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS related_queries TEXT[] DEFAULT '{}';

-- Add image and citation fields to articles
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_credit TEXT,
ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;

-- Create index for better performance on trending topics queries
CREATE INDEX IF NOT EXISTS idx_trending_topics_region ON trending_topics(region);
CREATE INDEX IF NOT EXISTS idx_trending_topics_strength ON trending_topics(trend_strength DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_processed ON trending_topics(processed);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- Create a view for powerful trend analytics
CREATE OR REPLACE VIEW trending_analytics AS
SELECT 
  region,
  category,
  COUNT(*) as total_trends,
  AVG(trend_strength) as avg_strength,
  SUM(CASE WHEN processed = true THEN 1 ELSE 0 END) as processed_count
FROM trending_topics
GROUP BY region, category;