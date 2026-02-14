-- Create site_settings table for global configuration
CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    site_name TEXT DEFAULT 'NEWSLAN.ID',
    site_description TEXT DEFAULT 'Portal berita terpercaya dengan fokus pada edukasi, investigasi, dan pemberitaan akurat.',
    site_logo TEXT,
    site_favicon TEXT,
    site_author_avatar TEXT,
    header_scripts TEXT,
    footer_scripts TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO site_settings (id, site_name, site_description)
VALUES ('main', 'NEWSLAN.ID', 'Portal berita terpercaya dengan fokus pada edukasi, investigasi, dan pemberitaan akurat.')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public settings are viewable by everyone" 
ON site_settings FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage site settings" 
ON site_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
