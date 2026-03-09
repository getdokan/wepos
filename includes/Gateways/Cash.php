<?php
namespace WeDevs\WePOS\Gateways;

use Automattic\WooCommerce\Enums\OrderInternalStatus;

/**
* Cash gateway payment for POS
*/
class Cash extends \WC_Payment_Gateway {

    protected $instructions;
    protected $enable_for_methods;
    protected $enable_for_virtual;

    /**
     * Constructor for the gateway.
     */
    public function __construct() {
        // Setup general properties.
        $this->setup_properties();

        // Load the settings.
        $this->init_form_fields();
        $this->init_settings();

        // Get settings.
        $this->title              = $this->get_option( 'title' );
        $this->description        = $this->get_option( 'description' );
        $this->instructions       = $this->get_option( 'instructions' );
        $this->enable_for_methods = $this->get_option( 'enable_for_methods', array() );
        $this->enable_for_virtual = $this->get_option( 'enable_for_virtual', 'yes' ) === 'yes';

        add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
    }

    /**
     * Setup general properties for the gateway.
     */
    protected function setup_properties() {
        $this->id                 = 'wepos_cash';
        $this->icon               = apply_filters( 'wepos_cash_icon', '' );
        $this->method_title       = __( 'Cash', 'wepos' );
        $this->method_description = __( 'Have your customers pay with cash', 'wepos' );
        $this->has_fields         = false;
        $this->supports           = array(
            'refunds'
        );
    }

    /**
     * Initialise Gateway Settings Form Fields.
     */
    public function init_form_fields() {

        $this->form_fields = array(
            'enabled'            => array(
                'title'       => __( 'Enable/Disable', 'wepos' ),
                'label'       => __( 'Enable cash gateway', 'wepos' ),
                'type'        => 'checkbox',
                'description' => '',
                'default'     => 'yes',
            ),
            'title'              => array(
                'title'       => __( 'Title', 'wepos' ),
                'type'        => 'text',
                'description' => __( 'Payment method description that the marchent see in pos checkout', 'wepos' ),
                'default'     => __( 'Cash', 'wepos' ),
                'desc_tip'    => true,
            ),
            'description'        => array(
                'title'       => __( 'Description', 'wepos' ),
                'type'        => 'textarea',
                'description' => __( 'Payment method description that marchent see in pos checkout page', 'wepos' ),
                'default'     => __( 'Pay with cash', 'wepos' ),
                'desc_tip'    => true,
            )
        );
    }

    /**
     * Check If The Gateway Is Available For Use.
     *
     * @return bool
     */
    public function is_available() {
        $order          = null;
        $needs_shipping = false;

        // Test if shipping is needed first.
        if ( is_page( wc_get_page_id( 'checkout' ) ) ) {
            return true;
        }

        return parent::is_available() && wepos_is_frontend();
    }

    /**
     * Process the payment and return the result.
     *
     * @param int $order_id Order ID.
     *
     * @return array
     *
     * @throws \WC_Data_Exception
     */
    public function process_payment( $order_id ) {
        $order = wc_get_order( $order_id );

        // Mark as processing or on-hold (payment won't be taken until delivery).
        $order->payment_complete();

        $order->update_status( 'completed', __( 'Payment collected via cash', 'wepos' ) );
        $order->add_order_note(
            sprintf(
                /* translators: 1: Cash tendered amount 2: Cash change amount. */
                __( 'Cash tendered amount: %1$s, Change amount: %2$s', 'wepos' ),
                $order->get_meta( '_wepos_cash_tendered_amount', true ),
                $order->get_meta( '_wepos_cash_change_amount', true )
            )
        );

        $order->save();

        // Return thankyou redirect.
        return array(
            'result'   => 'success',
        );
    }

    /**
     * Process refund.
     *
     * If the gateway declares 'refunds' support, this will allow it to refund.
     * a passed in amount.
     *
     * @param  int        $order_id Order ID.
     * @param  float|null $amount Refund amount.
     * @param  string     $reason Refund reason.
     * @return bool|\WP_Error True or false based on success, or a WP_Error object.
     */
    public function process_refund( $order_id, $amount = null, $reason = '' ) {
        $order = wc_get_order( $order_id );

        if ( ! $this->can_refund_order( $order ) ) {
            return new \WP_Error( 'error', __( 'Refund failed.', 'wepos' ) );
        }

        $order->add_order_note(
        /* translators: 1: Refund amount, 2: Refund reason */
            sprintf( __( 'Refunded %1$s - Reason: %2$s', 'wepos' ), $amount, $reason ) // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
        );

        $order->update_status(OrderInternalStatus::REFUNDED );
        $order->save();

        return true;
    }
 }
