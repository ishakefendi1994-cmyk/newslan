-- Add style and model columns to RSS Auto Jobs
-- Columns to store writing tone and article structure preference

ALTER TABLE rss_auto_jobs 
ADD COLUMN IF NOT EXISTS writing_style VARCHAR(50) DEFAULT 'Professional',
ADD COLUMN IF NOT EXISTS article_model VARCHAR(50) DEFAULT 'Straight News';

-- Update existing rows if any
UPDATE rss_auto_jobs SET writing_style = 'Professional' WHERE writing_style IS NULL;
UPDATE rss_auto_jobs SET article_model = 'Straight News' WHERE article_model IS NULL;

-- Log
COMMENT ON COLUMN rss_auto_jobs.writing_style IS 'Tone of the rewrite (Professional, Casual, etc)';
COMMENT ON COLUMN rss_auto_jobs.article_model IS 'Structure of the article (Straight News, Feature, etc)';
