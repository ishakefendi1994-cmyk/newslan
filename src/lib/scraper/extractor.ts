import axios from 'axios'
import * as cheerio from 'cheerio'

/**
 * Extract full article content from URL
 */
export async function extractArticleContent(url: string): Promise<{
    title: string
    content: string
    image?: string
    author?: string
}> {
    try {
        console.log(`[Extractor] Fetching: ${url}`)

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000 // Increased timeout
        })

        const $ = cheerio.load(response.data)

        // 1. Aggressive Noise Removal
        const junkSelectors = [
            'script', 'style', 'noscript', 'iframe', 'svg',
            'nav', 'header', 'footer', 'aside',
            '.advertisement', '.ads', '.ad-container', '#ads',
            '.social-share', '.share-buttons', '.share-box',
            '.related-articles', '.baca-juga', '.read-also', '.related-news',
            '.tags', '.topics', '.breadcrumb',
            '.author-bio', '.author-info', '.date', '.timestamp',
            '.comment-section', '#comments',
            '.newsletter', '.subscription',
            '.copyright', '.disclaimer',
            '.promo', '.banner'
        ]
        $(junkSelectors.join(', ')).remove()

        // 2. Extract Title (Try specific selectors first)
        let title =
            $('h1.title').first().text().trim() ||
            $('h1.article-title').first().text().trim() ||
            $('h1').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') ||
            $('title').text().trim()

        // 3. Extract Image
        let image =
            $('meta[property="og:image"]').attr('content') ||
            $('.detail__media-image img').attr('src') || // Detik specific
            $('.photo__img img').attr('src') || // Kompas specific
            $('article img').first().attr('src') ||
            $('.article-img img').first().attr('src') ||
            $('img').first().attr('src') // Fallback

        // 4. Extract Author
        let author =
            $('meta[name="author"]').attr('content') ||
            $('.author').first().text().trim() ||
            $('.detail__author').text().trim() || // Detik
            $('[rel="author"]').first().text().trim()

        // 5. Extract Content (Smarter Strategy)
        // Find the most likely article container
        const contentSelectors = [
            '.detail__body-text', // Detik
            '.read__content', // Kompas
            '.detail-text', // CNN
            '.article-content',
            '.post-content',
            '.entry-content',
            '.content-detail',
            'article',
            'main',
            '#content',
            '.content'
        ]

        let $contentContainer = null
        for (const selector of contentSelectors) {
            if ($(selector).length > 0) {
                $contentContainer = $(selector).first()
                break
            }
        }

        // Fallback: If no container found, use body but be careful
        if (!$contentContainer) {
            $contentContainer = $('body')
        }

        // 6. Iterate over Paragraphs to Preserve Structure
        let paragraphs: string[] = []

        // Look for p tags inside the container
        $contentContainer.find('p').each((_, el) => {
            const text = $(el).text().trim()

            // Filter out junk paragraphs
            if (
                text.length > 20 && // Too short
                !text.toLowerCase().includes('baca juga') &&
                !text.toLowerCase().includes('copyright') &&
                !text.toLowerCase().includes('halaman selanjutnya') &&
                !text.toLowerCase().includes('scroll to continue')
            ) {
                paragraphs.push(text)
            }
        })

        // If no p tags found (some sites use divs or br), try generic text
        if (paragraphs.length === 0) {
            const rawText = $contentContainer.text()
            // Split by double newlines or punctuation
            paragraphs = rawText.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20)
        }

        // Join with double newlines
        let content = paragraphs.join('\n\n')

        // Final cleanup
        content = content
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .replace(/\n /g, '\n') // Fix spaces after newlines
            .replace(/\n\n\n+/g, '\n\n') // Max 2 newlines
            .trim()

        // Limit content length
        if (content.length > 15000) {
            content = content.substring(0, 15000)
        }

        if (!content) {
            throw new Error('No content extracted')
        }

        console.log(`[Extractor] Success: ${title.substring(0, 50)}... (${content.length} chars)`)

        return {
            title,
            content,
            image,
            author
        }
    } catch (error) {
        console.error(`[Extractor] Error extracting ${url}:`, error)
        // Return minimal valid object instead of throwing if possible
        return {
            title: 'Failed to extract',
            content: '',
            image: ''
        }
    }
}

/**
 * Clean HTML content to plain text
 */
export function htmlToText(html: string): string {
    const $ = cheerio.load(html)
    return $.text().replace(/\s+/g, ' ').trim()
}
