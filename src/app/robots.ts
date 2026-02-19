import { MetadataRoute } from 'next'
import { getSiteSettings } from '@/lib/settings'

export default async function robots(): Promise<MetadataRoute.Robots> {
    const settings = await getSiteSettings()
    const SITE_URL = settings.site_url || process.env.NEXT_PUBLIC_SITE_URL || ''

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/auth/'],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
