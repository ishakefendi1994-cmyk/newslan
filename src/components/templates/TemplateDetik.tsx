'use client'

import { useState } from 'react'
import { NewsCard } from '@/components/ui/NewsCard'
import BannerSlider from '@/components/ui/BannerSlider'
import { Pagination } from '@/components/ui/Pagination'
import { ChevronRight, PlayCircle, TrendingUp, X, Play } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { optimizeCloudinaryUrl, formatRupiah } from '@/lib/utils'
import { ShopeeProductCard } from '@/components/commerce/ShopeeProductCard'
import AdRenderer from '@/components/news/AdRenderer'

interface TemplateProps {
    banners: any[]
    latestArticles: any[]
    categoriesWithNews: any[]
    breakingNews: any[]
    feedAds: any[]
    latestGridNews: any[]
    totalLatestNews: number
    trendingNews: any[]
    currentPage: number
    totalPages: number
    sidebarAds: any[]
    trendingProducts?: any[]
    shorts?: any[]
}

export default function TemplateDetik({
    banners,
    latestArticles,
    categoriesWithNews,
    breakingNews,
    feedAds,
    latestGridNews,
    totalLatestNews,
    trendingNews,
    currentPage,
    totalPages,
    sidebarAds,
    trendingProducts = [],
    shorts = []
}: TemplateProps) {
    const [selectedVideo, setSelectedVideo] = useState<any>(null)

    const focusArticles = latestArticles?.slice(0, 3) || []
    const listArticles = latestArticles?.slice(3, 10) || []

    // Extract youtube ID for fallback thumbnail (moved here to be accessible by modal)
    const getYTID = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    return (
        <div className="flex flex-col bg-white min-h-screen">

            {currentPage === 1 && (
                <>
                    {banners && banners.length > 0 && <BannerSlider banners={banners} />}

                    {/* Detik Hero Section */}
                    <section className="py-6 border-b border-gray-100">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                                {/* Large Detik Hero (Specific Style) */}
                                <div className="lg:col-span-8 space-y-0">
                                    {focusArticles[0] && (
                                        <div className="group relative">
                                            <Link href={`/news/${focusArticles[0].slug}`} className="block relative aspect-[16/9] overflow-hidden rounded-t-lg">
                                                <Image
                                                    src={optimizeCloudinaryUrl(focusArticles[0].featured_image, { quality: 'auto', width: 800 })}
                                                    alt={focusArticles[0].title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    priority
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                                                    <h2 className="text-white text-xl md:text-2xl font-black leading-tight group-hover:text-[#ffbe00] transition-colors">
                                                        {focusArticles[0].title}
                                                    </h2>
                                                    <p className="text-gray-300 text-xs mt-2 italic font-medium">
                                                        {new Date(focusArticles[0].created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                    </p>
                                                </div>
                                            </Link>

                                            {/* Berita Terkait Block */}
                                            <div className="bg-[#005596] p-4 rounded-b-lg">
                                                <p className="text-[#ffbe00] text-[10px] font-black uppercase mb-3 tracking-widest border-b border-white/10 pb-2">Berita Terkait</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {focusArticles.slice(1, 3).map((rel) => (
                                                        <Link key={rel.id} href={`/news/${rel.slug}`} className="text-white text-[11px] font-bold hover:underline line-clamp-2 leading-snug">
                                                            {rel.title}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Hero Sidebar: Advertisements */}
                                <div className="hidden lg:block lg:col-span-4 pl-4">
                                    <div className="bg-white border-l border-gray-100 pl-6 h-full space-y-6">
                                        <div className="flex items-center gap-2 border-b-2 border-gray-200 pb-1 mb-4">
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sponsored</h3>
                                        </div>

                                        {sidebarAds && sidebarAds.length > 0 ? (
                                            sidebarAds.map((ad, i) => (
                                                <div key={ad.id || i} className="rounded-lg overflow-hidden border border-gray-50 shadow-sm">
                                                    <AdRenderer ad={ad} isSidebar={true} />
                                                </div>
                                            ))
                                        ) : (
                                            /* Fallback to what was there if no ads */
                                            <div className="space-y-5">
                                                <div className="flex items-center gap-2 border-b-2 border-[#005596] pb-1 mb-4">
                                                    <h3 className="text-sm font-black text-[#005596] uppercase tracking-tighter italic">Terpopuler</h3>
                                                </div>
                                                {trendingNews?.slice(0, 5).map((article, idx) => (
                                                    <div key={article.id} className="flex gap-4 items-start group">
                                                        <span className="text-3xl font-black text-[#e00034] italic transition-colors leading-none w-6 text-center">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="flex-1 space-y-1">
                                                            <Link href={`/news/${article.slug}`} className="text-[13px] font-bold text-black hover:text-[#005596] transition-colors leading-tight line-clamp-2">
                                                                {article.title}
                                                            </Link>
                                                            <span className="text-[10px] text-gray-400 font-medium uppercase">{article.categories?.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Main News Content Area */}
                                <div className="lg:col-span-8">
                                    {/* Carousel Berita Populer (Horizontal Scroll) */}
                                    <div className="mb-10 group/carousel">
                                        <div className="flex items-center justify-between mb-4 border-b-2 border-[#e00034] pb-1">
                                            <h3 className="text-sm font-black text-[#e00034] uppercase italic tracking-tighter flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" /> Populer Hari Ini
                                            </h3>
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory scroll-smooth">
                                            {trendingNews?.map((article, idx) => (
                                                <Link
                                                    key={article.id}
                                                    href={`/news/${article.slug}`}
                                                    className="min-w-[200px] md:min-w-[240px] group/item snap-start"
                                                >
                                                    <div className="relative aspect-video overflow-hidden rounded-xl mb-3 shadow-sm border border-gray-100 bg-gray-50">
                                                        <Image
                                                            src={optimizeCloudinaryUrl(article.featured_image, { quality: 'auto', width: 300 })}
                                                            alt={article.title}
                                                            fill
                                                            className="object-cover group-hover/item:scale-110 transition-transform duration-700"
                                                        />
                                                        <div className="absolute top-2 left-2 bg-[#e00034] text-white w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black italic shadow-lg z-10">
                                                            {idx + 1}
                                                        </div>
                                                    </div>
                                                    <h4 className="text-[13px] font-bold text-black leading-snug group-hover/item:text-[#005596] transition-colors line-clamp-2">
                                                        {article.title}
                                                    </h4>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 border-b-2 border-[#005596] pb-1 mb-6">
                                            <h2 className="text-lg font-black text-[#005596] uppercase tracking-tighter italic">Berita Terkini</h2>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {latestGridNews?.filter((_, idx) => currentPage > 1 || idx >= 3).map((article) => (
                                                <div key={article.id} className="group py-4 first:pt-0">
                                                    <div className="flex gap-4">
                                                        <div className="relative w-32 h-20 md:w-48 md:h-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                                            <Image
                                                                src={optimizeCloudinaryUrl(article.featured_image, { quality: 'auto', width: 300 })}
                                                                alt={article.title}
                                                                fill
                                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                            />
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[#005596] text-[10px] font-bold uppercase">{article.categories?.name}</span>
                                                                <span className="text-gray-400 text-[10px] italic">{new Date(article.created_at).toLocaleDateString('id-ID')}</span>
                                                            </div>
                                                            <Link href={`/news/${article.slug}`} className="block">
                                                                <h3 className="text-sm md:text-lg font-bold text-black leading-snug hover:text-[#005596] transition-colors line-clamp-2">
                                                                    {article.title}
                                                                </h3>
                                                            </Link>
                                                            <p className="text-xs text-gray-500 line-clamp-1 hidden md:block">
                                                                {article.excerpt}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            baseUrl="/"
                                        />
                                    </div>
                                </div>

                                {/* Sidebar Style Detik */}
                                <div className="lg:col-span-4 space-y-8">
                                    {/* Banners / Ads Slot */}
                                    {sidebarAds && sidebarAds.length > 1 && (
                                        <div className="space-y-6">
                                            {sidebarAds.slice(1).map((ad, i) => (
                                                <div key={ad.id || i} className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                                    <AdRenderer ad={ad} isSidebar={true} />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Trending / Populer Section - Enlarged */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="text-xl font-black text-[#005596] uppercase mb-6 flex items-center gap-2 italic tracking-tighter">
                                            <TrendingUp className="w-6 h-6" /> Populer
                                        </h3>
                                        <div className="space-y-6">
                                            {trendingNews?.slice(0, 5).map((article, idx) => (
                                                <div key={article.id} className="flex gap-5 items-start group">
                                                    <span className="text-4xl font-black text-[#005596] italic transition-colors leading-none w-8 text-center">{idx + 1}</span>
                                                    <Link href={`/news/${article.slug}`} className="text-sm font-black text-black hover:text-[#005596] transition-colors leading-tight line-clamp-3">
                                                        {article.title}
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Latest News - Title Only */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="text-sm font-black text-black uppercase mb-4 flex items-center gap-2 border-b-2 border-black pb-1">
                                            Terupdate
                                        </h3>
                                        <div className="divide-y divide-gray-100">
                                            {latestGridNews?.slice(0, 5).map((article) => (
                                                <div key={article.id} className="py-4 first:pt-0 group">
                                                    <Link href={`/news/${article.slug}`} className="block">
                                                        <h4 className="text-[15px] font-black text-gray-900 group-hover:text-[#005596] transition-colors leading-snug line-clamp-2">
                                                            {article.title}
                                                        </h4>
                                                        <span className="text-[10px] text-gray-400 font-medium uppercase mt-2 block">
                                                            {new Date(article.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                        </span>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                        <Link href="/indeks" className="mt-4 block text-center text-[10px] font-black text-[#005596] hover:underline uppercase tracking-widest bg-gray-50 py-2 rounded-lg">
                                            Lihat Indeks
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* Category Sections (Multi-Section Layout - Full Width Below) */}
            {currentPage === 1 && categoriesWithNews && categoriesWithNews.length > 3 && (
                <section className="py-12 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        {categoriesWithNews.slice(3).map((cat, idx) => {
                            const items = (cat.articles as any[] || []).slice(0, 4)
                            if (items.length === 0) return null

                            // Alternate between Grid and List style
                            const isGrid = idx % 2 === 0

                            return (
                                <div key={cat.id} className="space-y-6">
                                    <div className="flex items-center justify-between border-b-2 border-black pb-1">
                                        <h2 className="text-xl font-black text-black uppercase tracking-tighter italic">{cat.name}</h2>
                                        <Link href={`/category/${cat.slug}`} className="flex items-center gap-1 text-xs font-bold text-[#005596] hover:underline uppercase tracking-widest">
                                            Selengkapnya <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    {isGrid ? (
                                        /* Grid Layout */
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {items.map((art) => (
                                                <Link key={art.id} href={`/news/${art.slug}`} className="group space-y-3">
                                                    <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 shadow-sm">
                                                        <Image
                                                            src={optimizeCloudinaryUrl(art.featured_image, { quality: 'auto', width: 400 })}
                                                            alt={art.title}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                    <h3 className="text-sm font-bold text-black leading-snug group-hover:text-[#005596] transition-colors line-clamp-2">
                                                        {art.title}
                                                    </h3>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        /* List/Mixed Layout */
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                            {/* Big Featured on Left */}
                                            <div className="lg:col-span-6">
                                                <Link href={`/news/${items[0].slug}`} className="group block space-y-4">
                                                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl shadow-md">
                                                        <Image
                                                            src={optimizeCloudinaryUrl(items[0].featured_image, { quality: 'auto', width: 600 })}
                                                            alt={items[0].title}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                    <h3 className="text-lg font-black text-black leading-tight group-hover:text-[#005596] transition-colors">
                                                        {items[0].title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 line-clamp-2">{items[0].excerpt}</p>
                                                </Link>
                                            </div>
                                            {/* List on Right */}
                                            <div className="lg:col-span-6 divide-y divide-gray-100">
                                                {items.slice(1).map((art) => (
                                                    <div key={art.id} className="py-3 first:pt-0 group">
                                                        <div className="flex gap-4">
                                                            <div className="relative w-24 h-16 shrink-0 overflow-hidden rounded-lg shadow-sm">
                                                                <Image
                                                                    src={optimizeCloudinaryUrl(art.featured_image, { quality: 'auto', width: 200 })}
                                                                    alt={art.title}
                                                                    fill
                                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                                />
                                                            </div>
                                                            <Link href={`/news/${art.slug}`} className="text-sm font-bold text-black hover:text-[#005596] transition-colors leading-tight line-clamp-2 self-center">
                                                                {art.title}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Video Section (Detik TV Style) */}
            {shorts && shorts.length > 0 && (
                <section className="py-12 bg-black text-white overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#e00034] p-1.5 rounded-lg">
                                    <PlayCircle className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Video Terkini</h2>
                            </div>
                            <Link href="/shorts" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-1">
                                Selengkapnya <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory">
                            {shorts.map((video) => {
                                // Extract youtube ID for fallback thumbnail
                                const ytId = getYTID(video.video_url)

                                return (
                                    <div
                                        key={video.id}
                                        className="min-w-[280px] md:min-w-[320px] group snap-start cursor-pointer"
                                        onClick={() => setSelectedVideo(video)}
                                    >
                                        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 border border-gray-800 bg-gray-900 shadow-2xl">
                                            <Image
                                                src={video.thumbnail_url || `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                                                alt={video.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-16 h-16 bg-[#e00034] rounded-full flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                                    <PlayCircle className="w-8 h-8 text-white fill-current" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <h3 className="text-sm font-black leading-tight drop-shadow-lg line-clamp-2">
                                                    {video.title}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Shopping Section (Products) */}
            {trendingProducts && trendingProducts.length > 0 && (
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-8 border-b-2 border-gray-100 pb-2">
                            <h2 className="text-2xl font-black text-black uppercase italic tracking-tighter flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-[#005596]" /> Rekomendasi Belanja
                            </h2>
                            <Link href="/products" className="text-xs font-bold text-[#005596] hover:underline uppercase tracking-widest">
                                Lihat Semua
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {trendingProducts.slice(0, 5).map((product) => (
                                <ShopeeProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    priceRange={product.price_range}
                                    image={product.image_url}
                                    storeNames={product.affiliate_links?.map((l: any) => l.store_name)}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* If not page 1, just show the list style (Simplified for pagination) */}
            {currentPage > 1 && (
                <section className="py-10">
                    <div className="max-w-4xl mx-auto px-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            baseUrl="/"
                        />
                    </div>
                </section>
            )}

            {/* Video Player Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        onClick={() => setSelectedVideo(null)}
                    />

                    <div className="relative w-full max-w-5xl aspect-video bg-black overflow-hidden shadow-2xl ring-1 ring-white/10">
                        <button
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-full transition-all z-20"
                            onClick={() => setSelectedVideo(null)}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <iframe
                            src={`https://www.youtube.com/embed/${getYTID(selectedVideo.video_url)}?autoplay=1&modestbranding=1&rel=0`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
