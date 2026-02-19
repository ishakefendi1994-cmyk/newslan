-- Create pages table for dynamic content
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to published pages"
ON pages FOR SELECT
USING (is_published = true);

-- For admin operations, we usually rely on service_role or authenticated users with specific roles.
-- Adding a broad authenticated policy for now if needed, or keeping it locked for admin-only via service_role.
CREATE POLICY "Allow authenticated users full access to pages"
ON pages FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
