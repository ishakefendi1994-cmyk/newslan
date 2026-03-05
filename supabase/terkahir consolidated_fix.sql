-- ========================================================
-- CONSOLIDATED SCHEMA & RLS FIX (NEW LAN) - VERSION 3
-- ========================================================
-- Fixed: Included ALL missing tables and ensured correct foreign key order.

-- 1. BASE TABLES (Level 0)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id),
  username text UNIQUE,
  full_name text,
  avatar_url text,
  role text DEFAULT 'member' CHECK (role = ANY (ARRAY['guest', 'member', 'subscriber', 'writer', 'admin']::text[])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.advertisements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['image', 'html', 'product_list']::text[])),
  image_url text,
  link_url text,
  html_content text,
  placement text NOT NULL CHECK (placement = ANY (ARRAY['header_bottom', 'article_before', 'article_middle', 'article_after', 'sidebar', 'section_sidebar', 'feed_between', 'sidebar_right', 'skin_left', 'skin_right']::text[])),
  is_active boolean DEFAULT true,
  width integer,
  height integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT advertisements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT product_categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.plugin_licenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_key text NOT NULL UNIQUE,
  registered_domain text,
  status text DEFAULT 'active' CHECK (status = ANY (ARRAY['active', 'suspended', 'expired']::text[])),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  last_verified_at timestamptz,
  client_name text,
  max_domains integer DEFAULT 1,
  notes text,
  CONSTRAINT plugin_licenses_pkey PRIMARY KEY (id)
);

-- 2. DEPENDENT TABLES (Level 1)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  show_on_home boolean DEFAULT true,
  display_order integer DEFAULT 0,
  bg_color text DEFAULT '#E11D48'::text,
  sidebar_ad_id uuid REFERENCES public.advertisements(id),
  sidebar_ad_2_id uuid REFERENCES public.advertisements(id),
  sidebar_ad_3_id uuid REFERENCES public.advertisements(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  price_range text,
  category_id uuid REFERENCES public.product_categories(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.shorts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  video_url text NOT NULL,
  thumbnail_url text,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT shorts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.license_activations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.plugin_licenses(id),
  domain text NOT NULL,
  activated_at timestamptz DEFAULT now(),
  CONSTRAINT license_activations_pkey PRIMARY KEY (id)
);

-- 3. DEPENDENT TABLES (Level 2)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  featured_image text,
  category_id uuid REFERENCES public.categories(id),
  author_id uuid REFERENCES public.profiles(id),
  is_premium boolean DEFAULT false,
  is_published boolean DEFAULT false,
  is_breaking boolean DEFAULT false,
  views_count integer DEFAULT 0,
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  source_url text,
  product_placement character varying DEFAULT 'after' CHECK (product_placement::text = ANY (ARRAY['middle', 'after']::text[])),
  focus_keyword text,
  CONSTRAINT articles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.ai_auto_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  task_key character varying NOT NULL UNIQUE,
  theme text NOT NULL,
  category_id uuid REFERENCES public.categories(id),
  style character varying DEFAULT 'Formal',
  model_type character varying DEFAULT 'Breaking News',
  generate_image boolean DEFAULT true,
  is_published boolean DEFAULT true,
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  last_run_status character varying,
  total_runs integer DEFAULT 0,
  total_articles_generated integer DEFAULT 0,
  articles_per_run integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  target_language text DEFAULT 'id',
  CONSTRAINT ai_auto_jobs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.rss_auto_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  task_key character varying NOT NULL UNIQUE,
  rss_url text NOT NULL,
  category_id uuid REFERENCES public.categories(id),
  is_published boolean DEFAULT true,
  max_articles_per_run integer DEFAULT 3,
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  last_run_status character varying,
  last_run_articles integer DEFAULT 0,
  total_runs integer DEFAULT 0,
  total_articles_published integer DEFAULT 0,
  show_source_attribution boolean DEFAULT true,
  use_ai_image boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  target_language text DEFAULT 'id',
  writing_style character varying DEFAULT 'Professional',
  article_model character varying DEFAULT 'Straight News',
  job_type character varying DEFAULT 'standard',
  search_keyword text,
  trend_region text DEFAULT 'local',
  trend_niche text DEFAULT 'any',
  thumbnail_priority text DEFAULT 'ai_priority',
  CONSTRAINT rss_auto_jobs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'processing', 'resolved', 'rejected']::text[])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT complaints_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  target_id uuid NOT NULL,
  user_id uuid REFERENCES public.profiles(id),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id)
);

