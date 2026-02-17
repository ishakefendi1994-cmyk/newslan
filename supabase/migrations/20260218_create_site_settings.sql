-- Create site_settings table with safer column names
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read
DROP POLICY IF EXISTS "Allow public read for site_settings" ON site_settings;
CREATE POLICY "Allow public read for site_settings" ON site_settings
    FOR SELECT USING (true);

-- Allow authenticated update (for admins)
DROP POLICY IF EXISTS "Allow authenticated update for site_settings" ON site_settings;
CREATE POLICY "Allow authenticated update for site_settings" ON site_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Seed default homepage
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('default_homepage', '/')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
