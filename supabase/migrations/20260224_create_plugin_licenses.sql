-- Create table for plugin licenses
CREATE TABLE IF NOT EXISTS public.plugin_licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  registered_domain TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.plugin_licenses ENABLE ROW LEVEL SECURITY;

-- Admins can manage all licenses
CREATE POLICY "Admins can manage all licenses" 
ON public.plugin_licenses FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Public can check license (handled by API, but this is a safeguard)
CREATE POLICY "Public can view licenses with key" 
ON public.plugin_licenses FOR SELECT 
USING (true);
