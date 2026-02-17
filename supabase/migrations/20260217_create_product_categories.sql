-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL, -- Lucide icon name
    color TEXT NOT NULL, -- Tailwind color class
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access for product_categories" ON product_categories
    FOR SELECT USING (true);

-- Admin full access (assuming authenticated users are admins for now or based on your role logic)
CREATE POLICY "Allow full access for authenticated users on product_categories" ON product_categories
    FOR ALL USING (auth.role() = 'authenticated');

-- Seed with initial categories
INSERT INTO product_categories (name, slug, icon, color) VALUES
('Gawai', 'gawai', 'Smartphone', 'bg-emerald-100 text-emerald-600'),
('Komputer', 'komputer', 'Laptop', 'bg-blue-100 text-blue-600'),
('Elektronik', 'elektronik', 'Tv', 'bg-orange-100 text-orange-600'),
('Fashion', 'fashion', 'Shirt', 'bg-pink-100 text-pink-600'),
('Kuliner', 'kuliner', 'UtensilsCrossed', 'bg-yellow-100 text-yellow-600'),
('Kesehatan', 'kesehatan', 'HeartPulse', 'bg-red-100 text-red-600'),
('Kecantikan', 'kecantikan', 'Sparkles', 'bg-purple-100 text-purple-600'),
('Aksesoris', 'aksesoris', 'Package', 'bg-slate-100 text-slate-600'),
('Jasa', 'jasa', 'Briefcase', 'bg-emerald-100 text-emerald-600'),
('Produk Digital', 'produk-digital', 'Cpu', 'bg-cyan-100 text-cyan-600'),
('Agen Perjalanan', 'agen-perjalanan', 'Plane', 'bg-blue-100 text-blue-600'),
('Lainya', 'lainya', 'MoreHorizontal', 'bg-gray-100 text-gray-600'),
('Official Store', 'official-store', 'Tag', 'bg-indigo-100 text-indigo-600')
ON CONFLICT (name) DO NOTHING;
