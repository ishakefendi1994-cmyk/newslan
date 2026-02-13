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

      {/* Hero Section */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="w-full px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              {featuredNews ? (
                <Link href={`/news/${featuredNews.slug}`} className="group relative block aspect-[16/9] w-full overflow-hidden">
                  <Image
                    src={featuredNews.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200"}
                    alt={featuredNews.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 md:p-10 space-y-4">
                    <div className="flex items-center space-x-2">
                      {featuredNews.categories && (
                        <span
                          className="text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest"
                          style={{ backgroundColor: (featuredNews.categories as any).bg_color || '#E11D48', color: getContrastColor((featuredNews.categories as any).bg_color) }}
                        >
                          {(featuredNews.categories as any).name}
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-none tracking-tighter line-clamp-2">
                      {featuredNews.title}
                    </h2>
                    <p className="text-gray-300 text-base md:text-lg max-w-2xl leading-relaxed line-clamp-2 hidden md:block">
                      {featuredNews.excerpt}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="aspect-[16/9] bg-gray-100 animate-pulse flex items-center justify-center">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Featured...</span>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 flex flex-col space-y-6">
              <div className="flex items-center space-x-2 border-l-4 border-red-600 pl-4 py-1">
                <TrendingUp className="w-5 h-5 text-red-600" />
                <h3 className="text-xl font-black uppercase tracking-tighter">Populer</h3>
              </div>
              <div className="space-y-6">
                {trendingArticles.length > 0 ? trendingArticles.map((article, i) => (
                  <div key={i} className="flex space-x-4 items-start group">
                    <span className="text-4xl font-black text-red-600 transition-colors italic leading-none">0{i + 1}</span>
                    <div className="flex flex-col space-y-1">
                      <Link href={`/news/${article.slug}`}>
                        <h4 className="font-bold text-sm leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                          {article.title}
                        </h4>
                      </Link>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: (article.categories as any)?.bg_color || '#9ca3af' }}
                      >
                        {(article.categories as any)?.name}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-400 text-sm italic font-bold">No trending news yet.</p>
                )}
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
            <div className="w-full px-4 sm:px-6">
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
