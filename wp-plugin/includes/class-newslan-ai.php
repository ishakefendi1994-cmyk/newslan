<?php
/**
 * Handle AI Rewriting using OpenRouter/OpenAI
 */
class Newslan_AI_Writer {

    private static $instance = null;
    private $last_error = '';

    public static function get_instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Rewrite content using AI
     */
    public function rewrite_article( $title, $content, $style = 'Professional', $model = 'Straight News' ) {
        $api_key = get_option( 'newslan_ai_groq_key' );
        if ( empty( $api_key ) ) {
            return false;
        }

        // Truncate content to avoid TPM (Tokens Per Minute) limit on free keys
        // Reduced to 2500 characters to stay under the 12k TPM limit
        $truncated_content = mb_substr( $content, 0, 2500 );

        $system_prompt = "You are a Senior Chief Editor. Your task is to produce a COMPLETELY NEW article based on the facts provided.\n";
        $system_prompt .= "STYLE: $style. Applying this style consistently.\n";
        $system_prompt .= "ARTICLE MODEL: $model. Following this structure.\n";
        $system_prompt .= "RULES: Output MUST be in Indonesian. No hallicunations. Format: Title on first line, then blank line, then HTML content (p, h2, ul, li).";

        $user_prompt = "Judul Asli: $title\n\nIsi Konten:\n$truncated_content";

        $response = wp_remote_post( 'https://api.groq.com/openai/v1/chat/completions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json'
            ),
            'body'    => json_encode( array(
                'model'    => 'llama-3.3-70b-versatile',
                'messages' => array(
                    array( 'role' => 'system', 'content' => $system_prompt ),
                    array( 'role' => 'user', 'content' => $user_prompt )
                ),
                'temperature' => 0.7
            )),
            'timeout' => 60
        ));

        if ( is_wp_error( $response ) ) {
            $this->last_error = $response->get_error_message();
            error_log( '[Newslan AI] Groq API Request Error: ' . $this->last_error );
            return false;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body_raw = wp_remote_retrieve_body( $response );
        $body = json_decode( $body_raw, true );

        if ( $code !== 200 ) {
            $this->last_error = isset( $body['error']['message'] ) ? $body['error']['message'] : 'Status Code ' . $code;
            error_log( '[Newslan AI] Groq API Returned Error: ' . $this->last_error );
            return false;
        }
        
        if ( isset( $body['choices'][0]['message']['content'] ) ) {
            $ai_text = $this->clean_ai_response( $body['choices'][0]['message']['content'] );
            
            // Split title and content (assumes first line is title)
            $parts = explode("\n\n", $ai_text, 2);
            $new_title = !empty($parts[0]) ? strip_tags($parts[0]) : $title;
            $new_content = !empty($parts[1]) ? $parts[1] : $ai_text;

            return array(
                'title'   => trim($new_title),
                'content' => trim($new_content)
            );
        }

        return false;
    }

    public function synthesize_from_multiple_sources( $sources, $style = 'Professional', $model = 'Straight News' ) {
        $api_key = get_option( 'newslan_ai_groq_key' );
        if ( empty( $api_key ) || empty( $sources ) ) {
            return false;
        }

        $source_data = "";
        foreach ( $sources as $i => $s ) {
            $content = mb_substr( $s['content'], 0, 2000 ); // Limit per source to avoid total TPM limit
            $source_data .= "--- SOURCE " . ($i + 1) . " (" . $s['sourceName'] . ") ---\n";
            $source_data .= "Title: " . $s['title'] . "\n";
            $source_data .= "Content:\n" . $content . "\n\n";
        }

        $system_prompt = "You are a Senior Editor-in-Chief. Your task is to SYNTHESIZE multiple news reports into ONE comprehensive, unique, and authoritative article.\n";
        $system_prompt .= "STYLE: $style. ARTICLE MODEL: $model.\n";
        $system_prompt .= "CRITICAL: Do NOT just summarize. Merge facts, detect contradictions, and provide a COMPLETE picture. Prioritize data density (prices, specs, names).\n";
        $system_prompt .= "RULES: Output MUST be in Indonesian. Format: Title on first line, then blank line, then HTML content (p, h2, ul, li).";

        $user_prompt = "Synthesize these " . count($sources) . " sources into a high-quality article.\n\nSOURCES:\n$source_data";

        $response = wp_remote_post( 'https://api.groq.com/openai/v1/chat/completions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json'
            ),
            'body'    => json_encode( array(
                'model'    => 'llama-3.3-70b-versatile',
                'messages' => array(
                    array( 'role' => 'system', 'content' => $system_prompt ),
                    array( 'role' => 'user', 'content' => $user_prompt )
                ),
                'temperature' => 0.2 // Lower temperature for more factual synthesis
            )),
            'timeout' => 120
        ));

        if ( is_wp_error( $response ) ) {
            $this->last_error = $response->get_error_message();
            return false;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code !== 200 ) {
            $this->last_error = isset( $body['error']['message'] ) ? $body['error']['message'] : 'Status Code ' . $code;
            return false;
        }

        if ( isset( $body['choices'][0]['message']['content'] ) ) {
            $ai_text = $this->clean_ai_response( $body['choices'][0]['message']['content'] );
            $parts = explode("\n\n", $ai_text, 2);
            return array(
                'title'   => trim(strip_tags($parts[0])),
                'content' => trim($parts[1])
            );
        }

        return false;
    }

    public function write_from_idea( $idea, $style = 'Professional', $model = 'Straight News' ) {
        $api_key = get_option( 'newslan_ai_groq_key' );
        if ( empty( $api_key ) || empty( $idea ) ) {
            return false;
        }

        $system_prompt = "You are a Creative Content Writer and Journalist. Your task is to develop a single idea or topic into a full, high-quality article.\n";
        $system_prompt .= "STYLE: $style. ARTICLE MODEL: $model.\n";
        $system_prompt .= "RULES: Output MUST be in Indonesian. No hallsucinations. Provide a professional and engaging article.\n";
        $system_prompt .= "Format: Title on first line, then blank line, then HTML content (p, h2, ul, li). Do NOT add any preamble.";

        $user_prompt = "Ide Utama / Topik: $idea\n\nSilakan kembangkan menjadi artikel lengkap.";

        $response = wp_remote_post( 'https://api.groq.com/openai/v1/chat/completions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json'
            ),
            'body'    => json_encode( array(
                'model'    => 'llama-3.3-70b-versatile',
                'messages' => array(
                    array( 'role' => 'system', 'content' => $system_prompt ),
                    array( 'role' => 'user', 'content' => $user_prompt )
                ),
                'temperature' => 0.8 // Higher temperature for more creative writing from idea
            )),
            'timeout' => 90
        ));

        if ( is_wp_error( $response ) ) {
            $this->last_error = $response->get_error_message();
            return false;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code !== 200 ) {
            $this->last_error = isset( $body['error']['message'] ) ? $body['error']['message'] : 'Status Code ' . $code;
            return false;
        }

        if ( isset( $body['choices'][0]['message']['content'] ) ) {
            $ai_text = $this->clean_ai_response( $body['choices'][0]['message']['content'] );
            $parts = explode("\n\n", $ai_text, 2);
            return array(
                'title'   => trim(strip_tags($parts[0])),
                'content' => trim($parts[1])
            );
        }
        return false;
    }

    public function get_last_error() {
        return $this->last_error;
    }
    private function clean_ai_response( $text ) {
        // Remove markdown triple backticks if present
        $text = preg_replace('/```html/', '', $text);
        $text = preg_replace('/```/', '', $text);
        return trim( $text );
    }
}
