-- Add targeting columns to rss_auto_jobs
ALTER TABLE rss_auto_jobs 
ADD COLUMN IF NOT EXISTS trend_region TEXT DEFAULT 'local',
ADD COLUMN IF NOT EXISTS trend_niche TEXT DEFAULT 'any';

-- Add comment for documentation
COMMENT ON COLUMN rss_auto_jobs.trend_region IS 'Target region: local (Indonesian) or western (English/US)';
COMMENT ON COLUMN rss_auto_jobs.trend_niche IS 'Target niche: any, technology, business, sports, entertainment, science, health';
