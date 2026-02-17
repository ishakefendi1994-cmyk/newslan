/**
 * AI Article Rewriter using Groq API
 * Handles rate limiting, retries, and content optimization
 */

// Groq Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY!
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
    sourceName: string
): Promise<RewriteResult> {
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

57: **LANGUAGE & TRANSLATION (CRITICAL)**:
    - **AUTO-DETECT SOURCE LANGUAGE**:
      - If source is ENGLISH: **TRANSLATE ID FIRST** -> Then REWRITE.
      - If source is INDONESIAN: Directly REWRITE.
    - **OUTPUT MUST BE 100% INDONESIAN**. No mixed languages.
    - Translate idioms/terms contextually (e.g., "Bear Market" -> "Pasar Lesu", not "Pasar Beruang").

2.  **NEW ANGLE & FRAMING**:
    - Choose ONE specific angle:
      a) **Investment Risk Focus**: Warning about potential downfalls.
      b) **Market Trend**: Connecting this to global economic shifts.
      c) **Practical Utility**: How this actually affects the daily user.
    - Write the ENTIRE article from this chosen perspective.

3.  **JOURNALISTIC VOICE**:
    - Use "National Media" style (Tempo/Kompas style). Professional, analytical, fluid.
    - Variation in sentence length: Mix short punchy sentences with longer analytical ones.
    - **Smooth Transitions**: Use paragraphs that flow naturally without needing "Adapun", "Selain itu". Avoid listicles/bullets unless absolutely necessary.

4.  **EXPANSION & DEEPENING**:
    - The result MUST be equal length or LONGER than the original.
    - Add *general* context to explain *why* facts matter (e.g., "This price drop reflects the broader instability in...").
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
                    'Authorization': `Bearer ${GROQ_API_KEY}`
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
