-- Create article_verifications table for Hector's fact-checking results
CREATE TABLE IF NOT EXISTS public.article_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accuracy_score INTEGER NOT NULL CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'flagged', 'needs_review', 'rejected')),
  fact_check_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_credibility JSONB NOT NULL DEFAULT '{}'::jsonb,
  legal_risk_assessment TEXT,
  recommendations TEXT[],
  verified_by TEXT NOT NULL DEFAULT 'Hector AI',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.article_verifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all verifications
CREATE POLICY "Admins can view verifications"
  ON public.article_verifications
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Service role can insert verifications
CREATE POLICY "Service role can insert verifications"
  ON public.article_verifications
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_article_verifications_article_id ON public.article_verifications(article_id);
CREATE INDEX idx_article_verifications_status ON public.article_verifications(verification_status);
CREATE INDEX idx_article_verifications_accuracy ON public.article_verifications(accuracy_score);