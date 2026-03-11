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
        $hook = add_submenu_page(
            'wepos',
            __( 'Dashboard', 'wepos' ),
            __( 'Dashboard', 'wepos' ),
            'manage_woocommerce',
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

        // Shared components
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

        $css_file = WEPOS_PATH . '/build/wepos-admin-react.css';

        if ( file_exists( $css_file ) ) {
            wp_enqueue_style(
                'wepos-admin-react',
                WEPOS_URL . '/build/wepos-admin-react.css',
                [],
                $version
            );
        }

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

        $localize_data = apply_filters( 'wepos_admin_react_localize_data', [
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
            'settings_sections'  => wepos_get_settings_sections(),
            'settings_fields'    => $settings_fields,
            'currency_format_symbol'    => function_exists( 'html_entity_decode' ) && function_exists( 'get_woocommerce_currency_symbol' ) ? html_entity_decode( get_woocommerce_currency_symbol() ) : ( function_exists( 'get_woocommerce_currency_symbol' ) ? get_woocommerce_currency_symbol() : '' ),
            'currency_format_num_decimals' => function_exists( 'wc_get_price_decimals' ) ? wc_get_price_decimals() : 2,
            'currency_format_thousand_sep' => function_exists( 'wc_get_thousand_separator' ) ? wc_get_thousand_separator() : ',',
            'currency_format_decimal_sep'  => function_exists( 'wc_get_decimal_separator' ) ? wc_get_decimal_separator() : '.',
            'currency_format'              => function_exists( 'get_woocommerce_price_format' ) ? get_woocommerce_price_format() : '%s%v',
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
