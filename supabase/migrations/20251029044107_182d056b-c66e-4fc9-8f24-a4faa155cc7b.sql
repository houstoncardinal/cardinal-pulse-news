-- Allow admins and service role to manage trending topics
CREATE POLICY "Admins can insert trending topics"
ON public.trending_topics
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can update trending topics"
ON public.trending_topics
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can delete trending topics"
ON public.trending_topics
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Allow service role full access for automated processes
CREATE POLICY "Service role can manage trending topics"
ON public.trending_topics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);