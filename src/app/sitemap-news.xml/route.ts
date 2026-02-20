import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/settings'

export const revalidate = 600 // 10 minutes cache for news

export async function GET() {
    const supabase = await createClient()
    const settings = await getSiteSettings()
    const SITE_URL = settings.site_url || process.env.NEXT_PUBLIC_SITE_URL || ''
    const SITE_NAME = settings.site_name || 'News Portal'

    // Google News Sitemap should only contain articles from the last 2 days (48 hours)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: articles, error } = await supabase
        .from('articles')
        .select('title, slug, created_at')
        .eq('is_published', true)
        .gte('created_at', fortyEightHoursAgo)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching articles for news sitemap:', error)
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${(articles || [])
            .map(
                (article) => `
  <url>
    <loc>${SITE_URL}/news/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${SITE_NAME}</news:name>
        <news:language>id</news:language>
      </news:publication>
      <news:publication_date>${new Date(article.created_at).toISOString()}</news:publication_date>
      <news:title>${article.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</news:title>
    </news:news>
  </url>`
            )
            .join('')}
</urlset>`

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
        },
    })
}
