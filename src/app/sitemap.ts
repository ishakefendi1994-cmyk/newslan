import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://newslan.id'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Fetch Articles
    const { data: articles } = await supabase
        .from('articles')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })

    // 2. Fetch Categories
    const { data: categories } = await supabase
        .from('categories')
        .select('slug')

    // 3. Fetch Products
    const { data: products } = await supabase
        .from('products')
        .select('id, updated_at')

    const articleUrls = (articles || []).map((article) => ({
        url: `${SITE_URL}/news/${article.slug}`,
        lastModified: new Date(article.updated_at),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }))

    const categoryUrls = (categories || []).map((category) => ({
        url: `${SITE_URL}/category/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }))

    const productUrls = (products || []).map((product) => ({
        url: `${SITE_URL}/products/${product.id}`,
        lastModified: new Date(product.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    return [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: 'always' as const,
            priority: 1,
        },
        {
            url: `${SITE_URL}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/redaksi`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.1,
        },
        {
            url: `${SITE_URL}/pedoman-media-siber`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.1,
        },
        ...articleUrls,
        ...categoryUrls,
        ...productUrls,
    ]
}
