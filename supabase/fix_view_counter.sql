-- Script untuk memperbaiki fitur hitung pengunjung artikel
-- Jalankan di Supabase SQL Editor

-- 1. Tambah kolom views_count jika belum ada
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;

-- 2. Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_articles_views_count 
ON public.articles(views_count DESC);

-- 3. Pastikan RPC function ada
CREATE OR REPLACE FUNCTION increment_article_views(article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.articles
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = article_id;
END;
$$;

-- 4. Verifikasi: Cek apakah kolom sudah ada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'articles' 
AND column_name = 'views_count';

-- 5. Test RPC function (ganti dengan article ID yang valid)
-- SELECT increment_article_views('your-article-id-here');
