-- Migration: Create games table for HTML5 Game Portal
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  instructions TEXT,
  thumbnail TEXT,
  embed_url TEXT NOT NULL,
  category TEXT DEFAULT 'Arcade',
  tags TEXT[],
  width INTEGER DEFAULT 800,
  height INTEGER DEFAULT 600,
  play_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_manual BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'gamemonetize',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Games viewable by everyone" ON public.games;
CREATE POLICY "Games viewable by everyone"
  ON public.games FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage games" ON public.games;
CREATE POLICY "Admins manage games"
  ON public.games FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS games_slug_idx ON public.games(slug);
CREATE INDEX IF NOT EXISTS games_category_idx ON public.games(category);
CREATE INDEX IF NOT EXISTS games_is_active_idx ON public.games(is_active);
CREATE INDEX IF NOT EXISTS games_is_featured_idx ON public.games(is_featured);
CREATE INDEX IF NOT EXISTS games_external_id_idx ON public.games(external_id);
CREATE INDEX IF NOT EXISTS games_created_at_idx ON public.games(created_at DESC);
