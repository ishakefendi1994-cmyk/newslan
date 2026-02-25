<?php
/**
 * Handle Auto-Job Logic and CPT
 */
class Flazz_Job_Engine {

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
            'name'               => 'Flazz Jobs',
            'singular_name'      => 'Flazz Job',
            'menu_name'          => 'Flazz Jobs',
            'name_admin_bar'     => 'Flazz Job',
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

        register_post_type( 'flazz_job', $args );
    }

    public function create_job( $data ) {
        $job_id = isset( $data['job_id'] ) ? intval( $data['job_id'] ) : 0;

        if ( $job_id ) {
            $post_id = wp_update_post( array(
                'ID'           => $job_id,
                'post_title'   => sanitize_text_field( $data['job_name'] ),
                'post_status'  => 'publish',
            ));
        } else {
            $post_id = wp_insert_post( array(
                'post_title'   => sanitize_text_field( $data['job_name'] ),
                'post_status'  => 'publish',
                'post_type'    => 'flazz_job',
            ));
        }

        if ( $post_id && ! is_wp_error( $post_id ) ) {
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
            'target_language',
            'research_scope',
            'publish_mode',
            'schedule_interval',
            'show_image_source',
            'show_article_source',
        );

        foreach ( $fields as $field ) {
            if ( isset( $data[$field] ) ) {
                update_post_meta( $post_id, '_flazz_job_' . $field, sanitize_text_field( $data[$field] ) );
            }
        }

        // Generate secret key if not exists (for external cron trigger)
        $secret = get_post_meta( $post_id, '_flazz_job_secret', true );
        if ( empty( $secret ) ) {
            $secret = wp_generate_password( 32, false );
            update_post_meta( $post_id, '_flazz_job_secret', $secret );
        }
    }

    public function run_job( $job_id ) {
        // License Guard
        require_once plugin_dir_path( __FILE__ ) . 'class-flazz-license.php';
        if ( ! Flazz_License_Manager::get_instance()->is_valid() ) {
            return "Error: Lisensi tidak valid atau sudah kadaluarsa. Silakan periksa pengaturan lisensi.";
        }

        $job_type    = get_post_meta( $job_id, '_flazz_job_job_type', true );
        $keyword     = get_post_meta( $job_id, '_flazz_job_keyword', true );
        $rss_url     = get_post_meta( $job_id, '_flazz_job_rss_url', true );
        $category    = get_post_meta( $job_id, '_flazz_job_category', true );
        $max_art     = get_post_meta( $job_id, '_flazz_job_max_articles', true ) ?: 3;
        $style       = get_post_meta( $job_id, '_flazz_job_writing_style', true );
        $model       = get_post_meta( $job_id, '_flazz_job_article_model', true ) ?: 'Straight News';
        $status      = get_post_meta( $job_id, '_flazz_job_publish_status', true );
        $image_mode  = get_post_meta( $job_id, '_flazz_job_image_mode', true ) ?: 'rss';
        $thumb_style = get_post_meta( $job_id, '_flazz_job_thumbnail_style', true ) ?: 'editorial_vector';
        $ai_idea     = get_post_meta( $job_id, '_flazz_job_ai_idea', true );
        $target_lang = get_post_meta( $job_id, '_flazz_job_target_language', true ) ?: 'Indonesian';
        $scope       = get_post_meta( $job_id, '_flazz_job_research_scope', true ) ?: 'local';

        $grabber   = Flazz_Grabber::get_instance();
        $ai_writer = Flazz_AI_Writer::get_instance();
        $img_gen   = Flazz_Image_Generator::get_instance();

        $source_contents = array();
        $synthesis       = null;
        
        // 1. Fetch or Generate
        if ( $job_type === 'keyword' ) {
            $lang_param = ( $scope === 'global' ) ? 'hl=en&gl=US&ceid=US:en' : 'hl=id&gl=ID&ceid=ID:id';
            $search_url = "https://news.google.com/rss/search?q=" . urlencode( $keyword ) . "&" . $lang_param;
            $articles = $grabber->fetch_rss( $search_url, 50 ); // Deep search (50 items) to find unprocessed variety
            if ( ! $articles ) return "Gagal mengambil data dari Google News (RSS).";
        } else if ( $job_type === 'rss_watcher' ) {
            $articles = $grabber->fetch_rss( $rss_url, 50 ); // Deep fetch for RSS to skip duplicates
            if ( ! $articles ) return "Gagal mengambil data dari sumber RSS.";
        } else if ( $job_type === 'ai_editor' ) {
            if ( empty( $ai_idea ) ) return "Ide Utama kosong. Silakan isi ide artikel.";
            $synthesis = $ai_writer->write_from_idea( $ai_idea, $style, $model, $target_lang );
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

                $content = '';
                $title   = $article['title'];
                $image   = $article['image'];

                if ( $job_type === 'keyword' ) {
                    // Use RSS description (Summary) directly for resilience (same as manual tools)
                    $desc    = ! empty( $article['description'] ) ? $article['description'] : '';
                    $content = wp_strip_all_tags( html_entity_decode( $desc, ENT_QUOTES, 'UTF-8' ) );
                    $content = trim( preg_replace( '/\s+/', ' ', $content ) );

                    // Clean title (remove "- Source Name")
                    $title = preg_replace( '/\s*[-–]\s*[^-–]+$/', '', $title );
                    
                    if ( strlen( $content ) < 30 ) {
                        $content = $title . '. Dipublikasikan oleh ' . $article['source'] . '.';
                    }
                } else {
                    // For RSS Watcher, try full extraction
                    $extracted = $grabber->extract_content( $article['link'] );
                    if ( $extracted && strlen( $extracted['content'] ) > 200 ) {
                        $content = $extracted['content'];
                        $title   = $extracted['title'] ?: $title;
                        $image   = $extracted['image'] ?: $image;
                    }
                }

                if ( ! empty( $content ) ) {
                    $source_contents[] = array(
                        'title'      => $title,
                        'content'    => $content,
                        'sourceName' => $article['source'],
                        'image'      => $image,
                        'link'       => $article['link']
                    );
                    $processed_links[] = $article['link'];
                    $count++;
                }
            }

            if ( empty( $source_contents ) ) return "Tidak ada artikel baru yang valid untuk diproses.";

            // 3. Synthesize with AI
            $synthesis = $ai_writer->synthesize_from_multiple_sources( $source_contents, $style, $model, $target_lang );
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
            if ( $image_mode === 'rss' && empty( $final_image ) && ! empty( $source_contents[0]['link'] ) ) {
                $final_image = $grabber->fetch_og_image( $source_contents[0]['link'] );
            }
            // Fallback Priority 3: Pixabay
            if ( empty( $final_image ) && $image_mode !== 'none' ) {
                $final_image = $grabber->fetch_pixabay_image( $synthesis['title'] );
            }
        }

        // ── Step 5: Determine Publishing Time (Smart Scheduler) ───────────────
        $publish_mode = get_post_meta( $job_id, '_flazz_job_publish_mode', true );
        $interval     = intval( get_post_meta( $job_id, '_flazz_job_schedule_interval', true ) );
        if ( $interval < 5 ) $interval = 60; // Default 1 hour if too low

        $post_status = 'publish';
        $post_date   = '';

        if ( $publish_mode === 'future' ) {
            $post_status = 'future';
            $post_date   = $this->get_next_scheduled_date( $interval );
        }

        // ── Step 6: Internal Linking (SEO Engine) ────────────────────────────
        $content_with_links = $this->add_internal_links( $synthesis['content'], $synthesis['title'] );
        
        // ── Step 6.1: Add Attributions (Article Source & Image Source) ───────
        $show_img_source = get_post_meta( $job_id, '_flazz_job_show_image_source', true ) !== '0'; // Default ON
        $show_art_source = get_post_meta( $job_id, '_flazz_job_show_article_source', true ) !== '0'; // Default ON
        
        $attributions = '';
        
        if ( $show_art_source && ! empty( $source_contents[0]['sourceName'] ) ) {
            $source_name = $source_contents[0]['sourceName'];
            $source_link = $source_contents[0]['link'];
            $attributions .= '<li><strong>Sumber Berita:</strong> <a href="' . esc_url( $source_link ) . '" target="_blank" rel="nofollow noopener">' . esc_html( $source_name ) . '</a></li>';
        }
        
        if ( $show_img_source ) {
            if ( $image_mode === 'generate_ai' ) {
                $attributions .= '<li><strong>Sumber Foto:</strong> Gambar dibuat oleh Flazz AI (Replicate Flux)</li>';
            } elseif ( ! empty( $source_contents[0]['image'] ) ) {
                $source_name = ! empty( $source_contents[0]['sourceName'] ) ? $source_contents[0]['sourceName'] : 'Original Source';
                $attributions .= '<li><strong>Sumber Foto:</strong> ' . esc_html( $source_name ) . ' / RSS Feed</li>';
            } elseif ( $image_mode === 'pixabay' ) {
                $attributions .= '<li><strong>Sumber Foto:</strong> Pixabay (Bebas Royalti)</li>';
            }
        }
        
        if ( ! empty( $attributions ) ) {
            $content_with_links .= '<div class="flazz-source-attribution" style="margin-top: 20px; padding: 10px 15px; background: #fefefe; border: 1px dashed #ddd; border-radius: 5px; font-size: 13px; color: #666;">';
            $content_with_links .= '<ul style="margin: 0; padding: 0; list-style: none;">' . $attributions . '</ul>';
            $content_with_links .= '</div>';
        }

        // ── Step 7: Create Post ───────────────────────────────────────────────
        $post_data = array(
            'post_title'    => $synthesis['title'],
            'post_content'  => $content_with_links,
            'post_status'   => $post_status,
            'post_category' => array( $category ),
        );

        if ( ! empty( $post_date ) ) {
            $post_data['post_date']     = $post_date;
            $post_data['post_date_gmt'] = get_gmt_from_date( $post_date );
            $post_data['edit_date']     = true;
        }

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

            // ── Step 8: AI Enrichment (SEO, Tags, Telegram) ─────────────────────
            $is_auto_cat = ( get_post_meta( $job_id, '_flazz_job_category', true ) === 'auto' );
            $this->log( "run_job: Post $new_post_id created, starting enrichment (auto_cat: " . ($is_auto_cat ? 'YES' : 'NO') . ")" );
            $this->enrich_post( $new_post_id, $synthesis['title'], $synthesis['content'], $is_auto_cat );

            // Mark all sources as processed
            foreach ( $processed_links as $link ) {
                add_post_meta( $new_post_id, '_flazz_source_url', $link );
            }

            $success_msg = "Success: Berhasil memposting artikel \"" . $synthesis['title'] . "\"";
            if ( $post_status === 'future' ) {
                $success_msg .= " (Dijadwalkan untuk: " . $post_date . ")";
            }
            return $success_msg;
        }

        return "Internal Error: Gagal membuat artikel di WordPress.";
    }

    /**
     * Calculate the next available slot for a future post.
     * Finds the latest scheduled post and adds the interval.
     */
    private function get_next_scheduled_date( $interval_minutes ) {
        if ( $interval_minutes < 1 ) $interval_minutes = 60;

        // Find the latest 'future' post
        $latest = get_posts( array(
            'post_type'      => 'post',
            'post_status'    => 'future',
            'posts_per_page' => 1,
            'orderby'        => 'post_date',
            'order'          => 'DESC',
        ) );

        $base_time = current_time( 'timestamp' );

        if ( ! empty( $latest ) ) {
            $latest_time = strtotime( $latest[0]->post_date );
            // If the latest scheduled post is still in the future, use it as baseline
            if ( $latest_time > $base_time ) {
                $base_time = $latest_time;
            }
        }

        $next_time = $base_time + ( $interval_minutes * 60 );
        return date( 'Y-m-d H:i:s', $next_time );
    }

    private function is_link_processed( $link ) {
        global $wpdb;
        $processed = $wpdb->get_var( $wpdb->prepare(
            "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_flazz_source_url' AND meta_value = %s LIMIT 1",
            $link
        ));
        return !empty($processed);
    }

    /**
     * Internal Linking Engine:
     * Appends related links to improve SEO and internal structure.
     */
    public function add_internal_links( $content, $title ) {
        // Search related posts by title words
        $words = explode( ' ', $title );
        $query_words = array_slice( $words, 0, 3 ); // Pick first 3 words
        $s_query = implode( ' ', $query_words );

        $related = get_posts( array(
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => 2,
            's'              => $s_query,
            'orderby'        => 'relevance',
        ) );

        if ( empty( $related ) || count( $related ) < 1 ) {
            // Fallback: just get latest posts if no match
            $related = get_posts( array(
                'post_type'      => 'post',
                'post_status'    => 'publish',
                'posts_per_page' => 2,
            ) );
        }

        if ( ! empty( $related ) ) {
            $links_html = '<div class="flazz-internal-links" style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 4px solid #2271b1;">';
            $links_html .= '<h3 style="margin-top: 0; font-size: 18px;">Baca Juga:</h3><ul style="margin-bottom: 0;">';
            
            foreach ( $related as $rel_post ) {
                $links_html .= '<li><a href="' . get_permalink( $rel_post->ID ) . '" title="' . esc_attr( $rel_post->post_title ) . '"><strong>' . esc_html( $rel_post->post_title ) . '</strong></a></li>';
            }
            
            $links_html .= '</ul></div>';
            $content .= $links_html;
        }

        return $content;
    }

    /**
     * AI Article Enrichment:
     * Handles SEO, Taxonomy (Tags/Category), and Notifications in one go.
     */
    public function enrich_post( $post_id, $title, $content, $force_auto_cat = false ) {
        // Step 1: SEO Meta
        $this->generate_and_save_seo_meta( $post_id, $title, $content );

        // Step 2: Taxonomy (Tags & Auto-Category)
        $this->suggest_and_apply_taxonomy( $post_id, $title, $content, $force_auto_cat );

        // Step 3: Telegram Notification
        $this->send_telegram( $post_id, $title, get_permalink( $post_id ) );
    }

    private function generate_and_save_seo_meta( $post_id, $title, $content ) {
        $api_url = 'https://www.cryptotechnews.net/api/ai/orchestrator';
        $license = get_option( 'flazz_ai_license_key' );
        $api_key = get_option( 'flazz_ai_groq_key' );
        $token   = get_option( 'flazz_ai_site_access_token' );
        $text_model = get_option( 'flazz_ai_text_model', 'llama-3.3-70b-versatile' );

        $response = wp_remote_post( $api_url, array(
            'timeout' => 30,
            'headers' => array( 
                'Content-Type'  => 'application/json',
                'X-Flazz-Token' => $token
            ),
            'body'    => json_encode( array(
                'action'      => 'generate_seo',
                'license_key' => $license,
                'domain'      => parse_url( home_url(), PHP_URL_HOST ),
                'api_key'     => $api_key,
                'payload'     => array( 
                    'title' => $title, 
                    'content' => mb_substr($content, 0, 1000),
                    'text_model' => $text_model
                )
            ))
        ));

        if ( ! is_wp_error( $response ) && wp_remote_retrieve_response_code( $response ) === 200 ) {
            $body = json_decode( wp_remote_retrieve_body( $response ), true );
            if ( isset( $body['success'] ) && $body['success'] === true && ! empty( $body['data'] ) ) {
                $seo = $body['data'];
                update_post_meta( $post_id, '_yoast_wpseo_title', $seo['title'] );
                update_post_meta( $post_id, '_yoast_wpseo_metadesc', $seo['description'] );
                update_post_meta( $post_id, '_rank_math_title', $seo['title'] );
                update_post_meta( $post_id, '_rank_math_description', $seo['description'] );
            }
        }
    }

    private function suggest_and_apply_taxonomy( $post_id, $title, $content, $force_auto_cat = false ) {
        $categories = get_categories( array( 'hide_empty' => 0 ) );
        $cat_names  = array_map( function($c){ return $c->name; }, $categories );

        $api_url = 'https://www.cryptotechnews.net/api/ai/orchestrator';
        $license = get_option( 'flazz_ai_license_key' );
        $api_key = get_option( 'flazz_ai_groq_key' );
        $token   = get_option( 'flazz_ai_site_access_token' );
        $text_model = get_option( 'flazz_ai_text_model', 'llama-3.3-70b-versatile' );

        $response = wp_remote_post( $api_url, array(
            'timeout' => 30,
            'headers' => array( 
                'Content-Type'  => 'application/json',
                'X-Flazz-Token' => $token
            ),
            'body'    => json_encode( array(
                'action'      => 'suggest_taxonomy',
                'license_key' => $license,
                'domain'      => parse_url( home_url(), PHP_URL_HOST ),
                'api_key'     => $api_key,
                'payload'     => array( 
                    'title' => $title, 
                    'content' => mb_substr($content, 0, 1000), 
                    'categories' => $cat_names,
                    'text_model' => $text_model
                )
            ))
        ));

        if ( ! is_wp_error( $response ) && wp_remote_retrieve_response_code( $response ) === 200 ) {
            $body = json_decode( wp_remote_retrieve_body( $response ), true );
            if ( isset( $body['success'] ) && $body['success'] === true && ! empty( $body['data'] ) ) {
                $data = $body['data'];
                if ( ! empty( $data['tags'] ) ) {
                    wp_set_post_tags( $post_id, $data['tags'], true );
                }
                if ( $force_auto_cat && isset( $data['category_index'] ) ) {
                    $idx = (int) $data['category_index'];
                    if ( isset( $categories[$idx] ) ) {
                        wp_set_post_categories( $post_id, array( $categories[$idx]->term_id ) );
                    }
                }
            }
        }
    }

    public function send_telegram( $post_id, $title, $url ) {
        $token   = get_option( 'flazz_ai_telegram_token' );
        $chat_id = get_option( 'flazz_ai_telegram_chat_id' );

        if ( empty( $token ) || empty( $chat_id ) ) return;

        $message = "🚀 *Berita Baru Terbit!*\n\n";
        $message .= "📌 *{$title}*\n\n";
        $message .= "🔗 [Baca Selengkapnya]({$url})";

        wp_remote_post( "https://api.telegram.org/bot{$token}/sendMessage", array(
            'body' => array(
                'chat_id'                  => $chat_id,
                'text'                     => $message,
                'parse_mode'               => 'Markdown',
                'disable_web_page_preview' => false,
            )
        ));
    }

    public function get_jobs() {
        return get_posts( array(
            'post_type'      => 'flazz_job',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC'
        ));
    }

    private function log( $msg ) {
        if ( class_exists( 'Flazz_Admin' ) ) {
            Flazz_Admin::get_instance()->log( $msg );
        } else {
            error_log( '[Flazz AI] ' . $msg );
        }
    }

    public function delete_job( $job_id ) {
        return wp_delete_post( $job_id, true );
    }
}
