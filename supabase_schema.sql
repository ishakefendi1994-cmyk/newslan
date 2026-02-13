-- Enable RLS
-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('guest', 'member', 'subscriber', 'writer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.profiles(id),
  is_premium BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  is_breaking BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_range TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Links table
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL, -- e.g., 'Shopee', 'TikTok Shop', 'Tokopedia'
  url TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article-Product junction table
CREATE TABLE IF NOT EXISTS public.article_products (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, product_id)
);

-- Shorts table
CREATE TABLE IF NOT EXISTS public.shorts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Short-Product junction table
CREATE TABLE IF NOT EXISTS public.short_products (
  short_id UUID REFERENCES public.shorts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (short_id, product_id)
);

-- Stats Tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'view_article', 'view_short', 'click_affiliate'
  target_id UUID NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WordPress Import Link table
CREATE TABLE IF NOT EXISTS public.wp_import_log (
  wp_post_id INTEGER PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wp_import_log ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Articles
DROP POLICY IF EXISTS "Published non-premium articles are viewable by everyone" ON public.articles;
CREATE POLICY "Published non-premium articles are viewable by everyone" 
ON public.articles FOR SELECT 
USING (is_published = true AND is_premium = false);

DROP POLICY IF EXISTS "Premium articles are viewable by subscribers and admins" ON public.articles;
CREATE POLICY "Premium articles are viewable by subscribers and admins" 
ON public.articles FOR SELECT 
USING (
  is_published = true AND is_premium = true AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('subscriber', 'admin'))
  )
);

DROP POLICY IF EXISTS "Writers can manage their own articles" ON public.articles;
CREATE POLICY "Writers can manage their own articles" 
ON public.articles FOR ALL 
USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all articles" ON public.articles;
CREATE POLICY "Admins can manage all articles" 
ON public.articles FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Products & Affiliate Links
DROP POLICY IF EXISTS "Products and links are viewable by everyone" ON public.products;
CREATE POLICY "Products and links are viewable by everyone" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Affiliate links are viewable by everyone" ON public.affiliate_links;
CREATE POLICY "Affiliate links are viewable by everyone" ON public.affiliate_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage affiliate links" ON public.affiliate_links;
CREATE POLICY "Admins can manage affiliate links" ON public.affiliate_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Video Shorts
DROP POLICY IF EXISTS "Shorts are viewable by everyone" ON public.shorts;
CREATE POLICY "Shorts are viewable by everyone" ON public.shorts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage shorts" ON public.shorts;
CREATE POLICY "Admins can manage shorts" ON public.shorts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Short products are viewable by everyone" ON public.short_products;
CREATE POLICY "Short products are viewable by everyone" ON public.short_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage short products" ON public.short_products;
CREATE POLICY "Admins can manage short products" ON public.short_products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Article Products
DROP POLICY IF EXISTS "Article products are viewable by everyone" ON public.article_products;
CREATE POLICY "Article products are viewable by everyone" ON public.article_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage article products" ON public.article_products;
CREATE POLICY "Admins can manage article products" ON public.article_products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- WordPress Import Log
DROP POLICY IF EXISTS "Admins can manage wp import log" ON public.wp_import_log;
CREATE POLICY "Admins can manage wp import log" ON public.wp_import_log FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Functions and Triggers for Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
