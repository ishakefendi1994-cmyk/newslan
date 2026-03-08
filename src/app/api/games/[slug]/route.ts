import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This handles /api/games/[slug] where slug can be either a slug string or a UUID (from admin)

async function getAdmin(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    return profile?.role === 'admin' ? user : null
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const supabase = await createClient()

        const admin = await getAdmin(supabase)
        if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        // slug can be a UUID (id) or an actual slug, try both
        const { error } = await supabase
            .from('games')
            .delete()
            .or(`id.eq.${slug},slug.eq.${slug}`)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const supabase = await createClient()

        const admin = await getAdmin(supabase)
        if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await request.json()
        const { error, data } = await supabase
            .from('games')
            .update({ ...body, updated_at: new Date().toISOString() })
            .or(`id.eq.${slug},slug.eq.${slug}`)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
