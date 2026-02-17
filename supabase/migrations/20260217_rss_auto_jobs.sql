-- RSS Auto-Jobs Table
-- Stores scheduled RSS fetch jobs with unique trigger URLs

CREATE TABLE IF NOT EXISTS rss_auto_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  task_key VARCHAR(64) UNIQUE NOT NULL,
  rss_url TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  is_published BOOLEAN DEFAULT true, -- Auto-publish or save as draft
  max_articles_per_run INT DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  last_run_status VARCHAR(50),
  last_run_articles INT DEFAULT 0,
  total_runs INT DEFAULT 0,
  total_articles_published INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rss_jobs_task_key ON rss_auto_jobs(task_key);
CREATE INDEX IF NOT EXISTS idx_rss_jobs_active ON rss_auto_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_rss_jobs_category ON rss_auto_jobs(category_id);

-- Enable Row Level Security
ALTER TABLE rss_auto_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users full access
CREATE POLICY "Allow authenticated users to view RSS jobs"
  ON rss_auto_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert RSS jobs"
  ON rss_auto_jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update RSS jobs"
  ON rss_auto_jobs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete RSS jobs"
  ON rss_auto_jobs FOR DELETE
  TO authenticated
  USING (true);

-- Public read access for cron trigger (no auth required)
CREATE POLICY "Allow public to read active jobs by task_key"
  ON rss_auto_jobs FOR SELECT
  TO public
  USING (is_active = true);

-- Comments
COMMENT ON TABLE rss_auto_jobs IS 'Stores RSS auto-job configurations with unique trigger URLs for cron automation';
COMMENT ON COLUMN rss_auto_jobs.task_key IS 'Unique 16-char key used in cron trigger URL';
COMMENT ON COLUMN rss_auto_jobs.is_published IS 'Whether to auto-publish articles (true) or save as draft (false)';
COMMENT ON COLUMN rss_auto_jobs.max_articles_per_run IS 'Maximum articles to process per cron trigger (spam prevention)';
