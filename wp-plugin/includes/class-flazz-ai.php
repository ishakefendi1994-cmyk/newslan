<?php
/**
 * Handle AI Rewriting using OpenRouter/OpenAI
 */
class Flazz_AI_Writer {

    private static $instance = null;
    private $last_error = '';

    public static function get_instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Rewrite content using AI Orchestrator (Cloud Brain)
     */
    public function rewrite_article( $title, $content, $style = 'Professional', $model = 'Straight News' ) {
        $api_key = get_option( 'flazz_ai_groq_key' );
        $license = get_option( 'flazz_ai_license_key' );

        if ( empty( $api_key ) ) {
            $this->last_error = 'API Key Groq belum diisi.';
            return false;
        }

        // Orchestrator API
        $api_url = 'https://www.cryptotechnews.net/api/ai/orchestrator';

        $response = wp_remote_post( $api_url, array(
            'headers' => array( 'Content-Type' => 'application/json' ),
            'body'    => json_encode( array(
                'action'      => 'rewrite',
                'license_key' => $license,
                'api_key'     => $api_key,
                'payload'     => array(
                    'title'   => $title,
                    'content' => mb_substr( $content, 0, 3000 ),
                    'style'   => $style,
                    'model'   => $model
                )
            )),
            'timeout' => 90
        ));

        return $this->handle_orchestrator_completion( $response, $title );
    }

    /**
     * Synthesize multiple articles (Cloud Brain)
     */
    public function synthesize_from_multiple_sources( $sources, $style = 'Professional', $model = 'Straight News' ) {
        // Implementation for synthesis via cloud
        // For simplicity, we can use the same rewrite logic or create a specific cloud action
        // Currently fallback to single rewrite of first source or error
        if ( empty( $sources ) ) return false;
        return $this->rewrite_article( $sources[0]['title'], $sources[0]['content'], $style, $model );
    }

    /**
     * Write from Idea (Cloud Brain)
     */
    public function write_from_idea( $idea, $style = 'Professional', $model = 'Straight News' ) {
        $api_key = get_option( 'flazz_ai_groq_key' );
        $license = get_option( 'flazz_ai_license_key' );

        if ( empty( $api_key ) || empty( $idea ) ) {
            $this->last_error = 'API Key atau Ide kosong.';
            return false;
        }

        $api_url = 'https://www.cryptotechnews.net/api/ai/orchestrator';

        $response = wp_remote_post( $api_url, array(
            'headers' => array( 'Content-Type' => 'application/json' ),
            'body'    => json_encode( array(
                'action'      => 'write_from_idea',
                'license_key' => $license,
                'api_key'     => $api_key,
                'payload'     => array(
                    'idea'  => $idea,
                    'style' => $style,
                    'model' => $model
                )
            )),
            'timeout' => 90
        ));

        return $this->handle_orchestrator_completion( $response );
    }

    private function handle_orchestrator_completion( $response, $fallback_title = '' ) {
        if ( is_wp_error( $response ) ) {
            $this->last_error = $response->get_error_message();
            return false;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code !== 200 ) {
            $this->last_error = isset( $body['message'] ) ? $body['message'] : 'Status ' . $code;
            return false;
        }

        if ( isset( $body['success'] ) && $body['success'] === true ) {
            $ai_text = $this->clean_ai_response( $body['data'] );
            
            $parts = explode("\n\n", $ai_text, 2);
            $new_title = !empty($parts[0]) ? strip_tags($parts[0]) : $fallback_title;
            $new_content = !empty($parts[1]) ? $parts[1] : $ai_text;

            return array(
                'title'   => trim($new_title),
                'content' => trim($new_content)
            );
        }

        return false;
    }

    public function get_last_error() {
        return $this->last_error;
    }

    private function clean_ai_response( $text ) {
        $text = preg_replace('/```html/', '', $text);
        $text = preg_replace('/```/', '', $text);
        return trim( $text );
    }
}
