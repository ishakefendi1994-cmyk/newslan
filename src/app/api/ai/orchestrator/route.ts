import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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
        finalPrompt = "Front page news editorial flat vector illustration, clean geometric shapes, professional news magazine style, simple corporate colors, high quality, " + prompt
    } else {
        finalPrompt = "Professional DSLR press photography, award winning news photo, high resolution, 8k, realistic journalistic style, " + prompt
    }

    // 1. Start the prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            // stabilityai/sdxl-turbo (via jyoung105)
            version: "521267bca99a59f8b16b812755603e23b7a5412767568d47c915920eabd9ef90",
            input: {
                prompt: finalPrompt,
                width: 512,
                height: 512,
                num_inference_steps: 15,
                guidance_scale: 6,
                scheduler: "K_EULER"
            }
        })
    })

    let prediction = await response.json()
    if (!response.ok) {
        return NextResponse.json({ success: false, message: 'Replicate Error: ' + (prediction.detail || response.statusText) }, { status: response.status })
    }

    // 2. Poll for results (Wait up to 15 seconds)
    const pollUrl = prediction.urls.get
    let attempts = 0
    const maxAttempts = 15

    while (attempts < maxAttempts) {
        const pollResponse = await fetch(pollUrl, {
            headers: { 'Authorization': `Token ${apiKey}` }
        })

        prediction = await pollResponse.json()

        if (prediction.status === 'succeeded') {
            return NextResponse.json({ success: true, data: prediction })
        } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
            return NextResponse.json({
                success: false,
                message: `Replicate prediction ${prediction.status}: ${prediction.error || 'Unknown error'}`
            }, { status: 500 })
        }

        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
    }

    return NextResponse.json({
        success: false,
        message: 'Replicate image generation timed out after 15 seconds. The image might still be processing.'
    }, { status: 504 })
}
