-- Migration: Add source_url to articles table
-- Used for duplicate detection and attribution tracking

ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create index for faster duplicate checks
CREATE INDEX IF NOT EXISTS idx_articles_source_url ON public.articles(source_url);

COMMENT ON COLUMN public.articles.source_url IS 'Original URL of the news source, used for duplicate prevention';
