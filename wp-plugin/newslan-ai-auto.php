<?php
/**
 * Plugin Name: Newslan AI Auto & RSS Grabber
 * Plugin URI: https://newslan.id
 * Description: Automated news grabbing from RSS feeds with AI rewriting and auto-posting features. Includes license management.
 * Version: 1.0.2
 * Author: Newslan Team
 * License: Commercial
 * Text Domain: newslan-ai-auto
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Define Constants
define( 'NEWSLAN_AI_VERSION', '1.0.4' );
define( 'NEWSLAN_AI_PATH', plugin_dir_path( __FILE__ ) );
define( 'NEWSLAN_AI_URL', plugin_dir_url( __FILE__ ) );

// Check PHP Version
if ( version_compare( PHP_VERSION, '7.4', '<' ) ) {
    add_action( 'admin_notices', function() {
        echo '<div class="notice notice-error"><p>Newslan AI requires at least PHP 7.4. Your server is running ' . PHP_VERSION . '.</p></div>';
    });
    return;
}

/**
 * Main Plugin Class
 */
class Newslan_AI_Auto {

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
        require_once NEWSLAN_AI_PATH . 'includes/class-newslan-license.php';
        require_once NEWSLAN_AI_PATH . 'includes/class-newslan-grabber.php';
        require_once NEWSLAN_AI_PATH . 'includes/class-newslan-ai.php';
        require_once NEWSLAN_AI_PATH . 'includes/class-newslan-image.php';
        require_once NEWSLAN_AI_PATH . 'includes/class-newslan-cron.php';
        require_once NEWSLAN_AI_PATH . 'includes/class-newslan-job-engine.php';
        require_once NEWSLAN_AI_PATH . 'admin/class-newslan-admin.php';
    }

    private function init_hooks() {
        register_activation_hook( __FILE__, array( $this, 'activate_plugin' ) );
    }

    public function init_components() {
        Newslan_Admin::get_instance();
        Newslan_Cron_Manager::get_instance();
        Newslan_Job_Engine::get_instance();
    }

    public function activate_plugin() {
        if ( ! get_option( 'newslan_ai_license_key' ) ) {
            update_option( 'newslan_ai_license_key', '' );
        }
    }
}

// Initialize the plugin
Newslan_AI_Auto::get_instance();
