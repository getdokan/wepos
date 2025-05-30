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
     * If the file exists and was modified in the last 5 minutes,
     * we're in development mode.
     *
     * @return bool
     */
    private function is_dev_mode()
    {
        $dev_file = WEPOS_PATH . '/.dev-server-running';

        // Check if the file exists and was modified in the last 5 minutes
        if (file_exists($dev_file)) {
            $mtime = filemtime($dev_file);

            if (time() - $mtime < 300) {
                return true;
            }
        }

        return false;
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
        $asset_file = WEPOS_PATH . '/assets/js/wepos-react.asset.php';
        $asset_data = file_exists($asset_file) ? include $asset_file : [];

        $dependencies = isset($asset_data['dependencies']) ? $asset_data['dependencies'] : [];
        $version = isset($asset_data['version']) ? $asset_data['version'] : WEPOS_VERSION;
        $script_url = $is_dev ? 'http://localhost:8887/wepos-react.js' : WEPOS_ASSETS . '/js/wepos-react.js';

        // Enqueue React runtime for HMR in development mode
        if ($is_dev) {
            wp_die('dev');
            wp_enqueue_script(
                'wepos-react-runtime',
                'http://localhost:8887/runtime.js',
                [],
                $version,
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

        // Enqueue styles
        wp_enqueue_style(
            'wepos-react',
            WEPOS_ASSETS . '/js/wepos-react.css',
            ['wp-components'],
            $version
        );

        // Localize script data
        wp_localize_script(
            'wepos-react',
            'wepos',
            [
                'rest' => [
                    'root' => esc_url_raw(get_rest_url()),
                    'nonce' => wp_create_nonce('wp_rest'),
                    'wcversion' => 'wc/v3',
                    'posversion' => 'wepos/v1',
                ],
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('wepos_nonce'),
                'mon_decimal_point' => wc_get_price_decimal_separator(),
                'currency_format_num_decimals' => wc_get_price_decimals(),
                'currency_format_symbol' => get_woocommerce_currency_symbol(),
                'currency_format_decimal_sep' => esc_attr(wc_get_price_decimal_separator()),
                'currency_format_thousand_sep' => esc_attr(wc_get_price_thousand_separator()),
                'currency_format' => esc_attr(str_replace(['%1$s', '%2$s'], ['%s', '%v'], get_woocommerce_price_format())),
                'rounding_precision' => wc_get_rounding_precision(),
                'admin_url' => get_admin_url(),
                'assets_url' => WEPOS_ASSETS,
                'placeholder_image' => wc_placeholder_img_src(),
                'ajax_loader' => WEPOS_ASSETS . '/images/spinner-2x.gif',
                'logout_url' => wp_logout_url(site_url()),
                'categories' => wepos_get_product_category(),
                'countries' => WC()->countries->get_countries(),
                'states' => WC()->countries->get_states(),
                'current_user_id' => get_current_user_id(),
                'home_url' => home_url(),
                'wp_date_format' => get_option('date_format'),
                'wp_time_format' => get_option('time_format'),
                'app_mode' => 'react',
                'debug' => defined('WP_DEBUG') && WP_DEBUG,
                'dev_mode' => $is_dev,
            ]
        );
    }
}
