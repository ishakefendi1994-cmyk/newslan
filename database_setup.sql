-- SQL Script to Initialize Site Settings
-- You can run this in the Supabase SQL Editor

-- 1. Ensure the site_settings table exists (if not already created)
CREATE TABLE IF NOT EXISTS site_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert or Update core settings
INSERT INTO site_settings (setting_key, setting_value)
VALUES 
    ('site_name', 'Portal Berita Baru'),
    ('site_url', 'http://localhost:3000'),
    ('active_template', 'detik'), -- Pilihan: detik, tempo, magazine
    ('meta_description', 'Portal berita terkini dan terpercaya.'),
    ('logo_url', '/images/logo.png'),
    ('favicon_url', '/favicon.ico'),
    ('footer_text', '© 2024 Portal Berita. All rights reserved.'),
    ('facebook_url', '#'),
    ('instagram_url', '#'),
    ('twitter_url', '#')
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- 3. Optional: Add categories if the table is empty
-- INSERT INTO categories (name, slug, bg_color)
-- VALUES 
--     ('Nasional', 'nasional', '#e00034'),
--     ('Internasional', 'internasional', '#005596'),
--     ('Teknologi', 'teknologi', '#222222')
-- ON CONFLICT (slug) DO NOTHING;

-- 4. Note on Ads Constraint (Tugas pending di task.md)
-- Jika ingin mengupdate validasi lokasi iklan, jalankan ini:
-- ALTER TABLE advertisements 
-- DROP CONSTRAINT IF EXISTS check_placement_location;
-- ALTER TABLE advertisements 
-- ADD CONSTRAINT check_placement_location 
-- CHECK (placement IN ('home_top', 'home_middle', 'home_sidebar', 'detail_before', 'detail_middle', 'detail_after', 'category_top', 'category_sidebar'));
