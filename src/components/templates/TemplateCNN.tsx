'use client'

import { useState } from 'react'
import { Pagination } from '@/components/ui/Pagination'
import { ChevronRight, TrendingUp, X, Play, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { optimizeCloudinaryUrl } from '@/lib/utils'
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
    const beritaUtamaArticles = latestArticles?.slice(3, 7) || []

    // Helper for YouTube ID
    const getYTID = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    return (
        <div className="flex flex-col bg-white min-h-screen font-sans text-black">
            <meta name="google-site-verification" content="Qos1JSRySAiuFYjTm_X3eLQRpU1JPRF8EQy-3a03BVY" />



            {/* ===== HALAMAN 1: HERO + SIDEBAR ===== */}
            {currentPage === 1 && (
                <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left: Hero + Berita Utama */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Hero Card */}
                            {heroArticle && (
                                <div className="group">
                                    {/* Featured Hero */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start pb-5 border-b border-gray-100">
                                        {/* Hero Image */}
                                        <div className="md:col-span-7 relative aspect-[16/10] overflow-hidden bg-gray-100 rounded-sm">
                                            <Image
                                                src={optimizeCloudinaryUrl(heroArticle.featured_image, { quality: 'auto', width: 900 })}
                                                alt={heroArticle.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                priority
                                            />
                                            {heroArticle.categories?.name && (
                                                <div className="absolute top-0 left-0">
                                                    <span className="bg-red-600 text-white font-black text-[10px] px-3 py-1 uppercase tracking-widest block">
                                                        {heroArticle.categories.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Hero Text */}
                                        <div className="md:col-span-5 flex flex-col space-y-3 md:pt-1">
                                            <Link href={`/news/${heroArticle.slug}`}>
                                                <h1 className="text-2xl md:text-[26px] font-extrabold leading-[1.15] tracking-tight text-gray-900 hover:text-red-600 transition-colors line-clamp-5">
                                                    {heroArticle.title}
                                                </h1>
                                            </Link>
                                            <p className="text-gray-500 text-[13px] leading-relaxed line-clamp-3">
                                                {heroArticle.excerpt}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span className="text-[11px] text-gray-400 font-medium">Berita Terbaru</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-Hero Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-gray-100 pt-4">
                                        {subHeroArticles.map((art, i) => (
                                            <div key={art.id} className={`group/sub flex gap-3 items-start ${i > 0 ? 'pl-5' : 'pr-5'}`}>
                                                {art.featured_image && (
                                                    <div className="relative w-[72px] h-[54px] shrink-0 overflow-hidden rounded-sm bg-gray-100">
                                                        <Image
                                                            src={optimizeCloudinaryUrl(art.featured_image, { width: 150 })}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                            priority={true}
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 space-y-1">
                                                    <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">
                                                        {art.categories?.name}
                                                    </span>
                                                    <Link href={`/news/${art.slug}`}>
                                                        <h3 className="text-[13px] font-bold leading-snug text-gray-900 hover:text-red-600 transition-colors line-clamp-3">
                                                            {art.title}
                                                        </h3>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* BERITA UTAMA Grid with Thumbnails */}
                            <div>
                                <div className="flex items-center gap-3 mb-5 border-b border-gray-900 pb-2">
                                    <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">BERITA UTAMA</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {beritaUtamaArticles.map((art) => (
                                        <div key={art.id} className="group space-y-2">
                                            <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-gray-100">
                                                {art.featured_image ? (
                                                    <Image
                                                        src={optimizeCloudinaryUrl(art.featured_image, { quality: 'auto', width: 300 })}
                                                        alt={art.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        priority={true}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200" />
                                                )}
                                                {art.categories?.name && (
                                                    <div className="absolute top-0 left-0">
                                                        <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 uppercase tracking-widest block">
                                                            {art.categories.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <Link href={`/news/${art.slug}`}>
                                                <h3 className="text-[13px] font-bold leading-snug text-gray-900 group-hover:text-red-600 transition-colors line-clamp-3">
                                                    {art.title}
                                                </h3>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar: TERPOPULER */}
                        <div className="lg:col-span-4">
                            <div className="lg:border-l border-gray-100 lg:pl-6 flex flex-col sticky top-16">
                                <div className="mb-4">
                                    <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-widest mb-1">TERPOPULER</h2>
                                    <div className="w-8 h-[3px] bg-red-600" />
                                </div>
                                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                                    {trendingNews?.slice(0, 10).map((art, idx) => (
                                        <div key={art.id} className="flex gap-3 items-start group border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                            {/* Number */}
                                            <span className="text-[28px] font-light text-gray-200 group-hover:text-red-200 transition-colors leading-none w-7 shrink-0 text-center pt-0.5">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            {/* Content */}
                                            <div className="flex-1 space-y-1 min-w-0">
                                                <Link href={`/news/${art.slug}`} className="block">
                                                    <h4 className="text-[13px] font-bold text-gray-900 hover:text-red-600 transition-colors leading-snug line-clamp-3">
                                                        {art.title}
                                                    </h4>
                                                </Link>
                                                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">
                                                    {art.categories?.name}
                                                </span>
                                            </div>
                                            {/* Thumbnail */}
                                            {art.featured_image && (
                                                <div className="relative w-14 h-12 shrink-0 overflow-hidden rounded-sm bg-gray-100">
                                                    <Image
                                                        src={optimizeCloudinaryUrl(art.featured_image, { width: 100 })}
                                                        alt=""
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>


                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== VIDEO / SHORTS SECTION ===== */}
            {currentPage === 1 && shorts && shorts.length > 0 && (
                <section className="py-10 bg-[#0d0d0d] text-white mt-4">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
                                <span className="text-red-600">9/16</span> Play
                            </h2>
                            <Link href="/shorts" className="text-[11px] font-black text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-1.5">
                                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x">
                            {shorts.map((video) => {
                                const ytId = getYTID(video.video_url)
                                return (
                                    <div
                                        key={video.id}
                                        className="min-w-[150px] md:min-w-[200px] aspect-[9/16] relative transition-all duration-500 hover:scale-[1.02] cursor-pointer group snap-start rounded-lg overflow-hidden"
                                        onClick={() => setSelectedVideo(video)}
                                    >
                                        <Image
                                            src={video.thumbnail_url || `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                                            alt={video.title}
                                            fill
                                            className="object-cover brightness-75 group-hover:brightness-100 transition-all"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <Play className="w-2.5 h-2.5 text-white fill-current" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Video</span>
                                            </div>
                                            <h3 className="text-[12px] font-bold leading-tight line-clamp-3 group-hover:text-red-400 transition-colors">
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

            {/* ===== KATEGORI + SIDEBAR FOKUS ===== */}
            <section className="py-10 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        <div className="lg:col-span-8">

                            {/* Produk Belanja — compact block */}
                            {trendingProducts.length > 0 && (
                                <div className="mb-4 pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2 mb-4 border-b border-gray-900 pb-2">
                                        <div className="w-1 h-5 bg-red-600" />
                                        <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-900">Rekomendasi Belanja</h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {trendingProducts.slice(0, 4).map((prod) => (
                                            <ShopeeProductCard
                                                key={prod.id}
                                                id={prod.id}
                                                name={prod.name}
                                                priceRange={prod.priceRange ?? prod.price_range ?? ''}
                                                image={prod.image ?? prod.image_url ?? ''}
                                                storeNames={prod.storeNames ?? prod.store_names ?? []}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sections per Kategori — layout bergantian: grid → list → featured */}
                            {categoriesWithNews?.filter((cat: any) => cat.articles?.length > 0).map((cat: any, idx: number) => {
                                const catSlug = cat.slug ?? cat.name?.toLowerCase()
                                const headerEl = (
                                    <div className="flex items-center justify-between mb-5 border-b border-gray-900 pb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-5 bg-red-600" />
                                            <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-900">{cat.name}</h2>
                                        </div>
                                        <Link href={`/category/${catSlug}`} className="text-[10px] font-black text-gray-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1">
                                            Lihat Semua <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                )

                                const layout = idx % 3

                                return (
                                    <div key={cat.id ?? cat.name} className="mt-10 pt-8 border-t border-gray-100">
                                        {headerEl}

                                        {/* Layout 0: Grid 3 kolom */}
                                        {layout === 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                {cat.articles.slice(0, 3).map((art: any) => (
                                                    <div key={art.id} className="group space-y-2">
                                                        <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-gray-200">
                                                            <Image src={optimizeCloudinaryUrl(art.featured_image, { quality: 'auto', width: 400 })} alt={art.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                            {art.categories?.name && (
                                                                <div className="absolute top-0 left-0">
                                                                    <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 uppercase tracking-widest block">{art.categories.name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Link href={`/news/${art.slug}`}>
                                                                <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2">{art.title}</h3>
                                                            </Link>
                                                            {art.excerpt && <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">{art.excerpt}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Layout 1: List horizontal (image kiri, teks kanan) */}
                                        {layout === 1 && (
                                            <div className="space-y-4">
                                                {cat.articles.slice(0, 4).map((art: any) => (
                                                    <article key={art.id} className="group grid grid-cols-12 gap-3 items-start border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                                        <div className="col-span-4 relative aspect-[4/3] overflow-hidden rounded-sm bg-gray-100">
                                                            <Image src={optimizeCloudinaryUrl(art.featured_image, { quality: 'auto', width: 300 })} alt={art.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                            {art.categories?.name && (
                                                                <span className="absolute top-0 left-0 bg-red-600 text-white font-black text-[8px] px-1.5 py-0.5 uppercase tracking-widest">{art.categories.name}</span>
                                                            )}
                                                        </div>
                                                        <div className="col-span-8 space-y-1">
                                                            <Link href={`/news/${art.slug}`}>
                                                                <h3 className="text-[20px] font-bold text-gray-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-3">{art.title}</h3>
                                                            </Link>
                                                            {art.excerpt && <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-2">{art.excerpt}</p>}
                                                        </div>
                                                    </article>
                                                ))}
                                            </div>
                                        )}

                                        {/* Layout 2: Featured — 1 besar kiri, 2 kecil kanan */}
                                        {layout === 2 && cat.articles.length >= 2 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                {/* Artikel utama — besar */}
                                                <div className="group space-y-2">
                                                    <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-gray-200">
                                                        <Image src={optimizeCloudinaryUrl(cat.articles[0].featured_image, { quality: 'auto', width: 500 })} alt={cat.articles[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        {cat.articles[0].categories?.name && (
                                                            <span className="absolute top-0 left-0 bg-red-600 text-white font-black text-[9px] px-2 py-0.5 uppercase tracking-widest block">{cat.articles[0].categories.name}</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Link href={`/news/${cat.articles[0].slug}`}>
                                                            <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-3">{cat.articles[0].title}</h3>
                                                        </Link>
                                                        {cat.articles[0].excerpt && <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">{cat.articles[0].excerpt}</p>}
                                                    </div>
                                                </div>
                                                {/* 2 artikel kecil stacked */}
                                                <div className="space-y-4">
                                                    {cat.articles.slice(1, 3).map((art: any) => (
                                                        <div key={art.id} className="group grid grid-cols-5 gap-3 items-start border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                                            <div className="col-span-2 relative aspect-[4/3] overflow-hidden rounded-sm bg-gray-100">
                                                                <Image src={optimizeCloudinaryUrl(art.featured_image, { quality: 'auto', width: 200 })} alt={art.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                            </div>
                                                            <div className="col-span-3 space-y-1">
                                                                {art.categories?.name && <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">{art.categories.name}</span>}
                                                                <Link href={`/news/${art.slug}`}>
                                                                    <h3 className="text-[14px] font-bold text-gray-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-3">{art.title}</h3>
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

                            <div className="mt-10">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    baseUrl="/"
                                />
                            </div>
                        </div>

                        {/* Right Sidebar: FOKUS + Ads */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* FOKUS Block */}
                            <div>
                                <div className="flex items-center justify-between mb-4 border-b border-gray-900 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-5 bg-red-600" />
                                        <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-900">FOKUS</h2>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-red-600" />
                                </div>
                                <div className="space-y-4">
                                    {trendingNews?.slice(6, 9).map((art) => (
                                        <div key={art.id} className="group space-y-2">
                                            <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-gray-100">
                                                <Image
                                                    src={optimizeCloudinaryUrl(art.featured_image, { quality: 'auto', width: 500 })}
                                                    alt={art.title}
                                                    fill
                                                    className="object-cover transition-transform group-hover:scale-105 duration-500"
                                                />
                                                {art.categories?.name && (
                                                    <div className="absolute top-0 left-0">
                                                        <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 uppercase tracking-widest block">
                                                            {art.categories.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <Link href={`/news/${art.slug}`}>
                                                <h4 className="text-[13px] font-bold text-gray-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2">
                                                    {art.title}
                                                </h4>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>



                            {/* Produk */}
                            {trendingProducts.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-gray-900 pb-2">
                                        <div className="w-1 h-5 bg-red-600" />
                                        <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-900">BELANJA</h2>
                                    </div>
                                    {trendingProducts.slice(0, 2).map((prod) => (
                                        <ShopeeProductCard
                                            key={prod.id}
                                            id={prod.id}
                                            name={prod.name}
                                            priceRange={prod.priceRange ?? prod.price_range ?? ''}
                                            image={prod.image ?? prod.image_url ?? ''}
                                            storeNames={prod.storeNames ?? prod.store_names ?? []}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Advertisements — di bawah sidebar */}
                            {sidebarAds && sidebarAds.length > 0 && (
                                <div className="pt-4 border-t border-gray-100 space-y-4">
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest block text-center">ADVERTISEMENT</span>
                                    {sidebarAds.slice(0, 2).map((ad, i) => (
                                        <div key={i} className="w-full flex justify-center">
                                            <AdRenderer ad={ad} isSidebar={true} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Berita Terbaru — link judul saja */}
                            {latestGridNews && latestGridNews.length > 0 && (
                                <div className="pt-5 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-3 border-b border-gray-900 pb-2">
                                        <div className="w-1 h-5 bg-red-600" />
                                        <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-900">Berita Terbaru</h2>
                                    </div>
                                    <ol className="space-y-0">
                                        {latestGridNews.slice(0, 7).map((art, i) => (
                                            <li key={art.id} className="group flex items-start gap-2.5 py-2.5 border-b border-gray-50 last:border-0">
                                                <span className="text-[13px] font-black text-red-600/60 shrink-0 w-4 leading-snug">{i + 1}</span>
                                                <Link href={`/news/${art.slug}`} className="text-[14px] font-semibold text-gray-700 group-hover:text-red-600 transition-colors leading-snug line-clamp-2">
                                                    {art.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>


            {/* ===== VIDEO MODAL ===== */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                    <div
                        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
                        onClick={() => setSelectedVideo(null)}
                    />
                    <div className="relative w-full max-w-sm aspect-[9/16] bg-black overflow-hidden shadow-2xl ring-1 ring-white/10 rounded-2xl">
                        <button
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-full transition-all z-20"
                            onClick={() => setSelectedVideo(null)}
                        >
                            <X className="w-4 h-4" />
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
