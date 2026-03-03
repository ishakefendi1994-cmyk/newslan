<?php
/**
 * Handle RSS Fetching and Content Extraction
 */
class Flazz_Grabber {

    private static $instance = null;

    public static function get_instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Fetch items from an RSS feed URL
     *
     * @param string $url RSS feed URL
     * @return array|false Array of articles or false on failure
     */
    public function fetch_rss( $url, $limit_override = 0 ) {
        error_log( '[Flazz AI] Grabber::fetch_rss - URL: ' . $url );

        $limit = $limit_override > 0 ? (int) $limit_override : (int) get_option( 'flazz_ai_fetch_limit', 10 );
        if ( $limit < 1 ) $limit = 5;

        // ── Step 1: Fetch content via wp_remote_get with custom User-Agent ──
        $response = wp_remote_get( $url, array(
            'timeout'   => 20,
            'sslverify' => false,
            'headers'   => array(
                'User-Agent' => 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            ),
        ) );

        if ( is_wp_error( $response ) ) {
            error_log( '[Flazz AI] Grabber::fetch_rss - HTTP Error: ' . $response->get_error_message() );
            return false;
        }

        $xml_body = wp_remote_retrieve_body( $response );
        $code     = wp_remote_retrieve_response_code( $response );

        if ( empty( $xml_body ) ) {
            error_log( '[Flazz AI] Grabber::fetch_rss - Empty body received (HTTP ' . $code . ')' );
            return false;
        }

        // ── Step 2: Parse via SimpleXML ──
        if ( ! function_exists( 'simplexml_load_string' ) ) {
            error_log( '[Flazz AI] Grabber::fetch_rss - SimpleXML extension missing' );
            return false;
        }

        libxml_use_internal_errors( true );
        $xml = @simplexml_load_string( $xml_body );
        
        if ( ! $xml ) {
            $errors = libxml_get_errors();
            foreach ( $errors as $error ) {
                error_log( '[Flazz AI] XML Error: ' . trim( $error->message ) );
            }
            libxml_clear_errors();
            return false;
        }
        libxml_clear_errors();

        if ( ! isset( $xml->channel->item ) ) {
            error_log( '[Flazz AI] Grabber::fetch_rss - No <item> found in <channel>' );
            return false;
        }

        $articles = array();
        $source_title = (string) $xml->channel->title;

        foreach ( $xml->channel->item as $item ) {
            if ( count( $articles ) >= $limit ) break;

            $title       = (string) $item->title;
            $link        = (string) $item->link;
            $description = (string) $item->description;
            $pub_date    = (string) $item->pubDate;
            $source_name = isset( $item->source ) ? (string) $item->source : $source_title;

            // Image extraction
            $image = '';
            $media = $item->children( 'http://search.yahoo.com/mrss/' );
            if ( ! empty( $media->content ) ) {
                $attrs = $media->content->attributes();
                if ( ! empty( $attrs['url'] ) ) $image = (string) $attrs['url'];
            }
            if ( empty( $image ) && ! empty( $media->thumbnail ) ) {
                $t_attrs = $media->thumbnail->attributes();
                if ( ! empty( $t_attrs['url'] ) ) $image = (string) $t_attrs['url'];
            }
            if ( empty( $image ) && preg_match( '/<img[^>]+src=["\']([^"\']+)["\']/', $description, $img_m ) ) {
                $image = $img_m[1];
            }

            $articles[] = array(
                'title'       => $title,
                'link'        => $link,
                'description' => $description,
                'date'        => $pub_date,
                'source'      => $source_name,
                'image'       => $image,
            );
        }

        error_log( '[Flazz AI] Grabber::fetch_rss - Found ' . count( $articles ) . ' items' );
        return $articles;
    }

    public function feed_cache_lifetime( $lifetime ) {
        return 60; // 60 seconds only
    }

