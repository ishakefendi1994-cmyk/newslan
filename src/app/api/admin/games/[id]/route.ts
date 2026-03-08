import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Moved here from /api/games/[id] to avoid Next.js dynamic segment naming conflict
// with /api/games/[slug]/play. Admin calls DELETE/PATCH /api/admin/games/{id}

async function getAdmin(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    return profile?.role === 'admin' ? user : null
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const admin = await getAdmin(supabase)
        if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { error } = await supabase.from('games').delete().eq('id', id)
        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const admin = await getAdmin(supabase)
        if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await request.json()
        const { error, data } = await supabase
            .from('games')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
