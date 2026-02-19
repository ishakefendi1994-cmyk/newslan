
import { forceHtmlFormatting } from '@/lib/utils/format-html'
import { getSiteSettings } from '../settings'

const DEFAULT_REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
const DEFAULT_GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Replicate Models
// Flux Schnell: Fast, cheap (0.003/img), good quality
const MODEL_FLUX_SCHNELL = "black-forest-labs/flux-schnell"

/**
 * Generate a Stable Diffusion friendly prompt based on article content
 */
export async function generateImagePrompt(title: string, content: string): Promise<string> {
    const settings = await getSiteSettings()
    const groqKey = settings.groq_api_key || DEFAULT_GROQ_API_KEY

    if (!groqKey) {
        throw new Error('GROQ_API_KEY is missing (neither in settings nor ENV)')
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are an AI Art Director. Create a high-quality text-to-image prompt for the following news article.
                        
                        RULES:
                        - Output ONLY the prompt. No introduction, no quotes.
                        - Style: Photorealistic, cinematic lighting, 8k, highly detailed.
                        - Focus on the main subject or concept.
                        - Avoid text, letters, or signboards in the image.
                        - Length: 20-40 words.`
                    },
                    {
                        role: 'user',
                        content: `Title: ${title}\n\nContent Preview: ${content.substring(0, 500)}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 100
            })
        })

        const data = await response.json()
        const prompt = data.choices[0]?.message?.content?.trim()

        console.log('[AI Image] Generated Prompt:', prompt)
        return prompt || `Editorial illustration of ${title}, photorealistic, 8k`
    } catch (error) {
        console.error('[AI Image] Failed to generate prompt:', error)
        return `Editorial illustration of ${title}, photorealistic, 8k`
    }
}

/**
 * Generate image using Replicate (Flux Schnell)
 * Returns the URL of the generated image
 */
export async function generateImage(prompt: string): Promise<string | null> {
    const settings = await getSiteSettings()
    const replicateToken = settings.replicate_api_token || DEFAULT_REPLICATE_API_TOKEN

    if (!replicateToken) {
        console.warn('[AI Image] REPLICATE_API_TOKEN is missing. Skipping image generation.')
        return null
    }

    console.log('[AI Image] Token found. Generating image with Replicate (Flux)... Prompt:', prompt)

    try {
        // Flux Schnell via Replicate HTTP API
        // Correct URL for model prediction
        const modelUrl = "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions"

        const predictionReq = await fetch(modelUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${replicateToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'wait'
            },
            body: JSON.stringify({
                input: {
                    prompt: prompt,
                    aspect_ratio: "16:9",
                    output_format: "webp",
                    go_fast: true,
                    megapixels: "1",
                    num_outputs: 1,
                    output_quality: 90
                }
            })
        })

        if (!predictionReq.ok) {
            const err = await predictionReq.text()
            throw new Error(`Replicate API Error: ${predictionReq.status} ${err}`)
        }

        const prediction = await predictionReq.json()

        // Replicate 'wait' header might return finished prediction, or we might need to poll.
        // If status is 'succeeded', output is in 'output'.
        // Output for Flux is usually an array of URLs.

        console.log('[AI Image] Replicate status:', prediction.status)

        if (prediction.status === 'succeeded' && prediction.output) {
            // Flux output is array of strings (URLs)
            return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
        } else if (prediction.status === 'starting' || prediction.status === 'processing') {
            // If it didn't wait long enough (timeout), we might need to poll? 
            // With 'Prefer: wait', it waits up to some seconds. Flux Schnell is usually < 1s.
            // If it failed to wait, we might have to just return null or implement polling.
            // For now, let's assume it works or log error.
            console.warn('[AI Image] Generation timed out or pending. Status:', prediction.status)
            return null
        } else {
            console.error('[AI Image] Generation failed:', prediction.error)
            return null
        }

    } catch (error: any) {
        console.error('[AI Image] Error calling Replicate:', error.message)
        return null
    }
}
