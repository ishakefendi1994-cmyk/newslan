import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = createAdminClient()

        // 1. Verify Admin Session
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

        const { client_name, max_domains, notes, expires_at } = await request.json()

        // 2. Generate License Key: FLAZZ-XXXX-XXXX-XXXX
        const generateKey = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No confusing chars
            const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
            return `FLAZZ-${segment()}-${segment()}-${segment()}`
        }

        const license_key = generateKey()

        // 3. Save to database
        const { data: license, error: dbError } = await supabase
            .from('plugin_licenses')
            .insert({
                license_key,
                client_name,
                max_domains: max_domains || 1,
                notes,
                expires_at,
                status: 'active'
            })
            .select()
            .single()

        if (dbError) {
            console.error('License Generation DB Error:', dbError)
            return NextResponse.json({ success: false, message: 'Failed to save license to database.' }, { status: 500 })
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
