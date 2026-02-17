import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

/**
 * Fetch RSS from custom URL
 * GET /api/rss/fetch-custom?url=https://example.com/rss
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const customUrl = searchParams.get('url')

        if (!customUrl) {
            return NextResponse.json(
                { success: false, error: 'URL parameter is required' },
                { status: 400 }
            )
        }

        console.log('[Custom RSS] Fetching from:', customUrl)

        const parser = new Parser({
            timeout: 15000, // Increased timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        })

        try {
            const feed = await parser.parseURL(customUrl)

            if (!feed.items || feed.items.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'RSS feed is empty or has no articles' },
                    { status: 400 }
                )
            }

            const articles = feed.items.slice(0, 50).map((item: any) => ({
                title: item.title || 'No title',
                link: item.link || '',
                source: feed.title || 'Custom Feed',
                pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
                hasImage: !!(item.enclosure?.url || item['media:thumbnail']?.$ || item.image)
            }))

            console.log(`[Custom RSS] ✅ Found ${articles.length} articles from ${feed.title}`)

            return NextResponse.json({
                success: true,
                count: articles.length,
                feedTitle: feed.title,
                articles
            })
        } catch (parseError: any) {
            console.error('[Custom RSS] Parse error:', parseError)

            // Better error messages
            let errorMessage = 'Failed to fetch RSS feed'

            if (parseError.message?.includes('404') || parseError.code === 404) {
                errorMessage = '❌ RSS feed not found (404). URL mungkin salah atau feed tidak tersedia.\n\nTips: Coba gunakan feed dari recommendations list.'
            } else if (parseError.message?.includes('timeout')) {
                errorMessage = '⏱️ Request timeout. Server terlalu lama merespon. Coba lagi nanti.'
            } else if (parseError.message?.includes('ENOTFOUND')) {
                errorMessage = '🌐 Domain not found. Periksa apakah URL sudah benar.'
            } else {
                errorMessage = `⚠️ Error: ${parseError.message}`
            }

            return NextResponse.json(
                { success: false, error: errorMessage },
                { status: 400 }
            )
        }
    } catch (error: any) {
        console.error('[Custom RSS] General error:', error)
        return NextResponse.json(
            { success: false, error: `⚠️ Unexpected error: ${error.message}` },
            { status: 500 }
        )
    }
}
