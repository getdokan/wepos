<?php
namespace WeDevs\WePOS\REST;

/**
* Product API Controller
*/
class ProductController extends \WC_REST_Products_Controller {

    /**
     * Endpoint namespace
     *
     * @var string
     */
    protected $namespace = 'wepos/v1';

    /**
     * Route name
     *
     * @var string
     */
    protected $base = 'products';

    /**
     * Register the routes for products.
     */
    public function register_routes() {
        register_rest_route( $this->namespace, '/' . $this->base, array(
            array(
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_products' ),
                'permission_callback' => array( $this, 'get_products_permissions_check' ),
                'args'                => $this->get_collection_params(),
            ),
            'schema' => array( $this, 'get_item_schema' ),
        ) );
    }

    /**
     * Get collection params.
     *
     * @return array
     */
    public function get_collection_params() {
        $params = parent::get_collection_params();

        $params['low_stock'] = array(
            'description'       => __( 'Limit result set to products that are low in stock.', 'wepos' ),
            'type'              => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
            'validate_callback' => 'rest_validate_request_arg',
        );

        return $params;
    }

    /**
     * Get product permission checking
     *
     * @since 1.0.2
     *
     * @return bool|\WP_Error
     */
    public function get_products_permissions_check() {
        if ( ! ( wepos_current_user_can_manage() ) ) {
            return new \WP_Error( 'wepos_rest_cannot_batch', __( 'Sorry, you are not allowed view this resource.', 'wepos' ), array( 'status' => rest_authorization_required_code() ) );
        }

        return true;
    }

    /**
     * Get products
     *
     * @since 1.0.5
     *
     * @return \WP_Error|\WP_REST_Response
     */
    public function get_products( $request ) {
        return $this->get_items( $request );
    }

    /**
     * Prepare objects query.
     *
     * @param \WP_REST_Request $request Request object.
     *
     * @return array
     */
    protected function prepare_objects_query( $request ) {
        $args = parent::prepare_objects_query( $request );

        if ( ! empty( $request['low_stock'] ) ) {
            $low_stock_ids = $this->get_low_stock_product_ids();

            if ( ! empty( $args['post__in'] ) ) {
                $intersected      = array_values( array_intersect( $low_stock_ids, array_map( 'intval', $args['post__in'] ) ) );
                $args['post__in'] = ! empty( $intersected ) ? $intersected : array( 0 );
            } else {
                $args['post__in'] = ! empty( $low_stock_ids ) ? $low_stock_ids : array( 0 );
            }
        }

        // Exclude products marked as "Online Only" from the POS product list
        // when the POS Visibility feature is turned on.
        if ( 'yes' === wepos_get_option( 'enable_pos_only_products', 'wepos_general', 'no' ) ) {
            if ( ! isset( $args['meta_query'] ) || ! is_array( $args['meta_query'] ) ) {
                $args['meta_query'] = array();
            }

            $args['meta_query'][] = array(
                'relation' => 'OR',
                array( 'key' => '_wepos_pos_visibility', 'compare' => 'NOT EXISTS' ),
                array( 'key' => '_wepos_pos_visibility', 'value' => 'online_only', 'compare' => '!=' ),
            );
        }

        /**
         * Filter wePOS product query arguments before fetching products.
         *
         * @since 1.4.0
         *
         * @param array            $args    Product query args.
         * @param \WP_REST_Request $request Request object.
         */
        $args = apply_filters( 'wepos_rest_product_query_args', $args, $request );

        return $args;
    }

    /**
     * Get product IDs that are low in stock, respecting per-product
     * thresholds and falling back to the global WooCommerce threshold.
     *
     * @return int[]
     */
    private function get_low_stock_product_ids() {
        $global_threshold = absint( max( get_option( 'woocommerce_notify_low_stock_amount', 2 ), 1 ) );

        $base_args = array(
            'post_type'              => 'product',
            'post_status'            => 'publish',
            'posts_per_page'         => -1,
            'fields'                 => 'ids',
            'no_found_rows'          => true,
            'update_post_term_cache' => false,
            'update_post_meta_cache' => false,
            'meta_query'             => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
                'relation' => 'AND',
                array( 'key' => '_manage_stock', 'value' => 'yes' ),
                array( 'key' => '_stock_status', 'value' => 'instock' ),
                array( 'key' => '_stock', 'value' => 0, 'compare' => '>', 'type' => 'NUMERIC' ),
            ),
        );

        // Products without a per-product threshold: use the global threshold.
        $global_args                    = $base_args;
        $global_args['meta_query'][]    = array( 'key' => '_stock', 'value' => $global_threshold, 'compare' => '<=', 'type' => 'NUMERIC' );
        $global_args['meta_query'][]    = array(
            'relation' => 'OR',
            array( 'key' => '_low_stock_amount', 'compare' => 'NOT EXISTS' ),
            array( 'key' => '_low_stock_amount', 'value' => '' ),
            array( 'key' => '_low_stock_amount', 'value' => 0, 'compare' => '<=', 'type' => 'NUMERIC' ),
        );
        $ids_from_global = get_posts( $global_args );

        // Products with a per-product threshold: fetch candidates, then filter in PHP.
        $per_product_args                 = $base_args;
        $per_product_args['meta_query'][] = array( 'key' => '_low_stock_amount', 'value' => 0, 'compare' => '>', 'type' => 'NUMERIC' );
        $candidates = get_posts( $per_product_args );

        $ids_from_per_product = array();
        foreach ( $candidates as $product_id ) {
            $stock     = (int) get_post_meta( $product_id, '_stock', true );
            $threshold = (int) get_post_meta( $product_id, '_low_stock_amount', true );

            if ( $stock <= $threshold ) {
                $ids_from_per_product[] = $product_id;
            }
        }

        return array_values( array_unique( array_merge(
            array_map( 'intval', (array) $ids_from_global ),
            array_map( 'intval', $ids_from_per_product )
        ) ) );
    }
}
