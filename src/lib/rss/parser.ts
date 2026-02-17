import Parser from 'rss-parser'
import { RSS_FEEDS, RSSFeed } from './feeds'

export interface RSSArticle {
    title: string
    link: string
    content: string
    contentSnippet: string
    pubDate: string
    categories?: string[]
    creator?: string
    image?: string
    sourceFeed: string
    sourceName: string
}

const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'media'],
            ['content:encoded', 'contentEncoded'],
            ['dc:creator', 'creator']
        ]
    },
    timeout: 10000 // 10 second timeout
})

/**
 * Fetch articles from a single RSS feed
 */
export async function fetchRSSFeed(feed: RSSFeed): Promise<RSSArticle[]> {
    try {
        console.log(`[RSS] Fetching feed: ${feed.name} from ${feed.url}`)

        const result = await parser.parseURL(feed.url)

        if (!result.items || result.items.length === 0) {
            console.log(`[RSS] No items found in ${feed.name}`)
            return []
        }

        const articles: RSSArticle[] = result.items.map(item => ({
            title: item.title || 'Untitled',
            link: item.link || '',
            content: (item as any).contentEncoded || item.content || item.contentSnippet || '',
            contentSnippet: item.contentSnippet || '',
            pubDate: item.pubDate || new Date().toISOString(),
            categories: item.categories || [],
            creator: (item as any).creator || feed.name,
            image: extractImage(item),
            sourceFeed: feed.id,
            sourceName: feed.name
        }))

        console.log(`[RSS] ✅ Found ${articles.length} articles from ${feed.name}`)
        return articles
    } catch (error: any) {
        console.error(`[RSS] ❌ Error fetching ${feed.name}:`, error.message)
        return []
    }
}

/**
 * Fetch articles from specific RSS feeds or all feeds
 * @param feedIds - Optional array of feed IDs to fetch. If not provided, fetches first 5 feeds only.
 */
export async function fetchAllRSSFeeds(feedIds?: string[]): Promise<RSSArticle[]> {
    let selectedFeeds: typeof RSS_FEEDS[number][]

    if (feedIds && feedIds.length > 0) {
        // Use specified feeds
        selectedFeeds = RSS_FEEDS.filter(f => feedIds.includes(f.id))
        console.log(`[RSS] Fetching ${selectedFeeds.length} specified feeds:`, feedIds.join(', '))
    } else {
        // Default: only fetch first 5 feeds to avoid timeout
        selectedFeeds = RSS_FEEDS.slice(0, 5)
        console.log(`[RSS] No feeds specified, using first 5 feeds by default`)
    }

    if (selectedFeeds.length === 0) {
        console.log(`[RSS] No feeds selected`)
        return []
    }

    console.log(`[RSS] Starting fetch for ${selectedFeeds.length} feeds...`)

    const results = await Promise.allSettled(
        selectedFeeds.map(feed => fetchRSSFeed(feed))
    )

    const articles = results
        .filter((r): r is PromissFulfilledResult<RSSArticle[]> => r.status === 'fulfilled')
        .flatMap(r => r.value)

    const failedCount = results.filter(r => r.status === 'rejected').length

    console.log(`[RSS] ✅ Total: ${articles.length} articles from ${selectedFeeds.length} feeds (${failedCount} failed)`)

    return articles
}

/**
 * Extract image from RSS item
 */
function extractImage(item: any): string | undefined {
    // Try media:content
    if (item.media?.$ && item.media.$.url) {
        return item.media.$.url
    }

    // Try enclosure
    if (item.enclosure && item.enclosure.url) {
        return item.enclosure.url
    }

    // Try parsing from content
    if (item.content) {
        const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/)
        if (imgMatch) return imgMatch[1]
    }

    // Try parsing from description
    if (item.description) {
        const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/)
        if (imgMatch) return imgMatch[1]
    }

    return undefined
}
