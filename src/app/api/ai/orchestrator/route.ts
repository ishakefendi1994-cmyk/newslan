import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import Replicate from 'replicate'
import crypto from 'crypto'

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Flazz AI Orchestrator is active and running. This endpoint only accepts POST requests for AI processing.'
    })
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action, license_key, domain, api_key, payload } = body
        const clientToken = request.headers.get('x-flazz-token')

        if (!license_key) {
            return NextResponse.json({ success: false, message: 'License key is required.' }, { status: 400 })
        }

        if (!clientToken) {
            return NextResponse.json({ success: false, message: 'Security Handshake failed: Token missing.' }, { status: 401 })
        }

        const internalSecret = process.env.FLAZZ_INTERNAL_SECRET || 'fallback_secret_123'

        // Verify Handshake Token
        const expectedToken = crypto
            .createHash('sha256')
            .update(license_key + domain + internalSecret)
            .digest('hex')

        if (clientToken !== expectedToken) {
            return NextResponse.json({ success: false, message: 'Security Handshake failed: Invalid Token.' }, { status: 401 })
        }

        const supabase = createAdminClient()

        // 1. Verify License status and domain
        const { data: license, error } = await supabase
            .from('plugin_licenses')
            .select('*, license_activations(domain)')
            .eq('license_key', license_key)
            .single()

        if (error || !license || license.status !== 'active') {
            return NextResponse.json({ success: false, message: 'Invalid or inactive license.' }, { status: 403 })
        }

        // 1.1 Strict Domain Matching
        const activations = license.license_activations || []
        const isDomainValid = activations.some((a: { domain: string }) => a.domain === domain)

        if (!isDomainValid) {
            return NextResponse.json({
                success: false,
                message: `Domain mismatch. This license is not activated for ${domain}. Please activate it from your WordPress settings.`
            }, { status: 403 })
        }

        // 2. Orchestrate based on action
        if (action === 'rewrite' || action === 'write_from_idea') {
            return await handleGroqProcessing(api_key, action, payload)
        } else if (action === 'generate_prompt') {
            return await handlePromptGeneration(api_key, payload)
        } else if (action === 'generate_image') {
            return await handleReplicateProcessing(api_key, payload)
        } else if (action === 'get_trends') {
            return await handleGetTrends(payload)
        } else if (action === 'generate_seo') {
            return await handleGenerateSeoMeta(api_key, payload)
        } else if (action === 'suggest_taxonomy') {
            return await handleSuggestTaxonomy(api_key, payload)
        }

        return NextResponse.json({ success: false, message: 'Unknown action.' }, { status: 400 })

    } catch (err) {
        console.error('Orchestrator Error:', err)
        return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
    }
}

async function handlePromptGeneration(apiKey: string, payload: any) {
    const { title, content, style } = payload
    let systemPrompt = ""

    if (style === 'real_photo') {
        systemPrompt = `You are a professional news photo editor. Your task is to write a concise image generation prompt (max 60 words) for the news article provided.

RULES — follow strictly:
- Derive the scene DIRECTLY from the article's topic. Do NOT invent unrelated imagery.
- Describe a calm, neutral, realistic scene typical of professional news/press photography.
- Mention specific objects, places, or people types relevant to the article (e.g. "businessman in suit signing documents", "street market in Jakarta", "rocket on launch pad").
- Use adjectives sparingly. Avoid dramatic or exaggerated words like: explosive, chaotic, dramatic, epic, fiery, terrifying, glowing, massive destruction.
- Style suffix to always include: "photorealistic, sharp focus, natural lighting, Reuters news photo"
- Output ONLY the prompt. No preamble, no explanation, no quotes.`
    } else {
        systemPrompt = `You are a professional editorial illustrator. Your task is to write a concise flat illustration prompt (max 60 words) for the news article provided.

RULES — follow strictly:
- Derive the illustration concept DIRECTLY from the article's topic. Do NOT invent unrelated imagery.
- Describe a clean, simple scene using symbolic or literal objects from the article (e.g. "smartphone with stock chart", "government building with Indonesian flag", "laptop with code on screen").
- Avoid vague or over-dramatic concepts like: "battle between forces", "explosion of ideas", "dark dystopian city", "glowing magical energy".
- Style suffix to always include: "flat vector illustration, minimal, bold outlines, news magazine editorial style, white background"
- Output ONLY the prompt. No preamble, no explanation, no quotes.`
    }

    const snippet = content ? content.slice(0, 600) : ''

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Article Title: ${title}\n\nContent snippet: ${snippet}\n\nImage Prompt:` }
            ],
            temperature: 0.2,
            max_tokens: 120
        })
    })

    const data = await response.json()
    if (!response.ok) return NextResponse.json({ success: false, message: 'Groq Error' }, { status: response.status })

    let result = data.choices[0].message.content
    result = result.replace(/^(here is|prompt:|image prompt:)\s*/i, '').replace(/["`]/g, '').trim()

    return NextResponse.json({ success: true, data: result })
}

