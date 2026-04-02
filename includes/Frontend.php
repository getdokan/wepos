<?php
namespace WeDevs\WePOS;

/**
 * Frontend Pages Handler
 */
class Frontend {

    public function __construct() {
        add_action( 'wp_head', [ $this, 'reset_head_style' ], 7 );
        add_action( 'wp_head', [ $this, 'reset_head_scripts' ], 8 );
        add_action( 'wepos_footer', [ $this, 'wp_print_footer_scripts' ], 20 );
        add_action( 'wp_head', [ $this, 'enqueue_scripts' ], 999 );
        add_action( 'template_redirect', [ $this, 'rewrite_templates' ], 1 );
        add_filter( 'show_admin_bar', [ $this, 'remove_admin_bar' ] );
        add_filter( 'document_title_parts', [ $this, 'render_page_title' ], 20 );

        // Show 'View POS' menu on my account page
        add_filter ( 'woocommerce_account_menu_items', [ $this, 'add_my_account_view_pos_menu' ], 20, 1 );
        add_filter( 'woocommerce_get_endpoint_url', [ $this, 'view_pos_menu_endpoint' ] , 10, 4 );
    }

    /**
     * Render footer content its own style
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function wp_print_footer_scripts() {
        do_action( 'wp_print_footer_scripts' );
    }

    /**
     * Load our template on our rewrite rule
     *
     * @return void
     */
    public function rewrite_templates() {
        if ( wp_validate_boolean( get_query_var( 'wepos' ) ) ) {
            // Redirect to login if not authenticated
            if ( ! is_user_logged_in() ) {
                wp_redirect( get_permalink( get_option( 'woocommerce_myaccount_page_id' ) ) );
                exit();
            }

            // Show permission denied if user cannot access POS
            if ( ! wepos_is_frontend() ) {
                wp_die(
                    esc_html__( 'You do not have sufficient permissions to access this page.', 'wepos' ),
                    esc_html__( 'Access Denied', 'wepos' ),
                    [ 'response' => 403 ]
                );
            }

            include_once WEPOS_PATH . '/templates/wepos.php';
            exit;
        }
    }

    /**
     * Remove admin bar
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function remove_admin_bar( $show ) {
        if ( wepos_is_frontend() ) {
            return false;
        }

        return $show;
    }

    /**
     * Reset all register styles from WP or Other plugins
     *
     * @return void
     */
    public function reset_head_style() {
        if ( wepos_is_frontend() ) {
            $wp_styles = wp_styles();
            $wp_styles->queue = [];
        }
    }

    /**
     * Reset all scripts
     *
     * @return void
     */
    public function reset_head_scripts() {
        if ( wepos_is_frontend() ) {
            $wp_scripts = wp_scripts();
            $wp_scripts->queue = [];
        }
    }

    /**
     * Enqueue all scripts
     *
     * @return void
     */
    public function enqueue_scripts() {
        if ( wepos_is_frontend() ) {
            do_action( 'wepos_enqueue_scripts' );
        }
    }

    /**
     * Render page title
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function render_page_title( $title ) {
        if ( wepos_is_frontend() ) {
            $title['title'] = apply_filters( 'wepos_page_document_title', __( 'Point of Sale', 'wepos' ) );
        }

        return $title;
    }

    /**
     * Adds view pos menu to my account page.
     *
     * @since  1.2.5
     *
     * @param  $menu_links
     *
     * @return array
     */
    public function add_my_account_view_pos_menu( $menu_links ) {
        $logout_index = array_search( "customer-logout", array_keys( $menu_links ) );

        $menu_links = array_slice( $menu_links, 0, $logout_index, true ) +
                      [ "view-wepos" => __( 'View POS', 'wepos' ) ] +
                      array_slice( $menu_links, $logout_index, count( $menu_links ) - 1, true );
        return $menu_links;
    }

    /**
     * Handles view pos menu endpoint.
     *
     * @since 1.2.5
     *
     * @param  $url
     * @param  $endpoint
     * @param  $value
     * @param  $permalink
     *
     * @return string
     */
    public function view_pos_menu_endpoint( $url, $endpoint, $value, $permalink ) {
        if ( 'view-wepos' === $endpoint ) {
            $url = untrailingslashit( get_site_url() ) . '/wepos/#';
        }

        return $url;
    }
}
