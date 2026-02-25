import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import Replicate from 'replicate'

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

        if (!license_key) {
            return NextResponse.json({ success: false, message: 'License key is required.' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Verify License (Reuse logic or call internal helper)
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
        systemPrompt = "Professional news photo editor. Write a single, focused image generation prompt (max 60 words). photorealistic, DSLR press photography, sharp focus. English only. No preamble."
    } else {
        systemPrompt = "Professional editorial illustrator. Write a single flat vector illustration prompt (max 60 words). clean geometric shapes, bold outlines, news magazine style. English only. No preamble."
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "llama-3-8b-8192", // Use a cheaper model for prompts
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Context:\nTitle: ${title}\nContent: ${content}\n\nGenerated Prompt:` }
            ],
            temperature: 0.4
        })
    })

    const data = await response.json()
    if (!response.ok) return NextResponse.json({ success: false, message: 'Groq Error' }, { status: response.status })

    let result = data.choices[0].message.content
    result = result.replace(/^(here is|prompt:)\s*/i, '').replace(/["'`]/g, '').trim()

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
        finalPrompt = "Front-page news editorial vector illustration, clean geometric shapes, professional news magazine style, " + prompt
    } else {
        finalPrompt = "Professional news press photography, award-winning journalism style, high resolution, " + prompt
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
