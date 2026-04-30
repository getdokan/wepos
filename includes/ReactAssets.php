<?php

namespace WeDevs\WePOS;

/**
 * React Scripts and Styles Class
 * Handles loading React-based frontend assets
 */
class ReactAssets
{
    public function __construct()
    {
        if (is_admin()) {
            add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        } else {
            add_action('wepos_enqueue_scripts', [$this, 'enqueue_frontend_scripts']);
        }
    }

    /**
     * Check if we're in development mode.
     *
     * Checks if runtime.asset.php exists, which is only created when webpack dev server is running
     *
     * @return bool
     */
    private function is_dev_mode()
    {
        $runtime_asset_file = WEPOS_PATH . '/build/runtime.asset.php';
        return file_exists($runtime_asset_file);
    }

    /**
     * Enqueue admin scripts.
     *
     * @return void
     */
    public function enqueue_admin_scripts()
    {
        // Admin scripts if needed
    }

    /**
     * Enqueue frontend scripts.
     *
     * @return void
     */
    public function enqueue_frontend_scripts()
    {
        $is_dev = $this->is_dev_mode();
        $version = WEPOS_VERSION;

        // Enqueue Shared Components first
        $comp_asset_file = WEPOS_PATH . '/build/wepos-components.asset.php';
        $comp_asset_data = file_exists($comp_asset_file) ? include $comp_asset_file : ['dependencies' => [], 'version' => $version];

        $comp_script_url = $is_dev ? 'http://localhost:8887/wepos-components.js' : WEPOS_URL . '/build/wepos-components.js';
        $comp_script_file = WEPOS_PATH . '/build/wepos-components.js';

        if ($is_dev || file_exists($comp_script_file)) {
            wp_enqueue_script(
                'wepos-react-components',
                $comp_script_url,
                $comp_asset_data['dependencies'],
                $comp_asset_data['version'],
                true
            );
            wp_set_script_translations( 'wepos-react-components', 'wepos', WEPOS_PATH . '/languages' );
        }

        $asset_file = WEPOS_PATH . '/build/wepos-react.asset.php';
        $asset_data = file_exists($asset_file) ? include $asset_file : [];

        $dependencies = isset($asset_data['dependencies']) ? $asset_data['dependencies'] : [];
        // The carrier bundle exposes `@wedevs/plugin-ui` + `react-router-dom`
        // on `window` — main bundle externalizes both, so it MUST load after.
        if ( $is_dev || file_exists( $comp_script_file ) ) {
            $dependencies[] = 'wepos-react-components';
        }
        $version = isset($asset_data['version']) ? $asset_data['version'] : WEPOS_VERSION;
        $script_url = $is_dev ? 'http://localhost:8887/wepos-react.js' : WEPOS_URL . '/build/wepos-react.js';
        $script_file = WEPOS_PATH . '/build/wepos-react.js';

        // Enqueue React runtime for HMR in development mode
        if ($is_dev) {
            $runtime_asset_file = WEPOS_PATH . '/build/runtime.asset.php';
            $runtime_asset_data = file_exists($runtime_asset_file) ? include $runtime_asset_file : [];
            $runtime_dependencies = isset($runtime_asset_data['dependencies']) ? $runtime_asset_data['dependencies'] : [];
            $runtime_version = isset($runtime_asset_data['version']) ? $runtime_asset_data['version'] : $version;

            wp_enqueue_script(
                'wepos-react-runtime',
                'http://localhost:8887/runtime.js',
                $runtime_dependencies,
                $runtime_version,
                true
            );

            // Add runtime as dependency for main script
            $dependencies[] = 'wepos-react-runtime';
        }

        // Create shared instances BEFORE any bundles load.
        // wepos-pro-react loads as a dependency of wepos-react (so pro hooks
        // register first), which means these globals must exist before pro loads.
        // The empty objects for router/plugin-ui are populated via Object.assign
        // when the base bundle loads, keeping the same object reference.
        wp_enqueue_script('wp-hooks');
        wp_add_inline_script(
            'wp-hooks',
            'if ( typeof window.__weposReactHooks === "undefined" ) { window.__weposReactHooks = wp.hooks.createHooks(); }' .
            ' window.__weposReactRouterDOM = window.__weposReactRouterDOM || {};' .
            ' window.__weposPluginUI = window.__weposPluginUI || {};' .
            ' window.__weposToast = window.__weposToast || {};' .
            ' window.wepos = window.wepos || {};',
            'after'
        );

        // Enqueue main React application
        if ($is_dev || file_exists($script_file)) {
            wp_enqueue_script(
                'wepos-react',
                $script_url,
                $dependencies,
                $version,
                true
            );
            wp_set_script_translations( 'wepos-react', 'wepos', WEPOS_PATH . '/languages' );
        }

        $accounting_script = array(
            'wepos-accounting' => array(
                'src'  => WC()->plugin_url() . '/assets/js/accounting/accounting.min.js',
                'deps' => array( 'jquery' )
            ),
        );

        wp_enqueue_script(
            'wepos-accounting',
            $accounting_script['wepos-accounting']['src'],
            $accounting_script['wepos-accounting']['deps'],
            '1.0.0',
            true
        );

        // Enqueue styles (check both development and production paths)
        $css_url = $is_dev
            ? 'http://localhost:8887/wepos-react.css'
            : WEPOS_URL . '/build/wepos-react.css';
        $css_file = WEPOS_PATH . '/build/wepos-react.css';

        if ($is_dev || file_exists($css_file)) {
            wp_enqueue_style(
                'wepos-react',
                $css_url,
                ['wp-components'],
                $version
            );
        }

        // Localize script data
        $localize_data = apply_filters(
            'wepos_localize_data',
            [
                'rest' => [
                    'root' => esc_url_raw(get_rest_url()),
                    'nonce' => wp_create_nonce('wp_rest'),
                    'wcversion' => 'wc/v3',
                    'posversion' => 'wepos/v1',
                ],
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('wepos_nonce'),
                'mon_decimal_point' => \wc_get_price_decimal_separator(),
                'currency_format_num_decimals' => \wc_get_price_decimals(),
                'currency' => \get_woocommerce_currency(),
                'currency_format_symbol' => \get_woocommerce_currency_symbol(),
                'currency_format_decimal_sep' => \wc_get_price_decimal_separator(),
                'currency_format_thousand_sep' => \wc_get_price_thousand_separator(),
                'currency_format_thousands_group_style' => 'thousand',
                'currency_format' => str_replace(['%1$s', '%2$s'], ['%s', '%v'], \get_woocommerce_price_format()),
                'rounding_precision' => \wc_get_rounding_precision(),
                'admin_url' => get_admin_url(),
                'assets_url' => WEPOS_ASSETS,
                'placeholder_image' => \wc_placeholder_img_src(),
                'ajax_loader' => WEPOS_ASSETS . '/images/spinner-2x.gif',
                'logout_url' => wp_logout_url(site_url()),
                'categories' => wepos_get_product_category(),
                'countries' => \WC()->countries->get_countries(),
                'states' => \WC()->countries->get_states(),
                'current_user_id' => get_current_user_id(),
                'current_user' => $this->get_current_user_data(),
                'home_url' => home_url(),
                'wp_date_format' => get_option('date_format'),
                'wp_time_format' => get_option('time_format'),
                'app_mode' => 'react',
                'debug' => defined('WP_DEBUG') && WP_DEBUG,
                'dev_mode' => $is_dev,
                'permissions' => [
                    'create_customers' => current_user_can( 'create_customers' ),
                ],
            ]
        );

        wp_localize_script(
            'wepos-react',
            'wepos',
            $localize_data
        );
    }

    /**
     * Get current user data for the frontend.
     *
     * @return array
     */
    private function get_current_user_data()
    {
        $user = wp_get_current_user();

        if ( ! $user->exists() ) {
            return [];
        }

        return [
            'name'            => $user->display_name,
            'email'           => $user->user_email,
            'avatar_url'      => get_avatar_url( $user->ID, [ 'size' => 96 ] ),
            'role'            => ! empty( $user->roles ) ? ucfirst( $user->roles[0] ) : '',
            'can_access_admin' => current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_wepos' ),
        ];
    }
}
