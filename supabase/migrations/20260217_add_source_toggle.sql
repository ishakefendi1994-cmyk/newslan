
-- Add show_source_attribution column to rss_auto_jobs
ALTER TABLE rss_auto_jobs 
ADD COLUMN IF NOT EXISTS show_source_attribution BOOLEAN DEFAULT true;

COMMENT ON COLUMN rss_auto_jobs.show_source_attribution IS 'Toggle to show/hide source attribution footer in generated articles';
