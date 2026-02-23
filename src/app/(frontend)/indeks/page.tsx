import { getIndeksArticles, getAllCategories, getSiteSettings } from '@/lib/data'
import IndeksHeader from '@/components/news/IndeksHeader'
import { NewsCard } from '@/components/ui/NewsCard'
import { format } from 'date-fns'
import { Metadata } from 'next'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

export const metadata: Metadata = {
    title: 'Indeks Berita - Portal Berita',
    description: 'Arsip berita harian lengkap berdasarkan tanggal dan kategori.',
}

interface IndeksPageProps {
    searchParams: Promise<{ date?: string; category?: string }>
}

export default async function IndeksPage({ searchParams }: IndeksPageProps) {
    const params = await searchParams
    const date = params.date || format(new Date(), 'yyyy-MM-dd')
    const category = params.category || 'all'

    const [articles, categories, settings] = await Promise.all([
        getIndeksArticles(date, category),
        getAllCategories(),
        getSiteSettings()
    ])

    return (
        <div className="bg-white min-h-screen pb-32">
            {/* Top Minimal Breadcrumb */}
            <div className="bg-white border-b border-gray-50 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Breadcrumbs
                        siteUrl={settings.site_url}
                        items={[{ label: 'Indeks Berita' }]}
                    />
                </div>
            </div>

            {/* Filter Section (Sticky ish) */}
            <IndeksHeader categories={categories || []} />

            {/* Result Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                {articles && articles.length > 0 ? (
                    <div className="space-y-12">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1.5 bg-[#0047ba] rounded-full" />
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                Terbit <span className="text-[#0047ba]">{articles.length} Berita</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                            {articles.map((article) => (
                                <NewsCard
                                    key={article.id}
                                    title={article.title}
                                    slug={article.slug}
                                    image={article.featured_image || ''}
                                    category={article.categories?.name || 'News'}
                                    excerpt={article.excerpt || ''}
                                    isPremium={article.is_premium}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100 text-center px-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <span className="text-2xl">🔍</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter italic">
                            Tidak Ada Berita
                        </h3>
                        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest max-w-sm">
                            Maaf, tidak ada berita yang ditemukan untuk tanggal dan kategori yang dipilih.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
