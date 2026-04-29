<?php

namespace WeDevs\WePOS\Gateways;

/**
 * Gateway manager
 *
 * @since 1.1.9
 */
class Manager {

    /**
     * Option key storing per-POS gateway settings.
     */
    const SETTINGS_OPTION = 'wepos_payment_gateways_settings';

    /**
     * Built-in POS-native gateway IDs.
     *
     * @var string[]
     */
    public static $native_gateways = [ 'wepos_cash', 'wepos_card' ];

    /**
     * Gateway manager
     */
    public function __construct() {
        add_action( 'plugins_loaded', [ $this, 'init_gateways' ], 11, 1 );
        add_filter( 'woocommerce_payment_gateways', [ $this, 'payment_gateways' ] );
        add_filter( 'woocommerce_available_payment_gateways', [ $this, 'available_payment_gateways' ], 99 );
    }

    /**
     * Initialize all gateways
     *
     * @since 1.0.0
     * @since 1.1.9 Refactored to separate manager class
     *
     * @return void
     */
    public function init_gateways() {
        if ( ! $this->is_wc_active() ) {
            return;
        }

        $gateways = $this->available_gateway();

        foreach ( $gateways as $class => $path ) {
            require_once $path;
        }
    }

    /**
     * Is WC active
     *
     * @since 1.0.8
     * @since 1.1.9 Refactored to separate manager class
     *
     * @return bool
     */
    public function is_wc_active() {
        if ( in_array( 'woocommerce/woocommerce.php', apply_filters( 'wepos_active_plugins', get_option( 'active_plugins' ) ) ) ) {
            return true;
        }

        return false;
    }

    /**
     * Add POS gateways to WooCommerce's gateway list.
     *
     * Skipped on the WC settings page so POS-specific gateways don't appear
     * in the storefront payments tab (mirrors wcpos behaviour).
     *
     * @param string[] $gateways
     *
     * @return string[]
     */
    public function payment_gateways( $gateways ) {
        global $plugin_page;

        if ( is_admin() && 'wc-settings' === $plugin_page ) {
            return $gateways;
        }

        $available_gateway = $this->available_gateway();

        return array_merge( $gateways, apply_filters( 'wepos_payment_gateway', array_keys( $available_gateway ) ) );
    }

    /**
     * Available Gateway
     *
     * @since 1.0.0
     * @since 1.1.9 Refactored to separate manager class
     * @since 2.1.0 Card gateway moved into lite.
     *
     * @return array
     */
    public function available_gateway() {
        return apply_filters( 'wepos_register_gateway', [
            'WeDevs\WePOS\Gateways\Cash' => WEPOS_INCLUDES . '/Gateways/Cash.php',
            'WeDevs\WePOS\Gateways\Card' => WEPOS_INCLUDES . '/Gateways/Card.php',
        ] );
    }

    /**
     * Filter WooCommerce's available gateway list during POS context only.
     *
     * Applies POS-specific enable/disable, ordering, title overrides, and
     * default selection from the per-POS settings option. Storefront
     * checkouts are untouched because the filter no-ops outside POS requests.
     *
     * @since 2.1.0
     *
     * @param array|null $gateways
     *
     * @return array|null
     */
    public function available_payment_gateways( $gateways ) {
        if ( ! is_array( $gateways ) || ! wepos_is_pos_request() ) {
            return $gateways;
        }

        $settings        = $this->get_settings();
        $gateway_options = $settings['gateways'];
        $default_id      = $settings['default_gateway'];

        $filtered = [];

        foreach ( $gateways as $id => $gateway ) {
            $config = isset( $gateway_options[ $id ] ) ? $gateway_options[ $id ] : null;

            if ( ! $config || empty( $config['enabled'] ) ) {
                continue;
            }

            if ( ! empty( $config['title'] ) ) {
                $gateway->title = $config['title'];
            }

            $gateway->chosen = ( $id === $default_id );
            $filtered[ $id ] = $gateway;
        }

        // Sort by saved order; gateways without an order entry sink to the bottom.
        uksort(
            $filtered,
            static function ( $a, $b ) use ( $gateway_options ) {
                $oa = isset( $gateway_options[ $a ]['order'] ) ? (int) $gateway_options[ $a ]['order'] : PHP_INT_MAX;
                $ob = isset( $gateway_options[ $b ]['order'] ) ? (int) $gateway_options[ $b ]['order'] : PHP_INT_MAX;

                return $oa <=> $ob;
            }
        );

        return $filtered;
    }

