'use client'

import { NewsCard } from '@/components/ui/NewsCard'
import BannerSlider from '@/components/ui/BannerSlider'
import { Pagination } from '@/components/ui/Pagination'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

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
}

export default function TemplateGrid({
    banners,
    latestArticles,
    categoriesWithNews,
    breakingNews,
    feedAds,
    latestGridNews,
    totalLatestNews,
    trendingNews,
    currentPage,
    totalPages
}: TemplateProps) {

    const heroArticles = latestArticles?.slice(0, 4) || []

    return (
        <div className="flex flex-col bg-white">
            {currentPage === 1 && (
                <>
                    {banners && banners.length > 0 && <BannerSlider banners={banners} />}

                    {/* Modern Grid Hero */}
                    <section className="py-12 bg-slate-50">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {heroArticles.map((article, idx) => (
                                    <div key={article.id} className={idx === 0 ? "md:col-span-2 md:row-span-2" : ""}>
                                        <NewsCard
                                            variant="overlay-grid"
                                            title={article.title}
                                            slug={article.slug}
                                            image={article.featured_image}
                                            category={article.categories?.name || 'News'}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Category Sections as Compact Grids */}
                    {categoriesWithNews?.map((section) => (
                        <section key={section.id} className="py-16 border-b border-slate-100">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                                        {section.name}
                                    </h2>
                                    <Link href={`/category/${section.slug}`} className="text-xs font-bold text-primary flex items-center gap-1 group">
                                        LIHAT SEMUA <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {(section.articles as any[] || []).slice(0, 4).map((article) => (
                                        <NewsCard
                                            key={article.id}
                                            variant="grid-standard"
                                            title={article.title}
                                            slug={article.slug}
                                            image={article.featured_image}
                                            category={section.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>
                    ))}
                </>
            )}

            {/* Standard Paginated Feed */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-xl font-black text-slate-900 mb-8 border-l-4 border-primary pl-4">LATEST UPDATES</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {latestGridNews?.map((article) => (
                            <NewsCard
                                key={article.id}
                                title={article.title}
                                slug={article.slug}
                                image={article.featured_image}
                                category={article.categories?.name || 'News'}
                                date={new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            />
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        baseUrl="/"
                    />
                </div>
            </section>
        </div>
    )
}
