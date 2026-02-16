import { BreakingNewsTicker } from '@/components/layout/BreakingNewsTicker'
import SkeletonCard from '@/components/ui/SkeletonCard'
import { NewsCard } from '@/components/ui/NewsCard'
import BannerSlider from '@/components/ui/BannerSlider'
import { Pagination } from '@/components/ui/Pagination'
import { Zap, TrendingUp, Sparkles, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdRenderer from '@/components/news/AdRenderer'
import {
  getBanners,
  getBreakingNews,
  getCategoriesWithNews,
  getFeedAds,
  getLatestArticlesTop20,
  getLatestGridNews,
  getTrendingNews
} from '@/lib/data'
import { optimizeCloudinaryUrl } from '@/lib/utils'

// Helper function to determine if text should be white or black based on background color
function getContrastColor(hexColor: string | null) {
  if (!hexColor) return 'white'
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return brightness > 128 ? 'black' : 'white'
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const currentPage = Number(params?.page) || 1
  const itemsPerPage = 10
  const offset = (currentPage - 1) * itemsPerPage

  // Parallel data fetching
  // Parallel data fetching
  const [
    banners,
    latestArticles,
    categoriesWithNews,
    breakingNewsResult,
    feedAds,
    { data: latestGridNews, count: totalLatestNews },
    trendingNews
  ] = await Promise.all([
    getBanners(),
    getLatestArticlesTop20(),
    getCategoriesWithNews(),
    getBreakingNews(),
    getFeedAds(),
    getLatestGridNews(currentPage, itemsPerPage),
    getTrendingNews()
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

  // Manual sorting and limiting for cleaner data
  const sections = categoriesWithNews?.map(cat => ({
    ...cat,
    articles: (cat.articles as any[] || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  })).filter(cat => cat.articles.length > 0) || []

  const heroArticle = latestArticles ? latestArticles[0] : null
  const spotlightArticles = latestArticles ? latestArticles.slice(1, 3) : [] // Items 2-3
  const middleHorizontalArticles = latestArticles ? latestArticles.slice(3, 5) : [] // Items 4-5
  const recentNewsArticles = latestArticles ? latestArticles.slice(5, 11) : [] // Items 6-11
  const breakingTitles = breakingNews?.map(n => n.title) || []

  const totalPages = totalLatestNews ? Math.ceil(totalLatestNews / itemsPerPage) : 0

  return (
    <div className="flex flex-col bg-[#F8F9FA]">
      {/* Hide Breaking News on page 2+ to keep focus on content */}
      {currentPage === 1 && <BreakingNewsTicker news={breakingTitles} />}

      {/* Banner & Ultimate Grid - Only on Page 1 */}
      {currentPage === 1 && (
        <>
          {banners && banners.length > 0 && (
            <BannerSlider banners={banners} />
          )}

          {/* Tempo-style News Grid */}
          <section className="py-10 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* LEFT: MAIN HERO COLUMN */}
                <div className="lg:col-span-8 space-y-12">
                  {/* Tempo Hero Article */}
                  {heroArticle ? (
                    <NewsCard
                      variant="tempo-hero"
                      title={heroArticle.title}
                      slug={heroArticle.slug}
                      image={heroArticle.featured_image}
                      category={heroArticle.categories?.name || 'Top News'}
                      date={new Date(heroArticle.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    />
                  ) : (
                    <SkeletonCard variant="tempo-hero" />
                  )}

                  {/* Tempo Sub-grid (3 Columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
                    {latestArticles?.slice(1, 4).map((article) => (
                      <NewsCard
                        key={article.id}
                        variant="tempo-sub"
                        title={article.title}
                        slug={article.slug}
                        image={article.featured_image}
                        category={article.categories?.name || 'News'}
                      />
                    ))}
                  </div>
                </div>

                {/* RIGHT: ARTIKEL TERBARU SIDEBAR */}
                <div className="lg:col-span-4">
                  <div className="space-y-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-1.5 h-6 bg-[#990000]" />
                      <h2 className="text-xl font-black text-black uppercase tracking-tighter">
                        Artikel Terbaru
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {latestArticles?.slice(4, 10).map((article) => (
                        <NewsCard
                          key={article.id}
                          variant="tempo-sidebar"
                          title={article.title}
                          slug={article.slug}
                          image={article.featured_image}
                          category={article.categories?.name || 'Terbaru'}
                        />
                      ))}
                    </div>

                    {/* Sidebar Ad (if exists) */}
                    {feedAds && feedAds[0] && (
                      <div className="pt-8 border-t border-gray-100">
                        <AdRenderer ad={feedAds[0]} isSidebar={true} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 text-center block mt-2">Space Iklan</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Category Sections with MULTIPLE Layout Models */}
          {sections.map((section, idx) => {
            const catColor = section.bg_color || '#ffffff';
            const isDark = getContrastColor(catColor) === 'white';
            const sectionTextColor = isDark ? 'text-white' : 'text-black';
            const secondaryTextColor = isDark ? 'text-gray-300' : 'text-gray-400';

            // Cycle through 4 layout models
            const layoutModel = idx % 4; // 0, 1, 2, 3

            return (
              <section key={section.id} className="py-20 border-t border-gray-100 overflow-hidden" style={{ backgroundColor: catColor }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {/* Section header inspired by Tempo */}
                  <div className="flex flex-row items-center justify-between mb-12">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-8 bg-[#990000]" />
                      <h2 className={`text-4xl font-black uppercase tracking-tighter italic ${sectionTextColor} leading-none`}>
                        {section.name}
                      </h2>
                    </div>
                    <Link
                      href={`/category/${section.slug}`}
                      className={`hidden sm:flex items-center text-[10px] font-black uppercase tracking-widest transition-colors ${sectionTextColor} hover:text-[#990000] group`}
                    >
                      Lihat Semua <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>

                  {/* MODEL 0: Large Focus (1 Big + 4 Small Grid) */}
                  {layoutModel === 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      {/* Big item */}
                      <div className="lg:col-span-12 xl:col-span-7">
                        {section.articles[0] && (
                          <NewsCard
                            variant="tempo-hero"
                            title={section.articles[0].title}
                            slug={section.articles[0].slug}
                            image={section.articles[0].featured_image}
                            category={section.name}
                            isDark={isDark}
                          />
                        )}
                      </div>
                      {/* Small items */}
                      <div className="lg:col-span-12 xl:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                        {section.articles.slice(1, 5).map((article: any) => (
                          <NewsCard
                            key={article.id}
                            variant="tempo-sidebar"
                            title={article.title}
                            slug={article.slug}
                            image={article.featured_image}
                            category={section.name}
                            isDark={isDark}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MODEL 1: List Model (Alternative rows) */}
                  {layoutModel === 1 && (
                    <div className="space-y-2">
                      {section.articles.slice(0, 4).map((article: any) => (
                        <NewsCard
                          key={article.id}
                          variant="tempo-horizontal"
                          title={article.title}
                          slug={article.slug}
                          image={article.featured_image}
                          category={section.name}
                          excerpt={article.excerpt}
                          isDark={isDark}
                        />
                      ))}
                    </div>
                  )}

                  {/* MODEL 2: Column Grid (Standard 4 Cols) */}
                  {layoutModel === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {section.articles.slice(0, 4).map((article: any) => (
                        <NewsCard
                          key={article.id}
                          variant="overlay-grid"
                          title={article.title}
                          slug={article.slug}
                          image={article.featured_image}
                          category={section.name}
                          isDark={isDark}
                        />
                      ))}
                    </div>
                  )}

                  {/* MODEL 3: Tempo Style (1 Hero Left + 3 Horizontal Right) */}
                  {layoutModel === 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Big Hero Left */}
                      <div className="lg:col-span-7">
                        {section.articles[0] && (
                          <div className="group relative h-full min-h-[500px] w-full overflow-hidden bg-gray-100">
                            <Image
                              src={optimizeCloudinaryUrl(section.articles[0].featured_image, { quality: 'auto', width: 800 })}
                              alt={section.articles[0].title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 1200px) 100vw, 60vw"
                            />
                            <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-black/60 to-transparent">
                              <span className="bg-[#990000] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white inline-block mb-3">
                                {section.name}
                              </span>
                              <Link href={`/news/${section.articles[0].slug}`} className="block">
                                <h3 className="text-xl md:text-2xl font-bold text-white leading-tight hover:underline">
                                  {section.articles[0].title}
                                </h3>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* 3 Horizontal Cards Right */}
                      <div className="lg:col-span-5 space-y-4">
                        {section.articles.slice(1, 4).map((article: any) => (
                          <div key={article.id} className="group flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                            <div className="relative w-24 h-24 shrink-0 overflow-hidden bg-gray-100">
                              <Image
                                src={optimizeCloudinaryUrl(article.featured_image, { quality: 'auto', width: 200 })}
                                alt={article.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="96px"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <span className="bg-[#990000] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white inline-block">
                                {section.name}
                              </span>
                              <Link href={`/news/${article.slug}`} className="block">
                                <h4 className="text-sm font-bold leading-snug text-black hover:text-[#990000] transition-colors line-clamp-3">
                                  {article.title}
                                </h4>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </section>
            );
          })}
        </>
      )}

      {/* Latest News Grid (Paginated) - Always Visible */}
      <section className="py-20 bg-white border-t border-black/5" id="latest-news">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end space-x-4 mb-12">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black">
              Latest News
            </h2>
            <div className="h-1 flex-1 bg-black/5 mb-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {latestGridNews?.map((article) => (
              <NewsCard
                key={article.id}
                title={article.title}
                slug={article.slug}
                image={article.featured_image || '/placeholder-news.jpg'}
                category={article.categories?.name || 'News'}
                date={new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              // Use default variant (vertical card)
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/"
          />
        </div>
      </section>

    </div >
  )
}
