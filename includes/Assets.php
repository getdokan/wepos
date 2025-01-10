<?php
namespace WeDevs\WePOS;

/**
 * Scripts and Styles Class
 */
class Assets {

    function __construct() {

        if ( is_admin() ) {
            add_action( 'admin_enqueue_scripts', [ $this, 'register' ], 5 );
        } else {
            add_action( 'wepos_enqueue_scripts', [ $this, 'register' ], 5 );
        }
    }

    /**
     * Register our app scripts and styles
     *
     * @return void
     */
    public function register() {
        $this->register_scripts( $this->get_scripts() );
        $this->register_styles( $this->get_styles() );
        $this->enqueue_all_scripts();
        $this->register_localize();
    }

    /**
     * Register scripts
     *
     * @param  array $scripts
     *
     * @return void
     */
    private function register_scripts( $scripts ) {
        foreach ( $scripts as $handle => $script ) {
            $deps      = isset( $script['deps'] ) ? $script['deps'] : false;
            $in_footer = isset( $script['in_footer'] ) ? $script['in_footer'] : false;
            $version   = isset( $script['version'] ) ? $script['version'] : WEPOS_VERSION;

            wp_register_script( $handle, $script['src'], $deps, $version, $in_footer );
        }
    }

    /**
     * Register styles
     *
     * @param  array $styles
     *
     * @return void
     */
    public function register_styles( $styles ) {
        foreach ( $styles as $handle => $style ) {
            $deps = isset( $style['deps'] ) ? $style['deps'] : false;

            wp_register_style( $handle, $style['src'], $deps, WEPOS_VERSION );
        }
    }

    /**
     * Get all registered scripts
     *
     * @return array
     */
    public function get_scripts() {
        global $wp_version;

        $prefix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';
        $dependency = [ 'jquery', 'wepos-i18n-jed' ];

        if ( version_compare( $wp_version, '5.0', '<' ) ) {
            $dependency[] = 'wepos-wp-hook';
        }

        if ( ! is_admin() ) {
            $dependency[] = 'wepos-wp-hook';
        }

        $scripts = [
            'wepos-tinymce' => array(
                'src'       => site_url( '/wp-includes/js/tinymce/tinymce.min.js' ),
                'deps'      => array()
            ),
            'wepos-tinymce-plugin' => array(
                'src'     => WEPOS_ASSETS . '/vendors/tinymce/code/plugin.min.js',
                'deps'    => array('wepos-tinymce'),
                'version' => time()
            ),
            'wepos-i18n-jed' => array(
                'src'       => WEPOS_ASSETS . '/js/jed.js',
                'version'   => filemtime( WEPOS_PATH . '/assets/js/jed.js' ),
                'in_footer' => false
            ),
            'wepos-blockui' => [
                'src'       => WC()->plugin_url() . '/assets/js/jquery-blockui/jquery.blockUI.min.js',
                'deps'      => array( 'jquery' ),
                'in_footer' => true
            ],
            'wepos-accounting' => array(
                'src'       => WC()->plugin_url() . '/assets/js/accounting/accounting.min.js',
                'deps'      => array( 'jquery' )
            ),
            'wepos-vendor' => [
                'src'       => WEPOS_ASSETS . '/js/vendor'. $prefix .'.js',
                'version'   => filemtime( WEPOS_PATH . '/assets/js/vendor'. $prefix .'.js' ),
                'in_footer' => true
            ],
            'wepos-select2' => [
                'src'       => WEPOS_ASSETS . '/js/select2.min.js',
                'version'   => filemtime( WEPOS_PATH . '/assets/js/select2.min.js' ),
                'in_footer' => true
            ],
            'wepos-bootstrap' => [
                'src'       => WEPOS_ASSETS . '/js/bootstrap'. $prefix .'.js',
                'deps'      => $dependency,
                'version'   => filemtime( WEPOS_PATH . '/assets/js/bootstrap'. $prefix .'.js' ),
                'in_footer' => true
            ],
            'wepos-frontend' => [
                'src'       => WEPOS_ASSETS . '/js/frontend'. $prefix .'.js',
                'version'   => filemtime( WEPOS_PATH . '/assets/js/frontend'. $prefix .'.js' ),
                'in_footer' => true
            ],
            'wepos-admin' => [
                'src'       => WEPOS_ASSETS . '/js/admin'. $prefix .'.js',
                'version'   => filemtime( WEPOS_PATH . '/assets/js/admin'. $prefix .'.js' ),
                'in_footer' => true
            ],
            'wepos-wp-hook' => array(
                'src'       => WEPOS_ASSETS . '/js/wphook'. $prefix .'.js',
                'deps'      => array( 'jquery' ),
                'version'   => filemtime( WEPOS_PATH . '/assets/js/wphook'. $prefix .'.js' ),
            )
        ];

        return $scripts;
    }

