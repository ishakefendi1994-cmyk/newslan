import Parser from 'rss-parser';

export interface WXRParsedPost {
    id: number;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    date: string;
    category: string;
    featuredImage: string;
}

/**
 * Parse WordPress WXR (XML) file content
 */
export async function parseWordPressXML(xmlContent: string): Promise<WXRParsedPost[]> {
    const parser = new Parser({
        customFields: {
            item: [
                ['content:encoded', 'contentEncoded'],
                ['excerpt:encoded', 'excerptEncoded'],
                ['wp:post_id', 'postId'],
                ['wp:post_name', 'postName'],
                ['wp:post_type', 'postType'],
                ['wp:post_date', 'postDate'],
                ['wp:status', 'postStatus'],
                ['wp:postmeta', 'postMeta', { keepArray: true }],
            ],
        },
    });

    const feed = await parser.parseString(xmlContent);
    const items = feed.items || [];

    // 1. Map all items for quick lookup (especially attachments)
    const postMap = new Map();
    const attachments = new Map();

    items.forEach((item: any) => {
        if (item.postType === 'attachment') {
            attachments.set(item.postId, item.guid || item.link);
        }
        postMap.set(item.postId, item);
    });

    // 2. Filter only published posts
    const posts = items.filter((item: any) =>
        item.postType === 'post' &&
        (item.postStatus === 'publish' || !item.postStatus)
    );

    // 3. Transform to clean interface
    return posts.map((item: any) => {
        // Extract category (domain="category")
        let category = 'Uncategorized';
        if (item.categories) {
            // rss-parser puts categories in an array. We search for ones that look like categories.
            const catObj = item.categories.find((c: any) => typeof c === 'object' ? c._ === 'category' : false);
            if (catObj) {
                category = catObj.name || catObj.text || 'Uncategorized';
            } else if (item.categories.length > 0) {
                // Fallback to first one if string array
                category = typeof item.categories[0] === 'string' ? item.categories[0] : 'Uncategorized';
            }
        }

        // Extract Featured Image from _thumbnail_id meta
        let featuredImage = '';
        if (item.postMeta) {
            const thumbMeta = item.postMeta.find((m: any) => m['wp:meta_key'] === '_thumbnail_id');
            if (thumbMeta) {
                const thumbId = thumbMeta['wp:meta_value'];
                featuredImage = attachments.get(thumbId) || '';
            }
        }

        return {
            id: parseInt(item.postId) || Math.floor(Math.random() * 1000000),
            title: item.title || 'Untitled',
            content: item.contentEncoded || item.content || '',
            excerpt: item.excerptEncoded || item.contentSnippet || '',
            slug: item.postName || item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'post',
            date: item.postDate || item.isoDate || new Date().toISOString(),
            category: category,
            featuredImage: featuredImage
        };
    });
}
