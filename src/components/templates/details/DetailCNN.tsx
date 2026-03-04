import Image from 'next/image'
import { Eye, Clock, Share2, Bookmark, ChevronRight } from 'lucide-react'
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
import FBComments from '@/components/news/FBComments'

interface DetailCNNProps {
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

export default function DetailCNN({
    article,
    nextArticle,
    banners,
    siteSettings,
    currentUrl,
    products,
    pageAds
}: DetailCNNProps) {
    const { beforeAd, middleAd, afterAd } = pageAds

    // Function to inject middle ad and products with CNN-specific styling
    const renderContentWithInjections = (content: string) => {
        const proseClasses = `prose prose-lg md:prose-xl max-w-none prose-p:text-[#000] prose-p:leading-[1.7] prose-p:mb-5 prose-headings:text-black prose-headings:font-black prose-headings:tracking-tighter prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-strong:text-black prose-strong:font-bold prose-img:rounded-sm`

        let processedContent = content
        const paragraphs = processedContent.split('</p>')

        if (paragraphs.length < 3) return <div className={proseClasses} dangerouslySetInnerHTML={{ __html: processedContent }} />

        const middleIndex = Math.floor(paragraphs.length / 2)
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
                    <div key="middle-products" className="my-12 not-prose bg-gray-50 p-6 rounded-sm border-l-4 border-red-600">
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-black uppercase tracking-tighter">Rekomendasi Belanja</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="bg-white min-h-screen pb-20 font-sans">
            <PrefetchNextArticle slug={nextArticle?.slug} />

            {/* Breadcrumbs */}
            <div className="border-b border-gray-100 py-3 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Breadcrumbs
                        siteUrl={siteSettings.site_url}
                        items={[
                            { label: article.categories?.name || 'News', href: `/category/${article.categories?.slug}` },
                            { label: 'Detail' }
                        ]}
                    />
                </div>
            </div>

            <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Main Content Area */}
                    <div className="lg:col-span-8">
                        {/* Header Section */}
                        <header className="mb-10">
                            <Link
                                href={`/category/${article.categories?.slug}`}
                                className="text-red-600 font-black uppercase tracking-widest text-xs mb-4 block hover:underline"
                            >
                                {article.categories?.name || 'News'}
                            </Link>
                            <h1 className="text-3xl md:text-5xl lg:text-5xl font-black leading-[1.1] text-gray-900 tracking-tight mb-6">
                                {article.title}
                            </h1>

                            <div className="flex items-center justify-between py-6 border-y border-gray-100 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-red-600">
                                        <span className="font-black text-lg">{(article.profiles?.full_name || 'R').charAt(0)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-gray-900 leading-tight">
                                            {article.profiles?.full_name || `Redaksi ${siteSettings.site_name}`}
                                        </span>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                            <span>{siteSettings.site_name}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span>{new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center text-xs text-gray-400 font-black uppercase tracking-widest">
                                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                                        {article.views_count || 0}
                                    </div>
                                </div>
                            </div>

                            {/* Share & Actions */}
                            <div className="flex items-center justify-between mb-8">
                                <SocialShare
                                    url={currentUrl}
                                    title={article.title}
                                    description={article.excerpt || ''}
                                    siteName={siteSettings.site_name}
                                />
                                <div className="flex items-center gap-4">
                                    <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                        <Bookmark className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </header>

                        {/* Featured Image */}
                        <figure className="mb-12 relative">
                            <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-gray-100 border border-gray-100">
                                <Image
                                    src={optimizeCloudinaryUrl(article.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200", { quality: 'auto', width: 1200 })}
                                    alt={article.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                            <figcaption className="mt-3 text-xs text-gray-500 italic leading-relaxed border-l-2 border-red-600 pl-3">
                                {article.image_caption || `Foto: Dok. ${siteSettings.site_name}`}
                            </figcaption>
                        </figure>

                        {/* Article Content */}
                        <div className="relative">
                            {beforeAd && (
                                <div className="mb-10 bg-gray-50/50 p-4 border border-gray-100 flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">ADVERTISEMENT</span>
                                    <AdRenderer ad={beforeAd} />
                                </div>
                            )}

                            {renderContentWithInjections(article.content)}

                            {afterAd && (
                                <div className="mt-12 bg-gray-50/50 p-4 border border-gray-100 flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">ADVERTISEMENT</span>
                                    <AdRenderer ad={afterAd} />
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        {article.focus_keyword && (
                            <div className="mt-12 pt-8 border-t border-gray-100">
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest mr-2">Tags:</span>
                                    {article.focus_keyword.split(',').map((tag: string, i: number) => (
                                        <Link
                                            key={tag}
                                            href={`/search?q=${tag.trim()}`}
                                            className="px-3 py-1 bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                                        >
                                            {tag.trim()}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bottom Share */}
                        <div className="mt-10 p-6 border-y border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-red-600" />
                                <h3 className="font-black text-gray-900 uppercase tracking-tight">Bagikan Berita Ini</h3>
                            </div>
                            <SocialShare
                                url={currentUrl}
                                title={article.title}
                                description={article.excerpt || ''}
                                siteName={siteSettings.site_name}
                            />
                        </div>

                        <FBComments url={currentUrl} />

                        {/* Related Articles Section */}
                        <section className="mt-16">
                            <div className="flex items-center justify-between mb-8 border-b border-gray-900 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-5 bg-red-600" />
                                    <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-900">Berita Terkait</h2>
                                </div>
                                <Link
                                    href={`/category/${article.categories?.slug}`}
                                    className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                                >
                                    Lihat Semua <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <Suspense fallback={
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                                </div>
                            }>
                                <RelatedArticlesContainer
                                    currentArticleId={article.id}
                                    categoryId={article.categories?.id}
                                    showHeader={false}
                                    limit={4}
                                />
                            </Suspense>
                        </section>
                    </div>

                    {/* Sidebar Container */}
                    <aside className="lg:col-span-4 space-y-10">
                        <div className="sticky top-24 space-y-10">
                            <Suspense fallback={<SkeletonSidebar />}>
                                <NewsSidebarContainer currentArticleId={article.id} />
                            </Suspense>
                        </div>
                    </aside>
                </div>
            </article>

            {/* Bottom Full-Width Section: Trending Offer */}
            <div className="mt-20 py-16 bg-gray-50 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Suspense fallback={null}>
                        <TrendingProductsContainer siteName={siteSettings.site_name} />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
