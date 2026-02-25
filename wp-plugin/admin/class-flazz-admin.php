<?php
/**
 * Handle Plugin Admin UI
 */

// Increase memory limit for heavy processing
@ini_set( 'memory_limit', '256M' );

class Flazz_Admin {

    private static $instance = null;

    public static function get_instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'admin_menu', array( $this, 'add_menu_page' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );

        // AJAX Handlers
        add_action( 'wp_ajax_flazz_save_job',        array( $this, 'ajax_save_job' ) );
        add_action( 'wp_ajax_flazz_delete_job',      array( $this, 'ajax_delete_job' ) );
        add_action( 'wp_ajax_flazz_run_job',         array( $this, 'ajax_run_job' ) );
        add_action( 'wp_ajax_flazz_test_api',        array( $this, 'ajax_test_api' ) );
        add_action( 'wp_ajax_flazz_manual_fetch',    array( $this, 'ajax_manual_fetch' ) );
        add_action( 'wp_ajax_flazz_research_keyword', array( $this, 'ajax_research_keyword' ) );
        add_action( 'wp_ajax_flazz_test_ai_image', array( $this, 'ajax_test_ai_image' ) );
        add_action( 'wp_ajax_flazz_get_trends', array( $this, 'ajax_get_trends' ) );
    }

    // =========================================================================
    // MENU & SETTINGS
    // =========================================================================

    public function add_menu_page() {
        require_once plugin_dir_path( __FILE__ ) . '../includes/class-flazz-license.php';
        $license_valid = Flazz_License_Manager::get_instance()->is_valid();

        $main_page = $license_valid ? 'render_jobs_page' : 'render_settings_page';
        $main_slug = $license_valid ? 'flazz-ai' : 'flazz-settings';

        // Main Menu
        add_menu_page( 'Flazz AI', 'Flazz AI', 'manage_options', 'flazz-ai',
            array( $this, $main_page ), 'dashicons-rss', 30 );

        if ( $license_valid ) {
            add_submenu_page( 'flazz-ai', 'Auto-Jobs Manager', 'Auto-Jobs', 'manage_options',
                'flazz-ai', array( $this, 'render_jobs_page' ) );

            add_submenu_page( 'flazz-ai', 'Manual Fetch & Tools', 'Manual Tools', 'manage_options',
                'flazz-manual-tools', array( $this, 'render_manual_tools_page' ) );
        }

        add_submenu_page( 'flazz-ai', 'Global Settings', 'Settings', 'manage_options',
            'flazz-settings', array( $this, 'render_settings_page' ) );

        add_submenu_page( 'flazz-ai', '📖 Panduan & Dokumentasi', 'Dokumentasi', 'manage_options',
            'flazz-docs', array( $this, 'render_documentation_page' ) );
    }

    public function register_settings() {
        $options = array(
            'flazz_ai_license_key', 'flazz_ai_groq_key', 'flazz_ai_replicate_token',
            'flazz_ai_rss_source_preset', 'flazz_ai_rss_feed_url', 'flazz_ai_fetch_limit',
            'flazz_ai_image_mode', 'flazz_ai_writing_style', 'flazz_ai_article_model',
            'flazz_ai_pixabay_key',
            'flazz_ai_telegram_token', 'flazz_ai_telegram_chat_id',
            'flazz_ai_text_model', 'flazz_ai_image_model'
        );
        foreach ( $options as $opt ) {
            register_setting( 'flazz_ai_settings', $opt );
        }
    }

    public function enqueue_admin_scripts( $hook ) {
        $pages = array( 'flazz-ai', 'flazz-manual-tools', 'flazz-settings' );
        $found = false;
        foreach ( $pages as $p ) {
            if ( strpos( $hook, $p ) !== false ) { $found = true; break; }
        }
        if ( ! $found ) return;

        wp_enqueue_script( 'flazz-admin-js', FLAZZ_AI_URL . 'admin/admin.js',
            array( 'jquery' ), FLAZZ_AI_VERSION, true );
        wp_localize_script( 'flazz-admin-js', 'flazzData', array(
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'flazz_admin_nonce' ),
        ) );
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private function log( $msg ) {
        error_log( '[Flazz AI] ' . $msg );
    }

    private function check_permission() {
        check_ajax_referer( 'flazz_admin_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }
    }

    private function check_license() {
        require_once plugin_dir_path( __FILE__ ) . '../includes/class-flazz-license.php';
        if ( ! Flazz_License_Manager::get_instance()->is_valid() ) {
            wp_send_json_error( 'Lisensi tidak valid atau sudah kadaluarsa. Silakan periksa tab Pengaturan.' );
        }
    }

    // =========================================================================
    // HELPER: Telegram Notification
    // =========================================================================

    private function send_telegram( $post_id, $title, $url ) {
        $token   = get_option( 'flazz_ai_telegram_token', '' );
        $chat_id = get_option( 'flazz_ai_telegram_chat_id', '' );

        if ( empty( $token ) || empty( $chat_id ) ) return;

        $text = "📰 *Artikel Baru Terbit!*\n\n" .
                "*" . esc_html( $title ) . "*\n\n" .
                "🔗 [Baca Selengkapnya]({$url})\n\n" .
                "_Dikirim oleh Flazz AI_";

        wp_remote_post( "https://api.telegram.org/bot{$token}/sendMessage", array(
            'body' => array(
                'chat_id'    => $chat_id,
                'text'       => $text,
                'parse_mode' => 'Markdown',
            ),
            'timeout' => 10,
        ) );

        $this->log( 'send_telegram: sent for post_id=' . $post_id );
    }


    private function create_wp_post_direct( $data, $source_url, $image_url ) {
        // Apply internal linking before post creation
        $job_engine = Flazz_Job_Engine::get_instance();
        $content_with_links = $job_engine->add_internal_links( $data['content'], $data['title'] );

        $post_id = wp_insert_post( array(
            'post_title'   => $data['title'],
            'post_content' => $content_with_links,
            'post_status'  => 'publish',
            'post_author'  => 1,
            'post_type'    => 'post',
        ) );

        if ( $post_id && ! is_wp_error( $post_id ) ) {
            update_post_meta( $post_id, '_flazz_source_url', $source_url );

            // ── AI Enrichment (SEO, Tags, Taxonomy, Telegram) ───────────────────
            $target_cat_raw = isset( $_POST['category'] ) ? $_POST['category'] : 'auto';
            $job_engine->enrich_post( $post_id, $data['title'], $data['content'], ($target_cat_raw === 'auto') );

            if ( ! empty( $image_url ) ) {
                require_once ABSPATH . 'wp-admin/includes/image.php';
                require_once ABSPATH . 'wp-admin/includes/file.php';
                require_once ABSPATH . 'wp-admin/includes/media.php';

                // Coba sideload langsung dulu
                $att_id = media_sideload_image( $image_url, $post_id, $data['title'], 'id' );

                // Jika gagal (misal Pixabay blocked tanpa Referer), download manual lalu sideload dari temp file
                if ( is_wp_error( $att_id ) ) {
                    $this->log( 'create_wp_post_direct: sideload failed (' . $att_id->get_error_message() . '), trying manual download...' );

                    $img_resp = wp_remote_get( $image_url, array(
                        'timeout' => 15,
                        'headers' => array(
                            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Referer'    => 'https://pixabay.com/',
                            'Accept'     => 'image/webp,image/apng,image/*,*/*',
                        ),
                    ) );

                    if ( ! is_wp_error( $img_resp ) && wp_remote_retrieve_response_code( $img_resp ) === 200 ) {
                        // Determine file extension from URL or content-type
                        $content_type = wp_remote_retrieve_header( $img_resp, 'content-type' );
                        $ext = 'jpg';
                        if ( strpos( $content_type, 'png' ) !== false )  $ext = 'png';
                        if ( strpos( $content_type, 'webp' ) !== false ) $ext = 'webp';
                        if ( strpos( $content_type, 'gif' ) !== false )  $ext = 'gif';

                        // Save to temp file
                        $tmp_file = wp_tempnam( 'flazz_img.' . $ext );
                        file_put_contents( $tmp_file, wp_remote_retrieve_body( $img_resp ) );

                        // Build file array for wp_handle_sideload
                        $file_array = array(
                            'name'     => 'flazz-' . $post_id . '.' . $ext,
                            'tmp_name' => $tmp_file,
                        );
                        $att_id = media_handle_sideload( $file_array, $post_id, $data['title'] );

                        if ( is_wp_error( $att_id ) ) {
                            $this->log( 'create_wp_post_direct: manual sideload also failed: ' . $att_id->get_error_message() );
                        } else {
                            $this->log( 'create_wp_post_direct: manual download sideload OK, att_id=' . $att_id );
                        }
                    } else {
                        $this->log( 'create_wp_post_direct: manual download failed, HTTP=' . wp_remote_retrieve_response_code( $img_resp ) );
                    }
                }

                if ( ! is_wp_error( $att_id ) && $att_id ) {
                    set_post_thumbnail( $post_id, $att_id );
                    $this->log( 'create_wp_post_direct: featured image set, att_id=' . $att_id );
                }
            }
        }

        // ── Auto-enrich: SEO Meta + Telegram ─────────────────────────────────
        if ( $post_id && ! is_wp_error( $post_id ) ) {
            $post_url = get_permalink( $post_id );
            // Fire-and-forget (non-blocking for the user)
            $this->generate_and_save_seo_meta( $post_id, $data['title'], $data['content'] );
            $this->send_telegram( $post_id, $data['title'], $post_url );
        }
        return $post_id;
    }


    /**
     * Search Pixabay API for a photo related to a query.
     * Requires: flazz_ai_pixabay_key in Settings.
     * Free API key at: https://pixabay.com/api/docs/ (register + get key instantly)
     *
     * @param  string $query  Search query (article title or keyword)
     * @return string|false   Direct image URL or false on failure
     */
    private function fetch_pixabay_image( $query ) {
        $api_key = get_option( 'flazz_ai_pixabay_key', '' );

        if ( empty( $api_key ) ) {
            $this->log( 'fetch_pixabay_image: Pixabay API key not set.' );
            return false;
        }

        // Ambil 3 kata pertama dari judul untuk query yang lebih relevan
        $words   = explode( ' ', $query );
        $q_short = implode( ' ', array_slice( $words, 0, 5 ) );

        $url = 'https://pixabay.com/api/?' . http_build_query( array(
            'key'          => $api_key,
            'q'            => $q_short,
            'image_type'   => 'photo',
            'orientation'  => 'horizontal',
            'category'     => 'news',
            'min_width'    => 800,
            'safesearch'   => 'true',
            'per_page'     => 5,
            'lang'         => 'id',
        ) );

        $this->log( 'fetch_pixabay_image: query = ' . $q_short );

        $resp = wp_remote_get( $url, array( 'timeout' => 10 ) );

        if ( is_wp_error( $resp ) ) {
            $this->log( 'fetch_pixabay_image: error = ' . $resp->get_error_message() );
            return false;
        }

        $code = wp_remote_retrieve_response_code( $resp );
        if ( $code !== 200 ) {
            $this->log( 'fetch_pixabay_image: HTTP ' . $code );
            return false;
        }

        $data = json_decode( wp_remote_retrieve_body( $resp ), true );

        // Coba ambil gambar kategori 'news', kalau kosong retry tanpa category filter
        if ( empty( $data['hits'] ) ) {
            $url2 = 'https://pixabay.com/api/?' . http_build_query( array(
                'key'         => $api_key,
                'q'           => $q_short,
                'image_type'  => 'photo',
                'orientation' => 'horizontal',
                'min_width'   => 800,
                'safesearch'  => 'true',
                'per_page'    => 5,
            ) );
            $resp2 = wp_remote_get( $url2, array( 'timeout' => 10 ) );
            if ( ! is_wp_error( $resp2 ) && wp_remote_retrieve_response_code( $resp2 ) === 200 ) {
                $data = json_decode( wp_remote_retrieve_body( $resp2 ), true );
            }
        }

        if ( ! empty( $data['hits'][0]['largeImageURL'] ) ) {
            $img = $data['hits'][0]['largeImageURL'];
            $this->log( 'fetch_pixabay_image: Found = ' . $img );
            return $img;
        }

        $this->log( 'fetch_pixabay_image: No results for query: ' . $q_short );
        return false;
    }



    public function ajax_test_ai_image() {
        check_ajax_referer( 'flazz_admin_nonce', 'nonce' );
        $this->log( 'ajax_test_ai_image: START' );
        $this->check_permission();
        
        $prompt = isset( $_POST['prompt'] ) ? sanitize_text_field( $_POST['prompt'] ) : '';
        if ( empty( $prompt ) ) {
            $this->log( 'ajax_test_ai_image: prompt empty' );
            wp_send_json_error( 'Prompt tidak boleh kosong.' );
        }

        $token    = get_option( 'flazz_ai_replicate_token' );
        $license  = get_option( 'flazz_ai_license_key' );

        $this->log( 'ajax_test_ai_image: token_len=' . strlen($token) . ' license=' . $license );

        if ( empty( $token ) ) {
            $this->log( 'ajax_test_ai_image: token missing' );
            wp_send_json_error( 'Replicate API Token belum diisi.' );
        }

        require_once plugin_dir_path( __FILE__ ) . '../includes/class-flazz-image.php';
        $generator = Flazz_Image_Generator::get_instance();
        $style     = get_option( 'flazz_ai_image_mode', 'standard' );
        
        $this->log( 'ajax_test_ai_image: triggering generate_image_via_cloud with style=' . $style );
        $image_url = $generator->generate_image_via_cloud( $prompt, $style, $token, $license );

        if ( $image_url ) {
            $this->log( 'ajax_test_ai_image: SUCCESS, url=' . $image_url );
            wp_send_json_success( $image_url );
        } else {
            $err = $generator->get_last_error();
            $this->log( 'ajax_test_ai_image: FAILED. Error: ' . $err );
            wp_send_json_error( 'Gagal generate gambar: ' . $err );
        }
    }

    // =========================================================================
    // AJAX: Test API
    // =========================================================================

    public function ajax_test_api() {
        check_ajax_referer( 'flazz_admin_nonce', 'nonce' );
        $this->log( 'ajax_test_api: START' );
        $this->check_permission();

        try {
            $api_key = get_option( 'flazz_ai_groq_key', '' );
            $license = get_option( 'flazz_ai_license_key', '' );

            if ( empty( $api_key ) ) {
                wp_send_json_error( 'API Key (Groq) belum diisi di Settings.' );
            }

            // Test via cloud orchestrator (Saas transition)
            $api_url = 'https://www.cryptotechnews.net/api/ai/orchestrator';
            $token   = get_option( 'flazz_ai_site_access_token' );

            $response = wp_remote_post( $api_url, array(
                'headers' => array( 
                    'Content-Type'  => 'application/json',
                    'X-Flazz-Token' => $token
                ),
                'body'    => json_encode( array(
                    'action'      => 'rewrite',
                    'license_key' => $license,
                    'domain'      => parse_url( home_url(), PHP_URL_HOST ),
                    'api_key'     => $api_key,
                    'payload'     => array(
                        'title'   => 'Test Sync',
                        'content' => 'Keep it short',
                        'style'   => 'Professional',
                        'model'   => 'Straight News'
                    )
                )),
                'timeout' => 30,
            ) );

            if ( is_wp_error( $response ) ) {
                wp_send_json_error( 'WP_Error: ' . $response->get_error_message() );
            }

            $code = wp_remote_retrieve_response_code( $response );
            $body = json_decode( wp_remote_retrieve_body( $response ), true );
            $this->log( 'ajax_test_api: code = ' . $code );

            if ( $code === 200 && isset( $body['success'] ) && $body['success'] === true ) {
                wp_send_json_success( 'Koneksi Cloud Orchestrator BERHASIL! Brain AI aktif.' );
            } else {
                $err  = isset( $body['message'] ) ? $body['message'] : 'HTTP ' . $code;
                wp_send_json_error( 'Orchestrator Error: ' . $err );
            }
        } catch ( Exception $e ) {
            $this->log( 'ajax_test_api: Exception = ' . $e->getMessage() );
            wp_send_json_error( 'Exception: ' . $e->getMessage() );
        }
    }

    // =========================================================================
    // AJAX: Save / Delete / Run Job
    // =========================================================================

    public function ajax_save_job() {
        $this->log( 'ajax_save_job: START' );
        $this->check_permission();
        $this->check_license();

        try {
            $job_engine = Flazz_Job_Engine::get_instance();
            $post_id    = $job_engine->create_job( $_POST );

            if ( $post_id ) {
                wp_send_json_success( 'Job berhasil disimpan.' );
            } else {
                wp_send_json_error( 'Gagal menyimpan Job.' );
            }
        } catch ( Exception $e ) {
            $this->log( 'ajax_save_job: Exception = ' . $e->getMessage() );
            wp_send_json_error( 'Exception: ' . $e->getMessage() );
        }
    }

    public function ajax_delete_job() {
        check_ajax_referer( 'flazz_admin_nonce', 'nonce' );
        $this->log( 'ajax_delete_job: START' );
        $this->check_permission();

        try {
            $job_id     = isset( $_POST['job_id'] ) ? intval( $_POST['job_id'] ) : 0;
            $job_engine = Flazz_Job_Engine::get_instance();

            if ( $job_engine->delete_job( $job_id ) ) {
                wp_send_json_success( 'Job dihapus.' );
            } else {
                wp_send_json_error( 'Gagal menghapus Job.' );
            }
        } catch ( Exception $e ) {
            $this->log( 'ajax_delete_job: Exception = ' . $e->getMessage() );
            wp_send_json_error( 'Exception: ' . $e->getMessage() );
        }
    }

    public function ajax_run_job() {
        check_ajax_referer( 'flazz_admin_nonce', 'nonce' );
        $this->log( 'ajax_run_job: START' );
        $this->check_permission();
        $this->check_license();

        @set_time_limit( 0 );
        @ignore_user_abort( true );

        try {
            $job_id = isset( $_POST['job_id'] ) ? intval( $_POST['job_id'] ) : 0;
            $this->log( 'ajax_run_job: job_id = ' . $job_id );

            if ( ! $job_id ) {
                wp_send_json_error( 'Job ID tidak valid.' );
            }

            $job_engine = Flazz_Job_Engine::get_instance();
            $result     = $job_engine->run_job( $job_id );

            $this->log( 'ajax_run_job: result = ' . print_r( $result, true ) );

            if ( is_string( $result ) && strpos( $result, 'Berhasil' ) !== false ) {
                wp_send_json_success( $result );
            } else {
                wp_send_json_error( is_string( $result ) ? $result : 'Error tidak diketahui.' );
            }
        } catch ( Exception $e ) {
            $this->log( 'ajax_run_job: Exception = ' . $e->getMessage() );
            wp_send_json_error( 'Exception: ' . $e->getMessage() );
        }
    }

    // =========================================================================
    // AJAX: Manual Fetch (RSS)
    // =========================================================================

    public function ajax_manual_fetch() {
        check_ajax_referer( 'flazz_admin_nonce', 'nonce' );
        $this->log( 'ajax_manual_fetch: START' );
        $this->check_permission();
        $this->check_license();

        @set_time_limit( 0 );
        @ignore_user_abort( true );

        try {
            $rss_url_override = isset( $_POST['rss_url'] ) ? esc_url_raw( trim( $_POST['rss_url'] ) ) : '';
            $this->log( 'ajax_manual_fetch: url = "' . $rss_url_override . '"' );

            $cron_manager = Flazz_Cron_Manager::get_instance();
            $stats        = $cron_manager->grab_rss_and_process( $rss_url_override );

            $this->log( 'ajax_manual_fetch: total=' . $stats['total'] . ' processed=' . $stats['processed'] . ' errors=' . $stats['errors'] );

            if ( $stats['total'] === 0 ) {
                $err = ! empty( $stats['last_error'] ) ? ' (' . $stats['last_error'] . ')' : '';
                wp_send_json_error( 'Tidak ada berita ditemukan' . $err . '. Pastikan URL RSS benar.' );
            }

            $message = sprintf(
                'Selesai! %d berita ditemukan: %d sudah ada, %d diproses, %d error.',
                $stats['total'], $stats['skipped'], $stats['processed'], $stats['errors']
            );

            if ( $stats['errors'] > 0 && ! empty( $stats['last_error'] ) ) {
                $message .= ' Pesan: ' . $stats['last_error'];
            }

            wp_send_json_success( $message );

        } catch ( Exception $e ) {
            $this->log( 'ajax_manual_fetch: Exception = ' . $e->getMessage() );
            wp_send_json_error( 'Exception: ' . $e->getMessage() );
        }
    }

    // =========================================================================
    // AJAX: Research by Keyword (Google News RSS → AI Synthesize → Post)
    // =========================================================================

    public function ajax_get_trends() {
        check_ajax_referer( 'flazz_admin_nonce', 'nonce' );
        $this->check_permission();

        $geo = isset( $_POST['geo'] ) ? sanitize_text_field( $_POST['geo'] ) : 'ID';
        $api_url = 'https://www.cryptotechnews.net/api/ai/orchestrator';
        $token   = get_option( 'flazz_ai_site_access_token' );

        $response = wp_remote_post( $api_url, array(
            'headers' => array( 
                'Content-Type'  => 'application/json',
                'X-Flazz-Token' => $token
            ),
            'body'    => json_encode( array(
                'action'      => 'get_trends',
                'license_key' => get_option( 'flazz_ai_license_key' ),
                'domain'      => parse_url( home_url(), PHP_URL_HOST ),
                'payload'     => array( 'geo' => $geo )
            )),
            'timeout' => 30
        ));

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( $response->get_error_message() );
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( isset( $body['success'] ) && $body['success'] === true ) {
            wp_send_json_success( $body['data'] );
        }

        wp_send_json_error( isset( $body['message'] ) ? $body['message'] : 'Failed to fetch trends' );
    }

    public function ajax_research_keyword() {
        check_ajax_referer( 'flazz_admin_nonce', 'nonce' );
        $this->log( 'ajax_research_keyword: START' );
        $this->check_permission();
        $this->check_license();

        @set_time_limit( 0 );
        @ignore_user_abort( true );
        @ini_set( 'memory_limit', '256M' );

        try {
            $keyword = isset( $_POST['keyword'] ) ? sanitize_text_field( $_POST['keyword'] ) : '';

            if ( empty( $keyword ) ) {
                wp_send_json_error( 'Keyword tidak boleh kosong.' );
            }

            $this->log( 'ajax_research_keyword: keyword = ' . $keyword );

            // ── STEP 1: Fetch Google News RSS (direct HTTP, no SimplePie) ────────────
            $search_url = 'https://news.google.com/rss/search?q=' . urlencode( $keyword ) . '&hl=id&gl=ID&ceid=ID:id';
            $this->log( 'ajax_research_keyword: Fetching = ' . $search_url );

            $rss_response = wp_remote_get( $search_url, array(
                'timeout'   => 20,
                'sslverify' => false,
                'headers'   => array(
                    'User-Agent' => 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                ),
            ) );

            if ( is_wp_error( $rss_response ) ) {
                wp_send_json_error( 'Gagal menghubungi Google News: ' . $rss_response->get_error_message() );
            }

            $code     = wp_remote_retrieve_response_code( $rss_response );
            $xml_body = wp_remote_retrieve_body( $rss_response );
            $this->log( 'ajax_research_keyword: HTTP ' . $code . ', body_len = ' . strlen( $xml_body ) );

            if ( $code !== 200 || empty( $xml_body ) ) {
                wp_send_json_error( 'Google News mengembalikan HTTP ' . $code . '. Coba lagi nanti.' );
            }

            // ── STEP 2: Parse XML (SimpleXML — lightweight, no memory bloat) ─────────
            if ( ! function_exists( 'simplexml_load_string' ) ) {
                wp_send_json_error( 'Server tidak memiliki ekstensi SimpleXML.' );
            }

            libxml_use_internal_errors( true );
            $xml = simplexml_load_string( $xml_body );
            libxml_clear_errors();

            if ( ! $xml || ! isset( $xml->channel->item ) ) {
                wp_send_json_error( 'Format RSS tidak valid atau tidak ada artikel.' );
            }

            // ── STEP 3: Use RSS descriptions + media namespace images (NO scraping) ─
            // Google News RSS embeds article summaries in <description>
            // and images in <media:content> / <media:thumbnail> elements
            $source_contents = array();
            $first_image     = '';

            foreach ( $xml->channel->item as $item ) {
                if ( count( $source_contents ) >= 4 ) break;

                $title       = (string) $item->title;
                $link        = (string) $item->link;
                $description = (string) $item->description;
                $source_name = isset( $item->source ) ? (string) $item->source : 'Google News';
                $pub_date    = isset( $item->pubDate ) ? (string) $item->pubDate : '';

                // ── Try to get image from media namespace ──────────────────────────
                $item_image = '';

                // Method A: media:content url="..." (most common in Google News RSS)
                $media = $item->children( 'http://search.yahoo.com/mrss/' );
                if ( ! empty( $media->content ) ) {
                    $attrs = $media->content->attributes();
                    if ( ! empty( $attrs['url'] ) ) {
                        $item_image = (string) $attrs['url'];
                    }
                }
                // Method B: media:thumbnail
                if ( empty( $item_image ) && ! empty( $media->thumbnail ) ) {
                    $t_attrs = $media->thumbnail->attributes();
                    if ( ! empty( $t_attrs['url'] ) ) {
                        $item_image = (string) $t_attrs['url'];
                    }
                }
                // Method C: extract <img> tag from description HTML
                if ( empty( $item_image ) && preg_match( '/<img[^>]+src=["\']([^"\']+)["\']/', $description, $img_m ) ) {
                    $item_image = $img_m[1];
                }

                if ( ! empty( $item_image ) && empty( $first_image ) ) {
                    $first_image = $item_image;
                }

                // Strip HTML from description text
                $clean_desc = wp_strip_all_tags( html_entity_decode( $description, ENT_QUOTES, 'UTF-8' ) );
                $clean_desc = trim( preg_replace( '/\s+/', ' ', $clean_desc ) );

                // Clean title (Google News appends "- Source Name")
                $clean_title = preg_replace( '/\s*[-–]\s*[^-–]+$/', '', $title );
                $clean_title = trim( $clean_title ) ?: $title;

                if ( strlen( $clean_desc ) < 30 ) {
                    $clean_desc = $clean_title . '. Dipublikasikan oleh ' . $source_name . '.';
                }

                $source_contents[] = array(
                    'title'      => $clean_title,
                    'content'    => $clean_desc,
                    'sourceName' => $source_name,
                    'link'       => $link,
                    'date'       => $pub_date,
                    'image'      => $item_image,
                );

                $this->log( 'ajax_research_keyword: Added "' . $clean_title . '" len=' . strlen( $clean_desc ) . ' img=' . ( $item_image ? 'YES' : 'none' ) );
            }


            if ( empty( $source_contents ) ) {
                wp_send_json_error( 'Tidak ada berita ditemukan untuk keyword: "' . $keyword . '"' );
            }

            $this->log( 'ajax_research_keyword: ' . count( $source_contents ) . ' sources ready for AI' );

            // ── STEP 4: Synthesize with AI ────────────────────────────────────────────
            $ai_writer   = Flazz_AI_Writer::get_instance();
            $style       = isset( $_POST['writing_style'] ) ? sanitize_text_field( $_POST['writing_style'] ) : get_option( 'flazz_ai_writing_style', 'Professional' );
            $model       = isset( $_POST['article_model'] ) ? sanitize_text_field( $_POST['article_model'] ) : get_option( 'flazz_ai_article_model', 'Straight News' );
            $image_mode       = isset( $_POST['image_mode'] ) ? sanitize_text_field( $_POST['image_mode'] ) : 'rss';
            $thumbnail_style  = isset( $_POST['thumbnail_style'] ) ? sanitize_text_field( $_POST['thumbnail_style'] ) : 'editorial_vector';
            $this->log( 'ajax_research_keyword: style=' . $style . ' model=' . $model . ' image_mode=' . $image_mode . ' thumb_style=' . $thumbnail_style );

            $synthesis = $ai_writer->synthesize_from_multiple_sources( $source_contents, $style, $model, $target_language );

            if ( ! $synthesis ) {
                $err = $ai_writer->get_last_error();
                $this->log( 'ajax_research_keyword: Synthesis FAILED = ' . $err );
                wp_send_json_error( 'AI Gagal: ' . ( $err ?: 'Tidak ada respons dari Groq.' ) );
            }

            $this->log( 'ajax_research_keyword: Synthesis OK — ' . $synthesis['title'] );

            // ── STEP 5: Get Featured Image ────────────────────────────────────────────
            $final_image = '';

            if ( $image_mode === 'generate_ai' ) {
                // Generate a fresh image via Replicate + Groq prompt
                $this->log( 'ajax_research_keyword: Generating AI image via Replicate (style: ' . $thumbnail_style . ')...' );
                $img_gen   = Flazz_Image_Generator::get_instance();
                $generated = $img_gen->generate_article_image( $synthesis['title'], $synthesis['content'], $thumbnail_style );
                if ( $generated ) {
                    $final_image = $generated;
                    $this->log( 'ajax_research_keyword: AI image OK = ' . $final_image );
                } else {
                    $this->log( 'ajax_research_keyword: AI image generation failed.' );
                }

            } elseif ( $image_mode === 'rss' || $image_mode === 'pixabay' ) {

                $first_sc = ! empty( $source_contents[0] ) ? $source_contents[0] : array();

                // Langkah 1: media:content / media:thumbnail dari RSS (hanya untuk mode 'rss')
                if ( $image_mode === 'rss' && ! empty( $first_sc['image'] ) ) {
                    $final_image = $first_sc['image'];
                    $this->log( 'image: Got from RSS media namespace = ' . $final_image );
                }

                // Langkah 2: coba og:image dari URL artikel pertama (hanya untuk mode 'rss')
                if ( $image_mode === 'rss' && empty( $final_image ) && ! empty( $first_sc['link'] ) ) {
                    $article_url = $first_sc['link'];
                    $parsed = parse_url( $article_url );
                    if ( ! empty( $parsed['query'] ) ) {
                        parse_str( $parsed['query'], $qp );
                        if ( ! empty( $qp['url'] ) ) $article_url = $qp['url'];
                    }
                    $grabber = Flazz_Grabber::get_instance();
                    $og      = $grabber->fetch_og_image( $article_url );
                    if ( $og ) {
                        $final_image = $og;
                        $this->log( 'image: Got og:image = ' . $final_image );
                    }
                }

                // Langkah 3: Pixabay Image Search (fallback untuk rss, atau mode eksplisit pixabay)
                if ( empty( $final_image ) ) {
                    $this->log( 'image: Trying Pixabay Image Search...' );
                    $search_q     = ! empty( $synthesis['title'] ) ? $synthesis['title'] : $keyword;
                    $pixabay_img  = $this->fetch_pixabay_image( $search_q );
                    if ( $pixabay_img ) {
                        $final_image = $pixabay_img;
                        $this->log( 'image: Got Pixabay image = ' . $final_image );
                    } else {
                        $this->log( 'image: Pixabay failed — posting without image.' );
                    }
                }
            }
            // image_mode === 'none': $final_image stays empty






            // ── STEP 6: Post to WordPress ─────────────────────────────────────────────
            $source_link = ! empty( $source_contents[0]['link'] ) ? $source_contents[0]['link'] : '';
            $this->create_wp_post_direct( $synthesis, $source_link, $final_image );

            wp_send_json_success( 'Berhasil! Artikel "' . esc_html( $synthesis['title'] ) . '" sudah diposting.' );

        } catch ( Exception $e ) {
            $this->log( 'ajax_research_keyword: Exception = ' . $e->getMessage() );
            wp_send_json_error( 'PHP Exception: ' . $e->getMessage() );
        }
    }

    // =========================================================================
    // PAGE RENDERERS
    // =========================================================================

    public function render_jobs_page() {
        $job_engine  = Flazz_Job_Engine::get_instance();
        $jobs        = $job_engine->get_jobs();
        $type_labels = array(
            'keyword'     => '🔍 Keyword Search',
            'rss_watcher' => '📡 RSS Watcher',
            'ai_editor'   => '✍️ AI Writer',
            'smart_trend' => '📈 Trending',
        );
        ?>
        <div class="wrap">
            <h1>📋 Auto-Jobs Manager</h1>
            <p>Buat dan kelola job otomasi berita cerdas Anda.</p>

            <h2 class="nav-tab-wrapper" style="margin-bottom: 20px;">
                <a href="#flazz-tab-jobs" class="nav-tab nav-tab-active">📋 Daftar Auto-Jobs</a>
                <a href="#flazz-tab-rss-db" class="nav-tab">📡 Database RSS</a>
                <a href="#flazz-tab-trends" class="nav-tab">📈 Trending Topik</a>
            </h2>

            <!-- TAB 1: JOB MANAGER -->
            <div id="flazz-tab-jobs" class="tab-content">
                <div style="margin-bottom: 20px;">
                    <button id="flazz-open-job-form" class="button button-primary">
                        + Buat Job Baru
                    </button>
                </div>

                <!-- Job Manager Table -->
                <div class="card" style="padding: 0; margin-bottom: 20px;">
                    <?php if ( empty( $jobs ) ) : ?>
                        <div style="padding: 20px; text-align: center; color: #666;">
                            <p>Belum ada Job. Klik "Buat Job Baru" untuk memulai.</p>
                        </div>
                    <?php else : ?>
                        <table class="widefat striped">
                            <thead>
                                <tr>
                                    <th style="width: 20%;">Nama Job</th>
                                    <th style="width: 15%;">Tipe</th>
                                    <th style="width: 35%; word-break: break-all;">Konfigurasi</th>
                                    <th style="width: 15%;">Target / Language</th>
                                    <th style="width: 15%; text-align: right;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ( $jobs as $jobs_item ) :
                                    $type     = get_post_meta( $jobs_item->ID, '_flazz_job_job_type', true );
                                    $keyword  = get_post_meta( $jobs_item->ID, '_flazz_job_keyword', true );
                                    $rss      = get_post_meta( $jobs_item->ID, '_flazz_job_rss_url', true );
                                    $ai_idea  = get_post_meta( $jobs_item->ID, '_flazz_job_ai_idea', true );
                                    $secret   = get_post_meta( $jobs_item->ID, '_flazz_job_secret', true );
                                    $target_lang = get_post_meta( $jobs_item->ID, '_flazz_job_target_language', true ) ?: 'Indonesian';
                                    $scope       = get_post_meta( $jobs_item->ID, '_flazz_job_research_scope', true ) ?: 'local';
                                    
                                    $detail = $rss;
                                    if ( $type === 'keyword' ) $detail = $keyword . ($scope === 'global' ? ' (Global)' : ' (Lokal)');
                                    if ( $type === 'ai_editor' ) $detail = mb_substr($ai_idea, 0, 50) . '...';

                                    $cron_url = site_url( '/?flazz_run_job=' . $jobs_item->ID . '&key=' . $secret );
                                ?>
                                <tr>
                                    <td>
                                        <strong><?php echo esc_html( $jobs_item->post_title ); ?></strong>
                                        <p class="description" style="font-size: 10px; margin-top: 5px;">
                                            <a href="javascript:void(0);" onclick="navigator.clipboard.writeText('<?php echo $cron_url; ?>'); alert('Cron URL copied!');">COPY CRON URL</a>
                                        </p>
                                    </td>
                                    <td>
                                        <code><?php echo esc_html( isset( $type_labels[$type] ) ? $type_labels[$type] : $type ); ?></code>
                                    </td>
                                    <td>
                                        <span class="description" style="word-break: break-all;"><?php echo esc_html( $detail ); ?></span>
                                    </td>
                                    <td>
                                        <strong><?php echo strtoupper($target_lang); ?></strong><br>
                                        <span class="description">Cat ID: <?php echo get_post_meta( $jobs_item->ID, '_flazz_job_category', true ); ?></span>
                                    </td>
                                    <td style="text-align: right;">
                                        <button title="Run" class="run-job button button-small" data-id="<?php echo $jobs_item->ID; ?>">▶ Run</button>
                                        <button title="Edit" class="edit-job button button-small" 
                                            data-id="<?php echo $jobs_item->ID; ?>"
                                            data-name="<?php echo esc_attr( $jobs_item->post_title ); ?>"
                                            data-type="<?php echo esc_attr( $type ); ?>"
                                            data-keyword="<?php echo esc_attr( $keyword ); ?>"
                                            data-rss_url="<?php echo esc_attr( $rss ); ?>"
                                            data-ai_idea="<?php echo esc_attr( $ai_idea ); ?>"
                                            data-category="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_category', true ) ); ?>"
                                            data-max_articles="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_max_articles', true ) ); ?>"
                                            data-writing_style="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_writing_style', true ) ); ?>"
                                            data-article_model="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_article_model', true ) ); ?>"
                                            data-image_mode="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_image_mode', true ) ); ?>"
                                            data-thumbnail_style="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_thumbnail_style', true ) ); ?>"
                                            data-target_language="<?php echo esc_attr( $target_lang ); ?>"
                                            data-research_scope="<?php echo esc_attr( $scope ); ?>"
                                            data-publish_mode="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_publish_mode', true ) ?: 'publish' ); ?>"
                                            data-schedule_interval="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_schedule_interval', true ) ?: '60' ); ?>"
                                            data-show_image_source="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_show_image_source', true ) === '0' ? '0' : '1' ); ?>"
                                            data-show_article_source="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_show_article_source', true ) === '0' ? '0' : '1' ); ?>"
                                        >✏️ Edit</button>
                                        <button title="Hapus" class="delete-job button button-small button-link-delete" data-id="<?php echo $jobs_item->ID; ?>">🗑</button>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </div>

                <!-- Job Form -->
                <div id="flazz-job-form-container" class="card" style="display:none; padding: 20px; margin-bottom: 20px; max-width: 800px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; margin-bottom: 20px; padding-bottom: 10px;">
                        <h2 id="job-form-title" style="margin: 0;">Buat Auto-Job Baru</h2>
                        <button id="flazz-close-job-form" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
                    </div>
                    
                    <input type="hidden" id="job_id" value="0">
                    
                    <table class="form-table">
                        <tr>
                            <th><label>Nama Job <span style="color: red;">*</span></label></th>
                            <td>
                                <input type="text" id="job_name" class="regular-text" placeholder="Misal: Berita Teknologi Harian">
                            </td>
                        </tr>
                        <tr>
                            <th><label>Tipe Job</label></th>
                            <td>
                                <select id="job_type" class="regular-text">
                                    <option value="keyword">🔍 Keyword Search (cari dari Google News)</option>
                                    <option value="rss_watcher">📡 RSS Watcher (monitor RSS feed)</option>
                                    <option value="ai_editor">✍️ AI Post Writer (input ide/topik saja)</option>
                                </select>
                            </td>
                        </tr>
                        <tr id="row-keyword">
                            <th><label>Kata Kunci</label></th>
                            <td>
                                <input type="text" id="job_keyword" class="regular-text" placeholder="teknologi AI, gaya hidup sehat">
                                <div id="job-keyword-trends" style="margin-top: 10px;"></div>
                            </td>
                        </tr>
                        <tr id="row-research-scope">
                            <th><label>Cakupan Riset</label></th>
                            <td>
                                <select id="job_research_scope" class="regular-text">
                                    <option value="local">🇮🇩 Lokal Indonesia</option>
                                    <option value="global">🌐 Global International (English Sources)</option>
                                </select>
                            </td>
                        </tr>
                        <tr id="row-target-language">
                            <th><label>Bahasa Output</label></th>
                            <td>
                                <select id="job_target_language" class="regular-text">
                                    <option value="Indonesian">Bahasa Indonesia</option>
                                    <option value="English">English</option>
                                </select>
                            </td>
                        </tr>
                        <tr id="row-rss" style="display:none;">
                            <th><label>RSS Feed URL</label></th>
                            <td>
                                <input type="url" id="job_rss_url" class="regular-text" placeholder="https://kompas.com/feed/news">
                            </td>
                        </tr>
                        <tr id="row-ai-idea" style="display:none;">
                            <th><label>Ide Utama / Prompt AI</label></th>
                            <td>
                                <textarea id="job_ai_idea" class="regular-text" style="height: 100px;" placeholder="Tulis rincian atau poin-poin yang ingin dikembangkan AI menjadi artikel..."></textarea>
                            </td>
                        </tr>
                        <tr>
                            <th><label>Pilih Kategori <span style="color: red;">*</span></label></th>
                            <td>
                                <select id="job_category" class="regular-text">
                                    <option value="">-- Pilih Kategori --</option>
                                    <option value="auto">🤖 AI Auto (Pilih Terbaik)</option>
                                    <?php
                                    $categories = get_categories( array( 'hide_empty' => 0 ) );
                                    foreach ( $categories as $cat ) {
                                        echo '<option value="' . esc_attr( $cat->term_id ) . '">' . esc_html( $cat->name ) . '</option>';
                                    }
                                    ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th><label>Max Artikel / Run</label></th>
                            <td>
                                <input type="number" id="job_max_articles" value="3" min="1" max="10" style="width: 60px;">
                            </td>
                        </tr>
                        <tr>
                            <th><label>Style Penulisan</label></th>
                            <td>
                                <select id="job_writing_style" class="regular-text">
                                    <option value="Professional">Professional</option>
                                    <option value="Casual">Casual</option>
                                    <option value="Investigative">Investigative</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th><label>Model Artikel AI</label></th>
                            <td>
                                <select id="job_article_model" class="regular-text">
                                    <option value="Straight News">Straight News</option>
                                    <option value="In-depth Analysis">In-depth Analysis</option>
                                    <option value="Editorial/Opinion">Editorial / Opini</option>
                                    <option value="Listicle">Listicle</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th><label>Sumber Foto</label></th>
                            <td>
                                <select id="job_image_mode" class="regular-text">
                                    <option value="rss">Otomatis RSS / Pixabay</option>
                                    <option value="pixabay">🖼️ Pixabay Image Search</option>
                                    <option value="generate_ai">🤖 AI Image (Replicate Flux)</option>
                                    <option value="none">Tanpa Foto</option>
                                </select>
                            </td>
                        </tr>
                        <tr id="row-job-thumbnail-style" style="display:none;">
                            <th><label>Style Thumbnail AI</label></th>
                            <td>
                                <select id="job_thumbnail_style" class="regular-text">
                                    <option value="editorial_vector">🎨 Editorial Vector</option>
                                    <option value="real_photo">📸 Real Photo</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th><label>⚖️ Atribusi & Lisensi</label></th>
                            <td>
                                <label style="display: block; margin-bottom: 5px;">
                                    <input type="checkbox" id="job_show_image_source" value="1" checked> 
                                    Tampilkan Sumber Foto (di bawah artikel)
                                </label>
                                <label style="display: block;">
                                    <input type="checkbox" id="job_show_article_source" value="1" checked> 
                                    Tampilkan Sumber Berita / Link Asli (SEO Friendly)
                                </label>
                                <p class="description">Sangat disarankan untuk menghindari klaim hak cipta.</p>
                            </td>
                        </tr>
                        <tr>
                            <th><label>Status Publikasi</label></th>
                            <td>
                                <select id="job_publish_mode" class="regular-text">
                                    <option value="publish">🚀 Terbit Langsung (Sekaligus)</option>
                                    <option value="future">📅 Jadwalkan (Smart Queue)</option>
                                </select>
                                <p class="description">"Jadwalkan" akan menyebar waktu terbit artikel agar terlihat lebih natural (baik untuk SEO).</p>
                            </td>
                        </tr>
                        <tr id="row-job-interval" style="display:none;">
                            <th><label>Interval Antar Post (Menit)</label></th>
                            <td>
                                <input type="number" id="job_schedule_interval" value="60" min="5" step="5" style="width: 80px;">
                                <span class="description">Jarak waktu antar artikel yang diterbitkan (dalam menit).</span>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top: 20px;">
                        <button id="flazz-save-job" class="button button-primary">
                            💾 Simpan Konfigurasi Job
                        </button>
                    </div>
                </div>
            </div>

            <!-- TAB 2: RSS DATABASE -->
            <div id="flazz-tab-rss-db" class="tab-content" style="display:none;">
                <div class="card">
                    <p>Pilih dari sumber berita terpercaya untuk mendapatkan konten berkualitas secara otomatis.</p>
                    
                    <?php
                    $recoms = $this->get_rss_recommendations();
                    foreach ( $recoms as $group_name => $feeds ) :
                    ?>
                        <h3 style="border-bottom: 2px solid #2271b1; padding-bottom: 5px; margin-top: 30px; display: inline-block;">
                            <?php echo esc_html( $group_name ); ?>
                        </h3>
                        <table class="widefat striped" style="margin-bottom: 20px;">
                            <thead>
                                <tr>
                                    <th style="width: 25%;">Nama Sumber</th>
                                    <th>RSS Feed URL</th>
                                    <th style="width: 15%; text-align: right;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ( $feeds as $f ) : ?>
                                <tr>
                                    <td><strong><?php echo esc_html( $f['name'] ); ?></strong></td>
                                    <td><code><?php echo esc_html( $f['url'] ); ?></code></td>
                                    <td style="text-align: right;">
                                        <button class="button button-small use-rss-url" data-url="<?php echo esc_attr( $f['url'] ); ?>">Gunakan URL</button>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- TAB 3: TRENDING TOPICS -->
            <div id="flazz-tab-trends" class="tab-content" style="display:none;">
                <div class="card" style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                        <div>
                            <h2 style="margin:0;">📈 Trending Topik Hari Ini</h2>
                            <p class="description">Temukan topik viral dari Google Trends untuk dijadikan konten segar.</p>
                        </div>
                        <div>
                            <label style="font-weight: bold; margin-right: 10px;">Pilih Wilayah:</label>
                            <select id="flazz-trend-region-selector" class="regular-text" style="width: auto;">
                                <option value="ID">🇮🇩 Indonesia</option>
                                <option value="US">🌐 Global / USA (English)</option>
                            </select>
                        </div>
                    </div>

                    <div id="trends-full-container">
                        <div style="text-align:center; padding: 40px;">
                            <span class="spinner is-active" style="float:none;"></span>
                            <p>Sedang mengambil data tren terbaru...</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .tab-content { background: #fff; border: 1px solid #ccd0d4; border-top: none; padding: 20px; box-shadow: 0 1px 1px rgba(0,0,0,.04); }
                .nav-tab-wrapper { margin-bottom: 0 !important; }
                .trend-badge { display: inline-block; padding: 5px 12px; background: #f0f0f1; border: 1px solid #ccd0d4; border-radius: 20px; margin: 3px; cursor: pointer; transition: all 0.2s; font-size: 12px; }
                .trend-badge:hover { background: #2271b1; color: #fff; border-color: #2271b1; }
                .trend-traffic { font-size: 10px; opacity: 0.7; margin-left: 5px; }

                .trends-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .trends-table th, .trends-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
                .trends-table th { background: #f9f9f9; font-weight: bold; color: #444; }
                .trends-table tr:hover { background: #fdfdfd; }
                .trend-rank { font-weight: bold; color: #2271b1; font-size: 16px; width: 40px; }
                .trend-keyword { font-weight: 600; font-size: 14px; display: block; }
                .trend-vol { color: #666; font-size: 12px; }

                /* Niche sections */
                .trend-niche-section { margin-bottom: 10px; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; }
                .trend-niche-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: linear-gradient(to right, #f5f7fa, #eef0f3); font-weight: 700; font-size: 13px; cursor: pointer; border-bottom: 1px solid #e0e0e0; }
                .trend-niche-header:hover { background: #e7eaf0; }
                .trend-niche-count { font-size: 11px; font-weight: normal; color: #666; background: #fff; padding: 2px 8px; border-radius: 10px; border: 1px solid #ddd; }
                .trend-niche-body { padding: 0; }
            </style>
        </div>
        <?php
    }

    private function get_rss_recommendations() {
        return array(
            '🇮🇩 Berita Nasional (Lokal)' => array(
                array( 'name' => 'Detik Berita', 'url' => 'https://www.detik.com/rss' ),
                array( 'name' => 'Kompas News', 'url' => 'https://www.kompas.com/feed' ),
                array( 'name' => 'Liputan6', 'url' => 'https://www.liputan6.com/rss' ),
                array( 'name' => 'Tempo Nasional', 'url' => 'https://www.tempo.co/rss/nasional' ),
                array( 'name' => 'CNN Indonesia', 'url' => 'https://www.cnnindonesia.com/nasional/rss' ),
            ),
            '🔌 Teknologi & Gadget' => array(
                array( 'name' => 'Kompas Tekno', 'url' => 'https://tekno.kompas.com/feed' ),
                array( 'name' => 'The Verge (Global)', 'url' => 'https://www.theverge.com/rss/index.xml' ),
                array( 'name' => 'TechCrunch (Global)', 'url' => 'https://techcrunch.com/feed/' ),
                array( 'name' => 'Wired Science', 'url' => 'https://www.wired.com/feed/category/science/latest/rss' ),
                array( 'name' => 'Engadget', 'url' => 'https://www.engadget.com/rss.xml' ),
            ),
            '💰 Bisnis & Finansial' => array(
                array( 'name' => 'CNBC Indonesia', 'url' => 'https://www.cnbcindonesia.com/news/rss' ),
                array( 'name' => 'Kontan Nasional', 'url' => 'https://nasional.kontan.co.id/rss' ),
                array( 'name' => 'Forbes Tech (Global)', 'url' => 'https://www.forbes.com/business/feed/' ),
                array( 'name' => 'Wall Street Journal', 'url' => 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml' ),
            ),
            '🌍 Berita Internasional (English)' => array(
                array( 'name' => 'BBC World News', 'url' => 'http://feeds.bbci.co.uk/news/world/rss.xml' ),
                array( 'name' => 'Reuters Top News', 'url' => 'http://feeds.reuters.com/reuters/topNews' ),
                array( 'name' => 'Al Jazeera English', 'url' => 'https://www.aljazeera.com/xml/rss/all.xml' ),
                array( 'name' => 'NASA News', 'url' => 'https://www.nasa.gov/rss/dyn/breaking_news.rss' ),
            )
        );
    }

    public function render_manual_tools_page() {
        $preset_urls = array(
            'cnn'      => 'https://www.cnnindonesia.com/nasional/rss',
            'detik'    => 'https://www.detik.com/rss',
            'kompas'   => 'https://rss.kompas.com/getall.xml',
            'antara'   => 'https://www.antaranews.com/rss/top-news.xml',
            'liputan6' => 'https://www.liputan6.com/rss',
            'tribun'   => 'https://www.tribunnews.com/rss',
        );
        $current_url = get_option( 'flazz_ai_rss_feed_url', '' );
        ?>
        <div class="wrap">
            <h1>🛠 Manual Tools</h1>
            <p>Jalankan proses konten secara instan tanpa menunggu jadwal otomatis.</p>

            <div class="card" style="max-width: 800px; margin-bottom: 20px; padding: 20px;">
                <h2>📡 Fetch RSS Feed</h2>
                <table class="form-table">
                    <tr>
                        <th><label>Pilih Sumber Preset</label></th>
                        <td>
                            <select id="flazz_manual_preset" style="width: 100%; max-width: 400px;">
                                <option value="">-- Pilih Preset atau Input Manual --</option>
                                <?php foreach ( $preset_urls as $key => $url ) : ?>
                                    <option value="<?php echo esc_attr( $url ); ?>"><?php echo strtoupper( $key ); ?> — <?php echo esc_html( $url ); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><label>Target Kategori</label></th>
                        <td>
                            <?php wp_dropdown_categories( array( 
                                'hide_empty'        => 0, 
                                'name'              => 'flazz_manual_cat', 
                                'id'                => 'flazz_manual_cat', 
                                'class'             => 'postform',
                                'show_option_none'  => '🤖 AI Auto (Pilih Terbaik)',
                                'option_none_value' => 'auto'
                            ) ); ?>
                        </td>
                    </tr>
                    <tr>
                        <th><label>URL RSS Manual</label></th>
                        <td>
                            <input type="url" id="flazz_manual_rss_url" class="regular-text" style="width: 100%; max-width: 400px;" placeholder="https://..." value="<?php echo esc_attr( $current_url ); ?>">
                        </td>
                    </tr>
                </table>
                <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
                    <button id="flazz-manual-fetch" class="button button-primary">
                        🚀 Fetch & Proses Sekarang
                    </button>
                    <div id="flazz-fetch-status" style="font-weight: bold;"></div>
                </div>
            </div>

            <div class="card" style="max-width: 800px; margin-bottom: 20px; padding: 20px;">
                <h2>🔍 Riset Cepat (Keyword)</h2>
                <table class="form-table">
                    <tr>
                        <th><label>Kata Kunci <span style="color: red;">*</span></label></th>
                        <td>
                            <input type="text" id="flazz_research_keyword" class="regular-text" style="width: 100%; max-width: 400px;" placeholder="Misal: Timnas Indonesia U-23">
                        </td>
                    </tr>
                    <tr>
                        <th><label>Cakupan Riset</label></th>
                        <td>
                            <select id="flazz_research_scope" class="regular-text">
                                <option value="local">🇮🇩 Lokal Indonesia</option>
                                <option value="global">🌐 Global International (English Sources)</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><label>Bahasa Output</label></th>
                        <td>
                            <select id="flazz_research_language" class="regular-text">
                                <option value="Indonesian">Bahasa Indonesia</option>
                                <option value="English">English</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><label>Style Penulisan</label></th>
                        <td>
                            <select id="flazz_research_style" class="regular-text">
                                <option value="Professional">Professional (Formal & Lugas)</option>
                                <option value="Casual">Casual (Santai & Gaul)</option>
                                <option value="Investigative">Investigatif (Mendalam & Kritis)</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><label>Tone / Model Artikel</label></th>
                        <td>
                            <select id="flazz_research_model" class="regular-text">
                                <option value="Straight News">Straight News (Berita Langsung)</option>
                                <option value="Feature Story">Feature Story (Narasi Mendalam)</option>
                                <option value="Opinion">Opinion / Opini</option>
                                <option value="Analysis">Analisis</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><label>Sumber Foto</label></th>
                        <td>
                            <select id="flazz_research_image_mode" class="regular-text">
                                <option value="rss">Otomatis dari RSS / OG Image</option>
                                <option value="pixabay">🖼️ Pixabay Image Search (FREE)</option>
                                <option value="generate_ai">🤖 Generate dengan AI (Replicate)</option>
                                <option value="none">Tanpa Foto</option>
                            </select>
                        </td>
                    </tr>
                    <tr id="row-thumbnail-style" style="display:none;">
                        <th><label>Style Thumbnail AI</label></th>
                        <td>
                            <select id="flazz_research_thumbnail_style" class="regular-text">
                                <option value="editorial_vector">🎨 Editorial Vector (Majalah Satiris)</option>
                                <option value="real_photo">📸 Real Photo (Foto Realistis)</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><label>Trending Hari Ini</label></th>
                        <td>
                            <div id="manual-keyword-trends">
                                <span class="description">⏳ Mengambil tren dari Google...</span>
                            </div>
                        </td>
                    </tr>
                </table>
                <div style="margin-top: 15px; display: flex; align-items: center; gap: 15px;">
                    <button id="flazz-start-research" class="button button-primary">
                        🔬 Mulai Riset & Posting
                    </button>
                    <div id="flazz-research-status" style="font-weight: bold;"></div>
                </div>
            </div>

            <!-- ACTIVITY LOG -->
            <div id="manual-log" class="card" style="display:none; background: #1e1e1e; color: #00ff00; padding: 20px; font-family: monospace; max-width: 800px; border-radius: 4px;">
                <div style="border-bottom: 1px solid #333; margin-bottom: 10px; padding-bottom: 5px; color: #aaa; font-size: 11px; text-transform: uppercase;">
                    Activity Log / Output Console
                </div>
                <div id="manual-log-content" style="max-height: 300px; overflow-y: auto; line-height: 1.4;"></div>
            </div>
        </div>
        <?php
    }

    public function render_settings_page() {
        $has_dom        = class_exists( 'DOMDocument' );
        $license_status = get_option( 'flazz_ai_license_status', 'invalid' );
        $has_curl       = function_exists( 'curl_init' );
        $has_simplexml  = function_exists( 'simplexml_load_string' );
        ?>
        <div class="wrap">
            <h1>⚙️ Global Settings</h1>
            <p>Konfigurasi API, Lisensi, dan optimasi server Anda di sini.</p>

            <div class="card" style="max-width: 800px; margin-bottom: 20px; padding: 20px;">
                <h2>🖥 Server Compatibility Check</h2>
                <table class="widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Komponen</th>
                            <th>Detail</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>PHP Version</strong></td>
                            <td><?php echo PHP_VERSION; ?></td>
                            <td><?php echo version_compare( PHP_VERSION, '7.4', '>=' ) ? '<span style="color: green; font-weight: bold;">✅ OK</span>' : '<span style="color: red; font-weight: bold;">❌ Perlu PHP 7.4+</span>'; ?></td>
                        </tr>
                        <tr>
                            <td><strong>php-dom</strong></td>
                            <td><?php echo $has_dom ? 'Tersedia' : 'Tidak tersedia'; ?></td>
                            <td><?php echo $has_dom ? '<span style="color: green; font-weight: bold;">✅ OK</span>' : '<span style="color: orange; font-weight: bold;">⚠️ Fallback</span>'; ?></td>
                        </tr>
                        <tr>
                            <td><strong>cURL</strong></td>
                            <td><?php echo $has_curl ? 'Tersedia' : 'Tidak tersedia'; ?></td>
                            <td><?php echo $has_curl ? '<span style="color: green; font-weight: bold;">✅ OK</span>' : '<span style="color: red; font-weight: bold;">❌ Wajib</span>'; ?></td>
                        </tr>
                        <tr>
                            <td><strong>SimpleXML</strong></td>
                            <td><?php echo $has_simplexml ? 'Tersedia' : 'Tidak tersedia'; ?></td>
                            <td><?php echo $has_simplexml ? '<span style="color: green; font-weight: bold;">✅ OK</span>' : '<span style="color: red; font-weight: bold;">❌ Wajib</span>'; ?></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="card" style="max-width: 800px; margin-bottom: 20px; padding: 20px;">
                <h2>🔑 API Keys & Configuration</h2>
                <form method="post" action="options.php">
                    <?php settings_fields( 'flazz_ai_settings' ); ?>
                    
                    <table class="form-table">
                        <tr>
                            <th><label>License Key</label></th>
                            <td>
                                <input type="text" name="flazz_ai_license_key" value="<?php echo esc_attr( get_option( 'flazz_ai_license_key' ) ); ?>" class="regular-text" placeholder="FLAZZ-XXXX-XXXX-XXXX">
                                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: <?php echo $license_status === 'valid' ? '#d4edda; color: #155724;' : '#f8d7da; color: #721c24;'; ?>">
                                    <?php echo strtoupper( $license_status ); ?>
                                </span>
                                <?php if ( $license_status === 'valid' ) :
                                    $info = Flazz_License_Manager::get_instance()->get_license_info();
                                    if ( !empty( $info ) ) : ?>
                                        <p class="description" style="color: green; font-weight: bold;">
                                            ✅ Teraktivasi: <?php echo $info['activations_count']; ?> / <?php echo $info['max_domains']; ?> Domain
                                            <?php if (isset($info['expires_at'])) echo ' | Exp: ' . date('d M Y', strtotime($info['expires_at'])); ?>
                                        </p>
                                    <?php endif;
                                endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <th><label>Groq API Key</label></th>
                            <td>
                                <input type="password" name="flazz_ai_groq_key" value="<?php echo esc_attr( get_option( 'flazz_ai_groq_key' ) ); ?>" class="regular-text" placeholder="gsk_xxxxxxxx"><br>
                                <button type="button" id="flazz-test-api" class="button button-secondary" style="margin-top: 5px;">🧪 Test Koneksi AI</button>
                                <span id="test-api-status" style="margin-left: 10px; font-weight: bold;"></span>
                                <p class="description">Ambil di <a href="https://console.groq.com" target="_blank">console.groq.com</a></p>
                            </td>
                        </tr>
                        <tr>
                            <th><label>🧠 AI Text Model (Pro)</label></th>
                            <td>
                                <select name="flazz_ai_text_model" class="regular-text">
                                    <option value="llama-3.3-70b-versatile" <?php selected( get_option( 'flazz_ai_text_model', 'llama-3.3-70b-versatile' ), 'llama-3.3-70b-versatile' ); ?>>🦙 Llama 3.3 70B (Versatile/Default)</option>
                                    <option value="llama-3.1-405b-reasoning" <?php selected( get_option( 'flazz_ai_text_model' ), 'llama-3.1-405b-reasoning' ); ?>>🦙 Llama 3.1 405B (Grand Master)</option>
                                    <option value="gpt-4o" <?php selected( get_option( 'flazz_ai_text_model' ), 'gpt-4o' ); ?>>🤖 GPT-4o (OpenAI Premium)</option>
                                    <option value="gpt-4o-mini" <?php selected( get_option( 'flazz_ai_text_model' ), 'gpt-4o-mini' ); ?>>🤖 GPT-4o Mini (Fast & Smart)</option>
                                </select>
                                <p class="description">Pilih model untuk penulisan artikel & riset. GPT-4o mungkin membutuhkan kredit tambahan.</p>
                            </td>
                        </tr>
                        <tr>
                            <th><label>Replicate API Token (AI Image)</label></th>
                            <td>
                                <input type="password" name="flazz_ai_replicate_token" id="flazz_ai_replicate_token" value="<?php echo esc_attr( get_option( 'flazz_ai_replicate_token' ) ); ?>" class="regular-text" placeholder="r8_xxxxxxxx">
                                <p class="description">Optional — Untuk Replicate Flux. Ambil di <a href="https://replicate.com/account/api-tokens" target="_blank">replicate.com/api-tokens</a></p>
                            </td>
                        </tr>
                        <tr>
                            <th><label>🖼️ AI Image Model (Replicate)</label></th>
                            <td>
                                <select name="flazz_ai_image_model" class="regular-text">
                                    <option value="flux-schnell" <?php selected( get_option( 'flazz_ai_image_model', 'flux-schnell' ), 'flux-schnell' ); ?>>⚡ Flux Schnell (Fast/Default)</option>
                                    <option value="flux-dev" <?php selected( get_option( 'flazz_ai_image_model' ), 'flux-dev' ); ?>>👨‍💻 Flux Dev (High Quality)</option>
                                    <option value="flux-pro" <?php selected( get_option( 'flazz_ai_image_model' ), 'flux-pro' ); ?>>💎 Flux Pro (Premium)</option>
                                    <option value="flux-1.1-pro" <?php selected( get_option( 'flazz_ai_image_model' ), 'flux-1.1-pro' ); ?>>👑 Flux 1.1 Pro (Ultra HD)</option>
                                    <option value="recraft-v3" <?php selected( get_option( 'flazz_ai_image_model' ), 'recraft-v3' ); ?>>🎨 Recraft V3 (Best for Design)</option>
                                    <option value="flux-nano" <?php selected( get_option( 'flazz_ai_image_model' ), 'flux-nano' ); ?>>🏎️ Nano Mode (Ultra Fast)</option>
                                </select>
                                <p class="description">Pilih kualitas gambar AI. Model Pro menghasilkan detail lebih tajam.</p>
                            </td>
                        </tr>
                        <tr>
                            <th><label>🎨 Gaya Gambar Default</label></th>
                            <td>
                                <select name="flazz_ai_image_mode" class="regular-text">
                                    <option value="standard" <?php selected( get_option( 'flazz_ai_image_mode', 'standard' ), 'standard' ); ?>>🌟 Standard / Universal (No Bias)</option>
                                    <option value="editorial_vector" <?php selected( get_option( 'flazz_ai_image_mode' ), 'editorial_vector' ); ?>>📰 Editorial Vector (News Illustration)</option>
                                    <option value="real_photo" <?php selected( get_option( 'flazz_ai_image_mode' ), 'real_photo' ); ?>>📸 Photorealistic News (Press Photo)</option>
                                </select>
                                <p class="description">Gaya visual yang akan diterapkan pada gambar artikel.</p>
                                
                                <div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; max-width: 440px;">
                                    <strong>🧪 Test AI Image Generation</strong>
                                    <p class="description">Masukkan prompt singkat untuk mengetes API Replicate Anda.</p>
                                    <input type="text" id="flazz-test-image-prompt" class="regular-text" style="width: 100%; margin-bottom: 10px;" placeholder="Misal: A cute robot writing a news article">
                                    <button type="button" id="flazz-test-ai-image" class="button button-secondary">🚀 Generate Test Image</button>
                                    <div id="test-image-status" style="margin-top: 10px;"></div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th><label>Pixabay API Key (Free Image)</label></th>
                            <td>
                                <input type="password" name="flazz_ai_pixabay_key" value="<?php echo esc_attr( get_option( 'flazz_ai_pixabay_key' ) ); ?>" class="regular-text" placeholder="xxxxxxxx-xxxxxxxxxxxxxx">
                                <p class="description">Gratis, disarankan untuk fallback gambar.</p>
                            </td>
                        </tr>
                        <tr>
                            <th colspan="2" style="background:#f0f6fc; padding: 10px 15px; font-size: 13px; border-top: 2px solid #2271b1;">
                                📤 Telegram Notification (Opsional)
                            </th>
                        </tr>
                        <tr>
                            <th><label>Telegram Bot Token</label></th>
                            <td>
                                <input type="password" name="flazz_ai_telegram_token" value="<?php echo esc_attr( get_option( 'flazz_ai_telegram_token' ) ); ?>" class="regular-text" placeholder="123456789:AAF...">
                                <p class="description">Buat bot baru via <a href="https://t.me/botfather" target="_blank">@BotFather</a> di Telegram. Gratis!</p>
                            </td>
                        </tr>
                        <tr>
                            <th><label>Telegram Chat ID</label></th>
                            <td>
                                <input type="text" name="flazz_ai_telegram_chat_id" value="<?php echo esc_attr( get_option( 'flazz_ai_telegram_chat_id' ) ); ?>" class="regular-text" placeholder="-100xxxxxxxxxx">
                                <p class="description">Chat ID channel/group tujuan. Cari via <a href="https://t.me/userinfobot" target="_blank">@userinfobot</a>. Untuk channel, awali dengan <code>-100</code>.</p>
                            </td>
                        </tr>
                        <tr>
                            <th><label>Gaya Penulisan Default</label></th>
                            <td>
                                <select name="flazz_ai_writing_style" class="regular-text">
                                    <?php foreach ( array( 'Professional', 'Casual', 'Investigative' ) as $s ) : ?>
                                        <option value="<?php echo $s; ?>" <?php selected( get_option( 'flazz_ai_writing_style', 'Professional' ), $s ); ?>><?php echo $s; ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th><label>Max Artikel per Fetch</label></th>
                            <td>
                                <input type="number" name="flazz_ai_fetch_limit" value="<?php echo esc_attr( get_option( 'flazz_ai_fetch_limit', 5 ) ); ?>" min="1" max="20" style="width: 60px;">
                                <p class="description">Limit pemrosesan artikel secara bulk.</p>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top: 20px;">
                        <button type="submit" class="button button-primary">
                            💾 SIMPAN SEMUA PENGATURAN
                        </button>
                    </div>
                </form>
            </div>
        </div>
        <?php
    }

    public function render_documentation_page() {
        ?>
        <div class="wrap">
            <h1>📖 Panduan & Dokumentasi Flazz AI</h1>
            <p>Pelajari cara menyiapkan API Key untuk memaksimalkan fitur otomasi berita Anda.</p>

            <div class="card" style="max-width: 800px; margin-bottom: 20px; padding: 20px;">
                <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">🤖 1. Cara Mendapatkan Groq API Key (Otak AI)</h2>
                <p>Groq digunakan untuk memproses data, meriset berita, dan menulis artikel secara cerdas.</p>
                <ol>
                    <li>Buka <strong><a href="https://console.groq.com" target="_blank">console.groq.com</a></strong>.</li>
                    <li>Login menggunakan akun Google atau email Anda.</li>
                    <li>Klik menu <strong>"API Keys"</strong> di sidebar kiri.</li>
                    <li>Klik tombol <strong>"+ Create API Key"</strong>.</li>
                    <li>Beri nama (misal: "Flazz AI Plugin") lalu klik <strong>"Submit"</strong>.</li>
                    <li>Salin kode yang muncul (berawalan <code>gsk_...</code>) dan tempel di <a href="<?php echo admin_url('admin.php?page=flazz-settings'); ?>">Halaman Settings</a>.</li>
                </ol>
                <p><em>*Groq saat ini menyediakan kuota gratis yang sangat cepat bagi pengguna baru.</em></p>
            </div>

            <div class="card" style="max-width: 800px; margin-bottom: 20px; padding: 20px;">
                <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">🎨 2. Cara Mendapatkan Replicate API Token (AI Image)</h2>
                <p>Replicate (khususnya model Flux) digunakan untuk membuat gambar thumbnail artikel yang unik dan HD.</p>
                <ol>
                    <li>Buka <strong><a href="https://replicate.com/account/api-tokens" target="_blank">replicate.com/api-tokens</a></strong>.</li>
                    <li>Login dengan akun <strong>GitHub</strong> Anda.</li>
                    <li>Di bagian <strong>"API Tokens"</strong>, Anda akan melihat token default atau bisa buat baru.</li>
                    <li>Klik ikon <strong>Copy</strong> pada token tersebut (berawalan <code>r8_...</code>).</li>
                    <li>Tempel di <a href="<?php echo admin_url('admin.php?page=flazz-settings'); ?>">Halaman Settings</a> pada kolom Replicate.</li>
                </ol>
                <p><strong>Penting:</strong> Replicate bersifat berbayar (pay-per-use), pastikan Anda sudah memasukkan metode pembayaran di akun Replicate Anda agar API bisa berjalan.</p>
            </div>

            <div class="card" style="max-width: 800px; margin-bottom: 20px; padding: 20px;">
                <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">🖼️ 3. Cara Mendapatkan Pixabay API Key (Gambar Gratis)</h2>
                <p>Pixabay digunakan sebagai sumber gambar alternatif/gratis jika Anda tidak ingin menggunakan AI Image.</p>
                <ol>
                    <li>Buka <strong><a href="https://pixabay.com/api/docs/" target="_blank">pixabay.com/api/docs/</a></strong>.</li>
                    <li>Daftar akun gratis atau login terlebih dahulu.</li>
                    <li>Scroll ke bawah ke bagian <strong>"Parameters"</strong>.</li>
                    <li>Cari tulisan <strong>"key (required)"</strong>, di sebelah kanannya akan muncul API Key Anda secara otomatis.</li>
                    <li>Salin kode tersebut dan tempel di <a href="<?php echo admin_url('admin.php?page=flazz-settings'); ?>">Halaman Settings</a>.</li>
                </ol>
            </div>

            <div class="card" style="max-width: 800px; margin-bottom: 20px; padding: 20px; background: #fff8e5;">
                <h2>💡 Tips Penggunaan</h2>
                <ul style="list-style-type: disc; margin-left: 20px;">
                    <li>Gunakan fitur <strong>"Test Koneksi AI"</strong> di Settings untuk memastikan Groq sudah aktif.</li>
                    <li>Gunakan fitur <strong>"Generate Test Image"</strong> untuk memastikan Replicate sudah siap digunakan.</li>
                    <li>Jika terjadi error "HTTP 401" atau "Unauthorized", periksa kembali apakah API Key Anda sudah dicopy dengan benar tanpa spasi tambahan.</li>
                </ul>
            </div>
        </div>
        <?php
    }
}
