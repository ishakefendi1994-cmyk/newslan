'use client'

import { useState } from 'react'
import { NewsCard } from '@/components/ui/NewsCard'
import BannerSlider from '@/components/ui/BannerSlider'
import { Pagination } from '@/components/ui/Pagination'
import { ChevronRight, PlayCircle, TrendingUp, X, Play, Search, User, Menu } from 'lucide-react'
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

export default function TemplateCNN({
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

    const heroArticle = latestArticles?.[0]
    const subHeroArticles = latestArticles?.slice(1, 3) || []
    const latestListArticles = latestGridNews?.slice(0, 5) || []

    // Helper for YouTube ID
    const getYTID = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    return (
        <div className="flex flex-col bg-white min-h-screen font-sans text-black">

            {/* CNN Custom Trending Bar */}
            {currentPage === 1 && (
                <div className="bg-white border-b border-gray-100 py-2">
                    <div className="max-w-7xl mx-auto px-4 flex items-center space-x-6 overflow-x-auto no-scrollbar whitespace-nowrap">
                        <span className="text-red-600 font-black text-xs uppercase tracking-widest">Trending</span>
                        {breakingNews?.slice(0, 6).map((news, idx) => (
                            <div key={idx} className="flex items-center space-x-4">
                                {idx > 0 && <div className="w-px h-3 bg-gray-200" />}
                                <Link
                                    href={`/news/${news.slug || '#'}`}
                                    className="text-[11px] font-bold text-gray-600 hover:text-red-600 transition-colors"
                                >
                                    {news.title}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {currentPage === 1 && (
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* Hero Section (Left Content, Right Big Image) */}
                        <div className="lg:col-span-8">
                            {heroArticle && (
                                <div className="group border-b border-gray-100 pb-10">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                        <div className="md:col-span-5 flex flex-col space-y-4">
                                            <span className="text-red-600 font-extrabold text-[11px] uppercase tracking-tighter">
                                                {heroArticle.categories?.name || 'Nasional'}
                                            </span>
                                            <Link href={`/news/${heroArticle.slug}`}>
                                                <h1 className="text-3xl md:text-[40px] font-black leading-[1.05] tracking-tight text-red-600 hover:text-red-700 transition-colors">
                                                    {heroArticle.title}
                                                </h1>
                                            </Link>
                                            <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                                                {heroArticle.excerpt}
                                            </p>
                                        </div>
                                        <div className="md:col-span-7 relative aspect-[4/3] overflow-hidden rounded-sm">
                                            <Image
                                                src={optimizeCloudinaryUrl(heroArticle.featured_image, { quality: 'auto', width: 800 })}
                                                alt={heroArticle.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                priority
                                            />
                                        </div>
                                    </div>

                                    {/* Sub-hero Grid (Below Main Hero) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 border-t border-gray-100 pt-8">
                                        {subHeroArticles.map((art) => (
                                            <div key={art.id} className="flex gap-4 group">
                                                <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-sm">
                                                    <Image
                                                        src={optimizeCloudinaryUrl(art.featured_image, { quality: 'auto', width: 200 })}
                                                        alt={art.title}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform"
                                                    />
                                                </div>
                                                <Link href={`/news/${art.slug}`} className="flex-1">
                                                    <h3 className="text-sm font-black leading-tight text-gray-900 group-hover:text-red-600 transition-colors line-clamp-3">
                                                        {art.title}
                                                    </h3>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* "Berita Utama" Section */}
                            <div className="mt-12">
                                <h2 className="text-xl font-black text-gray-900 mb-8 border-b-2 border-gray-900 pb-2 inline-block">BERITA UTAMA</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {latestArticles.slice(3, 6).map((art) => (
                                        <div key={art.id} className="group space-y-3">
                                            <Link href={`/news/${art.slug}`}>
                                                <h3 className="text-base font-black leading-tight text-gray-900 group-hover:text-red-600 transition-colors">
                                                    {art.title}
                                                </h3>
                                            </Link>
                                            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                                                {art.categories?.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: TERPOPULER */}
                        <div className="lg:col-span-4">
                            <div className="border-l border-gray-100 pl-8 h-full">
                                <h2 className="text-lg font-black text-gray-900 mb-8 border-l-4 border-red-600 pl-4 uppercase tracking-tighter">Terpopuler</h2>
                                <div className="space-y-8">
                                    {trendingNews?.slice(0, 6).map((art, idx) => (
                                        <div key={art.id} className="flex gap-4 items-start group">
                                            <span className="text-3xl font-black text-gray-200 group-hover:text-red-600/20 italic transition-colors leading-none w-10 text-center">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <div className="flex-1 space-y-1">
                                                <Link href={`/news/${art.slug}`} className="text-[14px] font-bold text-gray-900 hover:text-red-600 transition-colors leading-tight line-clamp-3">
                                                    {art.title}
                                                </Link>
                                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block pt-1">
                                                    {art.categories?.name}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Sidebar Advertisements */}
                                <div className="mt-12 sticky top-24">
                                    {sidebarAds?.slice(0, 1).map((ad, i) => (
                                        <AdRenderer key={i} ad={ad} isSidebar={true} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Section: 9/16 Play Style */}
            {currentPage === 1 && shorts && shorts.length > 0 && (
                <section className="py-16 bg-[#0c0c0c] text-white">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-3xl font-black italic tracking-tighter flex items-center gap-2">
                                <span className="text-red-600">9/16</span> Play
                            </h2>
                            <Link href="/shorts" className="text-xs font-black text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-2">
                                Lihat Semua <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x">
                            {shorts.map((video) => {
                                const ytId = getYTID(video.video_url)
                                return (
                                    <div
                                        key={video.id}
                                        className="min-w-[180px] md:min-w-[240px] aspect-[9/16] relative transition-all duration-500 hover:scale-[1.02] cursor-pointer group snap-start"
                                        onClick={() => setSelectedVideo(video)}
                                    >
                                        <Image
                                            src={video.thumbnail_url || `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                                            alt={video.title}
                                            fill
                                            className="object-cover rounded-lg brightness-75 group-hover:brightness-100 transition-all shadow-2xl"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Play className="w-3 h-3 text-white fill-current" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                                                    CNN Indonesia
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-black leading-tight line-clamp-3 group-hover:text-red-400 transition-colors">
                                                {video.title}
                                            </h3>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* TERBARU Section - Mixed Grid */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                        {/* Main Feed */}
                        <div className="lg:col-span-8">
                            <div className="flex items-center gap-3 mb-10 border-b border-gray-100 pb-2">
                                <div className="w-8 h-1 bg-red-600" />
                                <h2 className="text-xl font-black uppercase tracking-tighter italic text-gray-900">TERBARU</h2>
                            </div>

                            <div className="space-y-12">
                                {latestGridNews.slice(currentPage === 1 ? 5 : 0).map((art) => (
                                    <div key={art.id} className="group grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                        <div className="md:col-span-5 relative aspect-video overflow-hidden rounded-sm">
                                            <Image
                                                src={optimizeCloudinaryUrl(art.featured_image, { quality: 'auto', width: 500 })}
                                                alt={art.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="md:col-span-7 space-y-2">
                                            <Link href={`/news/${art.slug}`}>
                                                <h3 className="text-xl md:text-2xl font-black leading-tight text-gray-900 tracking-tight group-hover:text-red-600 transition-colors">
                                                    {art.title}
                                                </h3>
                                            </Link>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                                                    {art.categories?.name}
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                    Rekomendasi untuk Anda
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-16">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    baseUrl="/"
                                />
                            </div>
                        </div>

                        {/* Right Sidebar: FOKUS & Ads */}
                        <div className="lg:col-span-4 space-y-12">
                            {/* FOKUS Block */}
                            <div>
                                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-2">
                                    <h2 className="text-lg font-black uppercase tracking-tighter italic text-gray-900">FOKUS</h2>
                                    <ChevronRight className="w-4 h-4 text-red-600" />
                                </div>
                                <div className="space-y-6">
                                    {trendingNews?.slice(6, 9).map((art) => (
                                        <div key={art.id} className="relative aspect-[16/6] rounded-sm overflow-hidden group">
                                            <Image
                                                src={optimizeCloudinaryUrl(art.featured_image, { quality: 'auto', width: 400 })}
                                                alt={art.title}
                                                fill
                                                className="object-cover transition-transform group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                                                <div className="bg-red-600 text-white font-black text-[10px] px-3 py-1.5 uppercase leading-none shadow-xl transform group-hover:scale-110 transition-transform">
                                                    {art.title}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Large Sidebar Ad */}
                            <div className="bg-gray-50 border border-gray-100 p-4 flex flex-col items-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">ADVERTISEMENT</span>
                                {sidebarAds?.[1] && <AdRenderer ad={sidebarAds[1]} isSidebar={true} />}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Laporan Interaktif Section (Gray BG) */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between mb-10 border-b border-gray-200 pb-2">
                        <h2 className="text-base font-black uppercase tracking-widest italic text-gray-900 border-l-4 border-red-600 pl-4">LAPORAN INTERAKTIF</h2>
                        <Link href="/category/nasional" className="text-[10px] font-black text-gray-500 hover:text-red-600 uppercase tracking-widest">LIHAT SEMUA</Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {categoriesWithNews?.[0]?.articles?.slice(0, 3).map((art: any) => (
                            <div key={art.id} className="group space-y-6">
                                <div className="relative aspect-video overflow-hidden rounded-sm bg-gray-200">
                                    <Image
                                        src={optimizeCloudinaryUrl(art.featured_image, { quality: 'auto', width: 400 })}
                                        alt={art.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500 shadow-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Link href={`/news/${art.slug}`}>
                                        <h3 className="text-sm font-black text-gray-900 group-hover:text-red-600 transition-colors leading-relaxed">
                                            {art.title}
                                        </h3>
                                    </Link>
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                                        {art.categories?.name}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                    <div
                        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
                        onClick={() => setSelectedVideo(null)}
                    />

                    <div className="relative w-full max-w-lg aspect-[9/16] bg-black overflow-hidden shadow-2xl ring-1 ring-white/10 rounded-2xl">
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
