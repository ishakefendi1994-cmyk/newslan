import { createClient } from '@/lib/supabase/server'
import { NewsCard } from '@/components/ui/NewsCard'
import { Sparkles } from 'lucide-react'

export default async function RelatedArticlesContainer({
    currentArticleId,
    categoryId
}: {
    currentArticleId: string
    categoryId?: string
}) {
    if (!categoryId) return null

    const supabase = await createClient()

    const { data: relatedArticles } = await supabase
        .from('articles')
        .select('*, categories(name)')
        .eq('is_published', true)
        .eq('category_id', categoryId)
        .neq('id', currentArticleId)
        .order('created_at', { ascending: false })
        .limit(6)

    if (!relatedArticles || relatedArticles.length === 0) return null

    return (
        <div className="mt-24 bg-white p-8 sm:p-12 -mx-4 sm:-mx-6 lg:-mx-8 border-t-8 border-primary space-y-10">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3 text-black">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">Berita <span className="text-primary font-light">Terkait</span></h2>
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {relatedArticles.map((item) => (
                    <NewsCard
                        key={item.id}
                        title={item.title}
                        slug={item.slug}
                        image={item.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600"}
                        category={item.categories?.name || 'News'}
                        isPremium={item.is_premium}
                        isDark={false}
                        variant="compact"
                    />
                ))}
            </div>
        </div>
    )
}
