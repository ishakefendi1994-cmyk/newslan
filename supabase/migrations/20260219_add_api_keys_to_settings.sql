-- Add API keys to site_settings
INSERT INTO site_settings (setting_key, setting_value)
VALUES 
    ('groq_api_key', ''),
    ('replicate_api_token', '')
ON CONFLICT (setting_key) DO NOTHING;
