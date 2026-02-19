-- VERSION: 1.0 (Full Migration Ready)
-- Ini adalah skema lengkap dengan urutan eksekusi yang benar.
-- Jalankan script ini di SQL Editor Supabase Anda.

-- 0. AKTIFKAN EKSTENSI (Opsional tapi disarankan)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FUNGSI UNTUK OTOMATISASI UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- MASTER TABLES (TABEL UTAMAtanpa dependen)
-- ==========================================

-- PROFILES (Connect to Auth.Users)
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['guest'::text, 'member'::text, 'subscriber'::text, 'writer'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ADVERTISEMENTS
CREATE TABLE public.advertisements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['image'::text, 'html'::text, 'product_list'::text])),
  image_url text,
  link_url text,
  html_content text,
  placement text NOT NULL CHECK (placement = ANY (ARRAY['header_bottom'::text, 'article_before'::text, 'article_middle'::text, 'article_after'::text, 'sidebar'::text, 'section_sidebar'::text, 'feed_between'::text, 'skin_left'::text, 'skin_right'::text])),
  is_active boolean DEFAULT true,
  width integer,
  height integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- PRODUCT CATEGORIES (Marketplace)
CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL,
  color text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- CATEGORIES (Artikel Berita)
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  show_on_home boolean DEFAULT true,
  display_order integer DEFAULT 0,
  bg_color text DEFAULT '#E11D48'::text,
  sidebar_ad_id uuid REFERENCES public.advertisements(id) ON DELETE SET NULL,
  sidebar_ad_2_id uuid REFERENCES public.advertisements(id) ON DELETE SET NULL,
  sidebar_ad_3_id uuid REFERENCES public.advertisements(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- SITE SETTINGS
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- SHORTS (Video)
CREATE TABLE public.shorts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  video_url text NOT NULL,
  thumbnail_url text,
  views_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- DATA TABLES (TABEL YANG BERGANTUNG PADA MASTER)
-- ==========================================

-- PRODUCTS
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  price_range text,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ARTICLES
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  featured_image text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_premium boolean DEFAULT false,
  is_published boolean DEFAULT false,
  is_breaking boolean DEFAULT false,
  views_count integer DEFAULT 0,
  seo_title text,
  seo_description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- AFFILIATE LINKS
CREATE TABLE public.affiliate_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  url text NOT NULL,
  click_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- JUNCTION TABLES & SPECIAL LOGS
-- ==========================================

-- AD PRODUCTS (Produk di dalam Iklan)
CREATE TABLE public.ad_products (
  ad_id uuid NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  CONSTRAINT ad_products_pkey PRIMARY KEY (ad_id, product_id)
);

-- ARTICLE PRODUCTS (Produk di dalam Artikel)
CREATE TABLE public.article_products (
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT article_products_pkey PRIMARY KEY (article_id, product_id)
);

-- SHORT PRODUCTS (Produk di dalam Shorts)
CREATE TABLE public.short_products (
  short_id uuid NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT short_products_pkey PRIMARY KEY (short_id, product_id)
);

-- RSS AUTO JOBS
CREATE TABLE public.rss_auto_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name character varying NOT NULL,
  task_key character varying NOT NULL UNIQUE,
  rss_url text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_published boolean DEFAULT true,
  max_articles_per_run integer DEFAULT 3,
  is_active boolean DEFAULT true,
  last_run_at timestamp without time zone,
  last_run_status character varying,
  last_run_articles integer DEFAULT 0,
  total_runs integer DEFAULT 0,
  total_articles_published integer DEFAULT 0,
  show_source_attribution boolean DEFAULT true,
  use_ai_image boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- AI AUTO JOBS
CREATE TABLE public.ai_auto_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name character varying NOT NULL,
  task_key character varying NOT NULL UNIQUE,
  theme text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  style character varying DEFAULT 'Formal',
  model_type character varying DEFAULT 'Breaking News',
  generate_image boolean DEFAULT true,
  is_published boolean DEFAULT true,
  is_active boolean DEFAULT true,
  last_run_at timestamp without time zone,
  last_run_status character varying,
  total_runs integer DEFAULT 0,
  total_articles_generated integer DEFAULT 0,
  articles_per_run integer DEFAULT 1,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- ==========================================
-- MISC TABLES
-- ==========================================

CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  image_url text NOT NULL,
  link_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.complaints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'resolved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.navigation_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  url text NOT NULL,
  icon text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  location text DEFAULT 'main'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  target_id uuid NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.wp_import_log (
  wp_post_id integer NOT NULL PRIMARY KEY,
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE,
  imported_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- TRIGGERS UNTUK UPDATED_AT
-- ==========================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rss_auto_jobs_updated_at BEFORE UPDATE ON rss_auto_jobs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ai_auto_jobs_updated_at BEFORE UPDATE ON ai_auto_jobs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
