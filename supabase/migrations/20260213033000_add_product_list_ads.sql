-- Update advertisements table to support product_list type
ALTER TABLE public.advertisements DROP CONSTRAINT IF EXISTS advertisements_type_check;
ALTER TABLE public.advertisements ADD CONSTRAINT advertisements_type_check CHECK (type IN ('image', 'html', 'product_list'));

-- Create ad_products junction table
CREATE TABLE IF NOT EXISTS public.ad_products (
  ad_id UUID REFERENCES public.advertisements(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  PRIMARY KEY (ad_id, product_id)
);

-- Enable RLS
ALTER TABLE public.ad_products ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Ad products are viewable by everyone" ON public.ad_products;
CREATE POLICY "Ad products are viewable by everyone" ON public.ad_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage ad products" ON public.ad_products;
CREATE POLICY "Admins can manage ad products" ON public.ad_products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
