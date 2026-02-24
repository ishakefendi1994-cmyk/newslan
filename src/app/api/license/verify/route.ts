import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const { license_key, domain } = await request.json()

        if (!license_key) {
            return NextResponse.json({ success: false, message: 'License key is required.' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Fetch license details
        const { data: license, error } = await supabase
            .from('plugin_licenses')
            .select('*')
            .eq('license_key', license_key)
            .single()

        if (error || !license) {
            return NextResponse.json({ success: false, message: 'Invalid license key.' }, { status: 404 })
        }

        // 2. Check status
        if (license.status !== 'active') {
            return NextResponse.json({ success: false, message: `License is ${license.status}.` }, { status: 403 })
        }

        // 3. Check domain binding (if domain is already registered)
        if (license.registered_domain && license.registered_domain !== domain) {
            return NextResponse.json({
                success: false,
                message: 'License is already registered to another domain: ' + license.registered_domain
            }, { status: 403 })
        }

        // 4. Bind domain if first time use
        if (!license.registered_domain) {
            await supabase
                .from('plugin_licenses')
                .update({ registered_domain: domain })
                .eq('id', license.id)
        }

        // 5. Check expiry
        if (license.expires_at && new Date(license.expires_at) < new Date()) {
            await supabase
                .from('plugin_licenses')
                .update({ status: 'expired' })
                .eq('id', license.id)
            return NextResponse.json({ success: false, message: 'License has expired.' }, { status: 403 })
        }

        // 6. Update last verified at
        await supabase
            .from('plugin_licenses')
            .update({ last_verified_at: new Date().toISOString() })
            .eq('id', license.id)

        return NextResponse.json({
            success: true,
            message: 'License verified successfully.',
            data: {
                status: 'active',
                expires_at: license.expires_at
            }
        })

    } catch (err) {
        console.error('License Verification Error:', err)
        return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
    }
}
