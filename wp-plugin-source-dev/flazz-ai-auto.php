<?php
/**
 * Plugin Name: Flazz AI Auto & RSS Grabber
 * Plugin URI: https://www.cryptotechnews.net
 * Description: Automated news grabbing from RSS feeds with AI rewriting and auto-posting features. Powered by Flazz AI Cloud.
 * Version: 1.1.1
 * Author: Flazz Team
 * License: Commercial
 * Text Domain: flazz-ai-auto
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Define Constants
define( 'FLAZZ_AI_VERSION', '1.1.1' );
define( 'FLAZZ_AI_PATH', plugin_dir_path( __FILE__ ) );
define( 'FLAZZ_AI_URL', plugin_dir_url( __FILE__ ) );

// Check PHP Version
if ( version_compare( PHP_VERSION, '7.4', '<' ) ) {
    add_action( 'admin_notices', function() {
        echo '<div class="notice notice-error"><p>Flazz AI requires at least PHP 7.4. Your server is running ' . PHP_VERSION . '.</p></div>';
    });
    return;
}

/**
 * Main Plugin Class
 */
class Flazz_AI_Auto {

    private static $instance = null;

    public static function get_instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->load_dependencies();
        $this->init_components();
        $this->init_hooks();
    }

    private function load_dependencies() {
        require_once FLAZZ_AI_PATH . 'includes/class-flazz-license.php';
        require_once FLAZZ_AI_PATH . 'includes/class-flazz-grabber.php';
        require_once FLAZZ_AI_PATH . 'includes/class-flazz-ai.php';
        require_once FLAZZ_AI_PATH . 'includes/class-flazz-image.php';
        require_once FLAZZ_AI_PATH . 'includes/class-flazz-cron.php';
        require_once FLAZZ_AI_PATH . 'includes/class-flazz-job-engine.php';
        require_once FLAZZ_AI_PATH . 'admin/class-flazz-admin.php';
    }

    private function init_hooks() {
        register_activation_hook( __FILE__, array( $this, 'activate_plugin' ) );
    }

    public function init_components() {
        Flazz_Admin::get_instance();
        Flazz_Cron_Manager::get_instance();
        Flazz_Job_Engine::get_instance();
    }

    public function activate_plugin() {
        if ( ! get_option( 'flazz_ai_license_key' ) ) {
            update_option( 'flazz_ai_license_key', '' );
        }
    }
}

// Initialize the plugin
Flazz_AI_Auto::get_instance();
