import { createClient } from './supabase/server'

export interface SiteSettings {
    site_name: string
    theme_color: string
    description: string
    default_homepage: string
    logo_type: 'text' | 'image'
    site_logo_url: string
    default_ai_language: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
    site_name: 'NEWSLAN.ID',
    theme_color: '#990000',
    description: 'Portal berita terpercaya dengan fokus pada edukasi, investigasi, dan pemberitaan akurat.',
    default_homepage: '/',
    logo_type: 'text',
    site_logo_url: '',
    default_ai_language: 'id'
}

export async function getSiteSettings(): Promise<SiteSettings> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('site_settings')
            .select('setting_key, setting_value')

        if (error || !data) {
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
        })

        return settings
    } catch (e) {
        console.error('Error fetching site settings:', e)
        return DEFAULT_SETTINGS
    }
}
