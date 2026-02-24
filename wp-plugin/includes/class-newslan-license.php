<?php
/**
 * Handle Plugin Licensing
 */
class Newslan_License_Manager {

    private static $instance = null;
    private $license_option = 'newslan_ai_license_key';
    private $status_option = 'newslan_ai_license_status';

    public static function get_instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'update_option_' . $this->license_option, array( $this, 'on_license_key_update' ), 10, 2 );
    }

    public function on_license_key_update( $old_value, $new_value ) {
        if ( $old_value !== $new_value ) {
            delete_transient( 'newslan_license_check' );
            $this->verify_license( $new_value );
        }
    }

    /**
     * Check if the current domain has a valid license
     */
    public function is_valid() {
        $key = get_option( $this->license_option );
        if ( empty( $key ) ) return false;

        // Check cache first
        $cached_status = get_transient( 'newslan_license_check' );
        if ( $cached_status !== false ) {
            return $cached_status === 'valid';
        }

        // If no cache, verify now
        return $this->verify_license( $key );
    }

    /**
     * Verify license with remote server (Next.js API)
     */
    public function verify_license( $key ) {
        $domain = isset( $_SERVER['HTTP_HOST'] ) ? $_SERVER['HTTP_HOST'] : '';
        
        // Next.js API endpoint (License Server)
        // Hardcoded for now as per plan, could be moved to settings
        $api_url = 'http://localhost:3000/api/license/verify'; 

        $response = wp_remote_post( $api_url, array(
            'timeout' => 15,
            'headers' => array( 'Content-Type' => 'application/json' ),
            'body'    => json_encode( array(
                'license_key' => $key,
                'domain'      => $domain
            ) )
        ) );

        if ( is_wp_error( $response ) ) {
            error_log( '[Newslan AI] License API Error: ' . $response->get_error_message() );
            // Fail silently if server is down, but maybe don't invalidate local status immediately
            // For security, strictly return false or use a grace period
            return false;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code === 200 && isset( $body['success'] ) && $body['success'] === true ) {
            update_option( $this->status_option, 'valid' );
            set_transient( 'newslan_license_check', 'valid', 12 * HOUR_IN_SECONDS );
            return true;
        }

        // Invalid license
        update_option( $this->status_option, 'invalid' );
        set_transient( 'newslan_license_check', 'invalid', 12 * HOUR_IN_SECONDS );
        return false;
    }
}
