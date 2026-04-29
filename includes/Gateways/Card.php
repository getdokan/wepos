<?php
namespace WeDevs\WePOS\Gateways;

use Automattic\WooCommerce\Enums\OrderInternalStatus;

/**
 * Card gateway for POS — manual external card-terminal flow.
 *
 * Mirrors wcpos card behaviour: cashier swipes the card on a separate
 * terminal, then marks the POS order paid. No real-time payment capture.
 * Pro extensions can decorate this gateway with extra metadata
 * (card number, type, invoice no.) via order meta.
 *
 * @since 2.1.0
 */
class Card extends \WC_Payment_Gateway {

    /**
     * Constructor for the gateway.
     */
    public function __construct() {
        $this->setup_properties();
        $this->init_form_fields();
        $this->init_settings();

        $this->title       = $this->get_option( 'title' );
        $this->description = $this->get_option( 'description' );

        add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
    }

    /**
     * Setup general properties for the gateway.
     */
    protected function setup_properties() {
        $this->id                 = 'wepos_card';
        $this->icon               = apply_filters( 'wepos_card_icon', '' );
        $this->method_title       = __( 'Card', 'wepos' );
        $this->method_description = __( 'Accept card payments through an external terminal. The cashier processes the payment on the terminal, then marks the POS order paid.', 'wepos' );
        $this->has_fields         = false;
        $this->supports           = array(
            'refunds',
        );
    }

    /**
     * Initialise gateway settings form fields.
     */
    public function init_form_fields() {
        $this->form_fields = array(
            'enabled' => array(
                'title'   => __( 'Enable/Disable', 'wepos' ),
                'label'   => __( 'Enable card gateway', 'wepos' ),
                'type'    => 'checkbox',
                'default' => 'yes',
            ),
            'title' => array(
                'title'       => __( 'Title', 'wepos' ),
                'type'        => 'text',
                'description' => __( 'Payment method label shown to cashiers in POS checkout.', 'wepos' ),
                'default'     => __( 'Card', 'wepos' ),
                'desc_tip'    => true,
            ),
            'description' => array(
                'title'       => __( 'Description', 'wepos' ),
                'type'        => 'textarea',
                'description' => __( 'Payment method description shown in POS checkout.', 'wepos' ),
                'default'     => __( 'Pay with card via external terminal', 'wepos' ),
                'desc_tip'    => true,
            ),
        );
    }

    /**
     * Restrict availability to POS context — never appear on storefront checkout.
     *
     * @return bool
     */
    public function is_available() {
        if ( is_page( wc_get_page_id( 'checkout' ) ) ) {
            return false;
        }

        return parent::is_available() && ( wepos_is_frontend() || wepos_is_pos_request() );
    }

    /**
     * Mark the order paid. The actual card capture happens on an external terminal.
     *
     * @param int $order_id Order ID.
     *
     * @return array
     */
    public function process_payment( $order_id ) {
        $order = wc_get_order( $order_id );

        $order->payment_complete();
        $order->update_status( 'completed', __( 'Payment collected via external card terminal', 'wepos' ) );
        $order->add_order_note( __( 'Card payment accepted through external terminal.', 'wepos' ) );
        $order->save();

        do_action( 'wepos_thankyou_wepos_card', $order_id );

        return array(
            'result' => 'success',
        );
    }

    /**
     * Process refund.
     *
     * @param int        $order_id Order ID.
     * @param float|null $amount   Refund amount.
     * @param string     $reason   Refund reason.
     *
     * @return bool|\WP_Error
     */
    public function process_refund( $order_id, $amount = null, $reason = '' ) {
        $order = wc_get_order( $order_id );

        if ( ! $this->can_refund_order( $order ) ) {
            return new \WP_Error( 'error', __( 'Refund failed.', 'wepos' ) );
        }

        $order->add_order_note(
            /* translators: 1: Refund amount, 2: Refund reason */
            sprintf( __( 'Refunded %1$s - Reason: %2$s', 'wepos' ), $amount, $reason )
        );

        $order->update_status( OrderInternalStatus::REFUNDED );
        $order->save();

        return true;
    }
}
