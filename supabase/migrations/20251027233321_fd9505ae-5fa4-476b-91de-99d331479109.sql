-- Add Google News schema markup fields to articles
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS news_keywords TEXT[],
ADD COLUMN IF NOT EXISTS date_modified TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to generate NewsArticle schema
CREATE OR REPLACE FUNCTION public.generate_news_schema(article_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  article_record RECORD;
  schema_json JSONB;
BEGIN
  SELECT * INTO article_record FROM articles WHERE id = article_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  schema_json := jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'NewsArticle',
    'headline', article_record.title,
    'description', article_record.excerpt,
    'image', COALESCE(article_record.image_url, article_record.featured_image),
    'datePublished', article_record.published_at,
    'dateModified', COALESCE(article_record.date_modified, article_record.updated_at),
    'author', jsonb_build_object(
      '@type', 'Person',
      'name', COALESCE(article_record.author, 'Cardinal AI')
    ),
    'publisher', jsonb_build_object(
      '@type', 'Organization',
      'name', 'Cardinal News',
      'logo', jsonb_build_object(
        '@type', 'ImageObject',
        'url', 'https://cardinalnews.app/logo.png'
      )
    ),
    'mainEntityOfPage', jsonb_build_object(
      '@type', 'WebPage',
      '@id', 'https://cardinalnews.app/article/' || article_record.slug
    ),
    'articleSection', article_record.category,
    'keywords', article_record.meta_keywords,
    'wordCount', article_record.word_count
  );
  
  RETURN schema_json;
END;
$$;

-- Create trigger to update date_modified
CREATE OR REPLACE FUNCTION public.update_date_modified()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.date_modified = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_article_date_modified ON public.articles;
CREATE TRIGGER update_article_date_modified
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_date_modified();