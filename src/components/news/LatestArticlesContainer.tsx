import { createClient } from '@/lib/supabase/server'
import { NewsCard } from '@/components/ui/NewsCard'
import { Zap } from 'lucide-react'
import Link from 'next/link'

export default async function LatestArticlesContainer({ currentArticleId }: { currentArticleId: string }) {
    const supabase = await createClient()

    const { data: latestArticlesSection } = await supabase
        .from('articles')
        .select('*, categories(name)')
        .eq('is_published', true)
        .neq('id', currentArticleId)
        .order('created_at', { ascending: false })
        .limit(6)

    if (!latestArticlesSection || latestArticlesSection.length === 0) return null

    return (
        <div className="mt-24 space-y-8 border-t-4 border-black pt-10">
            <div className="flex items-center justify-between pb-2">
                <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Berita Terbaru</h2>
                </div>
                <Link href="/news" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">
                    Lihat Semua &rarr;
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {latestArticlesSection.map((item) => (
                    <NewsCard
                        key={item.id}
                        title={item.title}
                        slug={item.slug}
                        image={item.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600"}
                        category={item.categories?.name || 'News'}
                        isPremium={item.is_premium}
                    />
                ))}
            </div>
        </div>
    )
}
