-- Add verification tracking fields to articles table
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS verification_score INTEGER,
ADD COLUMN IF NOT EXISTS verification_status TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comment to explain the verification fields
COMMENT ON COLUMN public.articles.verification_score IS 'AI-generated accuracy score (0-100) from fact-checking pipeline';
COMMENT ON COLUMN public.articles.verification_status IS 'Verification status: verified, flagged, needs_review, rejected';
COMMENT ON COLUMN public.articles.rejection_reason IS 'Reason for rejection if article failed verification';

-- Create index for verification queries
CREATE INDEX IF NOT EXISTS idx_articles_verification_status ON public.articles(verification_status);
CREATE INDEX IF NOT EXISTS idx_articles_verification_score ON public.articles(verification_score);