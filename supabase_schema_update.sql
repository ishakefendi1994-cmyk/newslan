-- Add columns to categories table for home page configuration
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT true;

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#E11D48';

-- Optional: Update existing categories to have a default order and color
UPDATE categories SET display_order = 0 WHERE display_order IS NULL;
UPDATE categories SET bg_color = '#E11D48' WHERE bg_color IS NULL;

-- Create table for dynamic navigation menus
CREATE TABLE IF NOT EXISTS navigation_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT, -- Lucide-react icon name
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    location TEXT DEFAULT 'main', -- 'main', 'utility', 'mobile', 'footer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert sample data to match current hardcoded links
INSERT INTO navigation_links (label, url, display_order, location) VALUES 
('Harian', '/harian', 1, 'utility'),
('Mingguan', '/mingguan', 2, 'utility'),
('Newslan Plus', '/premium', 3, 'utility');

INSERT INTO navigation_links (label, url, display_order, location) VALUES 
('News', '/news', 1, 'mobile'),
('Trending', '/trending', 2, 'mobile'),
('Shorts', '/shorts', 3, 'mobile'),
('Products', '/products', 4, 'mobile');
