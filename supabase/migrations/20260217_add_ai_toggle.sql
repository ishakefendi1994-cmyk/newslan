
-- Migration to add AI Image toggle to RSS Auto Jobs
ALTER TABLE rss_auto_jobs 
ADD COLUMN IF NOT EXISTS use_ai_image BOOLEAN DEFAULT false;
