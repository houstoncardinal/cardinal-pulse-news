-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can read published articles" ON public.articles;

-- Create a new policy that allows viewing all articles (for admin purposes)
CREATE POLICY "Anyone can view all articles"
ON public.articles
FOR SELECT
USING (true);

-- Create a policy to allow updating articles
CREATE POLICY "Anyone can update articles"
ON public.articles
FOR UPDATE
USING (true)
WITH CHECK (true);