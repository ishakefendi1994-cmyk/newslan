import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'
import { getSiteSettings } from '@/lib/settings'
import { getTrendingKeywords } from '@/lib/trends/pytrends'

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

        await supabase
            .from('rss_auto_jobs')
            .update({ last_run_status: 'running' })
            .eq('id', job.id)

        // 3.1 Fetch Site Settings (using service role client)
        const settings = await getSiteSettings(supabase)
        const hasReplicate = !!(settings.replicate_api_token || process.env.REPLICATE_API_TOKEN)

        // 4. Fetch RSS feed (Skip if smart_trend)
        const parser = new Parser({
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })

        let feed: any = { items: [] }
        if (job.job_type === 'standard') {
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
        }

        // 5. Process articles
        const results: any[] = []
        let publishedCount = 0
        let articlesToProcess: any[] = []

        if (job.job_type === 'keyword_watcher' || (job.job_type === 'smart_trend' && !job.rss_url)) {
            const keyword = job.job_type === 'keyword_watcher' ? job.search_keyword : null
            console.log(`[RSS Cron] 🌟 Processing ${job.job_type === 'keyword_watcher' ? 'Keyword' : 'Trend'} Job: ${job.name} (Keyword: ${keyword || 'Auto-Trend'})`)

            let sourceItems: any[] = []

            // Dynamic Targeting Config
            const region = job.trend_region || 'local'
            const niche = job.trend_niche || 'any'
            const isWestern = region === 'western'
            const googleConfig = isWestern
                ? { hl: 'en', gl: 'US', ceid: 'US:en' }
                : { hl: 'id', gl: 'ID', ceid: 'ID:id' }

            if (job.job_type === 'keyword_watcher') {
                // 1. Search Google News for the specific keyword (Reliable & Comprehensive)
                // Added &tbs=qdr:d to ensure only news from the last 24 hours
                let searchKeyword = keyword || ''

                // INTENT-BASED PRODUCT RESEARCH: Enrich keyword if niche is 'products'
                if (niche === 'products' && !isWestern) {
                    searchKeyword = `spesifikasi lengkap harga terbaru review ${searchKeyword} resmi indonesia`
                } else if (niche === 'products' && isWestern) {
                    searchKeyword = `full specs official price review ${searchKeyword} deals buys`
                }

                const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchKeyword)}${niche !== 'any' && niche !== 'products' ? '+' + encodeURIComponent(niche) : ''}&hl=${googleConfig.hl}&gl=${googleConfig.gl}&ceid=${googleConfig.ceid}&tbs=qdr:d`

                console.log(`[RSS Cron] 🔍 Searching Google News (${region}) for: ${searchKeyword} ${niche !== 'any' ? '(' + niche + ')' : ''}`)

                try {
                    const googleNewsParser = new Parser()
                    const searchFeed = await googleNewsParser.parseURL(searchUrl)

                    // Sort by newest first before taking top results
                    const sortedItems = [...searchFeed.items].sort((a, b) =>
                        new Date(b.isoDate || b.pubDate || 0).getTime() - new Date(a.isoDate || a.pubDate || 0).getTime()
                    )

                    // Take top 5 results for diverse synthesis
                    sourceItems = sortedItems.slice(0, 5).map(item => ({
                        ...item,
                        sourceName: item.source?.title || (isWestern ? 'Global Media' : 'Media Lokal')
                    }))

                    console.log(`[RSS Cron] ✅ Found ${sourceItems.length} matches on Google News Search`)
                } catch (err: any) {
                    console.error(`[RSS Cron] Google News Search failed: ${err.message}`)
                }

                // 2. If Google search fails or is empty, fallback to scanning some local feeds (Only for local region)
                if (sourceItems.length === 0 && !isWestern) {
                    console.log(`[RSS Cron] ⚠️ Google Search empty. Falling back to local RSS scan...`)
                    const { RSS_FEEDS } = await import('@/lib/rss/feeds')
                    const candidateFeeds = RSS_FEEDS.filter(f => f.category === 'Berita Terkini' || f.category === 'Teknologi').slice(0, 10)

                    for (const candidate of candidateFeeds) {
                        try {
                            const cFeed = await parser.parseURL(candidate.url)
                            const matches = cFeed.items.filter(item =>
                                item.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                                (item.content || '').toLowerCase().includes(searchKeyword.toLowerCase())
                            ).slice(0, 1)

                            if (matches.length > 0) {
                                sourceItems.push(...matches.map(m => ({ ...m, sourceName: candidate.name })))
                            }
                            if (sourceItems.length >= 3) break
                        } catch (e) { }
                    }
                }

                articlesToProcess = sourceItems.slice(0, 1)
            } else {
                // Get Top Trends from Google News (Dynamic Region & Niche)
                // Freshness Filter: &tbs=qdr:d (past 24h)
                let trendUrl = `https://news.google.com/rss?hl=${googleConfig.hl}&gl=${googleConfig.gl}&ceid=${googleConfig.ceid}&tbs=qdr:d`

                // If niche is specified, use the section URL
                if (niche !== 'any') {
                    const topicMap: Record<string, string> = {
                        technology: 'TECHNOLOGY',
                        business: 'BUSINESS',
                        sports: 'SPORTS',
                        entertainment: 'ENTERTAINMENT',
                        science: 'SCIENCE',
                        health: 'HEALTH'
                    }
                    const topic = topicMap[niche]
                    if (topic) {
                        trendUrl = `https://news.google.com/rss/headlines/section/topic/${topic}?hl=${googleConfig.hl}&gl=${googleConfig.gl}&ceid=${googleConfig.ceid}&tbs=qdr:d`
                    } else if (niche === 'products') {
                        // SHOPEE RADAR & VIRAL PRODUCTS: Combine product research with viral trends
                        const productSearch = isWestern
                            ? 'viral products trending gadgets best buy deals review'
                            : 'produk viral shopee haul rekomendasi harga terbaru unik'
                        trendUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(productSearch)}&hl=${googleConfig.hl}&gl=${googleConfig.gl}&ceid=${googleConfig.ceid}&tbs=qdr:d`
                    } else {
                        trendUrl = `https://news.google.com/rss/headlines/section/topic/WORLD?hl=${googleConfig.hl}&gl=${googleConfig.gl}&ceid=${googleConfig.ceid}&tbs=qdr:d`
                    }
                }

                console.log(`[RSS Cron] 📈 Fetching Autonomous Trends (${region} / ${niche})`)

                const googleNewsParser = new Parser()
                const googleFeed = await googleNewsParser.parseURL(trendUrl)

                // Sort by newest first
                const sortedTrends = [...googleFeed.items].sort((a, b) =>
                    new Date(b.isoDate || b.pubDate || 0).getTime() - new Date(a.isoDate || a.pubDate || 0).getTime()
                )

                sourceItems = sortedTrends.slice(0, Math.min(3, job.max_articles_per_run)).map(item => ({ ...item, sourceName: isWestern ? 'International Press' : 'Media Nasional' }))
                articlesToProcess = sourceItems
            }

            // Process the collected items (Trends or Keyword matches)
            if (job.job_type === 'keyword_watcher' && sourceItems.length > 0) {
                // Synthesis Mode for Keyword Watcher
                try {
                    const extractedContents = []
                    for (const item of sourceItems.slice(0, 5)) { // Use up to 5 sources
                        try {
                            // Check if source item link is already in articles table (Robust duplicate detection)
                            const { data: existingSource } = await supabase
                                .from('articles')
                                .select('id')
                                .eq('source_url', item.link)
                                .limit(1)

                            if (existingSource && existingSource.length > 0) {
                                console.log(`[RSS Cron] ⏭️ Skipping already processed source: ${item.link}`)
                                continue
                            }

                            const exRes = await fetch(`${request.nextUrl.origin}/api/rss/extract`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ url: item.link })
                            })
                            const exData = await exRes.json()

                            if (exData.success && exData.data.content.length > 200) {
                                extractedContents.push({
                                    title: (exData.data.title || item.title || 'Untitled').toString(),
                                    content: exData.data.content.toString(),
                                    image: exData.data.image,
                                    sourceName: (item.sourceName || 'Google Search').toString()
                                })
                            } else {
                                // Fallback to snippet if extraction fails or is too short
                                const fallbackContent = item.contentSnippet || item.content || item.description || ''
                                if (fallbackContent.length > 50) {
                                    extractedContents.push({
                                        title: (item.title || 'Untitled').toString(),
                                        content: fallbackContent.toString(),
                                        sourceName: (item.sourceName || 'Google Search').toString()
                                    })
                                }
                            }
                        } catch (e) {
                            console.error(`[RSS Cron] Extraction failed for ${item.link}:`, e)
                        }
                    }

                    if (extractedContents.length > 0) {
                        const { synthesizeFromMultipleSources } = await import('@/lib/ai/rewriter')
                        const synthesis = await synthesizeFromMultipleSources(
                            extractedContents,
                            job.target_language || 'id',
                            job.writing_style || 'Professional',
                            job.article_model || 'Straight News'
                        )

                        // Final duplicate check by title for synthesized article
                        const { data: existingTitle } = await supabase
                            .from('articles')
                            .select('id')
                            .ilike('title', `%${synthesis.title.substring(0, 30)}%`)
                            .limit(1)

                        if (existingTitle && existingTitle.length > 0) {
                            console.log(`[RSS Cron] ⏭️ Skipping synthesized duplicate: ${synthesis.title}`)
                        } else {
                            // AI IMAGE GENERATION (Replicate) for Synthesis
                            let finalImageUrl = extractedContents.find(c => c.image)?.image || null
                            const priority = job.thumbnail_priority || 'ai_priority'

                            if (hasReplicate && job.use_ai_image && priority !== 'source_only') {
                                const shouldTryAI = priority === 'ai_priority' || (priority === 'source_priority' && !finalImageUrl)

                                if (shouldTryAI) {
                                    try {
                                        const { generateImagePrompt, generateImage } = await import('@/lib/ai/image-generator')
                                        const imagePrompt = await generateImagePrompt(synthesis.title, synthesis.content)
                                        const replicateUrl = await generateImage(imagePrompt)
                                        if (replicateUrl) finalImageUrl = replicateUrl
                                    } catch (imgErr: any) {
                                        console.error(`[RSS Cron] AI Image failed, using fallback: ${imgErr.message}`)
                                    }
                                }
                            }

                            const saveRes = await fetch(`${request.nextUrl.origin}/api/rss/save`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title: synthesis.title,
                                    content: synthesis.content,
                                    excerpt: synthesis.excerpt,
                                    image: finalImageUrl,
                                    sourceUrl: sourceItems[0].link,
                                    sourceName: `${job.search_keyword || 'Smart'} Synthesized Report`,
                                    categoryId: job.category_id,
                                    focusKeyword: job.search_keyword,
                                    isPublished: job.is_published,
                                    showSourceAttribution: job.show_source_attribution
                                })
                            })
                            const saveData = await saveRes.json()
                            if (saveData.success) {
                                publishedCount++
                                results.push({ title: synthesis.title, status: 'synthesized', articleId: saveData.article.id })
                            }
                        }
                    }
                } catch (synErr: any) {
                    console.error(`[RSS Cron] Synthesis failed: ${synErr.message}`)
                }
            } else if (job.job_type === 'smart_trend') {
                // HYBRID TREND DISCOVERY: Google Trends (Pytrends) + Google News Headlines
                console.log(`[RSS Cron] 🤖 Initializing Hybrid Trend Discovery for job: ${job.name}`)

                // 1. Fetch from Google Trends (Pytrends)
                const pytrendsKeywords = await getTrendingKeywords(region, niche)
                console.log(`[RSS Cron] 🔥 Pytrends Keywords:`, pytrendsKeywords)

                // 2. Fetch from Google News Headlines
                let trendUrl = `https://news.google.com/rss?hl=${googleConfig.hl}&gl=${googleConfig.gl}&ceid=${googleConfig.ceid}&tbs=qdr:d`
                if (niche !== 'any') {
                    const topicMap: Record<string, string> = {
                        technology: 'TECHNOLOGY',
                        business: 'BUSINESS',
                        sports: 'SPORTS',
                        entertainment: 'ENTERTAINMENT',
                        science: 'SCIENCE',
                        health: 'HEALTH'
                    }
                    const topic = topicMap[niche]
                    if (topic) {
                        trendUrl = `https://news.google.com/rss/headlines/section/topic/${topic}?hl=${googleConfig.hl}&gl=${googleConfig.gl}&ceid=${googleConfig.ceid}&tbs=qdr:d`
                    }
                }

                const googleNewsParser = new Parser()
                const googleFeed = await googleNewsParser.parseURL(trendUrl)
                const gNewsKeywords = googleFeed.items.slice(0, 5).map(item =>
                    item.title?.replace(/\s-\s[^-]+$/, '').substring(0, 60) || ''
                ).filter(k => k.length > 0)

                console.log(`[RSS Cron] 📰 Google News Headlines:`, gNewsKeywords)

                // 3. Combine and Deduplicate to create "Super Trends"
                const superTrends = Array.from(new Set([...pytrendsKeywords, ...gNewsKeywords])).slice(0, job.max_articles_per_run || 3)
                console.log(`[RSS Cron] 🚀 Super Trends for Synthesis:`, superTrends)

                // 4. Process each Super Trend
                for (const trendKeyword of superTrends) {
                    try {
                        console.log(`[RSS Cron] 📈 Processing Super Trend: ${trendKeyword}`)

                        // Final check for duplicate title (Fuzzy)
                        const { data: existingTrend } = await supabase
                            .from('articles')
                            .select('id')
                            .ilike('title', `%${trendKeyword.substring(0, 20)}%`)
                            .limit(1)

                        if (existingTrend && existingTrend.length > 0) {
                            console.log(`[RSS Cron] ⏭️ Skipping processed trend keyword: ${trendKeyword}`)
                            continue
                        }

                        // Search for diverse sources for this trend
                        const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(trendKeyword)}&hl=${googleConfig.hl}&gl=${googleConfig.gl}&ceid=${googleConfig.ceid}&tbs=qdr:d`
                        const searchFeed = await googleNewsParser.parseURL(searchUrl)
                        let trendSources = searchFeed.items.slice(0, 5)

                        if (trendSources.length === 0) {
                            console.log(`[RSS Cron] ⚠️ No sources found for trend: ${trendKeyword}`)
                            continue
                        }

                        // Extract content from top 3 sources
                        const extractedContents = []
                        for (const item of trendSources) {
                            try {
                                const exRes = await fetch(`${request.nextUrl.origin}/api/rss/extract`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ url: item.link })
                                })
                                const exData = await exRes.json()

                                if (exData.success && exData.data.content.length > 200) {
                                    extractedContents.push({
                                        title: (exData.data.title || item.title || 'Untitled').toString(),
                                        content: exData.data.content.toString(),
                                        image: exData.data.image,
                                        sourceName: (item.source?.title || 'Google News').toString()
                                    })
                                }
                                if (extractedContents.length >= 3) break
                            } catch (e) { }
                        }

                        if (extractedContents.length > 0) {
                            console.log(`[RSS Cron] 🤖 Synthesizing ${extractedContents.length} sources for super trend: ${trendKeyword}`)
                            const { synthesizeFromMultipleSources } = await import('@/lib/ai/rewriter')
                            const synthesis = await synthesizeFromMultipleSources(
                                extractedContents,
                                job.target_language || 'id',
                                job.writing_style || 'Professional',
                                job.article_model || 'Straight News'
                            )

                            // AI Image Generation
                            let finalImageUrl = extractedContents.find(c => c.image)?.image || null
                            const priority = job.thumbnail_priority || 'ai_priority'

                            if (hasReplicate && priority !== 'source_only') {
                                const shouldTryAI = priority === 'ai_priority' || (priority === 'source_priority' && !finalImageUrl)
                                if (shouldTryAI) {
                                    try {
                                        const { generateImagePrompt, generateImage } = await import('@/lib/ai/image-generator')
                                        const imagePrompt = await generateImagePrompt(synthesis.title, synthesis.content)
                                        const replicateUrl = await generateImage(imagePrompt)
                                        if (replicateUrl) finalImageUrl = replicateUrl
                                    } catch (imgErr: any) {
                                        console.error(`[RSS Cron] AI Image failed for trend: ${imgErr.message}`)
                                    }
                                }
                            }

                            // Save Article
                            const saveRes = await fetch(`${request.nextUrl.origin}/api/rss/save`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title: synthesis.title,
                                    content: synthesis.content,
                                    excerpt: synthesis.excerpt,
                                    image: finalImageUrl,
                                    sourceUrl: trendSources[0].link,
                                    sourceName: 'Hybrid Trend Synthesis (Pytrends + News)',
                                    categoryId: job.category_id,
                                    focusKeyword: trendKeyword,
                                    isPublished: job.is_published,
                                    showSourceAttribution: job.show_source_attribution
                                })
                            })
                            const saveData = await saveRes.json()
                            if (saveData.success) {
                                publishedCount++
                                results.push({ title: trendKeyword, status: 'synthesized', articleId: saveData.article.id })
                            }
                        }
                    } catch (err: any) {
                        console.error(`[RSS Cron] Super trend synthesis failed for ${trendKeyword}: ${err.message}`)
                    }
                }
            }
        } else {
            // STANDARD RSS JOB (Original Logic)
            articlesToProcess = feed.items.slice(0, job.max_articles_per_run)

            for (const item of articlesToProcess) {
                try {
                    // Check if source URL already exists
                    const { data: existingSource } = await supabase
                        .from('articles')
                        .select('id')
                        .eq('source_url', item.link)
                        .limit(1)

                    if (existingSource && existingSource.length > 0) {
                        console.log(`[RSS Cron] ⏭️ Skipping already processed source: ${item.link}`)
                        results.push({ title: item.title, status: 'duplicate', articleId: existingSource[0].id })
                        continue
                    }

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
                            language: job.target_language || 'id',
                            writingStyle: job.writing_style || 'Professional',
                            articleModel: job.article_model || 'Straight News'
                        })
                    })
                    const rewriteData = await rewriteRes.json()

                    if (!rewriteData.success) {
                        results.push({ title: item.title, status: 'rewrite_failed', error: rewriteData.error })
                        continue
                    }

                    // AI IMAGE GENERATION (Replicate)
                    let finalImageUrl = extractData.data.image
                    const priority = job.thumbnail_priority || 'ai_priority'

                    if (hasReplicate && priority !== 'source_only') {
                        const shouldTryAI = priority === 'ai_priority' || (priority === 'source_priority' && !finalImageUrl)

                        if (shouldTryAI) {
                            try {
                                const { generateImagePrompt, generateImage } = await import('@/lib/ai/image-generator')
                                const imagePrompt = await generateImagePrompt(rewriteData.data.title, rewriteData.data.content)
                                const replicateUrl = await generateImage(imagePrompt)
                                if (replicateUrl) finalImageUrl = replicateUrl
                            } catch (imgErr: any) {
                                console.error(`[RSS Cron] AI Image failed for standard job, using fallback: ${imgErr.message}`)
                            }
                        }
                    }

                    // Check for duplicates
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
                            focusKeyword: job.search_keyword,
                            isPublished: job.is_published,
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

                    if (hasReplicate) {
                        await new Promise(resolve => setTimeout(resolve, 1000))
                    }
                } catch (err: any) {
                    results.push({ title: item.title, status: 'error', error: err.message })
                }
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
            results
        })

    } catch (error: any) {
        console.error('[RSS Cron] Fatal error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
