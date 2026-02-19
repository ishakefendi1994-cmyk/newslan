import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/commerce/ProductCard'
import { NewsCard } from '@/components/ui/NewsCard'
import { Calendar, User, Share2, Bookmark, Lock, ArrowLeft, Zap, Sparkles, Eye } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import NewsSidebar from '@/components/news/NewsSidebar' // Keep for types if needed, or remove if unused 
import SocialShare from '@/components/news/SocialShare'
import AdRenderer from '@/components/news/AdRenderer'
import { getArticleBySlug, getNextArticle, getBanners } from '@/lib/data'
import { optimizeCloudinaryUrl } from '@/lib/utils'
import PrefetchNextArticle from '@/components/news/PrefetchNextArticle'
import BannerSlider from '@/components/ui/BannerSlider'
import { Metadata } from 'next'
import { Suspense } from 'react'
import NewsSidebarContainer from '@/components/news/NewsSidebarContainer'
import RelatedArticlesContainer from '@/components/news/RelatedArticlesContainer'
import SkeletonSidebar from '@/components/ui/SkeletonSidebar'
import SkeletonCard from '@/components/ui/SkeletonCard'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

// Generate Metadata for SEO and Social Sharing
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const { slug } = await params

    // Use Cached Access (ISR) for fast metadata resolution
    const article = await getArticleBySlug(slug)

    if (!article) return { title: 'Article Not Found - Newslan.id' }

    // Ensure absolute URLs for social sharing
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newslan.id'
    const title = article.title
    const description = article.excerpt || article.title

    // Fallback to logo if no featured image exists
    const imageUrl = article.featured_image || `${siteUrl}/logo.png`

    return {
        title: `${title} - Newslan.id`,
        description,
        metadataBase: new URL(siteUrl),
        alternates: {
            canonical: `/news/${slug}`,
        },
        openGraph: {
            title,
            description,
            url: `/news/${slug}`,
            siteName: 'Newslan.id',
            locale: 'id_ID',
            type: 'article',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                }
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
        // Meta tags to help social crawlers
        other: {
            'og:image:alt': title,
            'og:image:type': 'image/jpeg',
            'og:image:width': '1200',
            'og:image:height': '630',
        }
    }
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
    try {
        const { slug } = await params
        const supabase = await createClient()
        const settings = await supabase.from('site_settings').select('setting_key, setting_value')
        const siteSettings: Record<string, string> = {}
        settings.data?.forEach(s => siteSettings[s.setting_key] = s.setting_value)
        const primaryColor = siteSettings.theme_color || '#990000'

        // 1. Fetch MAIN Data (Critical for First Paint)
        // We use cached functions (ISR) for article data to ensure instant load.
        const article = await getArticleBySlug(slug)

        if (!article) {
            return notFound()
        }

        // Parallel fetch for other non-critical or dynamic data
        // OPTIMIZATION: AUTH & PREMIUM DISABLED (FORCE FAST LOAD)
        const [
            pageAdsResult,
            nextArticle,
            banners
        ] = await Promise.all([
            // Fetch Page Ads (Needed for Content Injection)
            supabase
                .from('advertisements')
                .select('*')
                .eq('is_active', true)
                .in('placement', ['article_before', 'article_middle', 'article_after']),

            // Fetch Next Article for Prefetching
            getNextArticle(article.id),

            // Fetch Banners for testing
            getBanners()
        ])

        // 3. Fire-and-forget View Increment (Non-blocking)
        supabase.rpc('increment_article_views', { article_id: article.id }).then(({ error }) => {
            if (error) console.error('RPC Error:', error)
        })

        // Extract Data
        const pageAds = pageAdsResult.data
        const showPaywall = false // Force disabled as requested

        // Process Products
        const products = article.article_products?.map((ap: any) => ({
            ...ap.products,
            links: ap.products.affiliate_links?.map((l: any) => ({
                store: l.store_name,
                url: l.url
            }))
        })) || []

        const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/news/${slug}`

        const beforeAd = pageAds?.find(a => a.placement === 'article_before')
        const middleAd = pageAds?.find(a => a.placement === 'article_middle')
        const afterAd = pageAds?.find(a => a.placement === 'article_after')

        // Function to inject middle ad
        const renderContentWithAds = (content: string) => {
            // Updated Prose Classes for a cleaner, premium look
            const proseClasses = `prose prose-lg md:prose-xl max-w-none prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b-4 prose-h2:border-primary/10 prose-h2:pb-2 prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-strong:text-black prose-strong:font-bold prose-img:rounded-2xl prose-img:shadow-xl`

            if (!middleAd) return <div className={proseClasses} dangerouslySetInnerHTML={{ __html: content }} />

            const paragraphs = content.split('</p>')
            if (paragraphs.length < 3) return <div className={proseClasses} dangerouslySetInnerHTML={{ __html: content }} />

            const middleIndex = Math.floor(paragraphs.length / 2)
            const firstHalf = paragraphs.slice(0, middleIndex).join('</p>') + '</p>'
            const secondHalf = paragraphs.slice(middleIndex).join('</p>')

            return (
                <div className="article-content">
                    <div className={proseClasses} dangerouslySetInnerHTML={{ __html: firstHalf }} />
                    <div className="my-14 not-prose clear-both">
                        <AdRenderer ad={middleAd} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] text-center block mt-3">- Advertisement -</span>
                    </div>
                    <div className={proseClasses} dangerouslySetInnerHTML={{ __html: secondHalf }} />
                </div>
            )
        }


        // Create JSON-LD for Articles (SEO)
        const articleJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: article.title,
            image: [article.featured_image || `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`],
            datePublished: article.created_at,
            dateModified: article.updated_at || article.created_at,
            author: [{
                '@type': 'Person',
                name: article.profiles?.full_name || `Redaksi ${siteSettings.site_name || 'Newslan.id'}`,
                url: `${process.env.NEXT_PUBLIC_SITE_URL}/redaksi`,
            }],
            publisher: {
                '@type': 'Organization',
                name: 'Newslan.id',
                logo: {
                    '@type': 'ImageObject',
                    url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
                },
            },
            description: article.excerpt || article.title,
        }

        return (
            <div className="bg-white min-h-screen">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
                />
                {banners && banners.length > 0 && <BannerSlider banners={banners} />}
                <PrefetchNextArticle slug={nextArticle?.slug} />
                {/* Breadcrumb Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Breadcrumbs items={[
                        { label: article.categories?.name || 'News', href: `/category/${article.categories?.slug}` },
                        { label: article.title }
                    ]} />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                    {/* TechCrunch Article Hero (Full Width) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px] mb-12 border border-black shadow-2xl">
                        {/* Left: Image */}
                        <div className="relative aspect-video md:aspect-auto md:h-full w-full bg-gray-100 border-b md:border-b-0 md:border-r border-black">
                            <Image
                                src={optimizeCloudinaryUrl(article.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200", { quality: 'auto:low', width: 650 })}
                                alt={article.title}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>

                        {/* Right: Dark Red Content Box */}
                        <div className="bg-primary p-8 md:p-12 flex flex-col justify-between text-white relative">
                            {/* Top Meta Actions */}
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-xs font-black uppercase tracking-[0.2em]">{article.categories?.name || 'News'}</span>
                                {/* Share button removed as requested */}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-5xl font-black leading-none tracking-tighter mb-8">
                                {article.title}
                            </h1>

                            {/* Bottom Meta */}
                            <div className="flex flex-col md:flex-row md:items-center text-xs md:text-sm font-bold border-t border-white/20 pt-6 mt-auto space-y-2 md:space-y-0 text-white/90">
                                <div className="flex items-center space-x-3">
                                    <span className="uppercase">{article.profiles?.full_name || `Redaksi ${siteSettings.site_name || 'Newslan.id'}`}</span>
                                </div>
                                <span className="hidden md:inline mx-3">•</span>
                                <span>{new Date(article.created_at).toLocaleDateString('en-US', { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                <span className="hidden md:inline mx-3">•</span>
                                <span className="flex items-center">
                                    <Eye className="w-4 h-4 mr-1" />
                                    {article.views_count || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

                        {/* Main Content (7 Columns) */}
                        <div className="lg:col-span-7 min-w-0 space-y-8">


                            {/* Article Text */}
                            <div className="max-w-none">
                                {beforeAd && (
                                    <div className="mb-10 not-prose clear-both">
                                        <AdRenderer ad={beforeAd} />
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center block mt-2">- Advertisement -</span>
                                    </div>
                                )}

                                {showPaywall ? (
                                    <>
                                        <div className="text-gray-600 line-clamp-3 overflow-hidden">
                                            <div
                                                className="prose prose-lg md:prose-xl max-w-none prose-p:text-gray-700 prose-p:leading-relaxed prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-3xl prose-strong:text-black prose-strong:font-bold"
                                                dangerouslySetInnerHTML={{ __html: article.content.substring(0, 500) }}
                                            />
                                        </div>
                                        <div className="relative mt-8">
                                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent h-40" />
                                            <div className="relative z-10 bg-black p-12 text-center space-y-8 mt-10 shadow-2xl skew-y-1">
                                                <div className="mx-auto w-16 h-16 bg-primary rounded-none flex items-center justify-center -rotate-3">
                                                    <Lock className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="space-y-4 -skew-y-1">
                                                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Konten Khusus Subscriber</h3>
                                                    <p className="text-gray-400 text-sm max-w-sm mx-auto font-medium">
                                                        Berlangganan sekarang untuk mendapatkan akses investigasi tajam, opini berani, dan berita eksklusif hari ini.
                                                    </p>
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-4 justify-center -skew-y-1">
                                                    <Link href="/subscribe" className="bg-primary text-white px-10 py-4 rounded-none font-black hover:bg-red-700 transition-all text-sm uppercase tracking-widest shadow-lg shadow-primary/30">
                                                        Gabung Sekarang
                                                    </Link>
                                                    <Link href="/auth/login" className="bg-white text-black px-10 py-4 rounded-none font-black hover:bg-gray-200 transition-all text-sm uppercase tracking-widest">
                                                        Masuk Akun
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    renderContentWithAds(article.content)
                                )}

                                {afterAd && (
                                    <div className="mt-12 not-prose clear-both border-t border-gray-100 pt-10">
                                        <AdRenderer ad={afterAd} />
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center block mt-2">- Advertisement -</span>
                                    </div>
                                )}
                            </div>

                            {/* Social Share Section */}
                            <div className="mt-12 pt-8 border-t border-gray-100">
                                <SocialShare
                                    url={currentUrl}
                                    title={article.title}
                                    description={article.excerpt || ''}
                                />
                            </div>

                        </div>

                        {/* Sidebar (5 Columns) (Async Streamed) */}
                        <div className="lg:col-span-5 min-w-0 lg:border-l lg:border-gray-100 lg:pl-8">
                            <Suspense fallback={<SkeletonSidebar />}>
                                <NewsSidebarContainer currentArticleId={article.id} />
                            </Suspense>
                        </div>

                    </div>

                    {/* Products Section - Full Width */}
                    {products.length > 0 && (
                        <div className="mt-20 pt-10 border-t-4 border-black space-y-8">
                            <div className="flex items-center space-x-3">
                                <div className="h-4 w-4 bg-primary rotate-45" />
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Rekomendasi Produk Terkait</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {products.map((product: any, i: number) => (
                                    <ProductCard
                                        key={i}
                                        name={product.name}
                                        description={product.description}
                                        image={product.image_url}
                                        priceRange={product.price_range}
                                        links={product.links}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Related Articles Section - Full Width (Async Streamed) */}
                    <Suspense fallback={
                        <div className="space-y-6 mt-16">
                            {[...Array(6)].map((_, i) => (
                                <SkeletonCard key={i} variant="tempo-horizontal" />
                            ))}
                        </div>
                    }>
                        <RelatedArticlesContainer currentArticleId={article.id} categoryId={article.categories?.id} />
                    </Suspense>
                </div>
            </div>
        )
    } catch (err) {
        console.error('Article Page Error:', err)
        return notFound()
    }
}