-- 4. JUNCTION & UTILITY TABLES (Level 3)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.ad_products (
  ad_id uuid NOT NULL REFERENCES public.advertisements(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  display_order integer DEFAULT 0,
  CONSTRAINT ad_products_pkey PRIMARY KEY (ad_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.article_products (
  article_id uuid NOT NULL REFERENCES public.articles(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  CONSTRAINT article_products_pkey PRIMARY KEY (article_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.short_products (
  short_id uuid NOT NULL REFERENCES public.shorts(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  CONSTRAINT short_products_pkey PRIMARY KEY (short_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id),
  store_name text NOT NULL,
  url text NOT NULL,
  click_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT affiliate_links_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.wp_import_log (
  wp_post_id integer NOT NULL,
  article_id uuid REFERENCES public.articles(id),
  imported_at timestamptz DEFAULT now(),
  CONSTRAINT wp_import_log_pkey PRIMARY KEY (wp_post_id)
);

-- 5. STANDALONE TABLES
-- ========================================================

CREATE TABLE IF NOT EXISTS public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  image_url text NOT NULL,
  link_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT banners_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  is_published boolean DEFAULT true,
  is_footer boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT pages_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.navigation_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  icon text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  location text DEFAULT 'main',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT navigation_links_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.telegram_drafts (
  id text NOT NULL,
  chat_id bigint,
  title text,
  content text,
  excerpt text,
  video_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT telegram_drafts_pkey PRIMARY KEY (id)
);

-- 6. HELPER FUNCTIONS & TRIGGERS
-- ========================================================

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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. RLS POLICIES (COMPREHENSIVE)
-- ========================================================

-- Enable RLS on all tables
DO $$
DECLARE
    table_name text;
    tables_list text[] := ARRAY[
        'profiles', 'advertisements', 'categories', 'articles', 
        'product_categories', 'products', 'ad_products', 'affiliate_links', 
        'ai_auto_jobs', 'rss_auto_jobs', 'pages', 'site_settings', 
        'banners', 'shorts', 'complaints', 'navigation_links', 
        'plugin_licenses', 'license_activations', 'telegram_drafts', 
        'wp_import_log', 'analytics_events', 'article_products', 'short_products'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_list LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END LOOP;
END $$;

-- 7.1. PUBLIC CONTENT (SELECT)
-----------------------------------------------------------
DROP POLICY IF EXISTS "Public select published" ON public.articles;
CREATE POLICY "Public select published" ON public.articles FOR SELECT USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Public select active ads" ON public.advertisements;
CREATE POLICY "Public select active ads" ON public.advertisements FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Public select active banners" ON public.banners;
CREATE POLICY "Public select active banners" ON public.banners FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Public select pages" ON public.pages;
CREATE POLICY "Public select pages" ON public.pages FOR SELECT USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Public select nav links" ON public.navigation_links;
CREATE POLICY "Public select nav links" ON public.navigation_links FOR SELECT USING (is_active = true OR public.is_admin());

-- General public access for basic tables
CREATE POLICY "Public select categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public select products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public select product cats" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Public select affiliate links" ON public.affiliate_links FOR SELECT USING (true);
CREATE POLICY "Public select shorts" ON public.shorts FOR SELECT USING (true);
CREATE POLICY "Public select profiles" ON public.profiles FOR SELECT USING (true);

-- 7.2. ADMIN ACCESS (ALL)
-----------------------------------------------------------
DO $$
DECLARE
    table_name text;
    tables_list text[] := ARRAY[
        'profiles', 'advertisements', 'categories', 'articles', 
        'product_categories', 'products', 'ad_products', 'affiliate_links', 
        'ai_auto_jobs', 'rss_auto_jobs', 'pages', 'site_settings', 
        'banners', 'shorts', 'complaints', 'navigation_links', 
        'plugin_licenses', 'license_activations', 'telegram_drafts', 
        'wp_import_log', 'analytics_events', 'article_products', 'short_products'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_list LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admin full access" ON public.%I', table_name);
        EXECUTE format('CREATE POLICY "Admin full access" ON public.%I FOR ALL USING (public.is_admin())', table_name);
    END LOOP;
END $$;

-- 7.3. USER SPECIFIC POLICIES
-----------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own complaints" ON public.complaints;
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own complaints" ON public.complaints;
CREATE POLICY "Users can insert own complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert analytics" ON public.analytics_events;
CREATE POLICY "Users can insert analytics" ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
