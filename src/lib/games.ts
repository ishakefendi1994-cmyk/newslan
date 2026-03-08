import { createClient } from '@/lib/supabase/server'

// Re-export constants so server code can still import from this file
export { GAME_CATEGORIES } from '@/lib/game-constants'

export type Game = {
    id: string
    external_id: string | null
    title: string
    slug: string
    description: string | null
    instructions: string | null
    thumbnail: string | null
    embed_url: string
    category: string
    tags: string[] | null
    width: number
    height: number
    play_count: number
    is_featured: boolean
    is_manual: boolean
    is_active: boolean
    source: string
    created_at: string
    updated_at: string
}

interface GetGamesOptions {
    category?: string
    page?: number
    limit?: number
    search?: string
    featuredOnly?: boolean
}

export async function getGames({
    category,
    page = 1,
    limit = 24,
    search,
    featuredOnly,
}: GetGamesOptions = {}) {
    const supabase = await createClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
        .from('games')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

    if (category && category !== 'All') {
        query = query.ilike('category', `%${category}%`)
    }

    if (search) {
        query = query.ilike('title', `%${search}%`)
    }

    if (featuredOnly) {
        query = query.eq('is_featured', true)
    }

    const { data, count, error } = await query

    return { data: (data as Game[]) || [], count: count || 0, error }
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (error) return null
    return data as Game
}

export async function getFeaturedGames(limit = 8): Promise<Game[]> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('play_count', { ascending: false })
        .limit(limit)

    return (data as Game[]) || []
}

export async function getRelatedGames(category: string, excludeSlug: string, limit = 6): Promise<Game[]> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .ilike('category', `%${category}%`)
        .neq('slug', excludeSlug)
        .order('play_count', { ascending: false })
        .limit(limit)

    return (data as Game[]) || []
}

export async function getAllGameSlugs(): Promise<{ slug: string; updated_at: string }[]> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('games')
        .select('slug, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

    return data || []
}

export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .slice(0, 80)
}