async function handleGroqProcessing(apiKey: string, action: string, payload: any) {
    if (!apiKey) return NextResponse.json({ success: false, message: 'Groq API Key missing.' }, { status: 400 })

    const targetLang = payload.target_language || 'Indonesian'
    let systemPrompt = `You are a Professional Content Writer and SEO Expert. Output MUST be in ${targetLang}.`

    if (action === 'rewrite') {
        systemPrompt += `\nTask: Rewrite the following article to be unique, engaging, and SEO friendly in ${targetLang}. Maintain the core facts.\n`
        systemPrompt += "STYLE: " + (payload.style || 'Professional') + ". MODEL: " + (payload.model || 'Straight News') + ".\n"
    } else {
        systemPrompt += `\nTask: Develop a single idea into a full, high-quality article in ${targetLang}.\n`
        systemPrompt += "STYLE: " + (payload.style || 'Professional') + ". MODEL: " + (payload.model || 'Straight News') + ".\n"
    }

    systemPrompt += "Format: Title on first line, then blank line, then HTML content (p, h2, ul, li). Do NOT add any preamble."

    const userPrompt = action === 'rewrite'
        ? `Title: ${payload.title}\n\nContent:\n${payload.content}`
        : `Ide Utama / Topik: ${payload.idea}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7
        })
    })

    const data = await response.json()
    if (!response.ok) {
        return NextResponse.json({ success: false, message: 'Groq Error: ' + (data.error?.message || response.statusText) }, { status: response.status })
    }

    return NextResponse.json({
        success: true,
        data: data.choices[0].message.content
    })
}

async function handleReplicateProcessing(apiKey: string, payload: any) {
    if (!apiKey) return NextResponse.json({ success: false, message: 'Replicate API Token missing.' }, { status: 400 })

    const { prompt, style } = payload
    let finalPrompt = prompt

    if (style === 'editorial_vector') {
        // Only add prefix if the prompt is very short (fallback)
        if (prompt.length < 50) {
            finalPrompt = "Front-page news editorial vector illustration, clean geometric shapes, professional news magazine style, " + prompt
        }
    } else {
        // For real_photo, we avoid heavy prefixes that can distract Flux.
        // Instead, we ensure the subject stays first and add a quality suffix.
        if (prompt.length < 50) {
            finalPrompt = "Professional news press photography, award-winning journalism style, " + prompt
        } else {
            // Append quality/style rather than prefixing to keep subject prominent
            finalPrompt = prompt + ", professional news press photography, award-winning journalism style, high resolution, 8k"
        }
    }

    try {
        const replicate = new Replicate({ auth: apiKey })

        // 1. Run the model with a simple retry for 429 (Throttling)
        let output;
        try {
            output = await replicate.run(
                "black-forest-labs/flux-schnell",
                {
                    input: {
                        prompt: finalPrompt,
                        aspect_ratio: "1:1",
                        num_inference_steps: 4
                    }
                }
            )
        } catch (err: any) {
            // If throttled (429), wait 2 seconds and try one last time
            if (err.message?.includes('429') || err.status === 429) {
                console.log('Throttled by Replicate. Retrying in 2 seconds...')
                await new Promise(resolve => setTimeout(resolve, 2000))
                output = await replicate.run(
                    "black-forest-labs/flux-schnell",
                    {
                        input: {
                            prompt: finalPrompt,
                            aspect_ratio: "1:1",
                            num_inference_steps: 4
                        }
                    }
                )
            } else {
                throw err
            }
        }

        if (!output || (Array.isArray(output) && output.length === 0)) {
            return NextResponse.json({ success: false, message: 'No output from Replicate.' }, { status: 500 })
        }

        // Output from flux-schnell can be an array of objects with .url() or plain strings
        let imageUrl = '';
        if (Array.isArray(output)) {
            const firstItem = output[0] as any;
            if (typeof firstItem === 'object' && firstItem !== null && typeof firstItem.url === 'function') {
                imageUrl = firstItem.url();
            } else {
                imageUrl = String(firstItem);
            }
        } else if (typeof output === 'object' && output !== null && typeof (output as any).url === 'function') {
            imageUrl = (output as any).url();
        } else {
            imageUrl = String(output);
        }

        if (!imageUrl || imageUrl === '[object Object]') {
            return NextResponse.json({ success: false, message: 'Invalid image URL format from Replicate.' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data: {
                status: 'succeeded',
                output: [imageUrl]
            }
        })

    } catch (err: any) {
        console.error('Replicate SDK Error:', err)
        return NextResponse.json({
            success: false,
            message: 'Replicate Error: ' + (err.message || 'Unknown error occurred.')
        }, { status: 500 })
    }
}

async function handleGenerateSeoMeta(api_key: string, payload: any) {
    const { title, content } = payload
    if (!title) return NextResponse.json({ success: false, message: 'Title is required.' }, { status: 400 })

    const snippet = content ? content.slice(0, 800) : title
    const systemPrompt = `You are an SEO expert. Given an article title and content snippet, respond ONLY with valid JSON (no markdown, no explanation) in this exact format:
{"seo_title":"...","meta_description":"...","focus_keyword":"..."}
Rules:
- seo_title: compelling, 55-65 characters, includes main keyword
- meta_description: enticing summary for SERP, max 155 characters
- focus_keyword: single most important keyword phrase (2-4 words)`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${api_key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Title: ${title}\n\nContent snippet: ${snippet}` }
            ],
            temperature: 0.3,
            max_tokens: 300,
        })
    })

    if (!response.ok) return NextResponse.json({ success: false, message: 'Groq SEO Error' }, { status: 500 })

    const groqData = await response.json()
    const raw = groqData.choices?.[0]?.message?.content?.trim() || ''

    try {
        const json = JSON.parse(raw.replace(/```json|```/g, '').trim())
        return NextResponse.json({ success: true, data: json })
    } catch {
        return NextResponse.json({ success: false, message: 'Failed to parse SEO meta from AI.' }, { status: 500 })
    }
}

