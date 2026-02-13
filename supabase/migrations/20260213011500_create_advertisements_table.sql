-- Create advertisements table
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'html')),
  image_url TEXT,
  link_url TEXT,
  html_content TEXT,
  placement TEXT NOT NULL CHECK (placement IN ('header_bottom', 'article_before', 'article_middle', 'article_after', 'sidebar', 'feed_between')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Ads are viewable by everyone" ON public.advertisements;
CREATE POLICY "Ads are viewable by everyone" ON public.advertisements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage ads" ON public.advertisements;
CREATE POLICY "Admins can manage ads" ON public.advertisements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
