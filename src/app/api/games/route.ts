import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)

        const category = searchParams.get('category') || ''
        const search = searchParams.get('search') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '24')
        const featured = searchParams.get('featured') === 'true'
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('games')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .order('is_featured', { ascending: false })
            .order('play_count', { ascending: false })
            .range(from, to)

        if (category && category !== 'All') {
            query = query.ilike('category', `%${category}%`)
        }

        if (search) {
            query = query.ilike('title', `%${search}%`)
        }

        if (featured) {
            query = query.eq('is_featured', true)
        }

        const { data, count, error } = await query

        if (error) throw error

        return NextResponse.json({ data: data || [], count: count || 0 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { data, error } = await supabase
            .from('games')
            .insert({
                ...body,
                is_manual: true,
                source: 'manual',
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
