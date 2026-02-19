-- Consolidated fix for article view counting
-- Run this in the Supabase SQL Editor

-- 1. Ensure views_count column exists with default 0
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;

-- 2. Create or replace the RPC function
-- SECURITY DEFINER allows the function to bypass RLS for the update, 
-- which is necessary for public/non-logged-in view counting.
CREATE OR REPLACE FUNCTION increment_article_views(article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.articles
  SET views_count = views_count + 1
  WHERE id = article_id;
END;
$$;

-- 3. Explicitly grant permissions to common Supabase roles
GRANT EXECUTE ON FUNCTION increment_article_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_article_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_article_views(UUID) TO service_role;

-- 4. Create an index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_articles_views_count ON public.articles(views_count DESC);
