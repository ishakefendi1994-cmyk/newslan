-- Add target_language to rss_auto_jobs
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'rss_auto_jobs' AND COLUMN_NAME = 'target_language') THEN
        ALTER TABLE rss_auto_jobs ADD COLUMN target_language TEXT DEFAULT 'id';
    END IF;
END $$;

-- Add default_ai_language to site_settings
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('default_ai_language', 'id')
ON CONFLICT (setting_key) DO NOTHING;
