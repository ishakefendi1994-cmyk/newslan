<?php
/**
 * Handle Scheduled Tasks (WP-Cron) and manual RSS processing
 */
class Flazz_Cron_Manager {

    private static $instance = null;

    public static function get_instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'flazz_cron_grab_rss', array( $this, 'grab_rss_and_process' ) );
        add_action( 'init', array( $this, 'handle_external_trigger' ) );
    }

    /**
     * Handle external cron trigger via URL:
     * yourdomain.com/?flazz_run_job=ID&key=SECRET
     */
    public function handle_external_trigger() {
        if ( ! isset( $_GET['flazz_run_job'] ) || ! isset( $_GET['key'] ) ) {
            return;
        }

        $job_id = intval( $_GET['flazz_run_job'] );
        $key    = sanitize_text_field( $_GET['key'] );

        if ( ! $job_id || empty( $key ) ) {
            wp_die( 'Job ID atau Key tidak valid.' );
        }

        $job_secret = get_post_meta( $job_id, '_flazz_job_secret', true );

        if ( empty( $job_secret ) || $key !== $job_secret ) {
            wp_die( 'Akses ditolak. Key tidak cocok atau tidak ditemukan.' );
        }

        // Run the job
        require_once plugin_dir_path( __FILE__ ) . 'class-flazz-job-engine.php';
        $engine = Flazz_Job_Engine::get_instance();
        $result = $engine->run_job( $job_id );

        // Log result to error log for debugging
        error_log( '[Flazz AI] External Job Trigger (ID: ' . $job_id . '): ' . $result );

        // Output result for the cron service (e.g. curl)
        echo $result;
        exit;
    }

    /**
     * Main processing function — called by WP-Cron or manually via AJAX.
     *
     * @param string $rss_url Optional override URL (e.g. from Manual Tools page)
     * @return array Stats array
     */
    public function grab_rss_and_process( $rss_url_override = '' ) {
        $stats = array(
            'total'      => 0,
            'skipped'    => 0,
            'processed'  => 0,
            'errors'     => 0,
            'last_error' => '',
        );

        error_log( '[Flazz AI] CronManager::grab_rss_and_process START' );

        // Determine RSS URL
        // Priority: 1. Parameter override, 2. Settings URL, 3. Preset URL
        $rss_url = '';

        if ( ! empty( $rss_url_override ) ) {
            $rss_url = $rss_url_override;
            error_log( '[Flazz AI] Using URL override: ' . $rss_url );
        } else {
            $preset  = get_option( 'flazz_ai_rss_source_preset', 'custom' );
            $rss_url = get_option( 'flazz_ai_rss_feed_url', '' );

            if ( $preset !== 'custom' ) {
                $preset_url = $this->get_preset_url( $preset );
                if ( $preset_url ) {
                    $rss_url = $preset_url;
                    error_log( '[Flazz AI] Using preset URL: ' . $rss_url );
                }
            }
        }

        if ( empty( $rss_url ) ) {
            $stats['last_error'] = 'RSS Feed URL kosong. Silakan isi di Settings atau input di Manual Tools.';
            error_log( '[Flazz AI] CronManager: ' . $stats['last_error'] );
            return $stats;
        }

        $grabber       = Flazz_Grabber::get_instance();
        $ai_writer     = Flazz_AI_Writer::get_instance();
        $writing_style = get_option( 'flazz_ai_writing_style', 'Professional' );
        $article_model = get_option( 'flazz_ai_article_model', 'Straight News' );
        $fetch_limit   = (int) get_option( 'flazz_ai_fetch_limit', 5 );

        // Fetch RSS
        $articles = $grabber->fetch_rss( $rss_url );

        if ( empty( $articles ) ) {
            $stats['last_error'] = 'Tidak ada artikel yang berhasil diambil dari RSS URL: ' . $rss_url;
            error_log( '[Flazz AI] CronManager: ' . $stats['last_error'] );
            return $stats;
        }

        $stats['total'] = count( $articles );
        error_log( '[Flazz AI] CronManager: Found ' . $stats['total'] . ' articles in RSS' );

        foreach ( $articles as $article ) {
            // Skip already processed URLs
            if ( $this->post_exists( $article['link'] ) ) {
                error_log( '[Flazz AI] CronManager: Skipping (already exists): ' . $article['link'] );
                $stats['skipped']++;
                continue;
            }

            // Extract content
            error_log( '[Flazz AI] CronManager: Extracting: ' . $article['link'] );
            $extracted = $grabber->extract_content( $article['link'] );

            if ( ! $extracted || strlen( $extracted['content'] ) < 100 ) {
                $stats['last_error'] = 'Gagal ekstrak konten dari: ' . $article['link'];
                error_log( '[Flazz AI] CronManager: ' . $stats['last_error'] );
                $stats['errors']++;
                continue;
            }

            // Rewrite with AI
            error_log( '[Flazz AI] CronManager: Rewriting with AI...' );
            $rewritten = $ai_writer->rewrite_article( 
                $extracted['title'] ?: $article['title'],
                $extracted['content'],
                $writing_style,
                $article_model
            );

            if ( ! $rewritten ) {
                $stats['last_error'] = 'AI Error: ' . $ai_writer->get_last_error();
                error_log( '[Flazz AI] CronManager: ' . $stats['last_error'] );
                $stats['errors']++;
                continue;
            }

            // Handle image
            $final_image = ! empty( $extracted['image'] ) ? $extracted['image'] : $article['image'];

            // Create post
            $this->create_wp_post( $rewritten, $article['link'], $final_image );
            $stats['processed']++;
            error_log( '[Flazz AI] CronManager: Posted: ' . $rewritten['title'] );

            // Throttle to respect API rate limits
            sleep( 5 );
        }

        error_log( '[Flazz AI] CronManager: DONE. Total=' . $stats['total'] . ' Processed=' . $stats['processed'] . ' Errors=' . $stats['errors'] );
        return $stats;
    }

    private function get_preset_url( $preset ) {
        $urls = array(
            'cnn'      => 'https://www.cnnindonesia.com/nasional/rss',
            'detik'    => 'https://www.detik.com/rss',
            'kompas'   => 'https://rss.kompas.com/getall.xml',
            'antara'   => 'https://www.antaranews.com/rss/top-news.xml',
            'liputan6' => 'https://www.liputan6.com/rss',
            'merdeka'  => 'https://www.merdeka.com/jakarta/rss/',
            'viva'     => 'https://www.viva.co.id/getrss/berita',
            'tribun'   => 'https://www.tribunnews.com/rss',
        );
        return isset( $urls[ $preset ] ) ? $urls[ $preset ] : false;
    }

    private function post_exists( $url ) {
        global $wpdb;
        $found = $wpdb->get_var( $wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_flazz_source_url' AND meta_value = %s LIMIT 1",
            $url
        ) );
        return ! empty( $found );
    }

    private function create_wp_post( $data, $source_url, $image_url ) {
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

                $att_id = media_sideload_image( $image_url, $post_id, $data['title'], 'id' );
                if ( ! is_wp_error( $att_id ) ) {
                    set_post_thumbnail( $post_id, $att_id );
                } else {
                    error_log( '[Flazz AI] CronManager: Image sideload error: ' . $att_id->get_error_message() );
                }
            }
        }
    }
}
