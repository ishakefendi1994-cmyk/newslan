import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/settings'

export const revalidate = 3600 // 1 hour cache for pages

export async function GET() {
    const supabase = await createClient()
    const settings = await getSiteSettings()
    const SITE_URL = settings.site_url || process.env.NEXT_PUBLIC_SITE_URL || ''

    // 1. Static Pages
    const staticPages = [
        '',
        '/news',
        '/products',
        '/redaksi',
        '/privacy-policy',
        '/pedoman-media-siber',
    ]

    // 2. Category Pages
    const { data: categories } = await supabase
        .from('categories')
        .select('slug')

    const categoryUrls = (categories || []).map(cat => `/category/${cat.slug}`)

    const allPages = [...staticPages, ...categoryUrls]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages
            .map(
                (path) => `
  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`
            )
            .join('')}
</urlset>`

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        },
    })
}
