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
        if ( ! ( current_user_can( 'manage_woocommerce' ) || apply_filters( 'wepos_rest_manager_permissions', false ) ) ) {
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
            $threshold = absint( max( get_option( 'woocommerce_notify_low_stock_amount', 2 ), 1 ) );

            $args['meta_query'] = $this->add_meta_query( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
                $args,
                array(
                    'key'   => '_manage_stock',
                    'value' => 'yes',
                )
            );

            $args['meta_query'] = $this->add_meta_query( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
                $args,
                array(
                    'key'     => '_stock',
                    'value'   => 0,
                    'compare' => '>',
                    'type'    => 'NUMERIC',
                )
            );

            $args['meta_query'] = $this->add_meta_query( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
                $args,
                array(
                    'key'     => '_stock',
                    'value'   => $threshold,
                    'compare' => '<=',
                    'type'    => 'NUMERIC',
                )
            );

            if ( empty( $request['stock_status'] ) ) {
                $args['meta_query'] = $this->add_meta_query( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
                    $args,
                    array(
                        'key'   => '_stock_status',
                        'value' => 'instock',
                    )
                );
            }
        }

        return $args;
    }
}