    /**
     * Get the merged POS gateway settings — saved overrides on top of WC defaults.
     *
     * Output shape:
     *   [
     *     'default_gateway' => 'wepos_cash',
     *     'gateways' => [
     *       'wepos_cash' => [
     *         'order'       => 0,
     *         'enabled'     => true,
     *         'title'       => 'Cash',
     *         'description' => '…',
     *       ],
     *       …
     *     ],
     *   ]
     *
     * @since 2.1.0
     *
     * @return array
     */
    public function get_settings() {
        $defaults = [
            'default_gateway' => 'wepos_cash',
            'gateways'        => [],
        ];

        $saved = get_option( self::SETTINGS_OPTION, [] );
        if ( ! is_array( $saved ) ) {
            $saved = [];
        }

        $merged = array_merge( $defaults, $saved );

        $all_gateways      = WC()->payment_gateways()->payment_gateways();
        $native_only       = function_exists( 'apply_filters' ) ? apply_filters( 'wepos_native_gateway_ids', self::$native_gateways ) : self::$native_gateways;
        $merged_gateways   = isset( $merged['gateways'] ) && is_array( $merged['gateways'] ) ? $merged['gateways'] : [];
        $position          = 0;

        foreach ( $all_gateways as $id => $gateway ) {
            $existing = isset( $merged_gateways[ $id ] ) ? $merged_gateways[ $id ] : [];

            $merged_gateways[ $id ] = [
                'order'       => isset( $existing['order'] ) ? (int) $existing['order'] : $position,
                'enabled'     => array_key_exists( 'enabled', $existing )
                    ? (bool) $existing['enabled']
                    : in_array( $id, $native_only, true ), // native gateways enabled by default; everything else opt-in.
                'title'       => isset( $existing['title'] ) ? (string) $existing['title'] : (string) $gateway->get_title(),
                'description' => isset( $existing['description'] ) ? (string) $existing['description'] : (string) $gateway->get_description(),
            ];

            $position++;
        }

        // Drop saved entries for gateways no longer installed.
        foreach ( array_keys( $merged_gateways ) as $id ) {
            if ( ! isset( $all_gateways[ $id ] ) ) {
                unset( $merged_gateways[ $id ] );
            }
        }

        $merged['gateways'] = $merged_gateways;

        // Ensure default_gateway is enabled — fall back to first enabled gateway.
        $default_id = $merged['default_gateway'];
        if ( ! isset( $merged_gateways[ $default_id ] ) || empty( $merged_gateways[ $default_id ]['enabled'] ) ) {
            foreach ( $merged_gateways as $id => $config ) {
                if ( ! empty( $config['enabled'] ) ) {
                    $merged['default_gateway'] = $id;
                    break;
                }
            }
        }

        return apply_filters( 'wepos_payment_gateways_settings', $merged );
    }

    /**
     * Persist POS gateway settings.
     *
     * @since 2.1.0
     *
     * @param array $settings
     *
     * @return array Sanitized settings as stored.
     */
    public function save_settings( $settings ) {
        $clean = [
            'default_gateway' => isset( $settings['default_gateway'] ) ? sanitize_key( $settings['default_gateway'] ) : 'wepos_cash',
            'gateways'        => [],
        ];

        if ( ! empty( $settings['gateways'] ) && is_array( $settings['gateways'] ) ) {
            foreach ( $settings['gateways'] as $id => $config ) {
                $id = sanitize_key( $id );
                if ( '' === $id ) {
                    continue;
                }
                $clean['gateways'][ $id ] = [
                    'order'       => isset( $config['order'] ) ? (int) $config['order'] : 0,
                    'enabled'     => ! empty( $config['enabled'] ),
                    'title'       => isset( $config['title'] ) ? sanitize_text_field( $config['title'] ) : '',
                    'description' => isset( $config['description'] ) ? sanitize_textarea_field( $config['description'] ) : '',
                ];
            }
        }

        update_option( self::SETTINGS_OPTION, $clean );

        return $this->get_settings();
    }

}
