import { NextRequest, NextResponse } from 'next/server'
import { rewriteArticle } from '@/lib/ai/rewriter'

/**
 * API endpoint to test AI rewriting
 * POST /api/rss/rewrite
 * Body: { title: string, content: string, sourceName: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { title, content, sourceName, useAIThumbnail } = await request.json()

        if (!title || !content) {
            return NextResponse.json(
                { success: false, error: 'Title and content are required' },
                { status: 400 }
            )
        }

        console.log(`[API] Rewriting article: ${title}, Use AI Thumbnail: ${useAIThumbnail}`)

        const result = await rewriteArticle(
            title,
            content,
            sourceName || 'Unknown Source'
        )

        // MANUAL AI IMAGE GENERATION
        // If useAIThumbnail is true, generate an image and attach it to the result
        let aiImageUrl = null
        if (useAIThumbnail && process.env.REPLICATE_API_TOKEN) {
            try {
                console.log('[API] Generating AI Thumbnail for Manual Rewrite...')
                // Dynamic import to avoid loading if not needed
                const { generateImagePrompt, generateImage } = await import('@/lib/ai/image-generator')

                const imagePrompt = await generateImagePrompt(result.title, result.content)
                aiImageUrl = await generateImage(imagePrompt)

                if (aiImageUrl) {
                    console.log('[API] AI Thumbnail generated:', aiImageUrl)
                }
            } catch (imgErr) {
                console.error('[API] Failed to generate AI thumbnail:', imgErr)
            }
        }

        console.log('[API] Rewrite result content preview:', result.content.substring(0, 100))

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                aiImage: aiImageUrl // Send this back so frontend can use it
            }
        })
    } catch (error: any) {
        console.error('[API] Rewrite error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
