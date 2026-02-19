-- Add is_footer column to pages
ALTER TABLE pages ADD COLUMN IF NOT EXISTS is_footer BOOLEAN DEFAULT false;
