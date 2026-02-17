-- AI Auto-Jobs Table
-- Stores configurations for automated AI article generation
CREATE TABLE IF NOT EXISTS ai_auto_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  task_key VARCHAR(64) UNIQUE NOT NULL,
  theme TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  style VARCHAR(50) DEFAULT 'Formal',
  model_type VARCHAR(50) DEFAULT 'Breaking News',
  generate_image BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  articles_per_run INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  last_run_status VARCHAR(50),
  total_runs INT DEFAULT 0,
  total_articles_generated INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_jobs_task_key ON ai_auto_jobs(task_key);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_active ON ai_auto_jobs(is_active);

-- RLS
ALTER TABLE ai_auto_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage AI jobs"
  ON ai_auto_jobs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to read active AI jobs by task_key"
  ON ai_auto_jobs FOR SELECT
  TO public
  USING (is_active = true);

COMMENT ON TABLE ai_auto_jobs IS 'Stores AI Creative Writer auto-job configurations for periodic generation';
