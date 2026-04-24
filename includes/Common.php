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
     * Canonical meta key for a product's POS visibility setting.
     *
     * Mirrors `Admin\Products::POS_VISIBILITY_META`. Kept as a local
     * constant so the frontend/REST handlers below don't need to pull in
     * an admin-only class.
     */
    const POS_VISIBILITY_META = '_wepos_pos_visibility';

    /**
     * Canonical list of POS visibility options.
     *
     * @return array<string,string>
     */
    public static function get_pos_visibility_options() {
        return [
            'pos_and_online' => __( 'POS & Online', 'wepos' ),
            'pos_only'       => __( 'POS Only', 'wepos' ),
            'online_only'    => __( 'Online Only', 'wepos' ),
        ];
    }

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

        // POS Visibility (public-facing hooks).
        // Admin-only hooks live in `Admin\Products`; these must fire on the
        // storefront and on REST, which is why they live here.
        //
        // Hide `pos_only` products from every frontend surface: shop loop,
        // archives, search, widgets, related products, upsells/cross-sells,
        // and `[products]`/block-editor shortcodes.
        add_action( 'pre_get_posts', [ $this, 'hide_pos_only_from_frontend' ] );

        // 404 on direct product URL access (/product/slug/, /?p=123) for
        // `pos_only` products. `pre_get_posts` can't reliably block singular
        // requests with a meta_query; this is the authoritative gate.
        add_action( 'template_redirect', [ $this, 'block_pos_only_singular' ] );

        // Hide `pos_only` from the public WooCommerce REST API for external
        // consumers. The wepos POS endpoint inherits this filter through
        // class extension, so we detect `/wepos/` routes and bail so the
        // POS can still see POS-only products.
        add_filter( 'woocommerce_rest_product_object_query', [ $this, 'hide_pos_only_from_wc_rest' ], 10, 2 );

        // REST read/write support for `pos_visibility` — covers both the
        // public WC REST endpoints and the POS endpoints.
        add_filter( 'woocommerce_rest_prepare_product_object', [ $this, 'rest_expose_pos_visibility' ], 10, 2 );
        add_action( 'woocommerce_rest_insert_product_object', [ $this, 'rest_save_pos_visibility' ], 10, 2 );

        // Decimal quantities — always preserve fractional values at the data
        // layer. WooCommerce casts every quantity passed through
        // `wc_stock_amount()` to int via the default
        // `woocommerce_stock_amount => intval` filter. That truncates
        // decimals on both write AND read — so once a user toggles decimal
        // quantities OFF, every previously saved decimal (order line qty,
        // product stock) would display as an integer even though the DB still
        // holds the float. Swapping in `floatval` is always safe: for an
        // integer value like `5`, `floatval()` returns `5.0` which PHP
        // coerces back to `"5"` on output (no visible change).
        //
        // The `enable_decimal_quantities` toggle only gates the UI surfaces
        // (cart input, admin stock step, QuickEdit step, order REST schema).
        remove_filter( 'woocommerce_stock_amount', 'intval' );
        add_filter( 'woocommerce_stock_amount', 'floatval' );
        add_action( 'woocommerce_before_product_object_save', [ $this, 'recalc_decimal_stock_status' ] );
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

    /**
     * Hide products flagged as POS-only from every frontend surface:
     * shop loop, category/tag archives, search, widgets, related products,
     * upsells/cross-sells, and the `[products]` / block-editor shortcodes.
     *
     * Skipped in the admin and during REST requests (REST has its own filter).
     *
     * @since 1.5.0
     *
     * @param \WP_Query $query
     *
     * @return void
     */
    public function hide_pos_only_from_frontend( $query ) {
        if ( is_admin() ) {
            return;
        }

        if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
            return;
        }

        if ( 'yes' !== wepos_get_option( 'enable_pos_only_products', 'wepos_general', 'no' ) ) {
            return;
        }

        $post_type = $query->get( 'post_type' );
        $is_product_query =
            'product' === $post_type
            || ( is_array( $post_type ) && in_array( 'product', $post_type, true ) )
            || ( $query->is_main_query() && ( is_shop() || is_product_taxonomy() || is_product_category() || is_product_tag() ) );

        if ( ! $is_product_query ) {
            return;
        }

        $meta_query = $query->get( 'meta_query' );
        if ( ! is_array( $meta_query ) ) {
            $meta_query = [];
        }

        $meta_query[] = [
            'relation' => 'OR',
            [
                'key'     => self::POS_VISIBILITY_META,
                'compare' => 'NOT EXISTS',
            ],
            [
                'key'     => self::POS_VISIBILITY_META,
                'value'   => 'pos_only',
                'compare' => '!=',
            ],
        ];

        $query->set( 'meta_query', $meta_query );
    }

    /**
     * Block direct access to a `pos_only` product's single page — turn it
     * into a 404 so the storefront never reveals the product, even when the
     * URL is known (shared links, bookmarks, `/?p=123`).
     *
     * @since 1.5.0
     *
     * @return void
     */
    public function block_pos_only_singular() {
        if ( is_admin() ) {
            return;
        }

        if ( 'yes' !== wepos_get_option( 'enable_pos_only_products', 'wepos_general', 'no' ) ) {
            return;
        }

        if ( ! is_singular( 'product' ) ) {
            return;
        }

        $product_id = get_queried_object_id();
        if ( ! $product_id ) {
            return;
        }

        $visibility = get_post_meta( $product_id, self::POS_VISIBILITY_META, true );
        if ( 'pos_only' !== $visibility ) {
            return;
        }

        global $wp_query;
        $wp_query->set_404();
        status_header( 404 );
        nocache_headers();

        $template = get_404_template();
        if ( $template ) {
            include $template;
        }
        exit;
    }

    /**
     * Hide `pos_only` products from the public WooCommerce REST API.
     *
     * The wepos POS endpoint extends `WC_REST_Products_Controller` and
     * therefore inherits this filter — so we detect the namespace and bail,
     * leaving POS listings intact.
     *
     * @since 1.5.0
     *
     * @param array            $args
     * @param \WP_REST_Request $request
     *
     * @return array
     */
    public function hide_pos_only_from_wc_rest( $args, $request ) {
        if ( 'yes' !== wepos_get_option( 'enable_pos_only_products', 'wepos_general', 'no' ) ) {
            return $args;
        }

        // Skip for wepos's own endpoints — the POS must see pos_only products.
        if ( $request && 0 === strpos( (string) $request->get_route(), '/wepos/' ) ) {
            return $args;
        }

        if ( ! isset( $args['meta_query'] ) || ! is_array( $args['meta_query'] ) ) {
            $args['meta_query'] = [];
        }

        $args['meta_query'][] = [
            'relation' => 'OR',
            [
                'key'     => self::POS_VISIBILITY_META,
                'compare' => 'NOT EXISTS',
            ],
            [
                'key'     => self::POS_VISIBILITY_META,
                'value'   => 'pos_only',
                'compare' => '!=',
            ],
        ];

        return $args;
    }

    /**
     * Expose `pos_visibility` in WC REST product responses.
     *
     * @since 1.5.0
     *
     * @param \WP_REST_Response $response
     * @param \WC_Product       $product
     *
     * @return \WP_REST_Response
     */
    public function rest_expose_pos_visibility( $response, $product ) {
        $value = get_post_meta( $product->get_id(), self::POS_VISIBILITY_META, true );
        $response->data['pos_visibility'] = $value ? $value : 'pos_and_online';
        return $response;
    }

    /**
     * Persist `pos_visibility` sent on REST insert/update requests.
     *
     * @since 1.5.0
     *
     * @param \WC_Product      $product
     * @param \WP_REST_Request $request
     *
     * @return void
     */
    public function rest_save_pos_visibility( $product, $request ) {
        if ( ! $request->has_param( 'pos_visibility' ) ) {
            return;
        }

        $value = sanitize_text_field( $request['pos_visibility'] );
        if ( ! array_key_exists( $value, self::get_pos_visibility_options() ) ) {
            $value = 'pos_and_online';
        }

        update_post_meta( $product->get_id(), self::POS_VISIBILITY_META, $value );
    }

    /**
     * Recompute stock_status for products with decimal stock quantities.
     *
     * WooCommerce's built-in out-of-stock check uses integer comparisons;
     * a stock of `0.5` would be flagged as "in stock" but subsequent decimal
     * reductions may cross zero at awkward times. This mirrors WC's own
     * logic while treating a stock quantity > 0 as "in stock" regardless of
     * fractional precision.
     *
     * @since 1.5.0
     *
     * @param \WC_Product $product
     *
     * @return void
     */
    public function recalc_decimal_stock_status( $product ): void {
        if ( ! $product->get_manage_stock() ) {
            $product->set_stock_status( 'instock' );
            return;
        }

        $stock_quantity   = (float) $product->get_stock_quantity();
        $notify_threshold = (float) get_option( 'woocommerce_notify_no_stock_amount', 0 );
        $above_threshold  = $stock_quantity > 0 && $stock_quantity > $notify_threshold;
        $allow_backorders = 'no' !== $product->get_backorders();

        if ( $above_threshold ) {
            $product->set_stock_status( 'instock' );
        } elseif ( $allow_backorders ) {
            $product->set_stock_status( 'onbackorder' );
        } else {
            $product->set_stock_status( 'outofstock' );
        }
    }
}
