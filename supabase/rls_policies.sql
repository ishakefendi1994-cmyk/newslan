-- RLS POLICIES FOR NEW LAN
-- Jalankan di SQL Editor Supabase Anda.
-- Script ini aman dijalankan berulang kali (Idempotent).

-- 1. AKTIFKAN RLS PADA SEMUA TABEL
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_auto_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_auto_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wp_import_log ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTION UNTUK CEK ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.1 OTOMATIS CREATE PROFILE SAAT SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'admin')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger jika sudah ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. POLICIES (DROP SEBELUM CREATE AGAR TIDAK ERROR)

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- CATEGORIES
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.categories;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.categories;

CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins have full access to categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Enable insert for authenticated users only" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.categories FOR UPDATE USING (true);

-- PRODUCT_CATEGORIES
DROP POLICY IF EXISTS "Product categories are viewable by everyone" ON public.product_categories;
DROP POLICY IF EXISTS "Admins have full access to product_categories" ON public.product_categories;

CREATE POLICY "Product categories are viewable by everyone" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Admins have full access to product_categories" ON public.product_categories FOR ALL USING (public.is_admin());

-- ARTICLES
DROP POLICY IF EXISTS "Published articles are viewable by everyone" ON public.articles;
DROP POLICY IF EXISTS "Admins have full access to articles" ON public.articles;
DROP POLICY IF EXISTS "Enable insert for anon if development" ON public.articles;
DROP POLICY IF EXISTS "Enable update for anon if development" ON public.articles;

CREATE POLICY "Published articles are viewable by everyone" ON public.articles FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Admins have full access to articles" ON public.articles FOR ALL USING (public.is_admin());
CREATE POLICY "Enable insert for anon if development" ON public.articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for anon if development" ON public.articles FOR UPDATE USING (true);

-- PRODUCTS
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;

CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins have full access to products" ON public.products FOR ALL USING (public.is_admin());

-- ADVERTISEMENTS
DROP POLICY IF EXISTS "Ads are viewable by everyone" ON public.advertisements;
DROP POLICY IF EXISTS "Admins have full access to ads" ON public.advertisements;

CREATE POLICY "Ads are viewable by everyone" ON public.advertisements FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins have full access to ads" ON public.advertisements FOR ALL USING (public.is_admin());

-- BANNERS
DROP POLICY IF EXISTS "Banners are viewable by everyone" ON public.banners;
DROP POLICY IF EXISTS "Admins have full access to banners" ON public.banners;

CREATE POLICY "Banners are viewable by everyone" ON public.banners FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins have full access to banners" ON public.banners FOR ALL USING (public.is_admin());

-- SHORTS
DROP POLICY IF EXISTS "Shorts are viewable by everyone" ON public.shorts;
DROP POLICY IF EXISTS "Admins have full access to shorts" ON public.shorts;

CREATE POLICY "Shorts are viewable by everyone" ON public.shorts FOR SELECT USING (true);
CREATE POLICY "Admins have full access to shorts" ON public.shorts FOR ALL USING (public.is_admin());

-- SITE SETTINGS
DROP POLICY IF EXISTS "Admins have full access to site_settings" ON public.site_settings;
CREATE POLICY "Admins have full access to site_settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- NAVIGATION_LINKS
DROP POLICY IF EXISTS "Navigation links are viewable by everyone" ON public.navigation_links;
DROP POLICY IF EXISTS "Admins have full access to navigation_links" ON public.navigation_links;

CREATE POLICY "Navigation links are viewable by everyone" ON public.navigation_links FOR SELECT USING (true);
CREATE POLICY "Admins have full access to navigation_links" ON public.navigation_links FOR ALL USING (public.is_admin());

-- COMPLAINTS
DROP POLICY IF EXISTS "Users can view own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can insert own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins have full access to complaints" ON public.complaints;

CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins have full access to complaints" ON public.complaints FOR ALL USING (public.is_admin());

-- JOBS (RSS & AI)
DROP POLICY IF EXISTS "Admins have full access to rss_jobs" ON public.rss_auto_jobs;
DROP POLICY IF EXISTS "Admins have full access to ai_jobs" ON public.ai_auto_jobs;

CREATE POLICY "Admins have full access to rss_jobs" ON public.rss_auto_jobs FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to ai_jobs" ON public.ai_auto_jobs FOR ALL USING (public.is_admin());

-- JUNCTION TABLES
DROP POLICY IF EXISTS "Ad_products viewable by everyone" ON public.ad_products;
DROP POLICY IF EXISTS "Ad_products admin full access" ON public.ad_products;
CREATE POLICY "Ad_products viewable by everyone" ON public.ad_products FOR SELECT USING (true);
CREATE POLICY "Ad_products admin full access" ON public.ad_products FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Article_products viewable by everyone" ON public.article_products;
DROP POLICY IF EXISTS "Article_products admin full access" ON public.article_products;
CREATE POLICY "Article_products viewable by everyone" ON public.article_products FOR SELECT USING (true);
CREATE POLICY "Article_products admin full access" ON public.article_products FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Short_products viewable by everyone" ON public.short_products;
DROP POLICY IF EXISTS "Short_products admin full access" ON public.short_products;
CREATE POLICY "Short_products viewable by everyone" ON public.short_products FOR SELECT USING (true);
CREATE POLICY "Short_products admin full access" ON public.short_products FOR ALL USING (public.is_admin());

-- ANALYTICS
DROP POLICY IF EXISTS "Admins have full access to analytics" ON public.analytics_events;
CREATE POLICY "Admins have full access to analytics" ON public.analytics_events FOR ALL USING (public.is_admin());

-- AFFILIATE LINKS
DROP POLICY IF EXISTS "Affiliate links viewable by everyone" ON public.affiliate_links;
DROP POLICY IF EXISTS "Affiliate links admin full access" ON public.affiliate_links;
CREATE POLICY "Affiliate links viewable by everyone" ON public.affiliate_links FOR SELECT USING (true);
CREATE POLICY "Affiliate links admin full access" ON public.affiliate_links FOR ALL USING (public.is_admin());
