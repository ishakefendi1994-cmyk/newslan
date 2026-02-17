import { NextRequest, NextResponse } from 'next/server'
import { fetchAllRSSFeeds } from '@/lib/rss/parser'

/**
 * API endpoint to test RSS feed fetching
 * GET /api/rss/fetch?feeds=id1,id2,id3
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const feedsParam = searchParams.get('feeds')
        const feedIds = feedsParam ? feedsParam.split(',') : undefined

        console.log('[RSS API] Starting fetch...', feedIds ? `feeds: ${feedIds.join(', ')}` : 'all feeds')

        const articles = await fetchAllRSSFeeds(feedIds)

        console.log('[RSS API] Fetch complete:', articles.length, 'articles')

        return NextResponse.json({
            success: true,
            count: articles.length,
            articles: articles.map(a => ({
                title: a.title,
                link: a.link,
                source: a.sourceName,
                pubDate: a.pubDate,
                hasImage: !!a.image
            }))
        })
    } catch (error: any) {
        console.error('[RSS API] Error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