    /**
     * Extract full article content from a URL.
     * Uses DOMDocument if available, otherwise falls back to plain text.
     *
     * @param string $url Article URL
     * @return array|false Associative array with title, content, image or false
     */
    public function extract_content( $url ) {
        error_log( '[Flazz AI] Grabber::extract_content - URL: ' . $url );

        $response = wp_remote_get( $url, array(
            'user-agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'timeout'    => 10,
            'sslverify'  => false,
        ) );

        if ( is_wp_error( $response ) ) {
            error_log( '[Flazz AI] Grabber::extract_content - WP_Error: ' . $response->get_error_message() );
            return false;
        }

        $http_code = wp_remote_retrieve_response_code( $response );
        $html      = wp_remote_retrieve_body( $response );

        if ( $http_code !== 200 || empty( $html ) ) {
            error_log( '[Flazz AI] Grabber::extract_content - Bad response code: ' . $http_code );
            return false;
        }

        // Try DOMDocument-based extraction
        if ( class_exists( 'DOMDocument' ) && class_exists( 'DOMXPath' ) ) {
            return $this->extract_with_dom( $html, $url );
        }

        // Fallback: strip all tags and return raw text
        error_log( '[Flazz AI] Grabber::extract_content - DOMDocument not available, using fallback' );
        return $this->extract_fallback( $html, $url );
    }

    private function extract_with_dom( $html, $url ) {
        $dom = new DOMDocument();
        libxml_use_internal_errors( true );

        $charset_html = mb_convert_encoding( $html, 'HTML-ENTITIES', 'UTF-8' );
        @$dom->loadHTML( $charset_html );
        libxml_clear_errors();

        $xpath = new DOMXPath( $dom );

        // Content selectors — from most specific to least
        $selectors = array(
            "//div[contains(@class,'detail__body-text')]",
            "//div[contains(@class,'read__content')]",
            "//div[contains(@class,'detail-text')]",
            "//div[contains(@class,'article-content')]",
            "//div[contains(@class,'content-detail')]",
            "//div[contains(@class,'post-content')]",
            "//article",
            "//div[contains(@class,'entry-content')]",
        );

        $raw_content = '';
        foreach ( $selectors as $selector ) {
            $nodes = $xpath->query( $selector );
            if ( $nodes && $nodes->length > 0 ) {
                $raw_content = $dom->saveHTML( $nodes->item(0) );
                break;
            }
        }

        // Fallback: body text
        if ( empty( $raw_content ) ) {
            $body_nodes = $xpath->query( '//body' );
            if ( $body_nodes && $body_nodes->length > 0 ) {
                $raw_content = $dom->saveHTML( $body_nodes->item(0) );
            }
        }

        $cleaned = strip_tags( $raw_content );
        $cleaned = preg_replace( '/\s+/', ' ', $cleaned );
        $cleaned = trim( $cleaned );

        // Title
        $title = '';
        $title_nodes = $xpath->query( '//h1' );
        if ( $title_nodes && $title_nodes->length > 0 ) {
            $title = trim( $title_nodes->item(0)->nodeValue );
        }
        if ( empty( $title ) ) {
            $title_nodes = $xpath->query( '//title' );
            if ( $title_nodes && $title_nodes->length > 0 ) {
                $title = trim( $title_nodes->item(0)->nodeValue );
            }
        }

        // OG Image
        $image = '';
        $og_nodes = $xpath->query( "//meta[@property='og:image']" );
        if ( $og_nodes && $og_nodes->length > 0 ) {
            $image = $og_nodes->item(0)->getAttribute('content');
        }

        error_log( '[Flazz AI] Grabber::extract_with_dom - content_len=' . strlen( $cleaned ) . ' title=' . $title );

        return array(
            'title'   => $title,
            'content' => $cleaned,
            'image'   => $image,
        );
    }

    private function extract_fallback( $html, $url ) {
        $text = strip_tags( $html );
        $text = preg_replace( '/\s+/', ' ', $text );
        $text = trim( $text );

        // Extract title from <title> tag via regex
        $title = '';
        if ( preg_match( '/<title>(.*?)<\/title>/is', $html, $m ) ) {
            $title = strip_tags( $m[1] );
        }

        // OG Image via regex
        $image = '';
        if ( preg_match( '/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/', $html, $m ) ) {
            $image = $m[1];
        } elseif ( preg_match( '/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']/', $html, $m ) ) {
            $image = $m[1];
        }

        return array(
            'title'   => $title,
            'content' => mb_substr( $text, 0, 5000 ),
            'image'   => $image,
        );
    }

