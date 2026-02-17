import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

/**
 * Simple direct RSS test - bypass our parser
 * GET /api/rss/test-direct
 */
export async function GET(request: NextRequest) {
    try {
        console.log('[Direct Test] Starting...')

        const parser = new Parser()
        const feed = await parser.parseURL('https://www.cnnindonesia.com/rss')

        console.log('[Direct Test] Feed title:', feed.title)
        console.log('[Direct Test] Items count:', feed.items?.length || 0)

        return NextResponse.json({
            success: true,
            feedTitle: feed.title,
            itemCount: feed.items?.length || 0,
            firstItem: feed.items?.[0] ? {
                title: feed.items[0].title,
                link: feed.items[0].link,
                pubDate: feed.items[0].pubDate
            } : null
        })
    } catch (error: any) {
        console.error('[Direct Test] Error:', error.message)
        return NextResponse.json(
            { success: false, error: error.message, stack: error.stack },
            { status: 500 }
        )
    }
}
