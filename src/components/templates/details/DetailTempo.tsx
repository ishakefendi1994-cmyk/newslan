import Image from 'next/image'
import { Eye, Lock } from 'lucide-react'
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
import BannerSlider from '@/components/ui/BannerSlider'

interface DetailTempoProps {
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

export default function DetailTempo({
    article,
    nextArticle,
    banners,
    siteSettings,
    currentUrl,
    products,
    pageAds
}: DetailTempoProps) {
    const { beforeAd, middleAd, afterAd } = pageAds

    // Function to inject middle ad and products
    const renderContentWithInjections = (content: string) => {
        const proseClasses = `prose prose-lg md:prose-xl max-w-none prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b-4 prose-h2:border-primary/10 prose-h2:pb-2 prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-strong:text-black prose-strong:font-bold prose-img:rounded-2xl prose-img:shadow-xl`

        const paragraphs = content.split('</p>')

        if (paragraphs.length < 3) return <div className={proseClasses} dangerouslySetInnerHTML={{ __html: content }} />

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
                    <div key="middle-ad" className="my-14 not-prose clear-both">
                        <AdRenderer ad={middleAd} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] text-center block mt-3">- Advertisement -</span>
                    </div>
                )
            }

            if (i === productPoint) {
                elements.push(<div key={`text-prod-${i}`} className={proseClasses} dangerouslySetInnerHTML={{ __html: currentContent.join('') }} />)
                currentContent = []
                elements.push(
                    <div key="middle-products" className="my-16 not-prose border-y border-gray-100 py-12 space-y-8 bg-slate-50/40 px-6 -mx-6 md:mx-0 md:px-0 md:bg-transparent md:border-x-0 relative">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Rekomendasi Terkait</h2>
                            </div>
                            <div className="h-[1px] flex-1 bg-gray-100 ml-4 hidden md:block" />
                        </div>
                        <div className="grid grid-cols-1 gap-6">
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
        <div className="bg-white min-h-screen">
            {banners && banners.length > 0 && <BannerSlider banners={banners} />}
            <PrefetchNextArticle slug={nextArticle?.slug} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Breadcrumbs
                    siteUrl={siteSettings.site_url}
                    items={[
                        { label: article.categories?.name || 'News', href: `/category/${article.categories?.slug}` },
                        { label: article.title }
                    ]}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px] mb-12 border border-black shadow-2xl">
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

                    <div className="bg-primary p-8 md:p-12 flex flex-col justify-between text-white relative">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-xs font-black uppercase tracking-[0.2em]">{article.categories?.name || 'News'}</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black leading-none tracking-tighter mb-8">
                            {article.title}
                        </h1>

                        <div className="flex flex-col md:flex-row md:items-center text-xs md:text-sm font-bold border-t border-white/20 pt-6 mt-auto space-y-2 md:space-y-0 text-white/90">
                            <div className="flex items-center space-x-3">
                                <span className="uppercase">{article.profiles?.full_name || `Redaksi ${siteSettings.site_name || 'Portal Berita'}`}</span>
                            </div>
                            <span className="hidden md:inline mx-3">•</span>
                            <span suppressHydrationWarning>{new Date(article.created_at).toLocaleDateString('en-US', { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span className="hidden md:inline mx-3">•</span>
                            <span className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                {article.views_count || 0}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                    <div className="lg:col-span-7 min-w-0 space-y-8">
                        <div className="max-w-none">
                            {beforeAd && (
                                <div className="mb-10 not-prose clear-both">
                                    <AdRenderer ad={beforeAd} />
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center block mt-2">- Advertisement -</span>
                                </div>
                            )}

                            {renderContentWithInjections(article.content)}

                            {afterAd && (
                                <div className="mt-12 not-prose clear-both border-t border-gray-100 pt-10">
                                    <AdRenderer ad={afterAd} />
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center block mt-2">- Advertisement -</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <SocialShare
                                url={currentUrl}
                                title={article.title}
                                description={article.excerpt || ''}
                                siteName={siteSettings.site_name}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-5 min-w-0 lg:border-l lg:border-gray-100 lg:pl-8">
                        <Suspense fallback={<SkeletonSidebar />}>
                            <NewsSidebarContainer currentArticleId={article.id} />
                        </Suspense>
                    </div>
                </div>

                {products.length > 0 && article.product_placement === 'after' && (
                    <div className="mt-20 pt-16 border-t border-gray-100 space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-900">Mungkin Anda Suka</h2>
                            </div>
                            <div className="h-[2px] flex-1 bg-gray-50 ml-6 hidden md:block" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
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

                <Suspense fallback={
                    <div className="space-y-6 mt-16">
                        {[...Array(6)].map((_, i) => (
                            <SkeletonCard key={i} variant="tempo-horizontal" />
                        ))}
                    </div>
                }>
                    <RelatedArticlesContainer currentArticleId={article.id} categoryId={article.categories?.id} />
                </Suspense>

                <Suspense fallback={null}>
                    <TrendingProductsContainer siteName={siteSettings.site_name} />
                </Suspense>
            </div>
        </div>
    )
}
