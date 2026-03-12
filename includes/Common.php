<?php

namespace WeDevs\WePOS;

defined( 'ABSPATH' ) || exit;

/**
 * Common Class.
 *
 * Class for doing generic common operations from both frontend and backend.
 *
 * @since WEPOS_LITE_SINCE
 */
class Common {

    /**
     * Constructor method.
     */
    public function __construct() {
        $this->init_hooks();
    }

    /**
     * Init hooks method.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @return void
     */
    public function init_hooks() {
        // Register custom POS order statuses.
        $this->register_order_status();
        add_filter( 'wc_order_statuses', [ $this, 'wc_order_statuses' ] );
        add_filter( 'woocommerce_valid_order_statuses_for_payment', [ $this, 'valid_order_statuses_for_payment' ], 10, 2 );
        add_filter( 'woocommerce_valid_order_statuses_for_payment_complete', [ $this, 'valid_order_statuses_for_payment_complete' ], 10, 2 );

        // Manipulate WooCommerce Order Data.
        add_action( 'woocommerce_new_order', [ $this, 'set_order_created_via_wepos' ], 10, 2 );
    }

    /**
     * Register custom POS order statuses.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @return void
     */
    private function register_order_status() {
        register_post_status(
            'wc-pos-open',
            [
                'label'                     => _x( 'POS - Open', 'Order status', 'wepos' ),
                'public'                    => true,
                'exclude_from_search'       => false,
                'show_in_admin_all_list'    => true,
                'show_in_admin_status_list' => true,
                'label_count'               => _n_noop(
                    'POS - Open <span class="count">(%s)</span>',
                    'POS - Open <span class="count">(%s)</span>',
                    'wepos'
                ),
            ]
        );
    }

    /**
     * Add custom POS order statuses to WooCommerce status list.
     *
     * @param array $order_statuses Existing order statuses.
     *
     * @return array
     */
    public function wc_order_statuses( array $order_statuses ): array {
        $order_statuses['wc-pos-open'] = _x( 'POS - Open', 'Order status', 'wepos' );

        return $order_statuses;
    }

    /**
     * Allow payment on pos-open orders.
     *
     * @param array              $order_statuses Valid order statuses.
     * @param \WC_Abstract_Order $order          The order object.
     *
     * @return array
     */
    public function valid_order_statuses_for_payment( array $order_statuses, $order ): array {
        $order_statuses[] = 'pos-open';

        return $order_statuses;
    }

    /**
     * Allow payment complete on pos-open orders.
     *
     * @param array              $order_statuses Valid order statuses.
     * @param \WC_Abstract_Order $order          The order object.
     *
     * @return array
     */
    public function valid_order_statuses_for_payment_complete( array $order_statuses, $order ): array {
        $order_statuses[] = 'pos-open';

        return $order_statuses;
    }

    /**
     * Set order created via wepos.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param int       $order_id The order ID.
     * @param \WC_Order $order    The order object.
     *
     * @return void|\WP_Error
     */
    public function set_order_created_via_wepos( $order_id, $order ) {
        if ( ! $order instanceof \WC_Order ) {
            return;
        }

        if ( empty( $order->get_meta( '_wepos_is_pos_order' ) ) ) {
            return;
        }

        $order->set_created_via( 'wepos' );
    }
}
