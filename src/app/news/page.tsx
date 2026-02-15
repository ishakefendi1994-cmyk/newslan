import { createClient } from '@/lib/supabase/server'
import { getTrendingNews } from '@/lib/data'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import NewsSidebar from '@/components/news/NewsSidebar'
import AdRenderer from '@/components/news/AdRenderer'

export const metadata = {
    title: 'Berita Terbaru - Newslan.id',
    description: 'Kumpulan berita terbaru dan terhangat dari Newslan.id',
}

export default async function NewsIndexPage({ searchParams }: { searchParams: { page?: string } }) {
    const supabase = await createClient()
    const page = Number(await searchParams.page) || 1
    const limit = 12
    const offset = (page - 1) * limit

    // Fetch Total Count
    const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)

    // Fetch Articles
    const { data: articles } = await supabase
        .from('articles')
        .select('*, categories(name, slug)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    // Fetch Sidebar Content (Latest & Ads)
    const { data: latestArticles } = await supabase
        .from('articles')
        .select('*, categories(name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5)

    const { data: sidebarAds } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .eq('placement', 'sidebar')

    const trendingNews = await getTrendingNews()

    const totalPages = Math.ceil((count || 0) / limit)

    return (
        <div className="bg-white min-h-screen">
            {/* Header */}
            <div className="bg-black text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-4">
                        Berita Terbaru
                    </h1>
                    <p className="text-gray-400 max-w-2xl">
                        Indeks berita terkini dari berbagai kategori, menyajikan informasi terpercaya dan aktual untuk Anda.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {articles?.map((article) => (
                                <Link
                                    key={article.id}
                                    href={`/news/${article.slug}`}
                                    className="group flex flex-col h-full bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-black/5 transition-all duration-300"
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                                        <Image
                                            src={article.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800"}
                                            alt={article.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            unoptimized
                                        />
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-primary text-white border-none rounded-none px-3 py-1 font-bold text-xs uppercase tracking-widest shadow-lg">
                                                {article.categories?.name || 'News'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 p-6">
                                        <div className="flex items-center text-xs text-gray-400 mb-3 font-bold uppercase tracking-wider">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(article.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <h2 className="text-xl font-bold leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-3">
                                            {article.title}
                                        </h2>
                                        <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
                                            {article.excerpt || article.content.substring(0, 100).replace(/<[^>]*>?/gm, '') + '...'}
                                        </p>
                                        <div className="flex items-center text-xs font-black uppercase tracking-widest text-primary mt-auto">
                                            Baca Selengkapnya
                                            <TrendingUp className="w-3 h-3 ml-1" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-12 flex justify-between items-center border-t-4 border-black pt-6">
                            <Link
                                href={`/news?page=${page - 1}`}
                                className={`flex items-center text-sm font-black uppercase tracking-widest hover:text-primary transition-colors ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Sebelumnya
                            </Link>

                            <span className="text-xs font-bold text-gray-400">
                                Halaman {page} dari {totalPages}
                            </span>

                            <Link
                                href={`/news?page=${page + 1}`}
                                className={`flex items-center text-sm font-black uppercase tracking-widest hover:text-primary transition-colors ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                Selanjutnya
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Link>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 lg:border-l lg:border-gray-100 lg:pl-10">
                        <NewsSidebar latestArticles={latestArticles || []} sidebarAds={sidebarAds || []} trendingNews={trendingNews || []} />
                    </div>
                </div>
            </div>
        </div>
    )
}
