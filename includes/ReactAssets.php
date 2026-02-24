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
        $asset_file = WEPOS_PATH . '/build/wepos-react.asset.php';
        $asset_data = file_exists($asset_file) ? include $asset_file : [];

        $dependencies = isset($asset_data['dependencies']) ? $asset_data['dependencies'] : [];
        $version = isset($asset_data['version']) ? $asset_data['version'] : WEPOS_VERSION;
        $script_url = $is_dev ? 'http://localhost:8887/wepos-react.js' : WEPOS_URL . '/build/wepos-react.js';

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

        // Enqueue main React application
        wp_enqueue_script(
            'wepos-react',
            $script_url,
            $dependencies,
            $version,
            true
        );

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

        wp_enqueue_style(
            'wepos-react',
            $css_url,
            ['wp-components'],
            $version
        );

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
                'currency_format_symbol' => \get_woocommerce_currency_symbol(),
                'currency_format_decimal_sep' => esc_attr(\wc_get_price_decimal_separator()),
                'currency_format_thousand_sep' => esc_attr(\wc_get_price_thousand_separator()),
                'currency_format' => esc_attr(str_replace(['%1$s', '%2$s'], ['%s', '%v'], \get_woocommerce_price_format())),
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
                'home_url' => home_url(),
                'wp_date_format' => get_option('date_format'),
                'wp_time_format' => get_option('time_format'),
                'app_mode' => 'react',
                'debug' => defined('WP_DEBUG') && WP_DEBUG,
                'dev_mode' => $is_dev,
            ]
        );

        wp_localize_script(
            'wepos-react',
            'wepos',
            $localize_data
        );
    }
}
