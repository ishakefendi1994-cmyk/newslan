import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const supabase = await createClient()

        // Simple play count increment using SQL
        const { data: game } = await supabase
            .from('games')
            .select('id, play_count')
            .eq('slug', slug)
            .single()

        if (game) {
            await supabase
                .from('games')
                .update({ play_count: (game.play_count || 0) + 1 })
                .eq('slug', slug)
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ success: false })
    }
}
