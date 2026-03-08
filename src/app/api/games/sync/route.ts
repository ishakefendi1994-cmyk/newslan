import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/games'
import { NextResponse } from 'next/server'

const GAMEMONETIZE_API = 'https://gamemonetize.com/feed.php'

type GameMonetizeGame = {
    id: string
    title: string
    description: string
    instructions: string
    url: string
    category: string
    tags: string
    thumb: string
    width: string
    height: string
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Verify admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Parse request body for options
        const body = await request.json().catch(() => ({}))
        const amount = body.amount || 500
        const category = body.category || '0' // 0 = all categories

        // Fetch from GameMonetize API
        const apiUrl = `${GAMEMONETIZE_API}?format=0&num=${amount}&category=${category}&type=0`
        const response = await fetch(apiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewslanBot/1.0)' },
            next: { revalidate: 0 }
        })

        if (!response.ok) {
            throw new Error(`GameMonetize API error: ${response.status}`)
        }

        const games: GameMonetizeGame[] = await response.json()

        if (!Array.isArray(games) || games.length === 0) {
            return NextResponse.json({ error: 'No games returned from API' }, { status: 500 })
        }

        let inserted = 0
        let updated = 0
        let failed = 0

        // Process in batches of 50
        const batchSize = 50
        for (let i = 0; i < games.length; i += batchSize) {
            const batch = games.slice(i, i + batchSize)

            const upsertData = batch.map((game) => {
                const baseSlug = generateSlug(game.title)
                const slug = `${baseSlug}-${game.id}`

                return {
                    external_id: game.id,
                    title: game.title,
                    slug,
                    description: game.description?.replace(/&bull;/g, '•').replace(/&middot;/g, '·').replace(/&mdash;/g, '—').replace(/&rsquo;/g, "'").replace(/&amp;/g, '&') || null,
                    instructions: game.instructions || null,
                    thumbnail: game.thumb || null,
                    embed_url: game.url,
                    category: game.category || 'Arcade',
                    tags: game.tags ? game.tags.split(', ').map((t: string) => t.trim()) : [],
                    width: parseInt(game.width) || 800,
                    height: parseInt(game.height) || 600,
                    is_active: true,
                    is_manual: false,
                    source: 'gamemonetize',
                    updated_at: new Date().toISOString(),
                }
            })

            const { error } = await supabase
                .from('games')
                .upsert(upsertData, {
                    onConflict: 'external_id',
                    ignoreDuplicates: false,
                })

            if (error) {
                console.error('Batch upsert error:', error)
                failed += batch.length
            } else {
                inserted += batch.length
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sync selesai: ${inserted} game diproses, ${failed} gagal`,
            total: games.length,
            inserted,
            updated,
            failed,
        })
    } catch (error: any) {
        console.error('Sync error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
