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

  // Fetch Banners
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // Fetch Articles for Hero
  const { data: latestArticles } = await supabase
    .from('articles')
    .select('*, categories(name, bg_color)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch Categories with limited articles for sections
  const { data: categoriesWithNews } = await supabase
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
    .order('display_order', { ascending: true })
    .eq('articles.is_published', true)
  // .order('created_at', { foreignTable: 'articles', ascending: false })
  // .limit(5, { foreignTable: 'articles' })

  // Manual sorting and limiting for cleaner data (Supabase JS client limitation with order/limit on relations)
  const sections = categoriesWithNews?.map(cat => ({
    ...cat,
    articles: (cat.articles as any[] || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  })).filter(cat => cat.articles.length > 0) || []

  // Fetch Breaking News
  let { data: breakingNews } = await supabase
    .from('articles')
    .select('title')
    .eq('is_published', true)
    .eq('is_breaking', true)
    .order('created_at', { ascending: false })
    .limit(5)

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

  // Fetch feed ads
  const { data: feedAds } = await supabase
    .from('advertisements')
    .select('*')
    .eq('placement', 'feed_between')
    .eq('is_active', true)

  const featuredNews = latestArticles && latestArticles.length > 0 ? latestArticles[0] : null
  const trendingArticles = latestArticles ? latestArticles.slice(1, 6) : []
  const breakingTitles = breakingNews?.map(n => n.title) || []

  return (
    <div className="flex flex-col">
      <BreakingNewsTicker news={breakingTitles} />

      {/* Banner Slider */}
      {banners && banners.length > 0 && (
        <BannerSlider banners={banners} />
      )}

      {/* TechCrunch Top Section: Hero + Headlines */}
      <section className="bg-white py-8 border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Hero (66%) */}
            <div className="lg:col-span-8">
              {featuredNews ? (
                <NewsCard
                  title={featuredNews.title}
                  slug={featuredNews.slug}
                  image={featuredNews.featured_image}
                  category={(featuredNews.categories as any)?.name || 'Featured'}
                  variant="techcrunch-hero"
                  author="Tim Fernholz"
                  date="8 hours ago"
                  isPremium={featuredNews.is_premium}
                />
              ) : (
                <div className="h-[500px] bg-gray-100 animate-pulse" />
              )}
            </div>

            {/* Right: Top Headlines (33%) */}
            <div className="lg:col-span-4 flex flex-col space-y-6">
              <div className="border-b border-black pb-2">
                <h2 className="text-xl font-bold text-white bg-black inline-block px-2 py-1 transform -skew-x-6">Top Headlines</h2>
              </div>

              <div className="flex flex-col space-y-6">
                {trendingArticles.map((article, i) => (
                  <div key={article.id} className="group flex flex-col space-y-1 pb-4 border-b border-gray-100 last:border-0">
                    <Link href={`/news/${article.slug}`} className="block">
                      <h3 className="text-lg font-bold leading-tight text-black group-hover:text-[#00D100] transition-colors">
                        {article.title}
                      </h3>
                    </Link>
                    <div className="text-xs text-gray-500 font-bold">
                      <span className="text-[#00D100]">{(article.categories as any)?.name}</span>
                      <span className="mx-2">•</span>
                      <span>{i + 2} hours ago</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Content: In Brief & More News */}
      <section className="bg-gray-50 py-12 border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: In Brief (Horizontal/Grid or List) */}
            <div className="lg:col-span-12">
              <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-3xl font-bold tracking-tighter text-black">In Brief</h3>
                <div className="h-1 flex-grow bg-[#00D100]"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sections[0]?.articles?.slice(0, 4).map((article: any, i: number) => (
                  <NewsCard
                    key={article.id}
                    title={article.title}
                    slug={article.slug}
                    image={article.featured_image}
                    category="In Brief"
                    variant="in-brief"
                    author="Newslan"
                    date={`${i + 1}d ago`}
                  />
                ))}
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
          <section key={section.id} className="py-16 transition-colors" style={{ backgroundColor: catColor }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center space-x-3">
                  <div className={`w-1.5 h-10 ${isDark ? 'bg-white' : 'bg-red-600'}`} style={!isDark && catColor !== '#ffffff' && catColor !== '#f9fafb' ? { backgroundColor: 'white' } : {}} />
                  <h2 className={`text-3xl font-black uppercase tracking-tighter italic ${sectionTextColor}`}>
                    {section.name}
                  </h2>
                </div>
                <Link
                  href={`/category/${section.slug}`}
                  className={`flex items-center text-xs font-bold uppercase tracking-widest transition-colors ${secondaryTextColor} hover:opacity-70`}
                >
                  Lihat Semua <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className={sidebarAds.length > 0 ? "grid grid-cols-1 lg:grid-cols-12 gap-10" : ""}>
                <div className={sidebarAds.length > 0 ? "lg:col-span-8 xl:col-span-8" : ""}>
                  {/* Grid Variations */}
                  {isAlternate ? (
                    // Layout A: Featured left, list on right
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                      <div className={sidebarAds.length > 0 ? "lg:col-span-12 xl:col-span-8 h-full" : "lg:col-span-7 h-full"}>
                        {section.articles[0] && (
                          <NewsCard
                            title={section.articles[0].title}
                            slug={section.articles[0].slug}
                            image={section.articles[0].featured_image}
                            category={section.name}
                            categoryColor={isDark ? 'white' : section.bg_color}
                            excerpt={section.articles[0].excerpt}
                            isPremium={section.articles[0].is_premium}
                            isDark={isDark}
                            variant="large"
                          />
                        )}
                      </div>
                      <div className={sidebarAds.length > 0 ? "lg:col-span-12 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6" : "lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6"}>
                        {section.articles.slice(1, sidebarAds.length > 0 ? 3 : 5).map((article: any) => (
                          <NewsCard
                            key={article.id}
                            title={article.title}
                            slug={article.slug}
                            image={article.featured_image}
                            category={section.name}
                            categoryColor={isDark ? 'white' : section.bg_color}
                            isPremium={article.is_premium}
                            isDark={isDark}
                            variant="compact"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Layout B: Four equal cards
                    <div className="space-y-16">
                      <div className={sidebarAds.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"}>
                        {section.articles.slice(0, sidebarAds.length > 0 ? 3 : 4).map((article: any) => (
                          <NewsCard
                            key={article.id}
                            title={article.title}
                            slug={article.slug}
                            image={article.featured_image}
                            category={section.name}
                            categoryColor={isDark ? 'white' : section.bg_color}
                            excerpt={article.excerpt}
                            isPremium={article.is_premium}
                            isDark={isDark}
                          />
                        ))}
                      </div>

                      {/* Inject Feed Ad if exists for this index */}
                      {feedAds && feedAds[idx % feedAds.length] && (
                        <div className="max-w-4xl mx-auto py-8">
                          <AdRenderer ad={feedAds[idx % feedAds.length]} />
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] text-center block mt-2 ${secondaryTextColor}`}>Sponsored Content</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sidebar Column - WordPress Style Multi-Ad Stack */}
                {sidebarAds.length > 0 && (
                  <div className="lg:col-span-4 xl:col-span-4">
                    <div className="sticky top-24 space-y-5">
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
    </div>
  )
}
