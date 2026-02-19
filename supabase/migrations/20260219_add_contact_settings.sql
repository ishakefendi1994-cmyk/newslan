-- Add contact settings to site_settings
INSERT INTO site_settings (setting_key, setting_value)
VALUES 
    ('contact_whatsapp', '+62 823-7886-5775'),
    ('contact_email', 'redaksi@newslan.id')
ON CONFLICT (setting_key) DO NOTHING;
