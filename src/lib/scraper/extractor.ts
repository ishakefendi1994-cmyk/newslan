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

        // 3. Extract Image (with Lazy-Load support)
        const imageSelectors = [
            'meta[property="og:image"]',
            'meta[name="twitter:image"]',
            'meta[itemprop="image"]',
            '.detail__media-image img', // Detik
            '.photo__img img', // Kompas
            'article img',
            '.article-img img',
            'img'
        ]

        let image: string | undefined = undefined
        for (const selector of imageSelectors) {
            const $img = $(selector).first()
            if ($img.length > 0) {
                // Check multiple possible source attributes for lazy loading
                const attrVal =
                    $img.attr('content') || // For meta tags
                    $img.attr('data-src') ||
                    $img.attr('data-lazy-src') ||
                    $img.attr('data-original') ||
                    $img.attr('data-src-retina') ||
                    $img.attr('src')

                if (attrVal && !attrVal.includes('pixel.gif') && !attrVal.includes('placeholder')) {
                    image = attrVal
                    break
                }
            }
        }

        // Resolve relative URL
        if (image && !image.startsWith('http')) {
            try {
                const baseUrl = new URL(url).origin
                image = new URL(image, baseUrl).toString()
            } catch (e) { }
        }

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

        // 6. Iterate over Paragraphs & Lists to Preserve Technical Data
        let paragraphs: string[] = []

        // Look for content tags (p, li, tr) inside the container
        $contentContainer.find('p, li, tr').each((_, el) => {
            const $el = $(el)
            const text = $el.text().trim()

            // Filter out junk paragraphs
            if (
                text.length > 5 && // Shorter limit for technical data
                !text.toLowerCase().includes('baca juga') &&
                !text.toLowerCase().includes('copyright') &&
                !text.toLowerCase().includes('halaman selanjutnya') &&
                !text.toLowerCase().includes('scroll to continue')
            ) {
                // If it's a list item or table row, prefix with bullet to help AI
                if (el.name === 'li') {
                    paragraphs.push(`- ${text}`)
                } else if (el.name === 'tr') {
                    // Extract all cell values in the row
                    const cells = $el.find('td, th').map((i, cell) => $(cell).text().trim()).get().join(': ')
                    if (cells.length > 5) paragraphs.push(cells)
                } else {
                    paragraphs.push(text)
                }
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