/**
 * handleGetTrends: Extracts trending topics from Google News organized by niche.
 * Each niche maps to a specific Google News topic RSS feed. Fetched in parallel.
 */
async function handleGetTrends(payload: any) {
    const geo = payload.geo || 'ID'

    const geoMap: Record<string, { hl: string, gl: string, ceid: string }> = {
        ID: { hl: 'id', gl: 'ID', ceid: 'ID:id' },
        US: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
    }
    const gc = geoMap[geo] || geoMap['ID']

    // Google News topic IDs — These are stable topic hashes used by Google News
    const niches = [
        { name: '📰 Berita Utama', slug: 'Utama', topicId: '' }, // main RSS (no topic ID)
        { name: '💻 Teknologi', slug: 'Teknologi', topicId: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtbGtHZ0pKUkNnQVAB' },
        { name: '💼 Bisnis', slug: 'Bisnis', topicId: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGVrNld5U0FtbGtHZ0pKUkNnQVAB' },
        { name: '🎬 Hiburan', slug: 'Hiburan', topicId: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtbGtHZ0pKUkNnQVAB' },
        { name: '⚽ Olahraga', slug: 'Olahraga', topicId: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtbGtHZ0pKUkNnQVAB' },
        { name: '🔬 Sains', slug: 'Sains', topicId: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0YVRjU0FtbGtHZ0pKUkNnQVAB' },
    ]

    const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1)'

    async function fetchNiche(niche: typeof niches[0]) {
        const url = niche.topicId
            ? `https://news.google.com/rss/topics/${niche.topicId}?hl=${gc.hl}&gl=${gc.gl}&ceid=${gc.ceid}`
            : `https://news.google.com/rss?hl=${gc.hl}&gl=${gc.gl}&ceid=${gc.ceid}`

        try {
            const res = await fetch(url, { headers: { 'User-Agent': ua } })
            if (!res.ok) return []

            const xml = await res.text()
            const results: { keyword: string; traffic: string; niche: string; niche_slug: string }[] = []
            const titleRe = /<item>[\s\S]*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g
            let m
            while ((m = titleRe.exec(xml)) !== null && results.length < 8) {
                const raw = m[1]
                    .replace(/ - [^-]+$/, '')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .trim()
                if (raw.length > 3) {
                    results.push({ keyword: raw, traffic: 'Trending', niche: niche.name, niche_slug: niche.slug })
                }
            }
            return results
        } catch {
            return []
        }
    }

    const allResults = (await Promise.all(niches.map(fetchNiche))).flat()

    if (allResults.length > 0) {
        console.log(`[Trends] Extracted ${allResults.length} items in ${niches.length} niches for ${geo}`)
        return NextResponse.json({ success: true, data: allResults })
    }

    return NextResponse.json({ success: false, message: 'Tidak dapat mengambil data trending saat ini.' })
}
/**
 * Suggest category and tags based on content.
 */
async function handleSuggestTaxonomy(apiKey: string, payload: any) {
    const { title, content, categories } = payload
    const snippet = content ? content.substring(0, 1000) : ''

    const prompt = `Based on this news article, suggest:
1. The most suitable category from this list: [${categories.join(', ')}]
2. At least 5 relevant SEO tags.

Title: ${title}
Content snippet: ${snippet}

Return ONLY a JSON object:
{
  "category_index": (number, index of the best matching category from the list, 0-based),
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are an SEO expert and news editor. Output only valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' }
            })
        })

        const data = await response.json()
        const result = JSON.parse(data.choices[0].message.content)

        return NextResponse.json({
            success: true,
            data: result
        })
    } catch (err: any) {
        console.error('Groq Taxononomy Error:', err)
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
}
