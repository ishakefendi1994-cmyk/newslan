<?php
/**
 * Handle AI Image Generation using Replicate & Groq
 */
class Newslan_Image_Generator {

    private static $instance = null;

    public static function get_instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Generate an AI image based on article content
     *
     * @param string $title    Article title
     * @param string $content  Article content
     * @param string $style    'editorial_vector' (default) or 'real_photo'
     */
    public function generate_article_image( $title, $content, $style = 'editorial_vector' ) {
        $replicate_token = get_option( 'newslan_ai_replicate_token' );
        $groq_key        = get_option( 'newslan_ai_groq_key' );

        if ( empty( $replicate_token ) || empty( $groq_key ) ) {
            return false;
        }

        // 1. Generate prompt using Groq (style-aware)
        $prompt = $this->generate_prompt( $title, $content, $groq_key, $style );
        if ( ! $prompt ) {
            // Fallback prompts per style
            if ( $style === 'real_photo' ) {
                $prompt = "High quality photorealistic press photo for news article: $title, professional DSLR, natural lighting, editorial photography, 8k, sharp focus";
            } else {
                $prompt = "Editorial vector illustration, satirical news magazine cover style: $title, minimalist background, bold composition, symbolic metaphor, clean vector shapes";
            }
        }

        error_log( '[Newslan AI] ImageGenerator: style=' . $style . ' prompt=' . $prompt );

        // 2. Generate image using Replicate (Flux Schnell)
        return $this->call_replicate( $prompt, $replicate_token );
    }

    private function generate_prompt( $title, $content, $groq_key, $style = 'editorial_vector' ) {

        if ( $style === 'real_photo' ) {
            $system_prompt = <<<PROMPT
You are a professional news photo editor. Your job is to write a single, focused image generation prompt for a news article thumbnail.

STRICT RULES:
- The image MUST directly represent the news topic. Do NOT invent unrelated concepts.
- Use real-world objects, people, or scenes closely related to the article subject.
- Style: photorealistic, DSLR press photography, sharp focus, natural lighting.
- Composition: foreground subject clearly visible, clean background (non-cluttered).
- Mood: match the tone of the news (serious, hopeful, political, sports, etc.)
- Forbidden: fantasy elements, surrealism, cartoons, text overlays, watermarks, logos.
- Language: English only.
- Length: maximum 60 words, single paragraph, no bullet points.

Output: Return ONLY the image prompt. No intro, no explanation, no quotes.
PROMPT;
        } else {
            // editorial_vector (flat illustration style)
            $system_prompt = <<<PROMPT
You are a professional editorial illustrator. Your job is to write a single, focused image generation prompt for a flat vector illustration thumbnail for a news article.

STRICT RULES:
- The illustration MUST visually represent the core subject of the news article. Do NOT drift to unrelated topics.
- Use clear symbolic objects, icons, or scenes that a reader would immediately associate with the article topic.
- Style: flat vector illustration, clean geometric shapes, bold outlines, limited color palette (3-5 colors), white or solid color background.
- Composition: one dominant focal point, minimal detail, suitable for a 16:9 thumbnail.
- Forbidden: photorealism, gradients, noise, textures, text overlays, logos, watermarks.
- Language: English only.
- Length: maximum 60 words, single paragraph, no bullet points.

Output: Return ONLY the image prompt. No intro, no explanation, no quotes.
PROMPT;
        }

        $body_content = substr( $content, 0, 800 );
        $user_prompt  = "News article title: \"$title\"\n\nSummary context:\n$body_content\n\nWrite the image generation prompt now:";

        $response = wp_remote_post( 'https://api.groq.com/openai/v1/chat/completions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $groq_key,
                'Content-Type'  => 'application/json'
            ),
            'body'    => json_encode( array(
                'model'       => 'llama-3.3-70b-versatile',
                'messages'    => array(
                    array( 'role' => 'system', 'content' => $system_prompt ),
                    array( 'role' => 'user',   'content' => $user_prompt )
                ),
                'temperature' => 0.4,   // lebih rendah = lebih konsisten & relevan
                'max_tokens'  => 150,   // cukup untuk 60 kata prompt
            )),
            'timeout' => 30
        ));

        if ( is_wp_error( $response ) ) return false;

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        $raw  = isset( $body['choices'][0]['message']['content'] ) ? trim( $body['choices'][0]['message']['content'] ) : false;

        // Strip any accidental intro phrases AI might add
        if ( $raw ) {
            $raw = preg_replace( '/^(here is|here\'s|image prompt:|prompt:)\s*/i', '', $raw );
            $raw = trim( $raw, '"\'` ' );
        }

        return $raw;
    }


    private function call_replicate( $prompt, $token ) {
        $response = wp_remote_post( 'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', array(
            'headers' => array(
                'Authorization' => 'Token ' . $token,
                'Content-Type'  => 'application/json',
                'Prefer'        => 'wait'
            ),
            'body'    => json_encode( array(
                'input' => array(
                    'prompt'       => $prompt,
                    'aspect_ratio' => "16:9",
                    'output_format'=> "webp",
                    'go_fast'      => true
                )
            )),
            'timeout' => 60
        ));

        if ( is_wp_error( $response ) ) return false;

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        
        if ( isset( $body['status'] ) && $body['status'] === 'succeeded' && !empty( $body['output'] ) ) {
            return is_array( $body['output'] ) ? $body['output'][0] : $body['output'];
        }

        return false;
    }
}
