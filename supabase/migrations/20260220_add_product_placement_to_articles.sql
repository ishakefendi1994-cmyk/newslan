-- Add product_placement column to articles table
-- Default to 'after' (bottom of article)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS product_placement VARCHAR DEFAULT 'after';

-- Constraint to ensure valid values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'articles_product_placement_check'
    ) THEN
        ALTER TABLE articles ADD CONSTRAINT articles_product_placement_check 
        CHECK (product_placement IN ('middle', 'after'));
    END IF;
END $$;

-- Enable RLS on article_products if not already enabled
ALTER TABLE IF EXISTS public.article_products ENABLE ROW LEVEL SECURITY;

-- Policies for article_products
DROP POLICY IF EXISTS "Article products are viewable by everyone" ON public.article_products;
CREATE POLICY "Article products are viewable by everyone" ON public.article_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage article products" ON public.article_products;
CREATE POLICY "Admins can manage article products" ON public.article_products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
