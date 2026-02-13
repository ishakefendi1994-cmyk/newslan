export interface WPPost {
    id: number;
    title: { rendered: string };
    content: { rendered: string };
    excerpt: { rendered: string };
    slug: string;
    date: string;
    _embedded?: {
        'wp:featuredmedia'?: Array<{
            source_url: string;
            alt_text: string;
        }>;
        'wp:term'?: Array<Array<{
            id: number;
            name: string;
            slug: string;
            taxonomy: string;
        }>>;
    };
}

export async function fetchWPPosts(url: string, page: number = 1, perPage: number = 10, after?: string): Promise<WPPost[]> {
    const cleanUrl = url.replace(/\/$/, '');
    let apiUrl = `${cleanUrl}/wp-json/wp/v2/posts?_embed&page=${page}&per_page=${perPage}`;

    if (after) {
        apiUrl += `&after=${after}`;
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch WordPress posts: ${response.statusText}`);
    }

    return response.json();
}

export function extractWPMedia(post: WPPost): string {
    return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
}

export function extractWPCategory(post: WPPost): string {
    const terms = post._embedded?.['wp:term'] || [];
    for (const taxonomy of terms) {
        for (const term of taxonomy) {
            if (term.taxonomy === 'category') {
                return term.name;
            }
        }
    }
    return 'Uncategorized';
}
