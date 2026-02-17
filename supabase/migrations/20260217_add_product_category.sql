-- Add category column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;

-- Index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
