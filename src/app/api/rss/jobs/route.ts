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
        writing_style,
        article_model,
        job_type,
        search_keyword,
        trend_region,
        trend_niche,
        thumbnail_priority,
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
            targetLanguage = 'id',
            writingStyle = 'Professional',
            articleModel = 'Straight News',
            jobType = 'standard',
            searchKeyword = '',
            trendRegion = 'local',
            trendNiche = 'any',
            thumbnailPriority = 'ai_priority'
        } = body

        if (!name || (jobType === 'standard' && !rssUrl) || (jobType === 'keyword_watcher' && !searchKeyword)) {
            return NextResponse.json(
                { success: false, error: 'Name and RSS URL (or Keyword) are required' },
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
                writing_style: writingStyle,
                article_model: articleModel,
                job_type: jobType,
                search_keyword: searchKeyword,
                trend_region: trendRegion,
                trend_niche: trendNiche,
                thumbnail_priority: thumbnailPriority,
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

        const {
            id,
            name,
            rssUrl,
            categoryId,
            isPublished,
            showSourceAttribution,
            useAIImage,
            maxArticlesPerRun,
            targetLanguage,
            writingStyle,
            articleModel,
            jobType,
            searchKeyword,
            trendRegion,
            trendNiche,
            thumbnailPriority
        } = body

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Job ID required' },
                { status: 400 }
            )
        }

        const updates: any = { updated_at: new Date().toISOString() }

        if (name !== undefined) updates.name = name
        if (rssUrl !== undefined) updates.rss_url = rssUrl
        if (categoryId !== undefined) updates.category_id = categoryId || null
        if (isPublished !== undefined) updates.is_published = isPublished
        if (showSourceAttribution !== undefined) updates.show_source_attribution = showSourceAttribution
        if (useAIImage !== undefined) updates.use_ai_image = useAIImage
        if (maxArticlesPerRun !== undefined) updates.max_articles_per_run = maxArticlesPerRun
        if (targetLanguage !== undefined) updates.target_language = targetLanguage
        if (writingStyle !== undefined) updates.writing_style = writingStyle
        if (articleModel !== undefined) updates.article_model = articleModel
        if (jobType !== undefined) updates.job_type = jobType
        if (searchKeyword !== undefined) updates.search_keyword = searchKeyword
        if (trendRegion !== undefined) updates.trend_region = trendRegion
        if (trendNiche !== undefined) updates.trend_niche = trendNiche
        if (thumbnailPriority !== undefined) updates.thumbnail_priority = thumbnailPriority

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
