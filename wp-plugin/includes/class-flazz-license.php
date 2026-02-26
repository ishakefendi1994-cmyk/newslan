<?php
/**
 * Licensed Guard System
 */
class FZ_Auth_Guard {

    private static $_i = null;
    private $_o1 = 'flazz_ai_license_key';
    private $_o2 = 'flazz_ai_license_status';

    public static function i() {
        if ( is_null( self::$_i ) ) {
            self::$_i = new self();
        }
        return self::$_i;
    }

    private function __construct() {
        add_action( 'update_option_' . $this->_o1, array( $this, 'u' ), 10, 2 );
    }

    public function u( $ov, $nv ) {
        if ( $ov !== $nv ) {
            delete_transient( 'fz_l_st' );
            $this->s( $nv );
        }
    }

    private function _ep() {
        // Obfuscated endpoint
        return base64_decode('aHR0cHM6Ly93d3cuY3J5cHRvdGVjaG5ld3MubmV0L2FwaS9saWNlbnNlL3ZlcmlmeQ==');
    }

    /**
     * Integrity Check
     */
    public function v() {
        $k = get_option( $this->_o1 );
        if ( empty( $k ) ) return false;

        $c = get_transient( 'fz_l_st' );
        if ( $c !== false ) {
            return $c === '1';
        }

        return $this->s( $k );
    }

    /**
     * Remote Sync
     */
    public function s( $k ) {
        $d = isset( $_SERVER['HTTP_HOST'] ) ? $_SERVER['HTTP_HOST'] : '';
        
        $r = wp_remote_post( $this->_ep(), array(
            'timeout' => 15,
            'headers' => array( 'Content-Type' => 'application/json' ),
            'body'    => json_encode( array(
                'license_key' => $k,
                'domain'      => $d
            ) )
        ) );

        if ( is_wp_error( $r ) ) {
            error_log( '[Flazz AI] License Sync WP_Error: ' . $r->get_error_message() );
            return false;
        }

        $sc = wp_remote_retrieve_response_code( $r );
        $bd = json_decode( wp_remote_retrieve_body( $r ), true );

        if ( $sc === 200 && isset( $bd['success'] ) && $bd['success'] === true ) {
            update_option( $this->_o2, 'valid' );
            
            if ( isset( $bd['data'] ) ) {
                update_option( 'flazz_ai_license_info', $bd['data'] );
                if ( isset( $bd['data']['site_access_token'] ) ) {
                    update_option( 'flazz_ai_site_access_token', sanitize_text_field( $bd['data']['site_access_token'] ) );
                }
            }

            set_transient( 'fz_l_st', '1', 12 * HOUR_IN_SECONDS );
            return true;
        }

        update_option( $this->_o2, 'invalid' );
        delete_option( 'flazz_ai_license_info' );
        delete_option( 'flazz_ai_site_access_token' );
        set_transient( 'fz_l_st', '0', 12 * HOUR_IN_SECONDS );
        return false;
    }

    /**
     * Data Retrieval
     */
    public function g() {
        return get_option( 'flazz_ai_license_info', array() );
    }
}
