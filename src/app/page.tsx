import { BreakingNewsTicker } from '@/components/layout/BreakingNewsTicker'
import { NewsCard } from '@/components/ui/NewsCard'
import BannerSlider from '@/components/ui/BannerSlider'
import { Zap, TrendingUp, Sparkles, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdRenderer from '@/components/news/AdRenderer'

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

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch all data in parallel
  const [
    { data: banners },
    { data: latestArticles },
    { data: categoriesWithNews },
    { data: breakingNewsResult },
    { data: feedAds }
  ] = await Promise.all([
    supabase.from('banners').select('*').eq('is_active', true).order('display_order', { ascending: true }),
    supabase.from('articles').select('*, categories(name, bg_color)').eq('is_published', true).order('created_at', { ascending: false }).limit(20),
    supabase.from('categories').select(`
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
    `).eq('show_on_home', true).order('display_order', { ascending: true }).eq('articles.is_published', true),
    supabase.from('articles').select('title').eq('is_published', true).eq('is_breaking', true).order('created_at', { ascending: false }).limit(5),
    supabase.from('advertisements').select('*').eq('placement', 'feed_between').eq('is_active', true)
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

  const spotlightArticles = latestArticles ? latestArticles.slice(0, 3) : []
  const heroArticle = latestArticles && latestArticles.length > 3 ? latestArticles[3] : null
  const middleHorizontalArticles = latestArticles ? latestArticles.slice(4, 6) : []
  const recentNewsArticles = latestArticles ? latestArticles.slice(6, 12) : []
  const breakingTitles = breakingNews?.map(n => n.title) || []

  return (
    <div className="flex flex-col bg-[#F8F9FA]">
      <BreakingNewsTicker news={breakingTitles} />

      {/* Banner Slider */}
      {banners && banners.length > 0 && (
        <BannerSlider banners={banners} />
      )}

      {/* Ultimate News Grid (Reference Style) */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* LEFT COLUMN: Spotlight (3 Vertical Cards) */}
            <div className="lg:col-span-2 space-y-8">
              {spotlightArticles.map((article, idx) => (
                <NewsCard
                  key={article.id}
                  variant="spotlight"
                  title={article.title}
                  slug={article.slug}
                  image={article.featured_image}
                  category={article.categories?.name || 'News'}
                  date={new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
              ))}
            </div>

            {/* MIDDLE COLUMN: Hero + Horizontal Pair */}
            <div className="lg:col-span-6 space-y-10">
              {heroArticle ? (
                <NewsCard
                  variant="grid-standard"
                  title={heroArticle.title}
                  slug={heroArticle.slug}
                  image={heroArticle.featured_image}
                  category={heroArticle.categories?.name || 'Top News'}
                  date={new Date(heroArticle.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
              ) : (
                <div className="h-[400px] bg-slate-100 animate-pulse" />
              )}

              {/* Horizontal Pair below hero */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                {middleHorizontalArticles.map((article) => (
                  <NewsCard
                    key={article.id}
                    variant="horizontal-medium"
                    title={article.title}
                    slug={article.slug}
                    image={article.featured_image}
                    category={article.categories?.name || 'Highlights'}
                    date={new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Recent News + Ad */}
            <div className="lg:col-span-4 space-y-10">
              <div className="bg-white p-6 md:p-8 rounded-none border-l-4 border-[#990000] shadow-sm">
                <h2 className="text-xl font-black text-black uppercase tracking-tighter mb-8 flex items-center">
                  <span className="text-[#990000] mr-2">|</span> Recent News
                </h2>
                <div className="space-y-2">
                  {recentNewsArticles.map((article) => (
                    <NewsCard
                      key={article.id}
                      variant="recent-list"
                      title={article.title}
                      slug={article.slug}
                      image={article.featured_image}
                      category={article.categories?.name || 'Recent'}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Category Sections with Varied Layouts */}
      {sections.map((section, idx) => {
        const isAlternate = idx % 2 === 1;
        const catColor = section.bg_color || (isAlternate ? '#f9fafb' : '#ffffff');
        const isDark = getContrastColor(catColor) === 'white';
        const sectionTextColor = isDark ? 'text-white' : 'text-black';
        const secondaryTextColor = isDark ? 'text-gray-300' : 'text-gray-400';

        // Create a stack of assigned advertisements
        const sidebarAds = [
          section.sidebar_ad,
          section.sidebar_ad_2,
          section.sidebar_ad_3
        ].filter(Boolean) as any[];

        return (
          <section key={section.id} className="py-20 border-b border-black/5 last:border-0 overflow-hidden" style={{ backgroundColor: catColor }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Modern Header */}
              <div className="flex flex-row items-end justify-between mb-12 border-b-4 border-black pb-4">
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${isDark ? 'text-white/60' : 'text-primary'}`}>Collection</span>
                  <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter italic ${sectionTextColor} leading-none`}>
                    {section.name}
                  </h2>
                </div>
                <Link
                  href={`/category/${section.slug}`}
                  className={`hidden sm:flex items-center text-[10px] font-black uppercase tracking-widest transition-colors ${sectionTextColor} hover:text-primary group`}
                >
                  View Collection <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Content Area (8 Cols) */}
                <div className={sidebarAds.length > 0 ? "lg:col-span-8" : "lg:col-span-12"}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Hero Feature Block (6 Cols) */}
                    <div className={sidebarAds.length > 0 ? "md:col-span-12 xl:col-span-6" : "md:col-span-6"}>
                      {section.articles[0] && (
                        <div className="h-full">
                          <NewsCard
                            title={section.articles[0].title}
                            slug={section.articles[0].slug}
                            image={section.articles[0].featured_image}
                            category={section.name}
                            categoryColor={isDark ? 'white' : section.bg_color}
                            excerpt={section.articles[0].excerpt}
                            isPremium={section.articles[0].is_premium}
                            isDark={isDark}
                            variant="feature-block"
                            date={new Date(section.articles[0].created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          />
                        </div>
                      )}
                    </div>

                    {/* 2x2 Grid Overlay (6 Cols) */}
                    <div className={sidebarAds.length > 0 ? "md:col-span-12 xl:col-span-6" : "md:col-span-6"}>
                      <div className="grid grid-cols-2 gap-4 h-full content-start">
                        {section.articles.slice(1, 5).map((article: any) => (
                          <div key={article.id} className="min-h-[180px] sm:min-h-[220px]">
                            <NewsCard
                              title={article.title}
                              slug={article.slug}
                              image={article.featured_image}
                              category={section.name}
                              categoryColor={isDark ? 'white' : section.bg_color}
                              isPremium={article.is_premium}
                              isDark={isDark}
                              variant="overlay-grid"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mobile View All Link */}
                    <Link
                      href={`/category/${section.slug}`}
                      className="sm:hidden mt-6 flex items-center justify-center py-4 border-2 border-black/10 text-[10px] font-black uppercase tracking-widest hover:border-black transition-all"
                    >
                      View All {section.name}
                    </Link>
                  </div>
                </div>

                {/* Feed Ad Injection */}
                {feedAds && feedAds[idx % feedAds.length] && !sidebarAds.length && (
                  <div className="mt-16 pt-16 border-t border-black/5">
                    <div className="max-w-4xl mx-auto">
                      <AdRenderer ad={feedAds[idx % feedAds.length]} />
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] text-center block mt-2 ${secondaryTextColor}`}>Sponsored Placement</span>
                    </div>
                  </div>
                )}

                {/* Sidebar Ad Stack (4 Cols) */}
                {sidebarAds.length > 0 && (
                  <div className="lg:col-span-4">
                    <div className="sticky top-24 space-y-10">
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${secondaryTextColor}`}>Promoted</span>
                      </div>
                      {sidebarAds.map((ad, adIdx) => (
                        <AdRenderer key={ad.id || adIdx} ad={ad} isSidebar={true} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )
      })}
    </div >
  )
}
