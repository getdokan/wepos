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

        // Tax overrides for POS orders.
        add_filter( 'woocommerce_order_get_tax_location', [ $this, 'get_tax_location' ], 10, 2 );
        add_action( 'woocommerce_order_item_after_calculate_taxes', [ $this, 'order_item_after_calculate_taxes' ] );
        add_action( 'woocommerce_order_item_shipping_after_calculate_taxes', [ $this, 'order_item_shipping_after_calculate_taxes' ], 10, 2 );
        add_action( 'woocommerce_order_item_fee_after_calculate_taxes', [ $this, 'order_item_fee_after_calculate_taxes' ], 10, 2 );

        // Hide POS-internal meta keys from the WooCommerce order edit screen.
        add_filter( 'woocommerce_hidden_order_itemmeta', [ $this, 'hidden_order_itemmeta' ] );
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

    /**
     * Override the tax location for POS orders based on order metadata.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param array              $args  Tax location arguments (country, state, postcode, city).
     * @param \WC_Abstract_Order $order The order object.
     *
     * @return array
     */
    public function get_tax_location( $args, $order ) {
        if ( ! $order instanceof \WC_Order ) {
            return $args;
        }

        if ( empty( $order->get_meta( '_wepos_is_pos_order' ) ) ) {
            return $args;
        }

        $tax_based_on = $order->get_meta( '_wepos_tax_based_on' );

        if ( 'billing' === $tax_based_on ) {
            $args['country']  = $order->get_billing_country();
            $args['state']    = $order->get_billing_state();
            $args['postcode'] = $order->get_billing_postcode();
            $args['city']     = $order->get_billing_city();
        } elseif ( 'shipping' === $tax_based_on ) {
            $args['country']  = $order->get_shipping_country();
            $args['state']    = $order->get_shipping_state();
            $args['postcode'] = $order->get_shipping_postcode();
            $args['city']     = $order->get_shipping_city();
        } else {
            // Default to store base address for POS orders.
            $args['country']  = \WC()->countries->get_base_country();
            $args['state']    = \WC()->countries->get_base_state();
            $args['postcode'] = \WC()->countries->get_base_postcode();
            $args['city']     = \WC()->countries->get_base_city();
        }

        return $args;
    }

    /**
     * Override item-level tax after WooCommerce calculates taxes.
     *
     * If the item carries _wepos_pos_data metadata with tax_status = 'none',
     * clear all taxes on that item.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param \WC_Order_Item $item The order item.
     *
     * @return void
     */
    public function order_item_after_calculate_taxes( $item ): void {
        $meta_data = $item->get_meta_data();

        foreach ( $meta_data as $meta ) {
            if ( '_wepos_pos_data' === $meta->key ) {
                $pos_data = json_decode( $meta->value, true );

                if ( JSON_ERROR_NONE === json_last_error() && isset( $pos_data['tax_status'] ) && 'none' === $pos_data['tax_status'] ) {
                    $item->set_taxes( false );
                }

                break;
            }
        }
    }

    /**
     * Override shipping item tax after WooCommerce calculates taxes.
     *
     * WC_Order_Item_Shipping ignores per-item tax_class and tax_status
     * (get_tax_class() returns the global option, set_tax_status() is a no-op).
     * The POS frontend stores the desired values in _wepos_pos_data meta.
     *
     * This handler:
     * - Clears taxes when tax_status = 'none'
     * - Recalculates with the correct tax_class when it differs from global
     * - Back-calculates net amount when amount_includes_tax is true
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param \WC_Order_Item_Shipping $item             The shipping item.
     * @param array                   $calculate_tax_for The tax calculation location data.
     *
     * @return void
     */
    public function order_item_shipping_after_calculate_taxes( $item, $calculate_tax_for ): void {
        $pos_data = null;

        foreach ( $item->get_meta_data() as $meta ) {
            if ( '_wepos_pos_data' === $meta->key ) {
                $pos_data = json_decode( $meta->value, true );
                break;
            }
        }

        if ( ! $pos_data || JSON_ERROR_NONE !== json_last_error() ) {
            return;
        }

        $tax_status = $pos_data['tax_status'] ?? 'taxable';
        $tax_class  = $pos_data['tax_class'] ?? '';
        $includes   = ! empty( $pos_data['amount_includes_tax'] );

        // Tax status = none → clear all taxes.
        if ( 'none' === $tax_status ) {
            $item->set_taxes( false );
            return;
        }

        // Determine if we need to recalculate (custom tax class or amount includes tax).
        $global_class = get_option( 'woocommerce_shipping_tax_class', 'inherit' );

        // Resolve 'inherit' to empty string (standard) for comparison.
        $effective_global = 'inherit' === $global_class ? '' : $global_class;
        $needs_recalc     = ( $tax_class !== $effective_global ) || $includes;

        if ( ! $needs_recalc ) {
            return;
        }

        // Use the POS-specified tax class for rate lookup.
        $calculate_tax_for['tax_class'] = $tax_class;
        $tax_rates = \WC_Tax::find_shipping_rates( $calculate_tax_for );

        if ( $includes ) {
            // Amount entered includes tax — back-calculate net and tax.
            $inclusive_taxes = \WC_Tax::calc_inclusive_tax( (float) $item->get_total(), $tax_rates );
            $net             = (float) $item->get_total() - array_sum( $inclusive_taxes );
            $item->set_total( wc_format_decimal( $net ) );
            $item->set_taxes( [ 'total' => $inclusive_taxes ] );
        } else {
            // Recalculate taxes with the correct class.
            $taxes = \WC_Tax::calc_tax( (float) $item->get_total(), $tax_rates, false );
            $item->set_taxes( [ 'total' => $taxes ] );
        }
    }

    /**
     * Fix tax calculation for negative fees (discounts).
     *
     * WooCommerce bypasses normal tax calculation for negative fees, disregarding
     * the tax_status and tax_class. This corrects that behavior for POS orders.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param \WC_Order_Item_Fee $fee_item          The fee item.
     * @param array              $calculate_tax_for The tax calculation data.
     *
     * @return void
     */
    public function order_item_fee_after_calculate_taxes( $fee_item, $calculate_tax_for ): void {
        if ( $fee_item->get_total() >= 0 ) {
            return;
        }

        $tax_status = $fee_item->get_tax_status();

        if ( 'taxable' === $tax_status ) {
            $tax_class = $fee_item->get_tax_class();
            $calculate_tax_for['tax_class'] = $tax_class ? $tax_class : '';

            $tax_rates      = \WC_Tax::find_rates( $calculate_tax_for );
            $discount_taxes = \WC_Tax::calc_tax( (float) $fee_item->get_total(), $tax_rates );

            $fee_item->set_taxes( [ 'total' => $discount_taxes ] );
        } else {
            $fee_item->set_taxes( [] );
        }

        $fee_item->save();
    }

    /**
     * Hide POS-internal meta keys from the WooCommerce order edit screen.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param array $meta_keys Existing hidden meta keys.
     *
     * @return array
     */
    public function hidden_order_itemmeta( array $meta_keys ): array {
        return array_merge( $meta_keys, [ '_wepos_pos_data', '_wepos_tax_status' ] );
    }
}
