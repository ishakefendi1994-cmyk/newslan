import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/commerce/ProductCard'
import { NewsCard } from '@/components/ui/NewsCard'
import { Calendar, User, Share2, Bookmark, Lock, ArrowLeft, Zap, Sparkles, Eye } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import NewsSidebar from '@/components/news/NewsSidebar'
import SocialShare from '@/components/news/SocialShare'
import AdRenderer from '@/components/news/AdRenderer'
import { Metadata } from 'next'

// Generate Metadata for SEO and Social Sharing
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()

    const { data: article } = await supabase
        .from('articles')
        .select('title, excerpt, featured_image')
        .eq('slug', slug)
        .single()

    if (!article) return { title: 'Not Found' }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://newslan.vercel.app'
    const title = article.title
    const description = article.excerpt || article.title
    const imageUrl = article.featured_image || `${siteUrl}/og-image.jpg`

    return {
        title: `${title} - Newslan.id`,
        description,
        openGraph: {
            title,
            description,
            url: `${siteUrl}/news/${slug}`,
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
        // Additional meta tags for better social sharing
        other: {
            'og:image:width': '1200',
            'og:image:height': '630',
        }
    }
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch Article with Category and Products
    const { data: article, error } = await supabase
        .from('articles')
        .select(`
            *,
            categories(id, name),
            profiles(full_name),
            article_products(
                products(
                    *,
                    affiliate_links(*)
                )
            )
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

    if (!article || error) {
        return notFound()
    }

    // Increment Views Count using RPC
    await supabase.rpc('increment_article_views', { article_id: article.id })

    // Fetch Latest Articles for Sidebar
    const { data: sidebarArticles } = await supabase
        .from('articles')
        .select('*, categories(name)')
        .eq('is_published', true)
        .neq('id', article.id)
        .order('created_at', { ascending: false })
        .limit(5)

    // Fetch Related Articles (Same Category)
    const { data: relatedArticles } = await supabase
        .from('articles')
        .select('*, categories(name)')
        .eq('is_published', true)
        .eq('category_id', article.categories?.id)
        .neq('id', article.id)
        .order('created_at', { ascending: false })
        .limit(6)

    // Fetch Latest Articles for Bottom Section
    const { data: latestArticlesSection } = await supabase
        .from('articles')
        .select('*, categories(name)')
        .eq('is_published', true)
        .neq('id', article.id)
        .order('created_at', { ascending: false })
        .limit(6)

    // Get User for Paywall
    const { data: { user } } = await supabase.auth.getUser()
    let profile = null
    if (user) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        profile = p
    }

    const isSubscribed = profile?.role === 'subscriber' || profile?.role === 'admin'
    const showPaywall = article.is_premium && !isSubscribed

    // Process Products
    const products = article.article_products?.map((ap: any) => ({
        ...ap.products,
        links: ap.products.affiliate_links?.map((l: any) => ({
            store: l.store_name,
            url: l.url
        }))
    })) || []

    const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/news/${slug}`

    // Fetch Advertisements for this page
    const { data: pageAds } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .in('placement', ['article_before', 'article_middle', 'article_after', 'sidebar'])

    const beforeAd = pageAds?.find(a => a.placement === 'article_before')
    const middleAd = pageAds?.find(a => a.placement === 'article_middle')
    const afterAd = pageAds?.find(a => a.placement === 'article_after')
    const sidebarAds = pageAds?.filter(a => a.placement === 'sidebar') || []

    // Function to inject middle ad
    const renderContentWithAds = (content: string) => {
        if (!middleAd) return <div className="article-content" dangerouslySetInnerHTML={{ __html: content }} />

        const paragraphs = content.split('</p>')
        if (paragraphs.length < 3) return <div className="article-content" dangerouslySetInnerHTML={{ __html: content }} />

        const middleIndex = Math.floor(paragraphs.length / 2)
        const firstHalf = paragraphs.slice(0, middleIndex).join('</p>') + '</p>'
        const secondHalf = paragraphs.slice(middleIndex).join('</p>')

        const proseClasses = "prose prose-xl max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-p:text-gray-800 prose-p:leading-relaxed prose-strong:text-black"

        return (
            <div className="article-content">
                <div className={proseClasses} dangerouslySetInnerHTML={{ __html: firstHalf }} />
                <div className="my-12 not-prose clear-both">
                    <AdRenderer ad={middleAd} />
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center block mt-2">- Advertisement -</span>
                </div>
                <div className={proseClasses} dangerouslySetInnerHTML={{ __html: secondHalf }} />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Breadcrumb / Back button */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Link href="/" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Kembali ke Beranda
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                {/* TechCrunch Article Hero (Full Width) */}
                <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px] mb-12 border border-black shadow-2xl">
                    {/* Left: Image */}
                    <div className="relative aspect-square md:aspect-auto md:h-full w-full bg-gray-100 border-b md:border-b-0 md:border-r border-black">
                        <Image
                            src={article.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200"}
                            alt={article.title}
                            fill
                            className="object-cover"
                            priority
                            unoptimized
                        />
                    </div>

                    {/* Right: Dark Red Content Box */}
                    <div className="bg-[#990000] p-8 md:p-12 flex flex-col justify-between text-white relative">
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
                            <span className="uppercase">{article.profiles?.full_name || 'Redaksi Newslan'}</span>
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Main Content (8 Columns) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* TechCrunch Article Hero */}
                        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px] mb-12 border border-black shadow-2xl">
                            {/* Left: Image */}
                            <div className="relative aspect-square md:aspect-auto md:h-full w-full bg-gray-100 border-b md:border-b-0 md:border-r border-black">
                                <Image
                                    src={article.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200"}
                                    alt={article.title}
                                    fill
                                    className="object-cover"
                                    priority
                                    unoptimized
                                />
                            </div>

                            {/* Right: Dark Red Content Box */}
                            <div className="bg-[#990000] p-8 md:p-12 flex flex-col justify-between text-white relative">
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
                                    <span className="uppercase">{article.profiles?.full_name || 'Redaksi Newslan'}</span>
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
                                            className="prose prose-xl max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-p:text-gray-800 prose-p:leading-relaxed prose-strong:text-black"
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

                        {/* Products Section */}
                        {products.length > 0 && (
                            <div className="mt-20 pt-10 border-t-4 border-black space-y-8">
                                <div className="flex items-center space-x-3">
                                    <div className="h-4 w-4 bg-primary rotate-45" />
                                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Rekomendasi Produk Terkait</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    </div>

                    {/* Sidebar (4 Columns) */}
                    <div className="lg:col-span-4 lg:border-l lg:border-gray-100 lg:pl-10">
                        <NewsSidebar latestArticles={sidebarArticles || []} sidebarAds={sidebarAds} />
                    </div>

                </div>

                {/* Related Articles Section */}
                {relatedArticles && relatedArticles.length > 0 && (
                    <div className="mt-32 space-y-10">
                        <div className="flex items-center justify-between border-b-4 border-black pb-4">
                            <div className="flex items-center space-x-3">
                                <Sparkles className="w-6 h-6 text-primary" />
                                <h2 className="text-3xl font-black uppercase tracking-tighter italic">Berita Terkait</h2>
                            </div>
                            <Badge className="bg-gray-100 text-gray-500 border-none px-4 py-1 text-xs">
                                Kategori: {(article.categories as any)?.name}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {relatedArticles.map((item) => (
                                <NewsCard
                                    key={item.id}
                                    title={item.title}
                                    slug={item.slug}
                                    image={item.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600"}
                                    category={item.categories?.name || 'News'}
                                    excerpt={item.excerpt}
                                    isPremium={item.is_premium}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Latest News Footer Section */}
                {latestArticlesSection && latestArticlesSection.length > 0 && (
                    <div className="mt-32 space-y-10">
                        <div className="flex items-center justify-between border-b-4 border-black pb-4">
                            <div className="flex items-center space-x-3">
                                <Zap className="w-6 h-6 text-primary" />
                                <h2 className="text-3xl font-black uppercase tracking-tighter italic">Berita Terbaru</h2>
                            </div>
                            <Link href="/news" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">
                                Lihat Semua Berita
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {latestArticlesSection.map((item) => (
                                <NewsCard
                                    key={item.id}
                                    title={item.title}
                                    slug={item.slug}
                                    image={item.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600"}
                                    category={item.categories?.name || 'News'}
                                    excerpt={item.excerpt}
                                    isPremium={item.is_premium}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
