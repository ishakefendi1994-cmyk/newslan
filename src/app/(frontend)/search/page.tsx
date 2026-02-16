import { searchArticles } from '@/lib/data'
import { NewsCard } from '@/components/ui/NewsCard'
import { Search } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Pencarian Berita - Newslan.id',
    description: 'Hasil pencarian berita di Newslan.id',
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
    // Await property access if needed, or handle if searchParams itself is a promise in future
    // For now following existing pattern:
    const query = (await searchParams).q || ''

    const articles = query ? await searchArticles(query) : []

    return (
        <div className="bg-white min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-black rounded-full">
                        <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                            Hasil Pencarian
                        </h1>
                        <p className="text-gray-500">
                            Menampilkan hasil untuk "<span className="font-bold text-black">{query}</span>"
                        </p>
                    </div>
                </div>

                {articles && articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article: any) => (
                            <NewsCard
                                key={article.id}
                                title={article.title}
                                slug={article.slug}
                                image={article.featured_image}
                                category={article.categories?.name || 'News'}
                                isPremium={article.is_premium}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">
                            Tidak Ditemukan
                        </h3>
                        <p className="text-gray-400 mt-2">
                            Maaf, kami tidak menemukan berita yang cocok dengan kata kunci tersebut.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
