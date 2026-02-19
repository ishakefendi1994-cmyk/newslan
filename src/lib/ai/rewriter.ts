/**
 * AI Article Rewriter using Groq API
 * Handles rate limiting, retries, and content optimization
 */

// Groq Configuration
import { getSiteSettings } from '../settings'
const DEFAULT_GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile' // Fast and high quality model for Indonesian

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 3000 // 3 seconds

interface RewriteResult {
    title: string
    content: string
    excerpt: string
}

/**
 * Rewrite article using AI (Groq)
 * @param title - Original article title
 * @param content - Original article content
 * @param sourceName - Name of the RSS source
 * @returns Rewritten article with title, content, and excerpt
 */
export async function rewriteArticle(
    title: string,
    content: string,
    sourceName: string,
    language: string = 'id',
    writingStyle: string = 'Professional',
    articleModel: string = 'Straight News'
): Promise<RewriteResult> {
    const settings = await getSiteSettings()
    const apiKey = settings.groq_api_key || DEFAULT_GROQ_API_KEY

    console.log(`[AI Rewriter] Starting rewrite with Groq (Llama 3.3)`)
    console.log(`[AI Rewriter] Original title:`, title)

    // Validate content
    if (!content || typeof content !== 'string') {
        console.error(`[AI Rewriter] Invalid content parameter:`, content)
        throw new Error('Content is required and must be a string')
    }

    console.log(`[AI Rewriter] Original content length: ${content.length} chars`)

    // Truncate content if too long (max 12000 chars - Llama has larger context window but let's be safe)
    const truncatedContent = content.substring(0, 12000)

    const systemPrompt = `You are a Senior Chief Editor at a top-tier Indonesian news agency. 
Your task is to produce a COMPLETELY NEW article based on the facts provided.

CRITICAL IDENTITY:
- You are NOT a summarizer or a rewriter. You are a REPORTER writing a fresh story.
- You despise laziness. Simple synonym swapping is UNACCEPTABLE.
- Your goal: If someone reads the original and your version, they should think they are two different articles covering the same event.

STRICT MANDATORY INSTRUCTIONS (NON-NEGOTIABLE):
1.  **RADICAL RESTRUCTURING (The "Anti-Linear" Rule)**:
    - COMPLETELY destroy the original structure.
    - If original does A -> B -> C, you MUST do C -> A -> B or Start with Impact -> B -> A.
    - *Forbidden:* Following the "Intro -> Pros -> Cons -> Conclusion" pattern if that's what the source did.
    - *Required:* Start with a "Market Context", "Expert Analysis", or "Future Trend" angle.

62: **LANGUAGE & TRANSLATION (CRITICAL)**:
    - **AUTO-DETECT SOURCE LANGUAGE**:
      - If source is NOT ${language === 'en' ? 'ENGLISH' : 'INDONESIAN'}: **TRANSLATE TO ${language === 'en' ? 'ENGLISH' : 'INDONESIAN'} FIRST** -> Then REWRITE.
    - **OUTPUT MUST BE 100% ${language === 'en' ? 'ENGLISH' : 'INDONESIAN'}**. No mixed languages.
    - Translate idioms/terms contextually based on the target language.

2.  **NEW ANGLE & FRAMING**:
    - Choose ONE specific angle:
      a) **Investment Risk Focus**: Warning about potential downfalls.
      b) **Market Trend**: Connecting this to global economic shifts.
      c) **Practical Utility**: How this actually affects the daily user.
    - Write the ENTIRE article from this chosen perspective.

3.  **JOURNALISTIC VOICE & STYLE**:
    - **STYLE: ${writingStyle}**
    - Apply the selected style consistently throughout the article.
    - Professional: Analytical, formal, objective.
    - Casual: Conversational, engaging, uses more accessible language.
    - Investigative: Skeptical, focused on facts/evidence, questioning.
    - Educational: Explanatory, instructive, uses "How-to" or "What-is" context.
    - Variation in sentence length: Mix short punchy sentences with longer analytical ones.

4.  **ARTICLE MODEL: ${articleModel} (STRUCTURE)**:
    - **Straight News**: Traditional inverted pyramid. Most important facts first. Concise and direct.
    - **Feature/Narasi**: Story-driven. Start with a scene/anecdote. More descriptive and flowy.
    - **Opinion/Analisis**: Heavy on "Why" and "What it means". Analytical, provides context and future prediction.
    - **Deep Analysis**: Comprehensive, deep dive into the subject. Use longer paragraphs for complexity.

5.  **EXPANSION & DEEPENING**:
    - The result MUST be equal length or LONGER than the original.
    - Add *general* context based on the **Model** and **Style** selected.
    - **No Hallucinations**: Do not invent numbers or quotes. Use general knowledge for context only.

5.  **UNIQUENESS CHECK**:
    - Avoid specific phrases used in the source.
    - Similarity must be <10%.
    - If it looks like a "spin", REWRITE IT.

6.  **OUTPUT FORMAT (STRICT TAGS)**:
    [TITLE]
    (Compelling, professional title. NO clickbait. distinct from source)
    [/TITLE]
    
    [EXCERPT]
    (A sharp, analytical summary of the situation. Max 160 chars)
    [/EXCERPT]
    
    [CONTENT]
    (HTML content. <p> tags. ONE or TWO <h2> subheadings. NO "Baca Juga". NO Bullets/Numbering unless critical.)
    [/CONTENT]

HTML RULES:
- **NO INLINE STYLES**: Do not use style="..." or font tags. Clean HTML only.
- Wrap ALL paragraphs in <p>.
- Use ONE <h2> or <h3> to break up text.
- No "Baca Juga" or links.
- Length: Keep it tight and impactful (300-500 words).`

    const userPrompt = `Source: ${sourceName}

Original Title: ${title}

Original Content:
${truncatedContent}

Rewrite this article following the instructions above. Return ONLY the tagged format.`

    // Retry loop
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[AI Rewriter] Attempt ${attempt}/${MAX_RETRIES}`)

            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error(`[AI Rewriter] API Error: ${response.status}`, errorText)

                // If rate limited, wait and retry
                if (response.status === 429 && attempt < MAX_RETRIES) {
                    console.log(`[AI Rewriter] Rate limited. Retrying in ${RETRY_DELAY / 1000}s...`)
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
                    continue
                }

                throw new Error(`Groq API error: ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            console.log(`[AI Rewriter] ✅ Response received from Groq`)

            // Extract AI response
            const aiResponse = data.choices[0].message.content

            // Parse Tag-Based Response
            let parsedTitle = ''
            let parsedExcerpt = ''
            let parsedContent = ''

            try {
                // Extract using regex for tags
                const titleMatch = aiResponse.match(/\[TITLE\]([\s\S]*?)\[\/TITLE\]/i)
                const excerptMatch = aiResponse.match(/\[EXCERPT\]([\s\S]*?)\[\/EXCERPT\]/i)
                const contentMatch = aiResponse.match(/\[CONTENT\]([\s\S]*?)\[\/CONTENT\]/i)

                parsedTitle = titleMatch ? titleMatch[1].trim() : ''
                parsedExcerpt = excerptMatch ? excerptMatch[1].trim() : ''
                parsedContent = contentMatch ? contentMatch[1].trim() : ''

                // Fallback: If tags missing, try to detect JSON block or assume entire response is content
                if (!parsedContent) {
                    // Try legacy JSON extraction as fallback
                    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/)
                    if (jsonMatch) {
                        try {
                            const jsonParsed = JSON.parse(jsonMatch[1])
                            parsedTitle = jsonParsed.title
                            parsedExcerpt = jsonParsed.excerpt
                            parsedContent = jsonParsed.content
                        } catch (e) {
                            console.warn('[AI Rewriter] Legacy JSON parse failed')
                        }
                    }

                    if (!parsedContent) {
                        // Worst case fallback
                        console.warn('[AI Rewriter] Tags missing, falling back to raw response')
                        parsedTitle = title
                        parsedExcerpt = title.substring(0, 160)
                        parsedContent = aiResponse
                    }
                }

                // Validate required fields
                if (!parsedTitle || !parsedContent) {
                    throw new Error('Missing required fields (TITLE or CONTENT) in AI response')
                }

                // Post-process content to ensure HTML formatting
                let finalContent = parsedContent
                if (!finalContent.includes('<p>')) {
                    console.log('[AI Rewriter] ⚠️ Content missing HTML tags, applying SMART fallback formatting')

                    // Split by double newlines first (if any)
                    let paragraphs = finalContent.split(/\n\n+/)

                    // If only one big block, try to split by sentences
                    if (paragraphs.length <= 1) {
                        // Split by period followed by space and capital letter, or just period at end
                        const sentences = finalContent.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [finalContent]

                        // Group sentences into paragraphs (3-4 sentences per paragraph)
                        const newParagraphs = []
                        let currentPara = ''
                        let count = 0

                        sentences.forEach((sentence) => {
                            currentPara += sentence.trim() + ' '
                            count++
                            if (count >= 3) {
                                newParagraphs.push(currentPara.trim())
                                currentPara = ''
                                count = 0
                            }
                        })
                        if (currentPara) newParagraphs.push(currentPara.trim())
                        paragraphs = newParagraphs
                    }

                    finalContent = paragraphs
                        .filter(p => p.trim()) // Remove empty lines
                        .map(p => `<p>${p.trim()}</p>`) // Wrap in <p>
                        .join('') // Join back
                }

                console.log(`[AI Rewriter] ✅ Successfully rewritten:`, parsedTitle)

                return {
                    title: parsedTitle,
                    content: finalContent,
                    excerpt: parsedExcerpt || parsedTitle.substring(0, 160)
                }

            } catch (parseError: any) {
                console.error(`[AI Rewriter] Failed to parse AI response:`, parseError.message)
                console.error(`[AI Rewriter] Raw response:`, aiResponse)

                // If parsing fails but we got a response, try to salvage it
                if (attempt === MAX_RETRIES) {
                    return {
                        title: title, // Use original title as fallback
                        content: aiResponse, // Use raw response as content
                        excerpt: title.substring(0, 160) // Use truncated title as excerpt
                    }
                }

                // Otherwise, retry
                throw parseError
            }

        } catch (error: any) {
            console.error(`[AI Rewriter] Attempt ${attempt} failed:`, error.message)

            // If final attempt, return original as fallback
            if (attempt === MAX_RETRIES) {
                console.error(`[AI Rewriter] ❌ All retries exhausted. Using original content.`)
                return {
                    title: title,
                    content: content,
                    excerpt: title.substring(0, 160)
                }
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        }
    }

    // Should not reach here, but TypeScript needs it
    throw new Error('Unexpected error in rewriteArticle')
}

