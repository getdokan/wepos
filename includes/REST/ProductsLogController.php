<?php
namespace WeDevs\WePOS\REST;

/**
* Products Log API Controller
*/
class ProductsLogController extends \WP_REST_Controller {

    /**
     * Endpoint namespace.
     *
     * @var string
     */
    protected $namespace = 'wepos/v1';

    /**
     * Route name.
     *
     * @var string
     */
    protected $base = 'product/logs';

    /**
     * Register all routes related to products log.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @return void
     */
    public function register_routes() {
        register_rest_route( $this->namespace, '/' . $this->base. '/(?P<id>[\d]+)', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [ $this, 'get_items' ],
                'permission_callback' => [ $this, 'get_items_permission' ],
                'args' => array(
                    'id' => [
                        'description' => __( 'Unique identifier for the object.', 'wepos' ),
                        'type'        => 'integer',
                        'required'    => true,
                    ],
                ),
            ],
            [
                'methods'             => \WP_REST_Server::EDITABLE,
                'callback'            => [ $this, 'update_items' ],
                'permission_callback' => [ $this, 'update_items_permission' ],
            ],
            'schema' => [ $this, 'get_item_schema' ],
        ] );
    }

    /**
     * Get items permission check.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param $request
     *
     * @return bool
     */
    public function get_items_permission( $request ) {
        if ( current_user_can( 'manage_woocommerce' ) || apply_filters( 'wepos_rest_manager_permissions', false ) ) {
            return true;
        }

        return false;
    }

    /**
     * Update items permission check.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param $request
     *
     * @return bool
     */
    public function update_items_permission( $request ) {
        return $this->get_items_permission( $request );
    }

    /**
     * Get product log items.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param \WP_Rest_Request $request
     *
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function get_items( $request ) {
        $args['counter_id'] = $request['id'];

        $request->set_query_params( [ 'context' => 'view' ] );

        $product_logs = wepos()->products_log->get_product_logs( $args );
        $data_objects = [];

        if ( ! empty( $product_logs ) ) {
            foreach( $product_logs as $product_log ) {
                $product_details = [
                    'id'             => $product_log->id,
                    'product_id'     => $product_log->product_id,
                    'product_title'  => $product_log->product_title,
                    'product_type'   => $product_log->product_type,
                    'product_sku'    => $product_log->product_sku,
                    'product_price'  => $product_log->product_price,
                    'product_stock'  => $product_log->product_stock,
                    'counter_counts' => $product_log->counter_counts,
                ];

                $response       = $this->prepare_item_for_response( $product_details, $request );
                $data_objects[] = $this->prepare_response_for_collection( $response );
            }
        }

        $response = rest_ensure_response( $data_objects );

        $response->header( 'X-WP-Total', intval( count( $product_logs ) ) );

        return $response;
    }

    /**
     * Update product log counter count item.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param \WP_Rest_Request $request
     *
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
    public function update_items( $request ) {
        $args['counter_id'] = $request['id'];

        $request->set_query_params( [ 'context' => 'edit' ] );

        $products_log_data = wepos()->products_log->handle_product_logs_data( $args );

        $response    = $this->prepare_item_for_response( $products_log_data, $request );
        $data_object = $this->prepare_response_for_collection( $response );

        return rest_ensure_response( $data_object );
    }

    /**
     * Prepares the item for REST response.
     *
     * @param mixed            $item    WordPress representation of the item.
     * @param \WP_REST_Request $request Request object.
     *
     * @return \WP_Error|object
     */
    public function prepare_item_for_response( $item, $request ) {
        $data   = [];
        $fields = $this->get_fields_for_response( $request );

        if ( in_array( 'id', $fields, true ) ) {
            $data['id'] = intval( $item['id'] );
        }

        if ( in_array( 'product_id', $fields, true ) ) {
            $data['product_id'] = intval( $item['product_id'] );
        }

        if ( in_array( 'product_title', $fields, true ) ) {
            $data['product_title'] = (string) $item['product_title'];
        }

        if ( in_array( 'product_type', $fields, true ) ) {
            $data['product_type'] = (string) $item['product_type'];
        }

        if ( in_array( 'product_sku', $fields, true ) ) {
            $data['product_sku'] = (string) $item['product_sku'];
        }

        if ( in_array( 'product_price', $fields, true ) ) {
            $data['product_price'] = floatval( $item['product_price'] );
        }

        if ( in_array( 'product_stock', $fields, true ) ) {
            $data['product_stock'] = intval( $item['product_stock'] );
        }

        if ( in_array( 'counter_counts', $fields, true ) ) {
            $data['counter_counts'] = intval( $item['counter_counts'] );
        }

        if ( in_array( 'counter_inserted', $fields, true ) ) {
            $data['counter_inserted'] = boolval( $item['counter_inserted'] );
        }

        if ( in_array( 'counter_counts_updated', $fields, true ) ) {
            $data['counter_counts_updated'] = boolval( $item['counter_counts_updated'] );
        }

        if ( in_array( 'logs_deleted', $fields, true ) ) {
            $data['logs_deleted'] = boolval( $item['logs_deleted'] );
        }

        $context  = ! empty( $request['context'] ) ? $request['context'] : 'view';
        $data     = $this->filter_response_by_context( $data, $context );
        $response = rest_ensure_response( $data );

        return $response;
    }

    /**
     * Retrieves the payment summary schema, conforming to JSON Schema.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @return array
     */
    public function get_item_schema() {
        if ( $this->schema ) {
            return $this->add_additional_fields_schema( $this->schema );
        }

        $schema = [
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => 'report',
            'type'       => 'object',
            'properties' => [
                'id' => [
                    'description' => __( 'ID of the product log.', 'wepos' ),
                    'type'        => 'integer',
                    'context'     => [ 'view' ],
                    'required'    => true,
                    'arg_options' => [
                        'sanitize_callback' => 'absint',
                    ],
                ],
                'product_id' => [
                    'description' => __( 'ID of the product.', 'wepos' ),
                    'type'        => 'integer',
                    'context'     => [ 'view' ],
                    'required'    => true,
                    'arg_options' => [
                        'sanitize_callback' => 'absint',
                    ],
                ],
                'product_title' => [
                    'description' => __( 'Title of the product.', 'wepos' ),
                    'type'        => 'string',
                    'context'     => [ 'view' ],
                    'required'    => true,
                    'arg_options' => [
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
                'product_type' => [
                    'description' => __( 'Type of the product.', 'wepos' ),
                    'type'        => 'string',
                    'context'     => [ 'view' ],
                    'required'    => true,
                    'arg_options' => [
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
                'product_sku' => [
                    'description' => __( 'SKU of the product.', 'wepos' ),
                    'type'        => 'string',
                    'context'     => [ 'view' ],
                    'required'    => true,
                    'arg_options' => [
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
                'product_price' => [
                    'description' => __( 'Price of the product.', 'wepos' ),
                    'type'        => 'float',
                    'context'     => [ 'view' ],
                    'required'    => true,
                    'arg_options' => [
                        'sanitize_callback' => 'floatval',
                    ],
                ],
                'product_stock' => [
                    'description' => __( 'Remaining stock count of the product.', 'wepos' ),
                    'type'        => 'integer',
                    'context'     => [ 'view' ],
                    'required'    => true,
                    'arg_options' => [
                        'sanitize_callback' => 'absint',
                    ],
                ],
                'counter_counts' => [
                    'description' => __( 'Number of counter already received update for this product log.', 'wepos' ),
                    'type'        => 'integer',
                    'context'     => [ 'view' ],
                    'required'    => true,
                    'arg_options' => [
                        'sanitize_callback' => 'absint',
                    ],
                ],
                'counter_inserted' => [
                    'description' => __( 'If the product counter data inserted.', 'wepos' ),
                    'type'        => 'boolean',
                    'context'     => [ 'edit' ],
                    'required'    => true,
                    'arg_options' => [
                        'sanitize_callback' => 'boolval',
                    ],
                ],
                'counter_counts_updated' => [
                    'description' => __( 'If the product counter counts updated.', 'wepos' ),
                    'type'        => 'boolean',
                    'context'     => [ 'edit' ],
                    'required'    => true,
                    'arg_options' => [
                        'sanitize_callback' => 'boolval',
                    ],
                ],
                'logs_deleted' => [
                    'description' => __( 'If the unnecessary product logs deleted.', 'wepos' ),
                    'type'        => 'boolean',
                    'context'     => [ 'edit' ],
                    'required'    => true,
                    'arg_options' => [
                        'sanitize_callback' => 'boolval',
                    ],
                ],
            ],
        ];

        $this->schema = $schema;

        return $this->add_additional_fields_schema( $this->schema );
    }
}
