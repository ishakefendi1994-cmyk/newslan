<?php
/**
 * Handle Auto-Job Logic and CPT
 */
class Newslan_Job_Engine {

    private static $instance = null;

    public static function get_instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'init', array( $this, 'register_job_cpt' ) );
    }

    public function register_job_cpt() {
        $labels = array(
            'name'               => 'Newslan Jobs',
            'singular_name'      => 'Newslan Job',
            'menu_name'          => 'Newslan Jobs',
            'name_admin_bar'     => 'Newslan Job',
            'add_new'            => 'Add New',
            'add_new_item'       => 'Add New Job',
            'new_item'           => 'New Job',
            'edit_item'          => 'Edit Job',
            'view_item'          => 'View Job',
            'all_items'          => 'All Jobs',
            'search_items'       => 'Search Jobs',
            'not_found'          => 'No jobs found.',
            'not_found_in_trash' => 'No jobs found in Trash.'
        );

        $args = array(
            'labels'             => $labels,
            'public'             => false,
            'show_ui'            => false, // We use our own custom UI
            'capability_type'    => 'post',
            'hierarchical'       => false,
            'supports'           => array( 'title' ),
            'rewrite'            => false,
            'query_var'          => true,
        );

        register_post_type( 'newslan_job', $args );
    }

    public function create_job( $data ) {
        $post_id = wp_insert_post( array(
            'post_title'   => $data['job_name'],
            'post_status'  => 'publish',
            'post_type'    => 'newslan_job',
        ));

        if ( $post_id ) {
            $this->update_job_meta( $post_id, $data );
            return $post_id;
        }
        return false;
    }

    public function update_job_meta( $post_id, $data ) {
        $fields = array(
            'job_type',
            'keyword',
            'rss_url',
            'category',
            'publish_status',
            'max_articles',
            'writing_style',
            'article_model',
            'image_mode',
            'thumbnail_style',
            'ai_idea',
        );

        foreach ( $fields as $field ) {
            if ( isset( $data[$field] ) ) {
                update_post_meta( $post_id, '_newslan_job_' . $field, sanitize_text_field( $data[$field] ) );
            }
        }

        // Generate secret key if not exists (for external cron trigger)
        $secret = get_post_meta( $post_id, '_newslan_job_secret', true );
        if ( empty( $secret ) ) {
            $secret = wp_generate_password( 32, false );
            update_post_meta( $post_id, '_newslan_job_secret', $secret );
        }
    }

    public function run_job( $job_id ) {
        // License Guard
        require_once plugin_dir_path( __FILE__ ) . 'class-newslan-license.php';
        if ( ! Newslan_License_Manager::get_instance()->is_valid() ) {
            return "Error: Lisensi tidak valid atau sudah kadaluarsa. Silakan periksa pengaturan lisensi.";
        }

        $job_type    = get_post_meta( $job_id, '_newslan_job_job_type', true );
        $keyword     = get_post_meta( $job_id, '_newslan_job_keyword', true );
        $rss_url     = get_post_meta( $job_id, '_newslan_job_rss_url', true );
        $category    = get_post_meta( $job_id, '_newslan_job_category', true );
        $max_art     = get_post_meta( $job_id, '_newslan_job_max_articles', true ) ?: 3;
        $style       = get_post_meta( $job_id, '_newslan_job_writing_style', true );
        $model       = get_post_meta( $job_id, '_newslan_job_article_model', true ) ?: 'Straight News';
        $status      = get_post_meta( $job_id, '_newslan_job_publish_status', true );
        $image_mode  = get_post_meta( $job_id, '_newslan_job_image_mode', true ) ?: 'rss';
        $thumb_style = get_post_meta( $job_id, '_newslan_job_thumbnail_style', true ) ?: 'editorial_vector';
        $ai_idea     = get_post_meta( $job_id, '_newslan_job_ai_idea', true );

        $grabber   = Newslan_Grabber::get_instance();
        $ai_writer = Newslan_AI_Writer::get_instance();
        $img_gen   = Newslan_Image_Generator::get_instance();

        $source_contents = array();
        $synthesis       = null;
        
        // 1. Fetch or Generate
        if ( $job_type === 'keyword' ) {
            $search_url = "https://news.google.com/rss/search?q=" . urlencode( $keyword ) . "&hl=id&gl=ID&ceid=ID:id";
            $articles = $grabber->fetch_rss( $search_url );
            if ( ! $articles ) return "Gagal mengambil data dari sumber (RSS/Search).";
        } else if ( $job_type === 'rss_watcher' ) {
            $articles = $grabber->fetch_rss( $rss_url );
            if ( ! $articles ) return "Gagal mengambil data dari sumber (RSS/Search).";
        } else if ( $job_type === 'ai_editor' ) {
            if ( empty( $ai_idea ) ) return "Ide Utama kosong. Silakan isi ide artikel.";
            $synthesis = $ai_writer->write_from_idea( $ai_idea, $style, $model );
            if ( ! $synthesis ) return "AI Writer Gagal: " . $ai_writer->get_last_error();
        } else {
            return "Tipe job tidak dikenal.";
        }

        // 2. Prepare Sources (for RSS/Keyword)
        if ( empty( $synthesis ) ) {
            $count = 0;
            $processed_links = array();
            foreach ( $articles as $article ) {
                if ( $count >= (int)$max_art ) break;
                
                if ( $this->is_link_processed( $article['link'] ) ) continue;

                $extracted = $grabber->extract_content( $article['link'] );
                if ( $extracted && strlen( $extracted['content'] ) > 200 ) {
                    $source_contents[] = array(
                        'title'      => $extracted['title'] ?: $article['title'],
                        'content'    => $extracted['content'],
                        'sourceName' => $article['source'],
                        'image'      => $extracted['image'],
                        'link'       => $article['link']
                    );
                    $processed_links[] = $article['link'];
                    $count++;
                }
            }

            if ( empty( $source_contents ) ) return "Tidak ada artikel baru yang valid untuk diproses.";

            // 3. Synthesize with AI
            $synthesis = $ai_writer->synthesize_from_multiple_sources( $source_contents, $style, $model );
            if ( ! $synthesis ) return "AI Synthesis Gagal: " . $ai_writer->get_last_error();
        }

        // 4. Determine Image logic (similar to manual tools)
        $final_image = '';
        if ( $image_mode === 'generate_ai' ) {
            $final_image = $img_gen->generate_article_image( $synthesis['title'], $synthesis['content'], $thumb_style );
        } elseif ( $image_mode === 'rss' || $image_mode === 'pixabay' ) {
            // Priority 1: RSS media namespace
            if ( $image_mode === 'rss' && ! empty( $source_contents[0]['image'] ) ) {
                $final_image = $source_contents[0]['image'];
            }
            // Priority 2: OG:Image from actual URL
            if ( $image_mode === 'rss' && empty( $final_image ) ) {
                $final_image = $grabber->fetch_og_image( $source_contents[0]['link'] );
            }
            // Fallback Priority 3: Pixabay
            if ( empty( $final_image ) && $image_mode !== 'none' ) {
                $final_image = $grabber->fetch_pixabay_image( $synthesis['title'] );
            }
        }

        // 5. Create Post
        $post_data = array(
            'post_title'    => $synthesis['title'],
            'post_content'  => $synthesis['content'],
            'post_status'   => $status,
            'post_category' => array( $category ),
        );

        $new_post_id = wp_insert_post( $post_data );

        if ( $new_post_id ) {
            // Sideload image if available
            if ( ! empty( $final_image ) ) {
                require_once ABSPATH . 'wp-admin/includes/image.php';
                require_once ABSPATH . 'wp-admin/includes/file.php';
                require_once ABSPATH . 'wp-admin/includes/media.php';
                
                $id = media_sideload_image( $final_image, $new_post_id, $synthesis['title'], 'id' );
                if ( ! is_wp_error( $id ) ) {
                    set_post_thumbnail( $new_post_id, $id );
                }
            }
            // Mark all sources as processed
            foreach ( $processed_links as $link ) {
                add_post_meta( $new_post_id, '_newslan_source_url', $link );
            }
            return "Success: Berhasil memposting artikel \"" . $synthesis['title'] . "\"";
        }

        return "Internal Error: Gagal membuat artikel di WordPress.";
    }

    private function is_link_processed( $link ) {
        global $wpdb;
        $processed = $wpdb->get_var( $wpdb->prepare(
            "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_newslan_source_url' AND meta_value = %s LIMIT 1",
            $link
        ));
        return !empty($processed);
    }

    public function get_jobs() {
        return get_posts( array(
            'post_type'      => 'newslan_job',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC'
        ));
    }

    public function delete_job( $job_id ) {
        return wp_delete_post( $job_id, true );
    }
}
