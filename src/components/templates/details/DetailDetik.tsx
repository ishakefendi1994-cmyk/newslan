import Image from 'next/image'
import { Eye, Lock, MessageCircle, Share2, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { optimizeCloudinaryUrl } from '@/lib/utils'
import SocialShare from '@/components/news/SocialShare'
import AdRenderer from '@/components/news/AdRenderer'
import { ProductCard } from '@/components/commerce/ProductCard'
import NewsSidebarContainer from '@/components/news/NewsSidebarContainer'
import RelatedArticlesContainer from '@/components/news/RelatedArticlesContainer'
import TrendingProductsContainer from '@/components/commerce/TrendingProductsContainer'
import { Suspense } from 'react'
import SkeletonSidebar from '@/components/ui/SkeletonSidebar'
import SkeletonCard from '@/components/ui/SkeletonCard'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import PrefetchNextArticle from '@/components/news/PrefetchNextArticle'

interface DetailDetikProps {
    article: any
    nextArticle: any
    banners: any[]
    siteSettings: any
    currentUrl: string
    products: any[]
    pageAds: {
        beforeAd?: any
        middleAd?: any
        afterAd?: any
    }
}

export default function DetailDetik({
    article,
    nextArticle,
    banners,
    siteSettings,
    currentUrl,
    products,
    pageAds
}: DetailDetikProps) {
    const { beforeAd, middleAd, afterAd } = pageAds

    // Function to inject middle ad and products with Detik-specific styling
    const renderContentWithInjections = (content: string) => {
        const proseClasses = `prose prose-lg md:prose-xl max-w-none prose-p:text-[#222] prose-p:leading-[1.8] prose-p:mb-6 prose-headings:text-black prose-headings:font-black prose-headings:tracking-tighter prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-l-4 prose-h2:border-[#0047ba] prose-h2:pl-4 prose-strong:text-black prose-strong:font-bold prose-img:rounded-xl`

        // Add "Jakarta - " style prefix if not present (simple heuristic)
        let processedContent = content
        if (content.startsWith('<p>')) {
            // Check if it already has a location prefix (simple check for " - ")
            const firstP = content.substring(0, 50)
            if (!firstP.includes(' - ')) {
                processedContent = content.replace('<p>', '<p><strong>Jakarta</strong> - ')
            }
        }

        const paragraphs = processedContent.split('</p>')

        if (paragraphs.length < 3) return <div className={proseClasses} dangerouslySetInnerHTML={{ __html: processedContent }} />

        const middleIndex = Math.floor(paragraphs.length / 2)
        const quarterIndex = Math.floor(paragraphs.length / 4)
        const threeQuarterIndex = Math.floor(paragraphs.length * 3 / 4)

        const adPoint = middleIndex
        const productPoint = (article.product_placement === 'middle' && products.length > 0) ? (middleAd ? threeQuarterIndex : middleIndex) : -1

        const elements = []
        let currentContent = []

        for (let i = 0; i < paragraphs.length; i++) {
            currentContent.push(paragraphs[i] + '</p>')

            if (i === adPoint && middleAd) {
                elements.push(<div key={`text-${i}`} className={proseClasses} dangerouslySetInnerHTML={{ __html: currentContent.join('') }} />)
                currentContent = []
                elements.push(
                    <div key="middle-ad" className="my-10 not-prose border-y border-gray-100 py-6">
                        <AdRenderer ad={middleAd} />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center block mt-2">ADVERTISEMENT</span>
                    </div>
                )
            }

            if (i === productPoint) {
                elements.push(<div key={`text-prod-${i}`} className={proseClasses} dangerouslySetInnerHTML={{ __html: currentContent.join('') }} />)
                currentContent = []
                elements.push(
                    <div key="middle-products" className="my-12 not-prose bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-1.5 h-6 bg-[#0047ba] rounded-full" />
                            <h2 className="text-lg font-black uppercase tracking-tighter italic">Rekomendasi Belanja</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {products.map((product: any, idx: number) => (
                                <ProductCard
                                    key={idx}
                                    name={product.name}
                                    description={product.description}
                                    image={product.image_url}
                                    priceRange={product.price_range}
                                    links={product.links}
                                />
                            ))}
                        </div>
                    </div>
                )
            }
        }

        if (currentContent.length > 0) {
            elements.push(<div key="text-final" className={proseClasses} dangerouslySetInnerHTML={{ __html: currentContent.join('') }} />)
        }

        return <div className="article-content">{elements}</div>
    }

    return (
        <div className="bg-[#f9f9f9] min-h-screen pb-20">
            <PrefetchNextArticle slug={nextArticle?.slug} />

            {/* Top Navigation Breadcrumb (Minimal) */}
            <div className="bg-white border-b border-gray-100 py-3">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <Breadcrumbs
                        siteUrl={siteSettings.site_url}
                        items={[
                            { label: article.categories?.name || 'News', href: `/category/${article.categories?.slug}` },
                            { label: 'Detail' }
                        ]}
                    />
                    <div className="flex items-center gap-4 text-gray-400">
                        <Share2 className="w-4 h-4 cursor-pointer hover:text-[#0047ba]" />
                        <Bookmark className="w-4 h-4 cursor-pointer hover:text-[#0047ba]" />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Main Article Container (8 Cols) */}
                    <div className="lg:col-span-8 bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100">

                        {/* Article Header */}
                        <div className="mb-8 text-center md:text-left">
                            <h1 className="text-3xl md:text-5xl font-black text-[#0047ba] leading-[1.1] tracking-tight mb-6">
                                {article.title}
                            </h1>

                            <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-gray-100 pb-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900">
                                        {article.profiles?.full_name || `Redaksi ${siteSettings.site_name}`}
                                    </span>
                                    <span className="text-gray-300">-</span>
                                    <span className="text-sm font-black text-[#e00034] italic">
                                        {siteSettings.site_name}News
                                    </span>
                                </div>
                                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-200" />
                                <div className="text-sm text-gray-400 font-medium">
                                    {new Date(article.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                                </div>
                                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-200" />
                                <div className="flex items-center text-sm text-gray-400 font-medium">
                                    <Eye className="w-4 h-4 mr-1.5" />
                                    {article.views_count || 0}
                                </div>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="mb-10 -mx-6 md:-mx-10 relative aspect-video group overflow-hidden border-y border-gray-100">
                            <Image
                                src={optimizeCloudinaryUrl(article.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200", { quality: 'auto', width: 900 })}
                                alt={article.title}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest rounded-md">
                                Foto: Dok. {siteSettings.site_name} RI
                            </div>
                        </div>

                        {/* Article Content */}
                        <div className="relative">
                            {beforeAd && (
                                <div className="mb-8 not-prose border-b border-gray-100 pb-6">
                                    <AdRenderer ad={beforeAd} />
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest text-center block mt-2">ADVERTISEMENT</span>
                                </div>
                            )}

                            {renderContentWithInjections(article.content)}

                            {afterAd && (
                                <div className="mt-12 not-prose pt-10 border-t border-gray-100">
                                    <AdRenderer ad={afterAd} />
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest text-center block mt-2">ADVERTISEMENT</span>
                                </div>
                            )}
                        </div>

                        {/* Tag Section (Detik Style) */}
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">Tags:</span>
                                {article.focus_keyword?.split(',').map((tag: string, i: number) => (
                                    <Link key={i} href={`/search?q=${tag.trim()}`} className="px-3 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-lg hover:bg-[#0047ba] hover:text-white transition-all uppercase tracking-tight">
                                        {tag.trim()}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Social Share Section */}
                        <div className="mt-10 px-6 py-4 bg-[#f4f7fa] rounded-2xl flex items-center justify-between">
                            <span className="text-xs font-black text-[#555] uppercase tracking-widest">Bagikan Artikell Ini:</span>
                            <SocialShare
                                url={currentUrl}
                                title={article.title}
                                description={article.excerpt || ''}
                                siteName={siteSettings.site_name}
                            />
                        </div>
                    </div>

                    {/* Sidebar Container (4 Cols) */}
                    <div className="lg:col-span-4 space-y-10">
                        {/* Sidebar Ad (Detik Style) */}
                        <div className="sticky top-24 space-y-10">
                            <Suspense fallback={<SkeletonSidebar />}>
                                <NewsSidebarContainer currentArticleId={article.id} />
                            </Suspense>

                            {/* Internal Ad Slot */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center relative">
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em] rotate-90 absolute right-1">PROMOTION</span>
                                    <Image
                                        src="https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=400"
                                        alt="Promo"
                                        fill
                                        className="object-cover opacity-80"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0047ba]/80 to-transparent flex flex-col justify-end p-6 text-white">
                                        <p className="text-xs font-black uppercase tracking-widest mb-1">Berlangganan</p>
                                        <h4 className="font-bold leading-tight">Dapatkan Update Berita Terpercaya Setiap Hari</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Related Content */}
                <div className="mt-20">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="h-2 w-10 bg-[#e00034] rounded-full" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Berita Terkait</h2>
                    </div>

                    <Suspense fallback={
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <SkeletonCard key={i} variant="detik-list" />
                            ))}
                        </div>
                    }>
                        <RelatedArticlesContainer currentArticleId={article.id} categoryId={article.categories?.id} showHeader={false} />
                    </Suspense>
                </div>

                <div className="mt-20">
                    <Suspense fallback={null}>
                        <TrendingProductsContainer siteName={siteSettings.site_name} />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
