<?php
namespace WeDevs\WePOS;

/**
 * Dokan base compability
 *
 * @since 1.0.2
 */
/**
* className
*/
class Dokan {

    /**
     * Load autometically when class initiate
     *
     * @since 1.0.2
     */
    public function __construct() {
        add_filter( 'wepos_frontend_permissions', [ $this, 'frontend_permissions' ], 10, 1 );
        add_filter( 'woocommerce_rest_product_object_query', [ $this, 'filter_vendor_products' ], 10, 2 );
        add_action( 'dokan_new_seller_created', [ $this, 'after_create_vendor' ], 15, 2 );
        add_filter( 'dokan_get_dashboard_nav', [ $this, 'show_pos_menu' ], 15 );
        add_filter( 'wepos_settings_fields', [ $this, 'add_dokan_settings' ], 11 );
        add_filter( 'wepos_rest_manager_permissions', [ $this, 'manager_permission' ], 10 );

        // If vendor created via REST API
        add_action( 'dokan_new_vendor', [ $this, 'after_create_vendor_via_rest' ], 15 );

        // Exclude wepos_cash payments from vendor withdrawal balance
        add_filter( 'dokan_order_should_exclude_from_vendor_balance', [ $this, 'exclude_wepos_cash_payment' ], 10, 5 );
    }

    /**
     * Manager permissions
     *
     * @since 1.0.4
     *
     * @return void
     */
    public function manager_permission( $valid ) {
        if ( current_user_can( 'dokandar' ) ) {
            return true;
        }

        return $valid;
    }

    /**
     * Handle frontend view permission for dokan vendors
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function frontend_permissions( $valid ) {
        if ( dokan_is_user_seller( get_current_user_id() ) && dokan_is_seller_enabled( get_current_user_id() ) ) {
	        return true;
        } else if ( current_user_can( 'cashier' ) ) {
            return true;
        }

        return false;
    }

    /**
     * Prepare object for product query
     *
     * filter by author
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function filter_vendor_products( $args, $request ) {
        if ( ! current_user_can( 'manage_woocommerce' ) && dokan_is_user_seller( dokan_get_current_user_id() ) ) {
            $args['author'] = dokan_get_current_user_id();
        }

        return $args;
    }

    /**
     * After create vendor set appropiate meta for pos
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function after_create_vendor( $user_id, $dokan_settings ) {
        if ( ! $user_id  ) {
            return;
        }

        if ( ! dokan_is_user_seller( $user_id ) ) {
            return;
        }

        $user = get_user_by( 'id', $user_id );
        $user->add_cap( 'publish_shop_orders' );
        $user->add_cap( 'list_users' );
    }

    /**
     * After create vendor via REST set appropiate meta for pos
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function after_create_vendor_via_rest( $user_id ) {
        if ( ! $user_id  ) {
            return;
        }

        if ( ! dokan_is_user_seller( $user_id ) ) {
            return;
        }

        $user = get_user_by( 'id', $user_id );
        $user->add_cap( 'publish_shop_orders' );
        $user->add_cap( 'list_users' );
    }

    /**
     * Show pos meny for vendor
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function show_pos_menu( $url ) {
        $settings = wepos_get_option( 'show_pos_menu_dashboard', 'wepos_general', 'yes' );

        if ( 'yes' === $settings ) {
            $url['wepos'] = [
                'title' => __( 'View POS', 'wepos' ),
                'icon'  => '<i class="fa fa-barcode" aria-hidden="true"></i>',
                'url'   => untrailingslashit( get_site_url() ) . '/wepos/#',
                'pos'   => 195,
            ];
        }

        return $url;
    }

    /**
     * Set dokan settings for wepos
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function add_dokan_settings( $settings_fields ) {
        $settings_fields['wepos_general']['show_pos_menu_dashboard'] = [
            'name'    => 'show_pos_menu_dashboard',
            'label'   => __( 'Show POS menu', 'wepos' ),
            'desc'    => __( 'Show POS menu in vendor dashboard', 'wepos' ),
            'type'    => 'select',
            'default' => 'yes',
            'options' => [
                'yes' => __( 'Yes', 'wepos' ),
                'no'  => __( 'No', 'wepos' ),
            ]
        ];

        return $settings_fields;
    }

    /**
     * Exclude wepos_cash payments from vendor withdrawal balance
     *
     * When a payment is made via wepos_cash method, exclude it from
     * the vendor's withdrawal balance calculation.
     *
     * @since 1.3.3
     *
     * @param bool     $should_exclude Whether to exclude the payment.
     * @param WC_Order $order          Order object.
     * @param int      $order_id       Order ID.
     * @param string   $new_status     New order status.
     * @param bool     $exclude_cod    Whether exclude COD option is enabled.
     *
     * @return bool True if payment should be excluded, false otherwise.
     */
    public function exclude_wepos_cash_payment( $should_exclude, $order, $order_id, $new_status, $exclude_cod ) {
        // Check if the payment method is wepos_cash
        if ( 'wepos_cash' === $order->get_payment_method() ) {
            return true;
        }

        return $should_exclude;
    }
}
