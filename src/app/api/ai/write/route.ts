
import { NextRequest, NextResponse } from 'next/server'
import { generateArticleFromScratch, NewsStyle, NewsModel } from '@/lib/ai/writer'
import { generateImagePrompt, generateImage } from '@/lib/ai/image-generator'
import { getSiteSettings } from '@/lib/settings'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { theme, category, style, model, language = 'id', generateImage: shouldGenerateImage = true } = body

        if (!theme || !category) {
            return NextResponse.json(
                { success: false, error: 'Theme and Category are required' },
                { status: 400 }
            )
        }

        console.log(`[AI Writer API] Generating article about "${theme}" (${style}/${model})`)

        // 1. Generate Article Text
        const article = await generateArticleFromScratch(theme, category, style as NewsStyle, model as NewsModel, language)

        // 2. Generate Image (Optional/Default True)
        const settings = await getSiteSettings()
        const hasReplicate = !!(settings.replicate_api_token || process.env.REPLICATE_API_TOKEN)

        let imageUrl = null
        if (shouldGenerateImage && hasReplicate) {
            try {
                console.log('[AI Writer API] Generating AI Thumbnail...')
                const imagePrompt = await generateImagePrompt(article.title, article.content)
                imageUrl = await generateImage(imagePrompt)
                console.log('[AI Writer API] Image generated:', imageUrl)
            } catch (imgErr) {
                console.error('[AI Writer API] Failed to generate image:', imgErr)
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                ...article,
                imageUrl
            }
        })

    } catch (error: any) {
        console.error('[AI Writer API] Error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
