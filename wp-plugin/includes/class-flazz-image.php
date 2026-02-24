<?php
/**
 * Handle AI Image Generation using Replicate & Groq
 */
class Flazz_Image_Generator {

    private static $instance = null;

    public static function get_instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Generate an AI image based on article content via Cloud Orchestrator
     *
     * @param string $title    Article title
     * @param string $content  Article content
     * @param string $style    'editorial_vector' (default) or 'real_photo'
     */
    public function generate_article_image( $title, $content, $style = 'editorial_vector' ) {
        $replicate_token = get_option( 'flazz_ai_replicate_token' );
        $groq_key        = get_option( 'flazz_ai_groq_key' );
        $license         = get_option( 'flazz_ai_license_key' );

        if ( empty( $replicate_token ) || empty( $groq_key ) ) {
            return false;
        }

        // 1. First, generate the prompt using the Cloud Orchestrator (calling Groq there)
        $prompt = $this->generate_prompt_via_cloud( $title, $content, $groq_key, $license, $style );
        if ( ! $prompt ) {
            // Hard fallback
            $prompt = ( $style === 'real_photo' ) ? "News photo: $title" : "Editorial illustration: $title";
        }

        // 2. Then, call the Cloud Orchestrator again to generate the image via Replicate
        return $this->generate_image_via_cloud( $prompt, $style, $replicate_token, $license );
    }

    private function generate_prompt_via_cloud( $title, $content, $groq_key, $license, $style ) {
        $api_url = 'https://www.cryptotechnews.net/api/ai/orchestrator';
        
        $response = wp_remote_post( $api_url, array(
            'headers' => array( 'Content-Type' => 'application/json' ),
            'body'    => json_encode( array(
                'action'      => 'generate_prompt',
                'license_key' => $license,
                'domain'      => isset( $_SERVER['HTTP_HOST'] ) ? $_SERVER['HTTP_HOST'] : '',
                'api_key'     => $groq_key,
                'payload'     => array(
                    'title'   => $title,
                    'content' => mb_substr( $content, 0, 1000 ),
                    'style'   => $style
                )
            )),
            'timeout' => 45
        ));

        if ( is_wp_error( $response ) ) return false;
        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        return ( isset( $body['success'] ) && $body['success'] === true ) ? $body['data'] : false;
    }

    private function generate_image_via_cloud( $prompt, $style, $token, $license ) {
        $api_url = 'https://www.cryptotechnews.net/api/ai/orchestrator';

        $response = wp_remote_post( $api_url, array(
            'headers' => array( 'Content-Type' => 'application/json' ),
            'body'    => json_encode( array(
                'action'      => 'generate_image',
                'license_key' => $license,
                'domain'      => isset( $_SERVER['HTTP_HOST'] ) ? $_SERVER['HTTP_HOST'] : '',
                'api_key'     => $token,
                'payload'     => array(
                    'prompt' => $prompt,
                    'style'  => $style
                )
            )),
            'timeout' => 60
        ));

        if ( is_wp_error( $response ) ) return false;
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( isset( $body['success'] ) && $body['success'] === true && !empty( $body['data']['output'] ) ) {
            $output = $body['data']['output'];
            return is_array( $output ) ? $output[0] : $output;
        }

        return false;
    }
}
