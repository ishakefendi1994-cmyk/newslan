import { NextRequest, NextResponse } from 'next/server'
import { extractArticleContent } from '@/lib/scraper/extractor'

/**
 * API endpoint to test article content extraction
 * POST /api/rss/extract
 * Body: { url: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            )
        }

        console.log(`[API] Extracting content from: ${url}`)

        const extracted = await extractArticleContent(url)

        return NextResponse.json({
            success: true,
            data: {
                ...extracted,
                contentLength: extracted.content.length
            }
        })
    } catch (error: any) {
        console.error('[API] Extract error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