/**
 * Synthesize a new article from multiple sources
 * @param sources - Array of original articles { title, content, sourceName }
 * @param language - Target language
 * @param writingStyle - Tone of voice
 * @param articleModel - Structure of report
 */
export async function synthesizeFromMultipleSources(
    sources: Array<{ title: string, content: string, sourceName: string }>,
    language: string = 'id',
    writingStyle: string = 'Professional',
    articleModel: string = 'Straight News'
): Promise<RewriteResult> {
    const settings = await getSiteSettings()
    const apiKey = settings.groq_api_key || DEFAULT_GROQ_API_KEY

    console.log(`[AI Synthesizer] Starting synthesis from ${sources.length} sources`)

    const sourceData = sources.map((s, i) => `--- SOURCE ${i + 1} (${s.sourceName}) ---\nTitle: ${s.title}\nContent:\n${s.content}`).join('\n\n')

    const systemPrompt = `You are a Senior Editor-in-Chief at a premier news agency. 
    Your task is to SYNTHESIZE multiple news reports into ONE comprehensive, unique, and authoritative article.

    CRITICAL IDENTITY:
    - You are an INVESTIGATIVE DATA-JOURNALIST.
    - Do NOT just summarize. You must MERGE facts, detect contradictions, and provide a COMPLETE picture.
    - Your goal: Create the "Ultimate Report" on this topic that makes all other sources redundant. Focus on DATA DENSITY.

    FLEXIBILITY & DATA INTEGRITY:
    - **Priority on Hard Data**: If sources contain specific numbers, prices (e.g., "Rp 5.000.000"), or technical specifications (e.g., "RAM 8GB", "Snapdragon 8 Gen 3"), you MUST include them exactly. Do NOT generalize them.
    - **Structure Requirement**: You MUST include a dedicated section (under an <h2> like 'Spesifikasi Lengkap' or 'Daftar Harga Terbaru') using <ul> or <table> to clearly list the technical details found.
    - **No Hallucinations**: Do NOT invent prices or specs. Use the sources as the ground truth.
    - **Cut the Fluff**: Avoid "ngambang" (vague/floaty) sentences like "harganya kompetitif" or "spesifikasinya menarik". Replace them with "Harganya Rp X" or "Layar 6.7 inci AMOLED".

    2. **STYLE & MODEL**:
       - **STYLE: ${writingStyle}**
       - **MODEL: ${articleModel}**
       - *Special Intent*: If the topic is a product, prioritize a "Review/Buying Guide" tone.

    3. **JOURNALISTIC INTEGRITY**:
       - Language: 100% ${language === 'en' ? 'ENGLISH' : 'INDONESIAN'}.
       - Output must be unique, professional, and dense with information. Aim for 400-600 words.

    4. **OUTPUT FORMAT (STRICT TAGS)**:
        [TITLE]
        (Authoritative, catchy, unique title)
        [/TITLE]
        
        [EXCERPT]
        (Punchy summary, max 160 chars)
        [/EXCERPT]
        
        [CONTENT]
        (HTML content with <p> and <h2>. You MAY use <ul> and <li> for technical specs to make them readable.)
        [/CONTENT]`

    const userPrompt = `Synthesize these ${sources.length} sources into a high-quality article in ${language === 'en' ? 'English' : 'Indonesian'}.

SOURCES:
${sourceData}

Return ONLY the tagged format.`

    // Reuse the logic from rewriteArticle for the API call and parsing
    // But since it's a different function, let's copy the call part

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.1, // Set to 0.1 for maximum factual accuracy and data retention
                    max_tokens: 4000
                })
            })

            if (!response.ok) {
                if (response.status === 429 && attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
                    continue
                }
                throw new Error(`Groq API error: ${response.status}`)
            }

            const data = await response.json()
            const aiResponse = data.choices[0].message.content

            // Parse Tag-Based Response (Abstracted Regex logic)
            const titleMatch = aiResponse.match(/\[TITLE\]([\s\S]*?)\[\/TITLE\]/i)
            const excerptMatch = aiResponse.match(/\[EXCERPT\]([\s\S]*?)\[\/EXCERPT\]/i)
            const contentMatch = aiResponse.match(/\[CONTENT\]([\s\S]*?)\[\/CONTENT\]/i)

            let parsedTitle = titleMatch ? titleMatch[1].trim() : 'Synthesis Result'
            let parsedExcerpt = excerptMatch ? excerptMatch[1].trim() : parsedTitle.substring(0, 160)
            let parsedContent = contentMatch ? contentMatch[1].trim() : ''

            if (!parsedContent) {
                parsedContent = aiResponse // Fallback
            }

            // Ensure HTML
            if (!parsedContent.includes('<p>')) {
                parsedContent = parsedContent.split('\n\n').filter((p: string) => p.trim()).map((p: string) => `<p>${p.trim()}</p>`).join('')
            }

            return {
                title: parsedTitle,
                content: parsedContent,
                excerpt: parsedExcerpt
            }

        } catch (error: any) {
            if (attempt === MAX_RETRIES) throw error
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        }
    }

    throw new Error('Unexpected synthesis error')
}
