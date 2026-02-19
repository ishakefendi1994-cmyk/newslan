-- Add search_keyword to RSS Auto Jobs
-- Used for the "Keyword Watcher" job type

ALTER TABLE rss_auto_jobs 
ADD COLUMN IF NOT EXISTS search_keyword TEXT;

-- Comment
COMMENT ON COLUMN rss_auto_jobs.search_keyword IS 'Specific keyword or topic to search for across all RSS feeds';
