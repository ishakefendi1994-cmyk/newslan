import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/articles/by-category?slug=nasional&limit=4
 * Returns published articles for a given category slug.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const slug = searchParams.get('slug')
        const limit = parseInt(searchParams.get('limit') ?? '4', 10)

        if (!slug) {
            return NextResponse.json({ error: 'slug is required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Step 1: Get category id from slug
        const { data: category, error: catError } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', slug)
            .single()

        if (catError || !category) {
            return NextResponse.json([], {
                headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
            })
        }

        // Step 2: Get articles by category_id
        const { data: articles, error } = await supabase
            .from('articles')
            .select('id, title, slug, featured_image, excerpt, created_at')
            .eq('category_id', category.id)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('[by-category API] Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(articles ?? [], {
            headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
        })
    } catch (err: any) {
        console.error('[by-category API] Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
