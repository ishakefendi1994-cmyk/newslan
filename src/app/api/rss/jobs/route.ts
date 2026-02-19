import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * RSS Auto-Jobs API
 * Manage scheduled RSS fetch jobs
 */

// Get all jobs
export async function GET() {
    try {
        const supabase = await createClient()

        const { data: jobs, error } = await supabase
            .from('rss_auto_jobs')
            .select(`
        id,
        name,
        task_key,
        rss_url,
        category_id,
        categories (name),
        is_published,
        show_source_attribution,
        use_ai_image,
        max_articles_per_run,
        is_active,
        last_run_at,
        last_run_status,
        last_run_articles,
        total_runs,
        total_articles_published,
        target_language,
        created_at
      `)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, jobs: jobs || [] })
    } catch (error: any) {
        console.error('[RSS Jobs API] GET error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// Create new job
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const {
            name,
            rssUrl,
            categoryId,
            isPublished = true,
            showSourceAttribution = true,
            useAIImage = false,
            maxArticlesPerRun = 3,
            targetLanguage = 'id'
        } = body

        if (!name || !rssUrl) {
            return NextResponse.json(
                { success: false, error: 'Name and RSS URL are required' },
                { status: 400 }
            )
        }

        // Generate unique task key (16 chars)
        const taskKey = generateTaskKey()

        const { data: job, error } = await supabase
            .from('rss_auto_jobs')
            .insert({
                name,
                task_key: taskKey,
                rss_url: rssUrl,
                category_id: categoryId || null,
                is_published: isPublished,
                show_source_attribution: showSourceAttribution,
                use_ai_image: useAIImage,
                max_articles_per_run: maxArticlesPerRun,
                target_language: targetLanguage,
                is_active: true
            })
            .select()
            .single()

        if (error) throw error

        console.log('[RSS Jobs] ✅ Created job:', name, 'Task Key:', taskKey)

        return NextResponse.json({
            success: true,
            job: {
                ...job,
                triggerUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/rss/cron/${taskKey}`
            }
        })
    } catch (error: any) {
        console.error('[RSS Jobs API] POST error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// Update job
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { id, showSourceAttribution, targetLanguage, ...otherUpdates } = body

        const updates: any = { ...otherUpdates, updated_at: new Date().toISOString() }
        if (showSourceAttribution !== undefined) {
            updates.show_source_attribution = showSourceAttribution
        }
        if (body.useAIImage !== undefined) {
            updates.use_ai_image = body.useAIImage
        }
        if (targetLanguage) {
            updates.target_language = targetLanguage
        }

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Job ID required' },
                { status: 400 }
            )
        }

        const { data: job, error } = await supabase
            .from('rss_auto_jobs')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, job })
    } catch (error: any) {
        console.error('[RSS Jobs API] PATCH error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// Delete job
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
            .from('rss_auto_jobs')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[RSS Jobs API] DELETE error:', error)
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
