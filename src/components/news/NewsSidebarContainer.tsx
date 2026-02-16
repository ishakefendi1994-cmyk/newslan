import { createClient } from '@/lib/supabase/server'
import { getTrendingNews } from '@/lib/data'
import NewsSidebar from './NewsSidebar'

export default async function NewsSidebarContainer({ currentArticleId }: { currentArticleId: string }) {
    const supabase = await createClient()

    // Fetch Sidebar Data in Parallel
    const [sidebarArticlesResult, trendingNewsResult, sidebarAdsResult] = await Promise.all([
        supabase
            .from('articles')
            .select('*, categories(name)')
            .eq('is_published', true)
            .neq('id', currentArticleId)
            .order('created_at', { ascending: false })
            .limit(5),

        getTrendingNews(),

        supabase
            .from('advertisements')
            .select('*')
            .eq('is_active', true)
            .eq('placement', 'sidebar')
    ])

    const sidebarArticles = sidebarArticlesResult.data || []
    const trendingNews = trendingNewsResult
    const sidebarAds = sidebarAdsResult.data || []

    return (
        <NewsSidebar
            latestArticles={sidebarArticles || []}
            sidebarAds={sidebarAds}
            trendingNews={trendingNews || []}
        />
    )
}
