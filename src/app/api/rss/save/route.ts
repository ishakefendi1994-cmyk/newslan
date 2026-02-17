import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadRSSImageToCloudinary } from '@/lib/cloudinary/upload-rss-image'
import { forceHtmlFormatting } from '@/lib/utils/format-html'

/**
 * Save AI-rewritten article to database
 * POST /api/rss/save
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const {
            title,
            content,
            excerpt,
            image,
            sourceUrl,
            sourceName,
            categoryId,
            isPublished = false,
            showSourceAttribution = true
        } = await request.json()

        if (!title || !content) {
            return NextResponse.json(
                { success: false, error: 'Title and content are required' },
                { status: 400 }
            )
        }

        console.log('[Save Article] Saving:', title.substring(0, 50))

        const { data: { user } } = await supabase.auth.getUser()

        // Get default category if not provided
        let finalCategoryId = categoryId
        if (!finalCategoryId) {
            const { data: defaultCategory } = await supabase
                .from('categories')
                .select('id')
                .limit(1)
                .single()

            finalCategoryId = defaultCategory?.id
        }

        // Generate slug
        const slug = title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100) + '-' + Date.now()

        // Upload RSS image to Cloudinary (if exists)
        let cloudinaryImageUrl = null
        if (image) {
            console.log('[Save Article] Uploading image to Cloudinary...')
            cloudinaryImageUrl = await uploadRSSImageToCloudinary(image)
            console.log('[Save Article] Cloudinary URL:', cloudinaryImageUrl)
        }

        // FORCE HTML FORMATTING (Post-processing)
        // This ensures even if AI returns plain text, it gets converted to HTML paragraphs
        const formattedContent = forceHtmlFormatting(content, title)

        // Add source info to excerpt (simple, no URL)
        const fullExcerpt = excerpt ? `${excerpt}` : ''

        // Add simple source attribution to content (just name, no link or disclaimer)
        let sourceAttribution = ''
        if (showSourceAttribution) {
            sourceAttribution = `
<div style="margin-top: 2rem; padding: 1rem; background: #f9fafb; border-left: 4px solid #990000; border-radius: 0.5rem;">
  <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">
    <strong>Sumber:</strong> ${sourceName}
  </p>
</div>`
        }

        const fullContent = formattedContent + sourceAttribution

        // Prepare article data (ONLY using existing columns)
        const articleData = {
            title,
            slug,
            content: fullContent, // Content with simple source attribution
            excerpt: fullExcerpt,
            featured_image: cloudinaryImageUrl, // Use Cloudinary URL (or null)
            category_id: finalCategoryId,
            author_id: user?.id || null,
            is_published: isPublished,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        console.log('[Save Article] Data:', { title, slug, categoryId: finalCategoryId, hasImage: !!image })

        // Insert article
        const { data: article, error } = await supabase
            .from('articles')
            .insert(articleData)
            .select()
            .single()

        if (error) {
            console.error('[Save Article] Database error:', error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        console.log('[Save Article] ✅ Success! Article ID:', article.id)

        return NextResponse.json({
            success: true,
            article: {
                id: article.id,
                title: article.title,
                slug: article.slug,
                isPublished: article.is_published
            }
        })
    } catch (error: any) {
        console.error('[Save Article] Error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
