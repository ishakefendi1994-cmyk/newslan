import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateArticleFromScratch, NewsStyle, NewsModel } from '@/lib/ai/writer'
import { generateImagePrompt, generateImage } from '@/lib/ai/image-generator'

/**
 * AI Auto-Job Cron Trigger
 * GET /api/ai/cron/[taskKey]
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
            .from('ai_auto_jobs')
            .select('*')
            .eq('task_key', taskKey)
            .single()

        if (jobError || !job) {
            console.error('[AI Cron] Job not found:', taskKey, jobError)
            return NextResponse.json(
                { success: false, error: 'Job not found' },
                { status: 404 }
            )
        }

        // 2. Check if job is active
        if (!job.is_active) {
            return NextResponse.json(
                { success: false, error: 'Job is disabled' },
                { status: 400 }
            )
        }

        console.log(`[AI Cron] 🚀 Starting generation for: ${job.name}`)

        // 3. Update status to 'generating'
        await supabase
            .from('ai_auto_jobs')
            .update({ last_run_status: 'generating' })
            .eq('id', job.id)

        // 4. Fetch Category Name
        const { data: category } = await supabase
            .from('categories')
            .select('name')
            .eq('id', job.category_id)
            .single()

        // 5. Generate and Save Articles (Loop based on articles_per_run)
        const articlesPerRun = job.articles_per_run || 1
        const results = []
        let publishedCount = 0

        for (let i = 0; i < articlesPerRun; i++) {
            try {
                console.log(`[AI Cron] Generating article ${i + 1}/${articlesPerRun} for: ${job.name}`)

                // Add sub-topic variation to make multiple articles distinct
                let thematicPrompt = job.theme
                if (articlesPerRun > 1) {
                    const variations = [
                        "fokus pada aspek sosial",
                        "fokus pada dampak ekonomi",
                        "fokus pada opini masyarakat",
                        "fokus pada perspektif masa depan",
                        "aspek kontroversial",
                        "aspek human interest"
                    ]
                    const variation = variations[i % variations.length]
                    thematicPrompt = `${job.theme} (${variation})`
                }

                // Call libraries directly (Internal call is safer and faster than fetch)
                const article = await generateArticleFromScratch(
                    thematicPrompt,
                    category?.name || 'Umum',
                    job.style as NewsStyle,
                    job.model_type as NewsModel,
                    job.target_language || 'id'
                )

                // Generate Image
                let imageUrl = null
                if (job.generate_image && process.env.REPLICATE_API_TOKEN) {
                    try {
                        console.log(`[AI Cron] Generating thumbnail ${i + 1}...`)
                        const imagePrompt = await generateImagePrompt(article.title, article.content)
                        imageUrl = await generateImage(imagePrompt)
                    } catch (imgErr) {
                        console.error('[AI Cron] Image failed:', imgErr)
                    }
                }

                // Save Article - Use private API logical flow
                const { data: savedArticle, error: saveError } = await supabase
                    .from('articles')
                    .insert({
                        title: article.title,
                        content: article.content,
                        excerpt: article.excerpt,
                        image_url: imageUrl,
                        category_id: job.category_id,
                        source_name: 'Newslan AI Writer',
                        is_published: job.is_published,
                        show_source_attribution: false,
                        slug: article.title.toLowerCase()
                            .replace(/[^\w ]+/g, '')
                            .replace(/ +/g, '-') + '-' + Math.random().toString(36).substring(2, 7)
                    })
                    .select()
                    .single()

                if (!saveError && savedArticle) {
                    publishedCount++
                    results.push({ status: 'success', articleId: savedArticle.id })
                    console.log(`[AI Cron] Saved article: ${savedArticle.title}`)
                } else {
                    console.error('[AI Cron] Save error:', saveError)
                    results.push({ status: 'failed', error: saveError?.message })
                }

                // Delay between generations to be polite to APIs
                if (articlesPerRun > i + 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000))
                }
            } catch (err: any) {
                console.error(`[AI Cron] Error in iteration ${i}:`, err)
                results.push({ status: 'error', error: err.message })
            }
        }

        // 6. Update Job Stats
        const executionTime = Math.round((Date.now() - startTime) / 1000)
        await supabase
            .from('ai_auto_jobs')
            .update({
                last_run_at: new Date().toISOString(),
                last_run_status: publishedCount > 0 ? 'success' : 'failed',
                total_runs: (job.total_runs || 0) + 1,
                total_articles_generated: (job.total_articles_generated || 0) + publishedCount
            })
            .eq('id', job.id)

        console.log(`[AI Cron] ✅ Completed: ${job.name} (${publishedCount} articles, ${executionTime}s)`)

        return NextResponse.json({
            success: true,
            jobName: job.name,
            articlesGenerated: publishedCount,
            publishStatus: job.is_published ? 'published' : 'draft',
            executionTime: `${executionTime}s`,
            details: results
        })

    } catch (error: any) {
        console.error('[AI Cron] Fatal error:', error)

        // Update job status to failed if we have the job info
        // We can't easily do it here without job ID, but we logged it.

        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
