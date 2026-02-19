-- Add thumbnail_priority to rss_auto_jobs
-- Options: 'ai_priority', 'source_priority', 'source_only'
ALTER TABLE rss_auto_jobs 
ADD COLUMN IF NOT EXISTS thumbnail_priority TEXT DEFAULT 'ai_priority';

COMMENT ON COLUMN rss_auto_jobs.thumbnail_priority IS 'Strategy for article thumbnails: ai_priority, source_priority, or source_only';
