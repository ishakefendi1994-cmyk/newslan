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

export default function TemplateMagazine({
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

    const mainStory = latestArticles?.[0]
    const subStories = latestArticles?.slice(1, 5) || []

    return (
        <div className="flex flex-col bg-slate-50 min-h-screen">
            {currentPage === 1 && (
                <>
                    {banners && banners.length > 0 && <BannerSlider banners={banners} />}

                    {/* Magazine Hero Section */}
                    <section className="py-8 bg-white border-b border-slate-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left: Large Main Story */}
                                <div className="lg:col-span-8">
                                    {mainStory && (
                                        <NewsCard
                                            variant="tempo-hero"
                                            title={mainStory.title}
                                            slug={mainStory.slug}
                                            image={mainStory.featured_image}
                                            category={mainStory.categories?.name || 'Featured'}
                                            date={new Date(mainStory.created_at).toLocaleDateString()}
                                        />
                                    )}
                                </div>
                                {/* Right: List of Sub Stories */}
                                <div className="lg:col-span-4 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Trending Now</h3>
                                    {subStories.map((article) => (
                                        <NewsCard
                                            key={article.id}
                                            variant="tempo-sidebar"
                                            title={article.title}
                                            slug={article.slug}
                                            image={article.featured_image}
                                            category={article.categories?.name || 'News'}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Strip Category Sections */}
                    <section className="py-12">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                            {categoriesWithNews?.slice(0, 3).map((section) => (
                                <div key={section.id}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <h2 className="text-xl font-bold text-slate-900 border-b-2 border-primary pb-1">{section.name}</h2>
                                        <div className="flex-1 h-px bg-slate-200" />
                                        <Link href={`/category/${section.slug}`} className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors">VIEW ALL</Link>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {(section.articles as any[] || []).slice(0, 3).map((article) => (
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
                            ))}
                        </div>
                    </section>
                </>
            )}

            {/* Pagination Style Feed */}
            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-black text-slate-900 mb-12 text-center uppercase tracking-tighter italic">Recommended for You</h2>
                        <div className="space-y-12">
                            {latestGridNews?.map((article) => (
                                <NewsCard
                                    key={article.id}
                                    variant="tempo-horizontal"
                                    title={article.title}
                                    slug={article.slug}
                                    image={article.featured_image}
                                    category={article.categories?.name || 'News'}
                                    excerpt={article.excerpt}
                                />
                            ))}
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            baseUrl="/"
                        />
                    </div>
                </div>
            </section>
        </div>
    )
}
