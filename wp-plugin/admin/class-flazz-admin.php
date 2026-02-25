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
        add_action( 'wp_ajax_flazz_research_keyword',array( $this, 'ajax_research_keyword' ) );
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
    }

    public function register_settings() {
        $options = array(
            'flazz_ai_license_key', 'flazz_ai_groq_key', 'flazz_ai_replicate_token',
            'flazz_ai_rss_source_preset', 'flazz_ai_rss_feed_url', 'flazz_ai_fetch_limit',
            'flazz_ai_image_mode', 'flazz_ai_writing_style', 'flazz_ai_article_model',
            'flazz_ai_pixabay_key',
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

    private function create_wp_post_direct( $data, $source_url, $image_url ) {
        $post_id = wp_insert_post( array(
            'post_title'   => $data['title'],
            'post_content' => $data['content'],
            'post_status'  => 'publish',
            'post_author'  => 1,
            'post_type'    => 'post',
        ) );

        if ( $post_id && ! is_wp_error( $post_id ) ) {
            update_post_meta( $post_id, '_flazz_source_url', $source_url );

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

        return $post_id;
    }

    /**
     * Try to retrieve the og:image meta from a URL.
     * Uses Chrome User-Agent and reads 30KB of head to cover most sites.
     */
    private function fetch_og_image( $url ) {
        $this->log( 'fetch_og_image: trying ' . $url );

        $resp = wp_remote_get( $url, array(
            'timeout'     => 10,
            'sslverify'   => false,
            'redirection' => 5,   // follow up to 5 redirects (needed for Google News links)
            'headers'     => array(
                'User-Agent'      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept'          => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            ),
        ) );

        if ( is_wp_error( $resp ) ) {
            $this->log( 'fetch_og_image: WP_Error = ' . $resp->get_error_message() );
            return false;
        }

        $code = wp_remote_retrieve_response_code( $resp );
        if ( $code !== 200 ) {
            $this->log( 'fetch_og_image: HTTP ' . $code . ' — skipping' );
            return false;
        }

        // Read first 30KB — enough to capture <head> on most sites
        $body = substr( wp_remote_retrieve_body( $resp ), 0, 30000 );

        // Pattern 1: property="og:image" content="..."
        if ( preg_match( '/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/', $body, $m ) ) {
            $this->log( 'fetch_og_image: found og:image (p1) = ' . $m[1] );
            return $m[1];
        }
        // Pattern 2: content="..." property="og:image"  (reversed attribute order)
        if ( preg_match( '/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']/', $body, $m ) ) {
            $this->log( 'fetch_og_image: found og:image (p2) = ' . $m[1] );
            return $m[1];
        }
        // Pattern 3: twitter:image fallback
        if ( preg_match( '/<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']/', $body, $m ) ) {
            $this->log( 'fetch_og_image: found twitter:image = ' . $m[1] );
            return $m[1];
        }
        // Pattern 4: content="..." name="twitter:image"
        if ( preg_match( '/<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\']/', $body, $m ) ) {
            $this->log( 'fetch_og_image: found twitter:image (p4) = ' . $m[1] );
            return $m[1];
        }

        $this->log( 'fetch_og_image: no og/twitter image found in page head' );
        return false;
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



    // =========================================================================
    // AJAX: Test API
    // =========================================================================

    public function ajax_test_api() {
        $this->log( 'ajax_test_api: START' );
        $this->check_permission();

        try {
            $api_key = get_option( 'flazz_ai_groq_key', '' );
            $license = get_option( 'flazz_ai_license_key', '' );

            if ( empty( $api_key ) ) {
                wp_send_json_error( 'API Key (Groq) belum diisi di Settings.' );
            }

            // Test via cloud orchestrator (Saas transition)
            $response = wp_remote_post( 'https://www.cryptotechnews.net/api/ai/orchestrator', array(
                'headers' => array( 'Content-Type' => 'application/json' ),
                'body'    => json_encode( array(
                    'action'      => 'rewrite',
                    'license_key' => $license,
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

    public function ajax_research_keyword() {
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
                    $og = $this->fetch_og_image( $article_url );
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
        <div class="wrap" id="flazz-job-manager">
            <h1>📋 Auto-Jobs Manager</h1>
            <p class="description">Buat dan kelola job otomasi berita. Setiap job akan mencari dan memposting artikel secara otomatis.</p>

            <div style="margin: 20px 0;">
                <button id="flazz-open-job-form" class="button button-primary button-large">➕ Buat Job Baru</button>
            </div>

            <table class="wp-list-table widefat fixed striped posts">
                <thead>
                    <tr>
                        <th style="width:20%;">Nama Job</th>
                        <th style="width:15%;">Tipe</th>
                        <th style="width:20%;">Keyword / Idea / URL</th>
                        <th style="width:30%;">Cron URL / Trigger</th>
                        <th style="width:15%;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if ( empty( $jobs ) ) : ?>
                        <tr><td colspan="5" style="text-align:center; padding:20px;">Belum ada Job. Klik "Buat Job Baru" untuk memulai.</td></tr>
                    <?php else : ?>
                        <?php foreach ( $jobs as $jobs_item ) :
                            $type     = get_post_meta( $jobs_item->ID, '_flazz_job_job_type', true );
                            $keyword  = get_post_meta( $jobs_item->ID, '_flazz_job_keyword', true );
                            $rss      = get_post_meta( $jobs_item->ID, '_flazz_job_rss_url', true );
                            $ai_idea  = get_post_meta( $jobs_item->ID, '_flazz_job_ai_idea', true );
                            $secret   = get_post_meta( $jobs_item->ID, '_flazz_job_secret', true );
                            
                            $detail = $rss;
                            if ( $type === 'keyword' ) $detail = $keyword;
                            if ( $type === 'ai_editor' ) $detail = $ai_idea;

                            $cron_url = site_url( '/?flazz_run_job=' . $jobs_item->ID . '&key=' . $secret );
                        ?>
                        <tr>
                            <td><strong><?php echo esc_html( $jobs_item->post_title ); ?></strong></td>
                            <td><?php echo esc_html( isset( $type_labels[$type] ) ? $type_labels[$type] : $type ); ?></td>
                            <td style="font-size:11px; color:#666; word-break:break-all;"><?php echo esc_html( $detail ); ?></td>
                            <td>
                                <code style="font-size:10px; background:#f0f0f1; padding:3px; display:block; word-break:break-all;"><?php echo esc_html( $cron_url ); ?></code>
                                <p class="description" style="margin-top:5px; font-size:10px;">Gunakan URL ini di crontab sistem (curl/wget).</p>
                            </td>
                            <td>
                                <button class="button button-small run-job" data-id="<?php echo $jobs_item->ID; ?>">▶ Jalankan</button>
                                <button class="button button-small edit-job" 
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
                                    data-target_language="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_target_language', true ) ); ?>"
                                    data-research_scope="<?php echo esc_attr( get_post_meta( $jobs_item->ID, '_flazz_job_research_scope', true ) ); ?>"
                                >✏️ Edit</button>
                                <button class="button button-small delete-job" data-id="<?php echo $jobs_item->ID; ?>" style="color:#d63638; margin-top:5px;">🗑 Hapus</button>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <div id="flazz-job-form-container" style="display:none; margin-top:30px; background:#fff; padding:25px; border:1px solid #ccd0d4; border-radius:6px;">
                <h2 id="job-form-title" style="margin-top:0;">Buat Auto-Job Baru</h2>
                <input type="hidden" id="job_id" value="0">
                <table class="form-table">
                    <tr>
                        <th>Nama Job <span style="color:red">*</span></th>
                        <td><input type="text" id="job_name" class="regular-text" placeholder="Contoh: Tech News Auto-Publisher"></td>
                    </tr>
                    <tr>
                        <th>Tipe Job</th>
                        <td>
                            <select id="job_type" class="regular-text">
                                <option value="keyword">🔍 Keyword Search (cari dari Google News)</option>
                                <option value="rss_watcher">📡 RSS Watcher (monitor RSS feed)</option>
                                <option value="ai_editor">✍️ AI Post Writer (input ide/topik saja)</option>
                            </select>
                        </td>
                    </tr>
                    <tr id="row-keyword">
                        <th>Kata Kunci</th>
                        <td>
                            <input type="text" id="job_keyword" class="regular-text" placeholder="Contoh: teknologi AI, harga emas">
                            <p class="description">Sistem akan mencari berita terkait kata kunci ini setiap kali job dijalankan.</p>
                        </td>
                    </tr>
                    <tr id="row-research-scope">
                        <th>Cakupan Riset</th>
                        <td>
                            <select id="job_research_scope" class="regular-text">
                                <option value="local">🇮🇩 Lokal Indonesia</option>
                                <option value="global">🌐 Global International (English Sources)</option>
                            </select>
                            <p class="description">Hanya berlaku untuk tipe Keyword Search.</p>
                        </td>
                    </tr>
                    <tr id="row-target-language">
                        <th>Bahasa Output</th>
                        <td>
                            <select id="job_target_language" class="regular-text">
                                <option value="Indonesian">Bahasa Indonesia</option>
                                <option value="English">English</option>
                            </select>
                            <p class="description">AI akan menulis artikel dalam bahasa yang dipilih.</p>
                        </td>
                    </tr>
                    <tr id="row-rss" style="display:none;">
                        <th>RSS Feed URL</th>
                        <td><input type="url" id="job_rss_url" class="large-text" placeholder="https://example.com/feed/rss"></td>
                    </tr>
                    <tr id="row-ai-idea" style="display:none;">
                        <th>Ide Utama / Topik</th>
                        <td>
                            <textarea id="job_ai_idea" class="large-text" rows="3" placeholder="Contoh: Manfaat minum air putih bagi kesehatan kulit di pagi hari..."></textarea>
                            <p class="description">AI akan mengembangkan ide ini menjadi artikel lengkap secara otomatis.</p>
                        </td>
                    </tr>
                    <tr>
                        <th>Max Artikel / Run</th>
                        <td><input type="number" id="job_max_articles" value="3" min="1" max="10"> artikel per sekali jalan</td>
                    </tr>
                    <tr>
                        <th>Pilih Kategori <span style="color:red">*</span></th>
                        <td>
                            <select id="job_category" class="regular-text">
                                <option value="">-- Pilih Kategori --</option>
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
                        <th>Model Artikel AI</th>
                        <td>
                            <select id="job_article_model">
                                <option value="Straight News">Straight News (Berita Lempeng)</option>
                                <option value="In-depth Analysis">In-depth Analysis (Analisis Mendalam)</option>
                                <option value="Editorial/Opinion">Editorial / Opini</option>
                                <option value="Listicle">Listicle (Poin-poin)</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Sumber Foto / Featured Image</th>
                        <td>
                            <select id="job_image_mode">
                                <option value="rss">Otomatis dari RSS / OG Image</option>
                                <option value="pixabay">🖼️ Pixabay Image Search (FREE)</option>
                                <option value="generate_ai">🤖 Generate dengan AI (Replicate)</option>
                                <option value="none">Tanpa Foto</option>
                            </select>
                            <p class="description">Gunakan logika yang sama dengan Manual Tools.</p>
                        </td>
                    </tr>
                    <tr id="row-job-thumbnail-style" style="display:none;">
                        <th>Style Thumbnail AI</th>
                        <td>
                            <select id="job_thumbnail_style">
                                <option value="editorial_vector">🎨 Editorial Vector (Majalah Satiris)</option>
                                <option value="real_photo">📸 Real Photo (Foto Realistis)</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Gaya Penulisan</th>
                        <td>
                            <select id="job_writing_style">
                                <option value="Professional">Professional</option>
                                <option value="Casual">Casual / Santai</option>
                                <option value="Investigative">Investigatif</option>
                            </select>
                        </td>
                    </tr>
                </table>
                <div style="margin-top:15px; display:flex; gap:10px;">
                    <button id="flazz-save-job" class="button button-primary button-large">💾 Simpan Job</button>
                    <button id="flazz-close-job-form" class="button button-large">Batal</button>
                </div>
            </div>
        </div>
        <?php
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
            <p class="description">Jalankan proses berita secara manual tanpa harus membuat Auto-Job atau menunggu jadwal cron.</p>

            <!-- SECTION 1: RSS Fetch -->
            <div class="card" style="max-width:800px; margin-top:20px; padding:20px;">
                <h2>📡 Fetch RSS Sekarang</h2>
                <p>Ambil berita dari RSS feed, tulis ulang dengan AI, dan posting ke WordPress.</p>

                <table class="form-table" style="margin:0;">
                    <tr>
                        <th style="width:150px;">Pilih Sumber Preset</th>
                        <td>
                            <select id="flazz_manual_preset" style="width:100%; max-width:400px;">
                                <option value="">-- Pilih Preset atau Input Manual --</option>
                                <?php foreach ( $preset_urls as $key => $url ) : ?>
                                    <option value="<?php echo esc_attr( $url ); ?>"><?php echo strtoupper( $key ); ?> — <?php echo esc_html( $url ); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>URL RSS Manual</th>
                        <td>
                            <input type="url" id="flazz_manual_rss_url" class="large-text" placeholder="https://example.com/rss" value="<?php echo esc_attr( $current_url ); ?>">
                            <p class="description">Input URL RSS di sini jika tidak ada di daftar preset di atas.</p>
                        </td>
                    </tr>
                </table>
                <button id="flazz-manual-fetch" class="button button-primary button-large" style="margin-top:10px;">▶ Fetch & Proses Sekarang</button>
                <div id="flazz-fetch-status" style="margin-top:15px; font-weight:bold;"></div>
            </div>

            <!-- SECTION 2: Keyword Research -->
            <div class="card" style="max-width:800px; margin-top:20px; padding:20px;">
                <h2>🔍 Riset Cepat (Keyword)</h2>
                <p>Masukkan kata kunci → sistem cari 4 berita terbaru di Google News → AI mensintesiskan jadi artikel → langsung posting.</p>
                <p style="color:#666; font-size:13px;">💡 Tidak perlu scraping situs sumber — langsung pakai ringkasan dari Google News RSS.</p>

                <table class="form-table" style="margin:0;">
                    <tr>
                        <th style="width:180px;">Kata Kunci <span style="color:red">*</span></th>
                        <td><input type="text" id="flazz_research_keyword" class="regular-text" placeholder="Contoh: Timnas Indonesia U-23" style="width:100%; max-width:400px;"></td>
                    </tr>
                    <tr>
                        <th>Cakupan Riset</th>
                        <td>
                            <select id="flazz_research_scope">
                                <option value="local">🇮🇩 Lokal Indonesia</option>
                                <option value="global">🌐 Global International (English Sources)</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Bahasa Output</th>
                        <td>
                            <select id="flazz_research_language">
                                <option value="Indonesian">Bahasa Indonesia</option>
                                <option value="English">English</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Gaya Penulisan</th>
                        <td>
                            <select id="flazz_research_style">
                                <option value="Professional">Professional (Formal &amp; Lugas)</option>
                                <option value="Casual">Casual (Santai &amp; Gaul)</option>
                                <option value="Investigative">Investigatif (Mendalam &amp; Kritis)</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Tone / Model Artikel</th>
                        <td>
                            <select id="flazz_research_model">
                                <option value="Straight News">Straight News (Berita Langsung)</option>
                                <option value="Feature Story">Feature Story (Narasi Mendalam)</option>
                                <option value="Opinion">Opinion / Opini</option>
                                <option value="Analysis">Analisis</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Sumber Foto / Featured Image</th>
                        <td>
                            <select id="flazz_research_image_mode">
                                <option value="rss">Otomatis dari RSS / OG Image Artikel</option>
                                <option value="pixabay">🖼️ Pixabay Image Search (FREE)</option>
                                <option value="generate_ai">🤖 Generate dengan AI (Replicate)</option>
                                <option value="none">Tanpa Foto</option>
                            </select>
                            <p class="description">
                                <strong>Otomatis RSS:</strong> Coba ambil dari media RSS → og:image → Pixabay.<br>
                                <strong>Pixabay:</strong> Cari foto langsung dari Pixabay (butuh Pixabay API Key di Settings, gratis).<br>
                                <strong>Generate AI:</strong> Buat gambar baru via Replicate (butuh Replicate Token di Settings).
                            </p>
                        </td>
                    </tr>
                    <tr id="row-thumbnail-style" style="display:none;">
                        <th>Style Thumbnail AI</th>
                        <td>
                            <select id="flazz_research_thumbnail_style">
                                <option value="editorial_vector">🎨 Editorial Vector (Majalah Satiris)</option>
                                <option value="real_photo">📸 Real Photo (Foto Realistis)</option>
                            </select>
                            <p class="description">
                                <strong>Editorial Vector:</strong> Gaya ilustrasi vektor satirikal ala sampul majalah berita.<br>
                                <strong>Real Photo:</strong> Gaya foto press/DSLR realistis dengan pencahayaan natural.
                            </p>
                        </td>
                    </tr>
                </table>
                <button id="flazz-start-research" class="button button-secondary button-large" style="margin-top:10px;">🔬 Mulai Riset & Posting</button>
                <div id="flazz-research-status" style="margin-top:15px; font-weight:bold;"></div>
            </div>
        </div>
        <?php
    }

    public function render_settings_page() {
        $license_status = get_option( 'flazz_ai_license_status', 'invalid' );
        $has_dom        = class_exists( 'DOMDocument' );
        $has_curl       = function_exists( 'curl_init' );
        $has_simplexml  = function_exists( 'simplexml_load_string' );
        ?>
        <div class="wrap">
            <h1>⚙️ Global Settings</h1>

            <!-- Server Compatibility -->
            <div class="card" style="max-width:700px; margin-top:20px; padding:20px;">
                <h2 style="margin-top:0;">🖥 Server Compatibility Check</h2>
                <table class="widefat">
                    <tbody>
                        <tr>
                            <td><strong>PHP Version</strong></td>
                            <td><?php echo PHP_VERSION; ?></td>
                            <td><?php echo version_compare( PHP_VERSION, '7.4', '>=' ) ? '✅ OK' : '❌ Perlu PHP 7.4+'; ?></td>
                        </tr>
                        <tr>
                            <td><strong>php-dom</strong></td>
                            <td><?php echo $has_dom ? 'Tersedia' : 'Tidak tersedia'; ?></td>
                            <td><?php echo $has_dom ? '✅ OK' : '⚠️ Tidak wajib (ada fallback)'; ?></td>
                        </tr>
                        <tr>
                            <td><strong>cURL</strong></td>
                            <td><?php echo $has_curl ? 'Tersedia' : 'Tidak tersedia'; ?></td>
                            <td><?php echo $has_curl ? '✅ OK' : '❌ Wajib — hubungi hosting'; ?></td>
                        </tr>
                        <tr>
                            <td><strong>SimpleXML</strong></td>
                            <td><?php echo $has_simplexml ? 'Tersedia' : 'Tidak tersedia'; ?></td>
                            <td><?php echo $has_simplexml ? '✅ OK' : '❌ Wajib untuk Riset Keyword'; ?></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Settings Form -->
            <div class="card" style="max-width:700px; margin-top:20px; padding:20px;">
                <h2 style="margin-top:0;">🔑 API Keys & Configuration</h2>
                <form method="post" action="options.php">
                    <?php settings_fields( 'flazz_ai_settings' ); ?>
                    <table class="form-table">
                        <tr>
                            <th>License Key</th>
                            <td>
                                <input type="text" name="flazz_ai_license_key" value="<?php echo esc_attr( get_option( 'flazz_ai_license_key' ) ); ?>" class="regular-text">
                                <span style="margin-left:10px; font-weight:bold; color:<?php echo $license_status === 'valid' ? 'green' : '#d63638'; ?>">
                                    <?php echo strtoupper( $license_status ); ?>
                                </span>
                                <?php if ( $license_status === 'valid' ) :
                                    $info = Flazz_License_Manager::get_instance()->get_license_info();
                                    if ( !empty( $info ) ) : ?>
                                        <p class="description" style="color:green; font-weight:bold;">
                                            ✅ Teraktivasi: <?php echo $info['activations_count']; ?> / <?php echo $info['max_domains']; ?> Domain
                                            <?php if (isset($info['expires_at'])) echo ' | Exp: ' . date('d M Y', strtotime($info['expires_at'])); ?>
                                        </p>
                                    <?php endif;
                                endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <th>Groq API Key</th>
                            <td>
                                <input type="password" name="flazz_ai_groq_key" value="<?php echo esc_attr( get_option( 'flazz_ai_groq_key' ) ); ?>" class="regular-text">
                                <button type="button" id="flazz-test-api" class="button" style="margin-left:10px;">🧪 Test Koneksi</button>
                                <span id="test-api-status" style="margin-left:10px; font-weight:bold;"></span>
                                <p class="description">Dapatkan API key gratis di <a href="https://console.groq.com" target="_blank">console.groq.com</a></p>
                            </td>
                        </tr>
                        <tr>
                            <th>Replicate API Token <span style="color:#888; font-size:12px; font-weight:normal;">(opsional)</span></th>
                            <td>
                                <input type="password" name="flazz_ai_replicate_token" value="<?php echo esc_attr( get_option( 'flazz_ai_replicate_token' ) ); ?>" class="regular-text">
                                <p class="description">
                                    Diperlukan jika Bapak ingin generate gambar AI (Replicate Flux).<br>
                                    Dapatkan token di <a href="https://replicate.com/account/api-tokens" target="_blank">replicate.com/account/api-tokens</a>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <th>Pixabay API Key <span style="color:#888; font-size:12px; font-weight:normal;">(Image Search, gratis)</span></th>
                            <td>
                                <input type="password" name="flazz_ai_pixabay_key" value="<?php echo esc_attr( get_option( 'flazz_ai_pixabay_key' ) ); ?>" class="regular-text">
                                <p class="description">
                                    Untuk fitur <strong>Pixabay Image Search</strong> — gratis tanpa batas.<br>
                                    Daftar + ambil API key di <a href="https://pixabay.com/api/docs/" target="_blank">pixabay.com/api/docs</a> (cukup register, langsung dapat key).
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <th>Gaya Penulisan Default</th>
                            <td>
                                <select name="flazz_ai_writing_style">
                                    <?php foreach ( array( 'Professional', 'Casual', 'Investigative' ) as $s ) : ?>
                                        <option value="<?php echo $s; ?>" <?php selected( get_option( 'flazz_ai_writing_style', 'Professional' ), $s ); ?>><?php echo $s; ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th>Max Artikel per Fetch</th>
                            <td>
                                <input type="number" name="flazz_ai_fetch_limit" value="<?php echo esc_attr( get_option( 'flazz_ai_fetch_limit', 5 ) ); ?>" min="1" max="20" style="width:80px;">
                                <p class="description">Jumlah maksimal artikel yang diproses per satu kali fetch/run.</p>
                            </td>
                        </tr>
                    </table>
                    <?php submit_button( 'Simpan Semua Pengaturan' ); ?>
                </form>
            </div>
        </div>
        <?php
    }
}
