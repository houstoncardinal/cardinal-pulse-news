-- Enable realtime for articles and trending_topics tables
ALTER TABLE public.articles REPLICA IDENTITY FULL;
ALTER TABLE public.trending_topics REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trending_topics;