import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * AI Auto-Jobs API
 * Manage scheduled AI article generation jobs
 */

// Get all AI jobs
export async function GET() {
    try {
        const supabase = await createClient()

        const { data: jobs, error } = await supabase
            .from('ai_auto_jobs')
            .select(`
                id,
                name,
                task_key,
                theme,
                category_id,
                categories (name),
                style,
                model_type,
                generate_image,
                is_published,
                articles_per_run,
                is_active,
                last_run_at,
                last_run_status,
                total_runs,
                total_articles_generated,
                created_at
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, jobs: jobs || [] })
    } catch (error: any) {
        console.error('[AI Jobs API] GET error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// Create new AI job
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const {
            name,
            theme,
            categoryId,
            style = 'Formal',
            modelType = 'Breaking News',
            generateImage = true,
            isPublished = true,
            articlesPerRun = 1
        } = body

        if (!name || !theme) {
            return NextResponse.json(
                { success: false, error: 'Name and Theme are required' },
                { status: 400 }
            )
        }

        // Generate unique task key (16 chars)
        const taskKey = generateTaskKey()

        const { data: job, error } = await supabase
            .from('ai_auto_jobs')
            .insert({
                name,
                task_key: taskKey,
                theme,
                category_id: categoryId || null,
                style,
                model_type: modelType,
                generate_image: generateImage,
                is_published: isPublished,
                articles_per_run: articlesPerRun,
                is_active: true
            })
            .select()
            .single()

        if (error) throw error

        console.log('[AI Jobs] ✅ Created AI job:', name, 'Task Key:', taskKey)

        return NextResponse.json({
            success: true,
            job: {
                ...job,
                triggerUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai/cron/${taskKey}`
            }
        })
    } catch (error: any) {
        console.error('[AI Jobs API] POST error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// Update AI job
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { id, ...updates } = body
        updates.updated_at = new Date().toISOString()

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Job ID required' },
                { status: 400 }
            )
        }

        const { data: job, error } = await supabase
            .from('ai_auto_jobs')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, job })
    } catch (error: any) {
        console.error('[AI Jobs API] PATCH error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// Delete AI job
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Job ID required' },
                { status: 400 }
            )
        }

        const { error } = await supabase
            .from('ai_auto_jobs')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[AI Jobs API] DELETE error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// Helper: Generate unique task key
function generateTaskKey(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let key = ''
    for (let i = 0; i < 16; i++) {
        key += chars[Math.floor(Math.random() * chars.length)]
    }
    return key
}
