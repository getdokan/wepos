<?php

namespace WeDevs\WePOS\Gateways;

/**
 * Gateway manager
 *
 * @since 1.1.9
 */
class Manager {

    /**
     * Gateway manager
     */
    public function __construct() {
        add_action( 'plugins_loaded', [ $this, 'init_gateways' ], 11, 1 );
        add_filter( 'woocommerce_payment_gateways', [ $this, 'payment_gateways' ] );
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
     * Add POS gateways
     *
     * @param $gateways
     *
     * @since 1.1.9 Refactored to separate manager class
     *
     * @return array
     */
    public function payment_gateways( $gateways ) {
        $available_gateway = $this->available_gateway();

        // else add default POS gateways
        return array_merge( $gateways, apply_filters( 'wepos_payment_gateway', array_keys( $available_gateway ) ) );
    }

    /**
     * Available Gateway
     *
     * @since 1.0.0
     * @since 1.1.9 Refactored to separate manager class
     *
     * @return array
     */
    public function available_gateway() {
        return apply_filters( 'wepos_register_gateway', [
            'WeDevs\WePOS\Gateways\Cash' => WEPOS_INCLUDES . '/Gateways/Cash.php'
        ] );
    }

}
