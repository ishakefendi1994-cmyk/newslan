
import { getSiteSettings } from '../settings'
const DEFAULT_GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export type NewsStyle = 'Formal' | 'Santai' | 'Investigatif' | 'Provokatif' | 'Inspiratif'
export type NewsModel = 'Breaking News' | 'Feature Story' | 'Opinion' | 'Interview' | 'Editorial'

interface GenerationResult {
    title: string
    content: string
    excerpt: string
}

/**
 * Generate a complete news article from scratch based on a theme
 */
export async function generateArticleFromScratch(
    theme: string,
    category: string,
    style: NewsStyle = 'Formal',
    model: NewsModel = 'Breaking News',
    language: string = 'id'
): Promise<GenerationResult> {
    const settings = await getSiteSettings()
    const apiKey = settings.groq_api_key || DEFAULT_GROQ_API_KEY

    if (!apiKey) {
        throw new Error('GROQ_API_KEY is missing (neither in settings nor ENV)')
    }

    const languageName = language === 'en' ? 'English' : 'Bahasa Indonesia'
    const systemPrompt = `You are a Senior Journalist at "Newslan". Write a high-quality news article based on the theme.
    
    OUTPUT LANGUAGE: ${languageName}

    **ARTICLE PARAMETERS**:
    - **Theme**: ${theme}
    - **Category**: ${category}
    - **Style**: ${style}
    - **Model**: ${model}

    **STRICT HTML RULES**:
    1. **HEADINGS**: Every new section MUST start with an **<h2>** tag.
    2. **FORBIDDEN**: Never use bold text (<strong> or **text**) as a standalone line for headings.
    3. **PARAGRAPHS**: Wrap article text in <p> tags.
    4. **JSON TEMPLATE**: You MUST return this exact structure:
    {
      "title": "...",
      "excerpt": "...",
      "content": "<p>PARAGRAF PEMBUKA (Lead) - Minimal 50 kata tanpa h2.</p><h2>Subjudul Pertama</h2><p>Paragraf kedua...</p><h2>Subjudul Kedua</h2><p>Paragraf ketiga...</p>"
    }

    PENTING: JANGAN PERNAH memulai "content" dengan <h2>. Baris pertama isi berita WAJIB berupa paragraf <p>.`

    const userPrompt = `Tulis artikel ${model} mendalam tentang "${theme}" dalam ${languageName}. Sertakan minimal 3 sub-judul menggunakan tag <h2>.`

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.8,
                response_format: { type: 'json_object' }
            })
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(`Groq API Error: ${response.status} ${err}`)
        }

        const data = await response.json()
        const resultString = data.choices[0]?.message?.content

        try {
            const parsed = JSON.parse(resultString)
            console.log(`[AI Writer Test] Title: ${parsed.title}`)
            console.log(`[AI Writer Test] Content contains <h2>: ${parsed.content.includes('<h2>')}`)
            console.log(`[AI Writer Test] Raw Content Sneak Peek: ${parsed.content.substring(0, 200)}...`)

            return {
                title: parsed.title,
                content: parsed.content,
                excerpt: parsed.excerpt
            }
        } catch (parseErr) {
            console.error('Failed to parse AI response:', resultString)
            throw new Error('AI returned invalid format')
        }
    } catch (error: any) {
        console.error('[AI Writer] Error:', error)
        throw error
    }
}
