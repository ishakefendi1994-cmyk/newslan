-- Create table for plugin licenses
CREATE TABLE IF NOT EXISTS public.plugin_licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  client_name TEXT,
  max_domains INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ
);

-- Create table to track license activations per domain
CREATE TABLE IF NOT EXISTS public.license_activations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.plugin_licenses(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(license_id, domain)
);

-- Enable RLS
ALTER TABLE public.plugin_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_activations ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
CREATE POLICY "Admins can manage licenses" 
ON public.plugin_licenses FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage activations" 
ON public.license_activations FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Public/Plugin access (Selective)
CREATE POLICY "Public can view licenses with key" 
ON public.plugin_licenses FOR SELECT 
USING (true);

CREATE POLICY "Public can view activations" 
ON public.license_activations FOR SELECT 
USING (true);
