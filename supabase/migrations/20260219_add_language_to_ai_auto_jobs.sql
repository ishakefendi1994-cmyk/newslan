-- Add target_language to ai_auto_jobs
ALTER TABLE ai_auto_jobs ADD COLUMN IF NOT EXISTS target_language TEXT DEFAULT 'id';

-- Ensure all existing jobs have 'id' as default if they didn't have it
UPDATE ai_auto_jobs SET target_language = 'id' WHERE target_language IS NULL;