    /**
     * Get registered styles
     *
     * @return array
     */
    public function get_styles() {
        $prefix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

        $styles = [
            'wepos-flaticon' => [
                'src' =>  WEPOS_ASSETS . '/css/flaticon.css'
            ],
            'wepos-font' => [
                'src' =>  WEPOS_ASSETS . '/css/fonts.css'
            ],
            'wepos-style' => [
                'src' =>  WEPOS_ASSETS . '/css/style' . $prefix . '.css'
            ],
            'wepos-bootstrap' => [
                'src' =>  WEPOS_ASSETS . '/css/bootstrap' . $prefix . '.css'
            ],
            'wepos-frontend' => [
                'src' =>  WEPOS_ASSETS . '/css/frontend' . $prefix . '.css'
            ],
            'wepos-admin' => [
                'src' =>  WEPOS_ASSETS . '/css/admin' . $prefix . '.css'
            ],
            'wepos-tinymce' => [
                'src'     => site_url( '/wp-includes/css/editor.css' ),
                'deps'    => array(),
                'version' => time()
            ],
            'wepos-select2' => [
                'src' =>  WEPOS_ASSETS . '/css/select2.min.css'
            ],
        ];

        return $styles;
    }

    public function enqueue_all_scripts() {
        if ( ! is_admin() ) {
            // Enqueue all style
            wp_enqueue_style( 'wepos-flaticon' );
            wp_enqueue_style( 'wepos-font' );
            wp_enqueue_style( 'wepos-style' );
            wp_enqueue_style( 'wepos-bootstrap' );
            wp_enqueue_style( 'wepos-frontend' );
            wp_enqueue_style( 'wepos-select2' );

            // Load scripts
            wp_enqueue_script( 'wepos-blockui' );
            wp_enqueue_script( 'wepos-accounting' );
            wp_enqueue_script( 'wepos-vendor' );
            wp_enqueue_script( 'wepos-bootstrap' );
            wp_enqueue_script( 'heartbeat' );
            wp_enqueue_script( 'wepos-select2' );

            do_action( 'wepos_load_forntend_scripts' );

            wp_enqueue_script( 'wepos-frontend' );
        }
    }

    /**
     * Set localize script data
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function register_localize() {
        $localize_data = apply_filters( 'wepos_localize_data', [
            'rest' => array(
                'root'    => esc_url_raw( get_rest_url() ),
                'nonce'   => wp_create_nonce( 'wp_rest' ),
                'wcversion' => 'wc/v3',
                'posversion' => 'wepos/v1',
            ),
            'ajaxurl'                      => admin_url( 'admin-ajax.php' ),
            'nonce'                        => wp_create_nonce( 'wepos_nonce' ),
            'libs'                         => [],
            'routeComponents'              => array( 'default' => null ),
            'routes'                       => $this->get_vue_admin_routes(),
            'i18n'                         => array( 'wepos' => wepos_get_jed_locale_data( 'wepos' ) ),
            'mon_decimal_point'            => wc_get_price_decimal_separator(),
            'currency_format_num_decimals' => wc_get_price_decimals(),
            'currency_format_symbol'       => get_woocommerce_currency_symbol(),
            'currency_format_decimal_sep'  => esc_attr( wc_get_price_decimal_separator() ),
            'currency_format_thousand_sep' => esc_attr( wc_get_price_thousand_separator() ),
            'currency_format'              => esc_attr( str_replace( array( '%1$s', '%2$s' ), array( '%s', '%v' ), get_woocommerce_price_format() ) ), // For accounting JS
            'rounding_precision'           => wc_get_rounding_precision(),
            'admin_url'                    => get_admin_url(),
            'assets_url'                   => WEPOS_ASSETS,
            'placeholder_image'            => wc_placeholder_img_src(),
            'ajax_loader'                  => WEPOS_ASSETS . '/images/spinner-2x.gif',
            'logout_url'                   => wp_logout_url( site_url() ),
            'categories'                   => wepos_get_product_category(),
            'countries'                    => WC()->countries->get_countries(),
            'states'                       => WC()->countries->get_states(),
            'current_user_id'              => get_current_user_id(),
            'current_cashier'              => wepos_get_cashier_data_by_user_id( get_current_user_id() ),
            'home_url'                     => home_url(),
            'wp_date_format'               => get_option( 'date_format' ),
            'wp_time_format'               => get_option( 'time_format' ),
        ] );

        wp_localize_script( 'wepos-vendor', 'wepos', $localize_data );
    }

     /**
     * SPA Routes
     *
     * @return array
     */
    public function get_vue_admin_routes() {
        $routes = array(
            array(
                'path'      => '/settings',
                'name'      => 'Settings',
                'component' => 'Settings'
            ),
        );

        return apply_filters( 'wepos_admin_routes', $routes );
    }
}
