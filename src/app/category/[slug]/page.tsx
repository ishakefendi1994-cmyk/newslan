import { createClient } from '@/lib/supabase/server'
import { NewsCard } from '@/components/ui/NewsCard'
import { notFound } from 'next/navigation'

interface CategoryPageProps {
    params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch category details
    const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!category) {
        notFound()
    }

    // Fetch articles for this category
    const { data: articles } = await supabase
        .from('articles')
        .select('*, categories(name)')
        .eq('category_id', category.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Category Header */}
            <div className="bg-gray-50 border-b border-gray-100 py-12 md:py-20 mb-10">
                <div className="w-full px-4 sm:px-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-1.5 bg-red-600 mb-2" />
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                            {category.name}
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                            Menampilkan {articles?.length || 0} berita terbaru di kategori {category.name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Articles Grid */}
            <div className="w-full px-4 sm:px-6">
                {articles && articles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {articles.map((article) => (
                            <NewsCard
                                key={article.id}
                                title={article.title}
                                slug={article.slug}
                                image={article.featured_image || ''}
                                category={category.name}
                                excerpt={article.excerpt || ''}
                                isPremium={article.is_premium}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">
                            Belum ada berita di kategori ini.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
