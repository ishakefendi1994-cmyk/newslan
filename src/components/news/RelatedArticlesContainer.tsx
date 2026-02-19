import { createClient } from '@/lib/supabase/server'
import { Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { optimizeCloudinaryUrl } from '@/lib/utils'

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
        <div className="mt-16 bg-white space-y-8">
            {/* Header */}
            <div className="flex items-center space-x-3 pb-4 border-b-2 border-gray-200">
                <Zap className="w-6 h-6" />
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic">
                    BERITA <span className="font-normal">TERKAIT</span>
                </h2>
            </div>

            {/* Horizontal Cards */}
            <div className="space-y-6">
                {relatedArticles.map((item) => (
                    <div key={item.id} className="group flex flex-col md:flex-row gap-6 pb-6 border-b border-gray-200 last:border-0">
                        {/* Image Left (~30%) */}
                        <div className="relative w-full md:w-[30%] aspect-video overflow-hidden bg-gray-100 shrink-0">
                            <Image
                                src={item.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600"}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, 30vw"
                            />
                        </div>

                        {/* Content Right (~70%) */}
                        <div className="flex-1 flex flex-col justify-start space-y-3">
                            <span className="bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white inline-block w-fit">
                                {item.categories?.name || 'BERITA'}
                            </span>
                            <Link href={`/news/${item.slug}`} className="block">
                                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-black leading-snug hover:text-primary transition-colors">
                                    {item.title}
                                </h3>
                            </Link>
                            {item.excerpt && (
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                                    {item.excerpt}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
