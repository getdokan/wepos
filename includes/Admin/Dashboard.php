<?php

namespace WeDevs\WePOS\Admin;

/**
 * React Admin Dashboard
 *
 * Registers the React-based admin dashboard page and handles script enqueuing.
 *
 * @since 1.3.0
 */
class Dashboard {

    /**
     * Constructor.
     *
     * @since 1.3.0
     */
    public function __construct() {
        add_action( 'admin_menu', [ $this, 'register_page' ] );
    }

    /**
     * Register the React dashboard as a submenu page under wepos.
     *
     * @since 1.3.0
     *
     * @return void
     */
    public function register_page() {
        $capability = wepos_admin_menu_capability();
        $hook = add_submenu_page(
            'wepos',
            __( 'Dashboard', 'wepos' ),
            __( 'Dashboard', 'wepos' ),
            $capability,
            'wepos-dashboard',
            [ $this, 'render_page' ]
        );

        add_action( 'load-' . $hook, [ $this, 'init_hooks' ] );
    }

    /**
     * Initialize hooks when the React dashboard page loads.
     *
     * @since 1.3.0
     *
     * @return void
     */
    public function init_hooks() {
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
    }

    /**
     * Enqueue React admin scripts and styles.
     *
     * @since 1.3.0
     *
     * @return void
     */
    public function enqueue_scripts() {
        wp_enqueue_media();

        $asset_file = WEPOS_PATH . '/build/wepos-admin-react.asset.php';
        $asset_data = file_exists( $asset_file ) ? include $asset_file : [];

        $dependencies = isset( $asset_data['dependencies'] ) ? $asset_data['dependencies'] : [];
        $version      = isset( $asset_data['version'] ) ? $asset_data['version'] : WEPOS_VERSION;

        // Shared components carrier — bundles `@wedevs/plugin-ui` +
        // `react-router-dom` once and exposes them on `window`. The main
        // admin bundle externalizes those imports so this MUST load first.
        $comp_asset_file = WEPOS_PATH . '/build/wepos-components.asset.php';
        $comp_asset_data = file_exists( $comp_asset_file ) ? include $comp_asset_file : [ 'dependencies' => [], 'version' => $version ];
        $comp_script_url = WEPOS_URL . '/build/wepos-components.js';
        $comp_script_file = WEPOS_PATH . '/build/wepos-components.js';

        if ( file_exists( $comp_script_file ) ) {
            wp_enqueue_script(
                'wepos-react-components',
                $comp_script_url,
                $comp_asset_data['dependencies'],
                $comp_asset_data['version'],
                true
            );
            wp_set_script_translations( 'wepos-react-components', 'wepos', WEPOS_PATH . '/languages' );
            $dependencies[] = 'wepos-react-components';
        }

        // Set up shared hooks instance (same pattern as ReactAssets.php).
        wp_enqueue_script( 'wp-hooks' );
        wp_add_inline_script(
            'wp-hooks',
            'if (typeof window.__weposReactHooks === "undefined") {'
            . '  window.__weposReactHooks = wp.hooks.createHooks();'
            . '}'
            . ' window.__weposReactRouterDOM = window.__weposReactRouterDOM || {};'
            . ' window.__weposPluginUI = window.__weposPluginUI || {};',
            'after'
        );

        wp_enqueue_script(
            'wepos-admin-react',
            WEPOS_URL . '/build/wepos-admin-react.js',
            $dependencies,
            $version,
            true
        );
        wp_set_script_translations( 'wepos-admin-react', 'wepos', WEPOS_PATH . '/languages' );

        // CSS is loaded in TWO places:
        // 1. Inside the Shadow DOM via <link> tags (main app isolation)
        // 2. In <head> via wp_enqueue_style (fallback for portal containers
        //    that escape to document.body — styles are scoped to .pui-root
        //    so they don't affect WP admin elements).
        $css_filename = is_rtl() ? 'wepos-admin-react-rtl.css' : 'wepos-admin-react.css';
        $css_file     = WEPOS_PATH . '/build/' . $css_filename;
        $admin_css_urls = [];

        if ( file_exists( $css_file ) ) {
            wp_enqueue_style(
                'wepos-admin-react',
                WEPOS_URL . '/build/' . $css_filename,
                [],
                $version
            );
        }

        if ( file_exists( $css_file ) ) {
            $admin_css_urls[] = add_query_arg( 'ver', $version, WEPOS_URL . '/build/' . $css_filename );
        }

        /**
         * Filter the CSS URLs injected into the admin Shadow DOM.
         *
         * Extensions can append their own stylesheet URLs so they are
         * loaded inside the shadow root alongside the base admin CSS.
         *
         * @since 1.4.0
         *
         * @param string[] $admin_css_urls Array of CSS file URLs.
         */
        $admin_css_urls = apply_filters( 'wepos_admin_shadow_css_urls', $admin_css_urls );

        // Sanitize all URLs before passing to JavaScript.
        $admin_css_urls = array_values( array_map( 'esc_url', $admin_css_urls ) );

        // Enqueue accounting.js
        if ( function_exists( 'WC' ) ) {
            wp_enqueue_script(
                'wepos-accounting',
                WC()->plugin_url() . '/assets/js/accounting/accounting.min.js',
                [ 'jquery' ],
                '0.4.2',
                true
            );
        }

        // Build settings fields in the same format Vue uses.
        $settings_fields = [];

        foreach ( wepos_get_settings_fields() as $section_key => $fields ) {
            foreach ( $fields as $field ) {
                $settings_fields[ $section_key ][ $field['name'] ] = $field;
            }
        }

        // Build access data for role-capability management (administrator only).
        $access_data = null;
        if ( current_user_can( 'manage_options' ) ) {
            $access_controller = new \WeDevs\WePOS\REST\AccessController();
            $access_data       = $access_controller->get_access_settings()->get_data();
        }

        // Reference data for POS Settings custom fields (country/state dropdowns).
        $wc_countries = function_exists( 'WC' ) ? WC()->countries->get_countries() : [];
        $wc_states    = function_exists( 'WC' ) ? WC()->countries->get_states() : [];

        $localize_data = apply_filters( 'wepos_admin_react_localize_data', [
            'adminCssUrls'       => $admin_css_urls,
            'access_data'        => $access_data,
            'allowed_pages'      => wepos_get_user_allowed_pages(),
            'rest' => [
                'root'       => esc_url_raw( get_rest_url() ),
                'nonce'      => wp_create_nonce( 'wp_rest' ),
                'wcversion'  => 'wc/v3',
                'posversion' => 'wepos/v1',
            ],
            'ajaxurl'            => admin_url( 'admin-ajax.php' ),
            'nonce'              => wp_create_nonce( 'wepos_nonce' ),
            'admin_url'          => admin_url(),
            'assets_url'         => WEPOS_ASSETS,
            'current_user_id'    => get_current_user_id(),
            'settings_sections'  => array_values( wepos_get_settings_sections() ),
            'settings_fields'    => $settings_fields,
            'countries'          => $wc_countries,
            'states'             => $wc_states,
            'currency_format_symbol'    => function_exists( 'html_entity_decode' ) && function_exists( 'get_woocommerce_currency_symbol' ) ? html_entity_decode( get_woocommerce_currency_symbol() ) : ( function_exists( 'get_woocommerce_currency_symbol' ) ? get_woocommerce_currency_symbol() : '' ),
            'currency_format_num_decimals' => function_exists( 'wc_get_price_decimals' ) ? wc_get_price_decimals() : 2,
            'currency_format_thousand_sep' => function_exists( 'wc_get_thousand_separator' ) ? wc_get_thousand_separator() : ',',
            'currency_format_decimal_sep'  => function_exists( 'wc_get_decimal_separator' ) ? wc_get_decimal_separator() : '.',
            'currency_format'              => function_exists( 'get_woocommerce_price_format' ) ? str_replace( [ '%1$s', '%2$s' ], [ '%s', '%v' ], get_woocommerce_price_format() ) : '%s%v',
        ] );

        wp_localize_script( 'wepos-admin-react', 'weposAdmin', $localize_data );
    }

    /**
     * Render the React admin mount point.
     *
     * @since 1.3.0
     *
     * @return void
     */
    public function render_page() {
        echo '<div class="wrap"><div id="wepos-admin-react-app"></div></div>';
    }
}
