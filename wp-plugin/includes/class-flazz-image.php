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
        $token   = get_option( 'flazz_ai_site_access_token' );
        
        $response = wp_remote_post( $api_url, array(
            'headers' => array( 
                'Content-Type'  => 'application/json',
                'X-Flazz-Token' => $token
            ),
            'body'    => json_encode( array(
                'action'      => 'generate_prompt',
                'license_key' => $license,
                'domain'      => parse_url( home_url(), PHP_URL_HOST ),
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

    private $last_error = '';

    public function get_last_error() {
        return $this->last_error;
    }

    /**
     * Call the Cloud Orchestrator to generate the image via Replicate
     */
    public function generate_image_via_cloud( $prompt, $style, $apiKey, $license ) {
        $api_url = 'https://www.cryptotechnews.net/api/ai/orchestrator';
        $token   = get_option( 'flazz_ai_site_access_token' );
        $this->last_error = '';

        error_log( '[Flazz AI] generate_image_via_cloud: START' );
        error_log( '[Flazz AI] payload action=generate_image, style=' . $style . ', prompt=' . $prompt );

        $response = wp_remote_post( $api_url, array(
            'headers' => array( 
                'Content-Type'  => 'application/json',
                'X-Flazz-Token' => $token
            ),
            'body'    => json_encode( array(
                'action'      => 'generate_image',
                'license_key' => $license,
                'domain'      => parse_url( home_url(), PHP_URL_HOST ),
                'api_key'     => $apiKey,
                'payload'     => array(
                    'prompt' => $prompt,
                    'style'  => $style
                )
            )),
            'timeout' => 60
        ));

        if ( is_wp_error( $response ) ) {
            $this->last_error = 'WP_Error: ' . $response->get_error_message();
            error_log( '[Flazz AI] generate_image_via_cloud: ' . $this->last_error );
            return false;
        }

        $body_text = wp_remote_retrieve_body( $response );
        $code      = wp_remote_retrieve_response_code( $response );
        error_log( '[Flazz AI] generate_image_via_cloud: HTTP Code ' . $code );
        
        $body = json_decode( $body_text, true );

        if ( isset( $body['success'] ) && $body['success'] === true && ! empty( $body['data']['output'] ) && ! empty( $body['data']['output'][0] ) ) {
            $output = $body['data']['output'];
            $final_url = is_array( $output ) ? $output[0] : $output;
            error_log( '[Flazz AI] generate_image_via_cloud: SUCCESS, final_url=' . $final_url );
            return $final_url;
        }

        $this->last_error = isset( $body['message'] ) ? $body['message'] : 'Orchestrator returned successful but with invalid or empty image output.';
        error_log( '[Flazz AI] generate_image_via_cloud: FAILED. ' . $this->last_error );
        return false;
    }
}
