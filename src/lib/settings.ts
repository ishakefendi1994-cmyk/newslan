import { createClient } from './supabase/server'

export interface SiteSettings {
    site_name: string
    theme_color: string
    description: string
    default_homepage: string
    logo_type: 'text' | 'image'
    site_logo_url: string
    default_ai_language: string
    groq_api_key?: string
    replicate_api_token?: string
    contact_whatsapp: string
    contact_email: string
    site_favicon_url: string
    site_url: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
    site_name: 'cryptotechnews.net',
    theme_color: '#990000',
    description: 'Portal berita terpercaya dengan fokus pada edukasi, investigasi, dan pemberitaan akurat.',
    default_homepage: '/',
    logo_type: 'text',
    site_logo_url: '',
    default_ai_language: 'id',
    groq_api_key: '',
    replicate_api_token: '',
    contact_whatsapp: '',
    contact_email: 'admin@cryptotechnews.net',
    site_favicon_url: '/favicon.ico',
    site_url: 'https://cryptotechnews.net'
}

export async function getSiteSettings(supabaseClient?: any): Promise<SiteSettings> {
    try {
        const supabase = supabaseClient || await createClient()
        const { data, error } = await supabase
            .from('site_settings')
            .select('setting_key, setting_value')

        if (error || !data) {
            console.warn('Using default settings due to error:', error)
            return DEFAULT_SETTINGS
        }

        const settings = { ...DEFAULT_SETTINGS }
        data.forEach((item: any) => {
            if (item.setting_key === 'site_name') settings.site_name = item.setting_value
            if (item.setting_key === 'theme_color') settings.theme_color = item.setting_value
            if (item.setting_key === 'site_description') settings.description = item.setting_value
            if (item.setting_key === 'default_homepage') settings.default_homepage = item.setting_value
            if (item.setting_key === 'logo_type') settings.logo_type = item.setting_value as any
            if (item.setting_key === 'site_logo_url') settings.site_logo_url = item.setting_value
            if (item.setting_key === 'groq_api_key') settings.groq_api_key = item.setting_value
            if (item.setting_key === 'replicate_api_token') settings.replicate_api_token = item.setting_value
            if (item.setting_key === 'default_ai_language') settings.default_ai_language = item.setting_value
            if (item.setting_key === 'contact_whatsapp') settings.contact_whatsapp = item.setting_value
            if (item.setting_key === 'contact_email') settings.contact_email = item.setting_value
            if (item.setting_key === 'site_favicon_url') settings.site_favicon_url = item.setting_value
            if (item.setting_key === 'site_url') settings.site_url = item.setting_value
        })

        return settings
    } catch (e) {
        console.error('Error fetching site settings:', e)
        return DEFAULT_SETTINGS
    }
}
