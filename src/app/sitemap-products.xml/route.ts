import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/settings'

export const revalidate = 3600 // 1 hour cache

export async function GET() {
    const supabase = await createClient()
    const settings = await getSiteSettings()
    const SITE_URL = settings.site_url || process.env.NEXT_PUBLIC_SITE_URL || ''

    const { data: products, error } = await supabase
        .from('products')
        .select('id, updated_at')
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching products for sitemap:', error)
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${(products || [])
            .map(
                (product) => `
  <url>
    <loc>${SITE_URL}/products/${product.id}</loc>
    <lastmod>${new Date(product.updated_at || new Date()).toISOString()}</lastmod>
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
