-- Add job_type to RSS Auto Jobs
-- Allows distinguishing between standard RSS and smart trend tracking

ALTER TABLE rss_auto_jobs 
ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT 'standard';

-- Update existing rows
UPDATE rss_auto_jobs SET job_type = 'standard' WHERE job_type IS NULL;

-- Comment
COMMENT ON COLUMN rss_auto_jobs.job_type IS 'Type of the job: "standard" for regular RSS, "smart_trend" for Google News trends tracker';
