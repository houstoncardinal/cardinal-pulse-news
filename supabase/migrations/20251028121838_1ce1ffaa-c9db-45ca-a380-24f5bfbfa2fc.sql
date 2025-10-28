-- Fix articles table RLS policies

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Anyone can update articles" ON articles;

-- Create proper admin-only policies for articles
CREATE POLICY "Admins can update articles"
ON articles FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert articles"
ON articles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete articles"
ON articles FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));