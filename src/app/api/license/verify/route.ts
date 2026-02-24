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

        // 3. Check expiry
        if (license.expires_at && new Date(license.expires_at) < new Date()) {
            return NextResponse.json({ success: false, message: 'License has expired.' }, { status: 403 })
        }

        // 4. Check domain registrations/activations
        const { data: activations } = await supabase
            .from('license_activations')
            .select('*')
            .eq('license_id', license.id)

        const activeDomains = activations || []
        const alreadyRegistered = activeDomains.find(a => a.domain === domain)

        if (!alreadyRegistered) {
            // Check if we hit the limit
            if (activeDomains.length >= (license.max_domains || 1)) {
                return NextResponse.json({
                    success: false,
                    message: `Domain limit reached (${license.max_domains} site/s). Please upgrade your license.`
                }, { status: 403 })
            }

            // Register new domain
            const { error: regError } = await supabase
                .from('license_activations')
                .insert({ license_id: license.id, domain: domain })

            if (regError) {
                console.error('Domain Registration Error:', regError)
                return NextResponse.json({ success: false, message: 'Failed to activate on this domain.' }, { status: 500 })
            }
        }

        // 5. Update last verified at
        await supabase
            .from('plugin_licenses')
            .update({ last_verified_at: new Date().toISOString() })
            .eq('id', license.id)

        return NextResponse.json({
            success: true,
            message: 'License verified successfully.',
            data: {
                status: 'active',
                expires_at: license.expires_at,
                max_domains: license.max_domains,
                activations_count: alreadyRegistered ? activeDomains.length : activeDomains.length + 1
            }
        })

    } catch (err) {
        console.error('License Verification Error:', err)
        return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
    }
}
