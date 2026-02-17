import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Get all categories
 * GET /api/categories
 */
export async function GET() {
    try {
        const supabase = await createClient()

        const { data: categories, error } = await supabase
            .from('categories')
            .select('id, name')
            .order('name', { ascending: true })

        if (error) {
            console.error('[Categories API] Error:', error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json(categories || [])
    } catch (error: any) {
        console.error('[Categories API] Error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
