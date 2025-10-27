-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for article images
CREATE POLICY "Anyone can view article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Service role can upload article images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'article-images');

CREATE POLICY "Service role can update article images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'article-images');

CREATE POLICY "Service role can delete article images"
ON storage.objects FOR DELETE
USING (bucket_id = 'article-images');