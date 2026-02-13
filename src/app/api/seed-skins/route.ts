import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const htmlContent = `
<div style="width: 100%; height: 100%; min-height: 100vh; background: #fafafa; display: flex; flex-direction: column; items-center; justify-content: flex-start; padding-top: 150px; text-align: center;">
    <div style="width: 80%; max-width: 200px; margin: 0 auto; aspect-ratio: 1/4; background: #e4e4e7; border: 2px dashed #a1a1aa; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; border-radius: 8px;">
        <span style="font-family: sans-serif; font-weight: 900; font-size: 24px; line-height: 1.2; color: #71717a; text-transform: uppercase;">Space<br>Iklan<br>Disini</span>
        <div style="width: 40px; height: 4px; background: #ef4444;"></div>
        <span style="font-family: sans-serif; font-size: 12px; font-weight: bold; color: #52525b;">Hubungi Redaksi</span>
    </div>
</div>
`

    const ads = [
        {
            title: 'Sample Skin Left',
            type: 'html',
            placement: 'skin_left',
            html_content: htmlContent,
            is_active: true
        },
        {
            title: 'Sample Skin Right',
            type: 'html',
            placement: 'skin_right',
            html_content: htmlContent,
            is_active: true
        }
    ]

    for (const ad of ads) {
        // Check if exists
        const { data: existing } = await supabase
            .from('advertisements')
            .select('id')
            .eq('placement', ad.placement)
            .eq('title', ad.title)
            .single()

        if (!existing) {
            await supabase.from('advertisements').insert(ad)
        } else {
            await supabase.from('advertisements').update(ad).eq('id', existing.id)
        }
    }

    return NextResponse.json({ success: true, message: 'Skin ads seeded' })
}
