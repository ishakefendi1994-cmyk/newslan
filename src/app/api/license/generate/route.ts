import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Verify Session
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
        }

        // Use Admin Client for DB operations (bypassing RLS)
        const adminSupabase = createAdminClient()
        const { client_name, max_domains, notes, expires_at } = await request.json()

        // 2. Generate License Key: FLAZZ-XXXX-XXXX-XXXX
        const generateKey = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No confusing chars
            const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
            return `FLAZZ-${segment()}-${segment()}-${segment()}`
        }

        const license_key = generateKey()

        // 3. Save to database
        const insertData: any = {
            license_key,
            client_name,
            max_domains: max_domains || 1,
            notes,
            status: 'active'
        }

        // Only add expires_at if it's a valid string, otherwise set to null
        if (expires_at && expires_at.trim() !== '') {
            insertData.expires_at = expires_at
        }

        const { data: license, error: dbError } = await adminSupabase
            .from('plugin_licenses')
            .insert(insertData)
            .select()
            .single()

        if (dbError) {
            console.error('License Generation DB Error:', dbError)
            return NextResponse.json({
                success: false,
                message: `Database Error: ${dbError.message}`,
                details: dbError.details || dbError.hint
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'License generated successfully.',
            data: license
        })

    } catch (err) {
        console.error('License Generation Error:', err)
        return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
    }
}
