-- Create article_history table to track all changes
CREATE TABLE IF NOT EXISTS public.article_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'published', 'unpublished', 'deleted'
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  previous_data JSONB,
  new_data JSONB,
  change_summary TEXT
);

-- Enable RLS
ALTER TABLE public.article_history ENABLE ROW LEVEL SECURITY;

-- Admins can view history
CREATE POLICY "Admins can view article history"
ON public.article_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create function to log article changes
CREATE OR REPLACE FUNCTION public.log_article_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type TEXT;
  change_summary TEXT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    action_type := 'deleted';
    change_summary := 'Article "' || OLD.title || '" was deleted';
    INSERT INTO public.article_history (article_id, action, changed_by, previous_data, change_summary)
    VALUES (OLD.id, action_type, auth.uid(), row_to_json(OLD)::jsonb, change_summary);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status = 'draft' AND NEW.status = 'published') THEN
      action_type := 'published';
      change_summary := 'Article "' || NEW.title || '" was published';
    ELSIF (OLD.status = 'published' AND NEW.status = 'draft') THEN
      action_type := 'unpublished';
      change_summary := 'Article "' || NEW.title || '" was unpublished';
    ELSE
      action_type := 'updated';
      change_summary := 'Article "' || NEW.title || '" was updated';
    END IF;
    INSERT INTO public.article_history (article_id, action, changed_by, previous_data, new_data, change_summary)
    VALUES (NEW.id, action_type, auth.uid(), row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, change_summary);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    action_type := 'created';
    change_summary := 'Article "' || NEW.title || '" was created';
    INSERT INTO public.article_history (article_id, action, new_data, change_summary)
    VALUES (NEW.id, action_type, row_to_json(NEW)::jsonb, change_summary);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger on articles table
CREATE TRIGGER article_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.log_article_change();

-- Create index for better performance
CREATE INDEX idx_article_history_article_id ON public.article_history(article_id);
CREATE INDEX idx_article_history_changed_at ON public.article_history(changed_at DESC);