-- 1. Create pages table
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    is_published BOOLEAN DEFAULT true,
    is_footer BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- 3. Add Policies
DROP POLICY IF EXISTS "Allow public read access to published pages" ON pages;
CREATE POLICY "Allow public read access to published pages"
ON pages FOR SELECT
USING (is_published = true);

DROP POLICY IF EXISTS "Allow authenticated users full access to pages" ON pages;
CREATE POLICY "Allow authenticated users full access to pages"
ON pages FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Add contact settings to site_settings
INSERT INTO site_settings (setting_key, setting_value)
VALUES 
    ('contact_whatsapp', '+62 823-7886-5775'),
    ('contact_email', 'redaksi@newslan.id')
ON CONFLICT (setting_key) DO NOTHING;
