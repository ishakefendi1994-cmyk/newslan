import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/commerce/ProductCard'
import { NewsCard } from '@/components/ui/NewsCard'
import { Calendar, User, Share2, Bookmark, Lock, ArrowLeft, Zap, Sparkles, Eye } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import NewsSidebar from '@/components/news/NewsSidebar' // Keep for types if needed, or remove if unused 
import SocialShare from '@/components/news/SocialShare'
import AdRenderer from '@/components/news/AdRenderer'
import { getArticleBySlug, getNextArticle, getBanners } from '@/lib/data'
import { optimizeCloudinaryUrl } from '@/lib/utils'
import PrefetchNextArticle from '@/components/news/PrefetchNextArticle'
import BannerSlider from '@/components/ui/BannerSlider'
import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/settings'
import TrendingProductsContainer from '@/components/commerce/TrendingProductsContainer'
import DetailDetik from '@/components/templates/details/DetailDetik'
import DetailTempo from '@/components/templates/details/DetailTempo'
import DetailCNN from '@/components/templates/details/DetailCNN'

// Generate Metadata for SEO and Social Sharing
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const { slug } = await params

    // Use Cached Access (ISR) for fast metadata resolution
    const article = await getArticleBySlug(slug)

    const settings = await getSiteSettings()
    const siteUrl = settings.site_url || process.env.NEXT_PUBLIC_SITE_URL || ''
    if (!article) return { title: `Article Not Found - ${settings.site_name}` }
    const title = article.title
    const description = article.excerpt || article.title

    // Fallback to logo if no featured image exists
    const imageUrl = article.featured_image || `${siteUrl}/logo.png`

    return {
        title: `${title} - ${settings.site_name}`,
        description,
        keywords: article.focus_keyword || undefined,
        metadataBase: new URL(siteUrl || 'http://localhost:3000'),
        alternates: {
            canonical: `/news/${slug}`,
        },
        openGraph: {
            title,
            description,
            url: `/news/${slug}`,
            siteName: settings.site_name,
            locale: 'id_ID',
            type: 'article',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                }
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
        // Meta tags to help social crawlers
        other: {
            'og:image:alt': title,
            'og:image:type': 'image/jpeg',
            'og:image:width': '1200',
            'og:image:height': '630',
        }
    }
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
    try {
        const { slug } = await params

        // Use standardized helper from @/lib/data
        const siteSettings = await getSiteSettings()
        const activeTemplate = siteSettings.active_template || 'tempo'
        const supabase = await createClient()

        // 1. Fetch MAIN Data (Critical for First Paint)
        // We use cached functions (ISR) for article data to ensure instant load.
        const article = await getArticleBySlug(slug)

        if (!article) {
            return notFound()
        }

        // Parallel fetch for other non-critical or dynamic data
        // OPTIMIZATION: AUTH & PREMIUM DISABLED (FORCE FAST LOAD)
        const [
            pageAdsResult,
            nextArticle,
            banners
        ] = await Promise.all([
            // Fetch Page Ads (Needed for Content Injection)
            supabase
                .from('advertisements')
                .select('*')
                .eq('is_active', true)
                .in('placement', ['article_before', 'article_middle', 'article_after']),

            // Fetch Next Article for Prefetching
            getNextArticle(article.id),

            // Fetch Banners for testing
            getBanners()
        ])

        // 3. Fire-and-forget View Increment (Non-blocking)
        supabase.rpc('increment_article_views', { article_id: article.id }).then(({ error }) => {
            if (error) console.error('RPC Error:', error)
        })

        // Extract Data
        const pageAds = pageAdsResult.data

        // Process Products
        const products = article.article_products?.map((ap: any) => ({
            ...ap.products,
            links: ap.products.affiliate_links?.map((l: any) => ({
                store: l.store_name,
                url: l.url
            }))
        })) || []

        const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/news/${slug}`

        const beforeAd = pageAds?.find((a: any) => a.placement === 'article_before')
        const middleAd = pageAds?.find((a: any) => a.placement === 'article_middle')
        const afterAd = pageAds?.find((a: any) => a.placement === 'article_after')

        // Create JSON-LD for Articles (SEO)
        const articleJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: article.title,
            image: [article.featured_image || `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`],
            datePublished: article.created_at,
            dateModified: article.updated_at || article.created_at,
            author: [{
                '@type': 'Person',
                name: article.profiles?.full_name || `Redaksi ${siteSettings.site_name || 'Portal Berita'}`,
                url: `${siteSettings.site_url}/redaksi`,
            }],
            publisher: {
                '@type': 'Organization',
                name: siteSettings.site_name || 'Portal Berita',
                logo: {
                    '@type': 'ImageObject',
                    url: `${siteSettings.site_url}/logo.png`,
                },
            },
            description: article.excerpt || article.title,
        }

        const props = {
            article,
            nextArticle,
            banners: banners || [],
            siteSettings,
            currentUrl,
            products,
            pageAds: {
                beforeAd,
                middleAd,
                afterAd
            }
        }

        switch (activeTemplate) {
            case 'cnn':
                return <DetailCNN {...props} />
            case 'detik':
                return <DetailDetik {...props} />
            case 'tempo':
            default:
                return <DetailTempo {...props} />
        }
    } catch (err) {
        console.error('Article Page Error:', err)
        return notFound()
    }
}
