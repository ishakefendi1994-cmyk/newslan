-- Add focus_keyword column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS focus_keyword TEXT;

-- Index for focus_keyword to help with potential search or filtering
CREATE INDEX IF NOT EXISTS idx_articles_focus_keyword ON articles(focus_keyword);

COMMENT ON COLUMN articles.focus_keyword IS 'Focus keyword for SEO purposes';
