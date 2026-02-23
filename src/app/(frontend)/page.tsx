import { BreakingNewsTicker } from '@/components/layout/BreakingNewsTicker'
import SkeletonCard from '@/components/ui/SkeletonCard'
import { NewsCard } from '@/components/ui/NewsCard'
import BannerSlider from '@/components/ui/BannerSlider'
import { Pagination } from '@/components/ui/Pagination'
import { Zap, TrendingUp, Sparkles, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdRenderer from '@/components/news/AdRenderer'
import {
  getBanners,
  getBreakingNews,
  getCategoriesWithNews,
  getFeedAds,
  getLatestArticlesTop20,
  getLatestGridNews,
  getTrendingNews,
  getTrendingProducts,
  getShorts,
  getSiteSettings,
  getSidebarAds
} from '@/lib/data'

// Import Templates
import TemplateTempo from '@/components/templates/TemplateTempo'
import TemplateGrid from '@/components/templates/TemplateGrid'
import TemplateMagazine from '@/components/templates/TemplateMagazine'
import TemplateDetik from '@/components/templates/TemplateDetik'
import TemplateCNN from '@/components/templates/TemplateCNN'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const currentPage = Number(params?.page) || 1
  const itemsPerPage = 10

  // Fetch settings for direct redirect and template choice
  const settings = await getSiteSettings()
  const defaultHome = settings?.default_homepage
  const activeTemplate = settings?.active_template || 'tempo'

  if (defaultHome && defaultHome !== '/' && currentPage === 1) {
    redirect(defaultHome)
  }

  // Parallel data fetching
  const [
    banners,
    latestArticles,
    categoriesWithNews,
    breakingNewsResult,
    feedAds,
    { data: latestGridNews, count: totalLatestNews },
    trendingNews,
    sidebarAds,
    trendingProducts,
    shorts
  ] = await Promise.all([
    getBanners(),
    getLatestArticlesTop20(),
    getCategoriesWithNews(),
    getBreakingNews(),
    getFeedAds(),
    getLatestGridNews(currentPage, itemsPerPage),
    getTrendingNews(),
    getSidebarAds(),
    getTrendingProducts(10),
    getShorts(10)
  ])

  let breakingNews = breakingNewsResult

  // Fallback to latest 5 news if no breaking news
  if (!breakingNews || breakingNews.length === 0) {
    const { data: latestForTicker } = await supabase
      .from('articles')
      .select('title')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5)
    breakingNews = latestForTicker
  }

  const totalPages = totalLatestNews ? Math.ceil(totalLatestNews / itemsPerPage) : 0

  const templateProps = {
    banners: banners || [],
    latestArticles: latestArticles || [],
    categoriesWithNews: categoriesWithNews || [],
    breakingNews: breakingNews || [],
    feedAds: feedAds || [],
    latestGridNews: latestGridNews || [],
    totalLatestNews: totalLatestNews || 0,
    trendingNews: trendingNews || [],
    currentPage,
    totalPages,
    sidebarAds: sidebarAds || [],
    trendingProducts: trendingProducts || [],
    shorts: shorts || []
  }

  // Render Template based on settings
  switch (activeTemplate) {
    case 'grid':
      return <TemplateGrid {...templateProps} />
    case 'magazine':
      return <TemplateMagazine {...templateProps} />
    case 'detik':
      return <TemplateDetik {...templateProps} />
    case 'cnn':
      return <TemplateCNN {...templateProps} />
    case 'tempo':
    default:
      return <TemplateTempo {...templateProps} />
  }
}
