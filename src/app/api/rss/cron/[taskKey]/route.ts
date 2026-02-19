import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'

/**
 * RSS Auto-Job Cron Trigger
 * GET /api/rss/cron/[taskKey]
 * 
 * Public endpoint for external cron services
 * Uses service role key to bypass RLS
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskKey: string }> }
) {
    const startTime = Date.now()
    const { taskKey } = await params

    try {
        // Use service role client to bypass RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 1. Find job by task_key
        const { data: job, error: jobError } = await supabase
            .from('rss_auto_jobs')
            .select('*')
            .eq('task_key', taskKey)
            .single()

        if (jobError || !job) {
            console.error('[RSS Cron] Job not found:', taskKey, jobError)
            return NextResponse.json(
                {
                    success: false,
                    error: `Job not found for key: "${taskKey}". DB Error: ${JSON.stringify(jobError)}`,
                    debug: { taskKey, jobError }
                },
                { status: 404 }
            )
        }

        // 2. Check if job is active
        if (!job.is_active) {
            console.log('[RSS Cron] Job is paused:', job.name)
            return NextResponse.json(
                { success: false, error: 'Job is currently paused' },
                { status: 400 }
            )
        }

        console.log(`[RSS Cron] 🚀 Starting job: ${job.name}`)

        // 3. Update job status to 'running'
        await supabase
            .from('rss_auto_jobs')
            .update({ last_run_status: 'running' })
            .eq('id', job.id)

        // 4. Fetch RSS feed
        const parser = new Parser({
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })

        let feed
        try {
            feed = await parser.parseURL(job.rss_url)
        } catch (err: any) {
            console.error('[RSS Cron] Failed to fetch feed:', err.message)
            await supabase
                .from('rss_auto_jobs')
                .update({
                    last_run_at: new Date().toISOString(),
                    last_run_status: 'failed',
                    last_run_articles: 0,
                    total_runs: job.total_runs + 1
                })
                .eq('id', job.id)

            return NextResponse.json(
                { success: false, error: 'Failed to fetch RSS feed: ' + err.message },
                { status: 500 }
            )
        }

        // 5. Process articles (limit to max_articles_per_run)
        const articlesToProcess = feed.items.slice(0, job.max_articles_per_run)
        const results = []
        let publishedCount = 0

        for (const item of articlesToProcess) {
            try {
                // Extract content
                const extractRes = await fetch(`${request.nextUrl.origin}/api/rss/extract`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: item.link })
                })
                const extractData = await extractRes.json()

                if (!extractData.success) {
                    results.push({ title: item.title, status: 'extract_failed', error: extractData.error })
                    continue
                }

                // AI Rewrite
                const rewriteRes = await fetch(`${request.nextUrl.origin}/api/rss/rewrite`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: extractData.data.title,
                        content: extractData.data.content,
                        sourceName: feed.title || 'RSS Feed',
                        language: job.target_language || 'id'
                    })
                })
                const rewriteData = await rewriteRes.json()

                if (!rewriteData.success) {
                    results.push({ title: item.title, status: 'rewrite_failed', error: rewriteData.error })
                    continue
                }

                // AI IMAGE GENERATION (Replicate)
                // If Replicate token exists AND job setting is ON, try to generate a custom thumbnail
                let finalImageUrl = extractData.data.image
                if (process.env.REPLICATE_API_TOKEN && job.use_ai_image) {
                    try {
                        // 1. Generate Prompt
                        const { generateImagePrompt, generateImage } = await import('@/lib/ai/image-generator')
                        const imagePrompt = await generateImagePrompt(rewriteData.data.title, rewriteData.data.content)

                        // 2. Generate Image
                        const replicateUrl = await generateImage(imagePrompt)

                        if (replicateUrl) {
                            console.log('[RSS Cron] AI Image generated:', replicateUrl)
                            // 3. Upload to Cloudinary (Optimization)
                            // We use the same upload function, it handles URL downloads
                            // But usually uploadRSSImageToCloudinary expects a URL.
                            // Replicate URL is public for a short time, so we must upload it.
                            /* 
                               Wait, uploadRSSImageToCloudinary expects a URL string. 
                               So we can just pass the replicateUrl.
                               However, we don't have direct access to that function here unless we import it?
                               Ah, the SAVE route does the uploading! 
                               
                               Wait, if we pass `image: replicateUrl` to the SAVE route, 
                               the SAVE route will call `uploadRSSImageToCloudinary`.
                               So we just need to replace `finalImageUrl` with `replicateUrl`.
                            */
                            finalImageUrl = replicateUrl
                        }
                    } catch (imgErr) {
                        console.error('[RSS Cron] AI Image Gen failed:', imgErr)
                        // Fallback to original image
                    }
                }

                // Check for duplicates (basic title match)
                const { data: existing } = await supabase
                    .from('articles')
                    .select('id')
                    .ilike('title', `%${rewriteData.data.title.substring(0, 50)}%`)
                    .limit(1)

                if (existing && existing.length > 0) {
                    results.push({ title: item.title, status: 'duplicate', articleId: existing[0].id })
                    continue
                }

                // Save article
                const saveRes = await fetch(`${request.nextUrl.origin}/api/rss/save`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: rewriteData.data.title,
                        content: rewriteData.data.content,
                        excerpt: rewriteData.data.excerpt,
                        image: finalImageUrl || null,
                        sourceUrl: item.link,
                        sourceName: feed.title || 'RSS Feed',
                        categoryId: job.category_id,
                        isPublished: job.is_published, // Use job's publish setting
                        showSourceAttribution: job.show_source_attribution
                    })
                })
                const saveData = await saveRes.json()

                if (saveData.success) {
                    publishedCount++
                    results.push({
                        title: item.title,
                        status: job.is_published ? 'published' : 'draft',
                        articleId: saveData.article.id
                    })
                } else {
                    results.push({ title: item.title, status: 'save_failed', error: saveData.error })
                }

                // 6. Rate Limit Handling
                // User confirmed paid account - removing 12s hard wait.
                // Replicate should handle higher limits now.
                // We add a tiny 1s buffer just to be safe and polite to their API.
                if (process.env.REPLICATE_API_TOKEN) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            } catch (err: any) {
                results.push({ title: item.title, status: 'error', error: err.message })
            }
        }

        // 6. Update job stats
        const executionTime = Math.round((Date.now() - startTime) / 1000)
        await supabase
            .from('rss_auto_jobs')
            .update({
                last_run_at: new Date().toISOString(),
                last_run_status: 'success',
                last_run_articles: publishedCount,
                total_runs: job.total_runs + 1,
                total_articles_published: job.total_articles_published + publishedCount
            })
            .eq('id', job.id)

        console.log(`[RSS Cron] ✅ Job completed: ${job.name} (${publishedCount} articles, ${executionTime}s)`)

        return NextResponse.json({
            success: true,
            jobName: job.name,
            articlesProcessed: articlesToProcess.length,
            articlesPublished: publishedCount,
            publishStatus: job.is_published ? 'published' : 'draft',
            executionTime: `${executionTime}s`,
            details: results
        })

    } catch (error: any) {
        console.error('[RSS Cron] Fatal error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
