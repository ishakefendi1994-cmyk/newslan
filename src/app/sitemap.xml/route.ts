import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/settings'

export const revalidate = 900 // 15 minutes cache

export async function GET() {
    const supabase = await createClient()
    const settings = await getSiteSettings()
    const SITE_URL = settings.site_url || process.env.NEXT_PUBLIC_SITE_URL || ''

    // Count total published articles to calculate pages
    const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)

    const totalArticles = count || 0
    const postsPerPage = 1000
    const postSitemapCount = Math.ceil(totalArticles / postsPerPage) || 1

    const sitemaps = [
        `${SITE_URL}/sitemap-pages.xml`,
        `${SITE_URL}/sitemap-products.xml`,
        `${SITE_URL}/sitemap-news.xml`,
    ]

    // Add paginated posts sitemaps
    for (let i = 1; i <= postSitemapCount; i++) {
        sitemaps.push(`${SITE_URL}/sitemap-posts-${i}.xml`)
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps
            .map(
                (url) => `
  <sitemap>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
            )
            .join('')}
</sitemapindex>`

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=600',
        },
    })
}
