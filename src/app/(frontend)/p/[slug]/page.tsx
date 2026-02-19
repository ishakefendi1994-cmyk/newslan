import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Shield, Info, FileText } from 'lucide-react'

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function DynamicPage({ params }: PageProps) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: page, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

    if (error || !page) {
        notFound()
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Header */}
            <div className="bg-black text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase">
                        {page.title}
                    </h1>
                    <div className="h-1 w-20 bg-primary mx-auto" />
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-16">
                <div
                    className="prose prose-slate max-w-none 
                    prose-headings:font-black prose-headings:italic prose-headings:uppercase prose-headings:tracking-tighter
                    prose-p:text-gray-600 prose-p:leading-relaxed
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-black prose-strong:font-black"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />
            </div>
        </div>
    )
}
