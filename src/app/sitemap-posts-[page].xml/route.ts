import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/settings'

export const revalidate = 1800 // 30 minutes cache

export async function GET(
    request: Request,
    { params }: { params: { page: string } }
) {
    const pageStr = params.page
    const page = parseInt(pageStr)

    if (isNaN(page) || page < 1) {
        return new Response('Invalid sitemap page', { status: 400 })
    }

    const supabase = await createClient()
    const settings = await getSiteSettings()
    const SITE_URL = settings.site_url || process.env.NEXT_PUBLIC_SITE_URL || ''

    const postsPerPage = 1000
    const from = (page - 1) * postsPerPage
    const to = from + postsPerPage - 1

    const { data: articles, error } = await supabase
        .from('articles')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error(`Error fetching articles for sitemap page ${page}:`, error)
    }

    if (!articles || articles.length === 0) {
        // Return empty sitemap instead of 404 to avoid breaking index
        return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`, {
            headers: { 'Content-Type': 'application/xml' }
        })
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${articles
            .map(
                (article) => `
  <url>
    <loc>${SITE_URL}/news/${article.slug}</loc>
    <lastmod>${new Date(article.updated_at).toISOString()}</lastmod>
  </url>`
            )
            .join('')}
</urlset>`

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=900',
        },
    })
}
