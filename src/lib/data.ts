import { createPublicClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'

// Cache revalidation time in seconds
const REVALIDATE_TIME = 60

export const getBanners = unstable_cache(
    async () => {
        const supabase = createPublicClient()
        const { data } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true })
        return data
    },
    ['banners'],
    { revalidate: REVALIDATE_TIME, tags: ['banners'] }
)

export const getLatestArticlesTop20 = unstable_cache(
    async () => {
        const supabase = createPublicClient()
        const { data } = await supabase
            .from('articles')
            .select('*, categories(name, bg_color)')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(20)
        return data
    },
    ['latest-articles-top-20'],
    { revalidate: REVALIDATE_TIME, tags: ['articles'] }
)

export const getCategoriesWithNews = unstable_cache(
    async () => {
        const supabase = createPublicClient()
        const { data } = await supabase
            .from('categories')
            .select(`
        id,
        name,
        slug,
        show_on_home,
        display_order,
        bg_color,
        sidebar_ad_id,
        sidebar_ad:advertisements!sidebar_ad_id(*),
        sidebar_ad_2_id,
        sidebar_ad_2:advertisements!sidebar_ad_2_id(*),
        sidebar_ad_3_id,
        sidebar_ad_3:advertisements!sidebar_ad_3_id(*),
        articles(
          id,
          title,
          slug,
          featured_image,
          excerpt,
          is_premium,
          created_at
        )
      `)
            .eq('show_on_home', true)
            .neq('slug', 'uncategorized')
            .order('display_order', { ascending: true })
            .eq('articles.is_published', true)

        return data
    },
    ['categories-with-news'],
    { revalidate: REVALIDATE_TIME, tags: ['categories', 'articles'] }
)

export const getBreakingNews = unstable_cache(
    async () => {
        const supabase = createPublicClient()
        const { data } = await supabase
            .from('articles')
            .select('title')
            .eq('is_published', true)
            .eq('is_breaking', true)
            .order('created_at', { ascending: false })
            .limit(5)
        return data
    },
    ['breaking-news'],
    { revalidate: REVALIDATE_TIME, tags: ['articles'] }
)

export const getFeedAds = unstable_cache(
    async () => {
        const supabase = createPublicClient()
        const { data } = await supabase
            .from('advertisements')
            .select('*')
            .eq('placement', 'feed_between')
            .eq('is_active', true)
        return data
    },
    ['feed-ads'],
    { revalidate: REVALIDATE_TIME, tags: ['ads'] }
)

export const getLatestGridNews = unstable_cache(
    async (page: number, itemsPerPage: number) => {
        const supabase = createPublicClient()
        const offset = (page - 1) * itemsPerPage
        const { data, count } = await supabase
            .from('articles')
            .select('*, categories(name, bg_color)', { count: 'exact' })
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + itemsPerPage - 1)
        return { data, count }
    },
    ['latest-grid-news'],
    { revalidate: REVALIDATE_TIME, tags: ['articles'] }
)

export const getTrendingNews = unstable_cache(
    async () => {
        const supabase = createPublicClient()
        const { data } = await supabase
            .from('articles')
            .select('*, categories(name, bg_color)')
            .eq('is_published', true)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
            .order('views_count', { ascending: false })
            .limit(7)
        return data
    },
    ['trending-news'],
    { revalidate: REVALIDATE_TIME, tags: ['articles'] }
)

export const searchArticles = async (query: string) => {
    const supabase = createPublicClient()
    const { data } = await supabase
        .from('articles')
        .select('*, categories(name, bg_color)')
        .eq('is_published', true)
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)
    return data
}

export const getArticleBySlug = unstable_cache(
    async (slug: string) => {
        const supabase = createPublicClient()
        const { data } = await supabase
            .from('articles')
            .select(`
                *,
                categories(id, name),
                profiles(full_name),
                article_products(
                    products(
                        *,
                        product_categories(name),
                        affiliate_links(*)
                    )
                )
            `)
            .eq('slug', slug)
            .eq('is_published', true)
            .single()
        return data
    },
    ['article-by-slug'],
    { revalidate: REVALIDATE_TIME, tags: ['articles'] }
)

export const getNextArticle = unstable_cache(
    async (currentId: string) => {
        const supabase = createPublicClient()
        const { data } = await supabase
            .from('articles')
            .select('slug, title, featured_image')
            .eq('is_published', true)
            .neq('id', currentId)
            // Ideally we'd use a more complex logic (same category, newer), 
            // but for "Next Article" flow, getting the immediately preceding or following record 
            // is often done by sorting or ID comparison. 
            // Here simply getting the latest one that isn't current for simplicity/demo.
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        return data
    },
    ['next-article'],
    { revalidate: REVALIDATE_TIME, tags: ['articles'] }
)

export const getProductById = unstable_cache(
    async (id: string) => {
        const supabase = createPublicClient()
        const { data } = await supabase
            .from('products')
            .select('*, product_categories(name), affiliate_links(*)')
            .eq('id', id)
            .single()
        return data
    },
    ['product-by-id'],
    { revalidate: REVALIDATE_TIME, tags: ['products'] }
)

export const getTrendingProducts = unstable_cache(
    async (limit: number = 4) => {
        const supabase = createPublicClient()
        const { data } = await supabase
            .from('products')
            .select('*, product_categories(name), affiliate_links(*)')
            .order('created_at', { ascending: false })
            .limit(limit)
        return data
    },
    ['trending-products'],
    { revalidate: REVALIDATE_TIME, tags: ['products'] }
)

export async function getSiteSettings() {
    const supabase = createPublicClient()
    const { data } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')

    // Convert array to key-value object
    const settings: Record<string, string> = {}
    if (data) {
        data.forEach((item: any) => {
            settings[item.setting_key] = item.setting_value
        })
    }
    return settings
}