    /**
     * Try to retrieve the og:image meta from a URL.
     * Hardened to handle Google News redirects and various meta tag formats.
     */
    public function fetch_og_image( $url ) {
        if ( empty( $url ) ) return false;

        error_log( '[Flazz AI] Grabber::fetch_og_image - URL: ' . $url );

        // If it's a Google News redirect URL, try to follow it
        $resp = wp_remote_get( $url, array(
            'timeout'     => 15,
            'sslverify'   => false,
            'redirection' => 10,
            'headers'     => array(
                'User-Agent'      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept'          => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            ),
        ) );

        if ( is_wp_error( $resp ) ) {
            error_log( '[Flazz AI] Grabber::fetch_og_image - WP_Error: ' . $resp->get_error_message() );
            return false;
        }

        $code = wp_remote_retrieve_response_code( $resp );
        $body = wp_remote_retrieve_body( $resp );

        if ( $code !== 200 || empty( $body ) ) {
            error_log( '[Flazz AI] Grabber::fetch_og_image - HTTP ' . $code );
            return false;
        }

        // Handle meta-refresh redirects (common on some news sites)
        if ( preg_match( '/<meta[^>]+http-equiv=["\']refresh["\'][^>]+content=["\']\d+;\s*url=([^"\']+)["\']/i', $body, $refresh_m ) ) {
            $new_url = str_replace( '&amp;', '&', $refresh_m[1] );
            error_log( '[Flazz AI] Grabber::fetch_og_image - Meta Refresh to: ' . $new_url );
            return $this->fetch_og_image( $new_url );
        }

        // Search for images in head (limit search to first 100KB)
        $head = substr( $body, 0, 100000 );
        $patterns = array(
            '/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/',
            '/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']/',
            '/<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']/',
            '/<meta[^>]+name=["\']image["\'][^>]+content=["\']([^"\']+)["\']/',
            '/<link[^>]+rel=["\']image_src["\'][^>]+href=["\']([^"\']+)["\']/',
        );

        foreach ( $patterns as $pattern ) {
            if ( preg_match( $pattern, $head, $m ) ) {
                $found = html_entity_decode( $m[1] );
                // Ensure absolute URL
                if ( ! empty( $found ) && strpos( $found, 'http' ) === 0 ) {
                    error_log( '[Flazz AI] Grabber::fetch_og_image - Success: ' . $found );
                    return $found;
                }
            }
        }

        error_log( '[Flazz AI] Grabber::fetch_og_image - No image found' );
        return false;
    }

    private function log( $msg ) {
        error_log( '[Flazz AI] Grabber: ' . $msg );
    }

    /**
     * Search Pixabay API for a photo related to a query.
     */
    public function fetch_pixabay_image( $query ) {
        $api_key = get_option( 'flazz_ai_pixabay_key', '' );
        if ( empty( $api_key ) ) return false;

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

        $resp = wp_remote_get( $url, array( 'timeout' => 10 ) );
        if ( is_wp_error( $resp ) ) return false;

        $data = json_decode( wp_remote_retrieve_body( $resp ), true );
        
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
            if ( ! is_wp_error( $resp2 ) ) {
                $data = json_decode( wp_remote_retrieve_body( $resp2 ), true );
            }
        }

        return ! empty( $data['hits'][0]['largeImageURL'] ) ? $data['hits'][0]['largeImageURL'] : false;
    }

    /**
     * Search Google Custom Search API for an image.
     */
    public function fetch_google_image( $query ) {
        $api_key = get_option( 'flazz_ai_google_api_key', '' );
        $cx      = get_option( 'flazz_ai_google_cx', '' );

        if ( empty( $api_key ) || empty( $cx ) ) return false;

        $url = 'https://www.googleapis.com/customsearch/v1?' . http_build_query( array(
            'key'        => $api_key,
            'cx'         => $cx,
            'q'          => $query,
            'searchType' => 'image',
            'num'        => 1,
            'safe'       => 'active',
        ) );

        $resp = wp_remote_get( $url, array( 'timeout' => 10 ) );
        if ( is_wp_error( $resp ) ) return false;

        $data = json_decode( wp_remote_retrieve_body( $resp ), true );
        return ! empty( $data['items'][0]['link'] ) ? $data['items'][0]['link'] : false;
    }
}
