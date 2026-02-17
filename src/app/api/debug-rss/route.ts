
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: { persistSession: false }
            }
        )

        const { data: jobs, error } = await supabase
            .from('rss_auto_jobs')
            .select('*')

        return NextResponse.json({
            success: true,
            count: jobs?.length,
            jobs,
            error
        })
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message })
    }
}
