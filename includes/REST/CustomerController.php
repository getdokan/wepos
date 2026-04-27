<?php
namespace WeDevs\WePOS\REST;

/**
* Customer API Controller
*/
class CustomerController extends \WC_REST_Customers_Controller {

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
    protected $base = 'customers';

    /**
     * Register the routes for customers.
     */
    public function register_routes() {
        register_rest_route( $this->namespace, '/' . $this->base, array(
            array(
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_customers' ),
                'permission_callback' => array( $this, 'get_customers_permissions_check' ),
                'args'                => $this->get_collection_params(),
            ),
            array(
                'methods'             => \WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'create_customer' ),
                'permission_callback' => array( $this, 'create_customer_permission_callback' ),
                'args'                => array_merge( $this->get_endpoint_args_for_item_schema( \WP_REST_Server::CREATABLE ), array(
                    'email' => array(
                        'required' => true,
                        'type'     => 'string',
                        'description' => __( 'New user email address.', 'wepos' ),
                    ),
                    'username' => array(
                        'required' => 'no' === get_option( 'woocommerce_registration_generate_username', 'yes' ),
                        'description' => __( 'New user username.', 'wepos' ),
                        'type'     => 'string',
                    ),
                    'password' => array(
                        'required' => 'no' === get_option( 'woocommerce_registration_generate_password', 'no' ),
                        'description' => __( 'New user password.', 'wepos' ),
                        'type'     => 'string',
                    ),
                ) ),
            ),
            'schema' => array( $this, 'get_public_item_schema' ),
        ) );

        register_rest_route( $this->namespace, '/' . $this->base . '/(?P<id>[\d]+)', array(
            array(
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_customer' ),
                'permission_callback' => array( $this, 'get_customers_permissions_check' ),
                'args'                => array_merge(
                    array(
                        'id' => array(
                            'description' => __( 'Unique identifier for the resource.', 'wepos' ),
                            'type'        => 'integer',
                        ),
                    ),
                    $this->get_endpoint_args_for_item_schema( \WP_REST_Server::READABLE )
                ),
            ),
            array(
                'methods'             => \WP_REST_Server::EDITABLE,
                'callback'            => array( $this, 'update_customer' ),
                'permission_callback' => array( $this, 'update_customer_permission_callback' ),
                'args'                => array_merge(
                    array(
                        'id' => array(
                            'description' => __( 'Unique identifier for the resource.', 'wepos' ),
                            'type'        => 'integer',
                        ),
                    ),
                    $this->get_endpoint_args_for_item_schema( \WP_REST_Server::EDITABLE )
                ),
            ),
            'schema' => array( $this, 'get_public_item_schema' ),
        ) );
    }

    /**
     * Get the query params for collections.
     *
     * @return array
     */
    public function get_collection_params() {
        $params = parent::get_collection_params();

        if ( isset( $params['orderby']['enum'] ) && is_array( $params['orderby']['enum'] ) ) {
            $params['orderby']['enum'][] = 'last_name';
        }

        return $params;
    }

    /**
     * Get customers permission checking
     *
     * @since 1.0.2
     *
     * @return bool|\WP_Error
     */
    public function create_customer_permission_callback() {
        $can_create = wepos_current_user_can_manage() && current_user_can( 'create_customers' );

        if ( ! $can_create ) {
            return new \WP_Error( 'wepos_rest_cannot_create', __( 'Sorry, you are not allowed to create customers.', 'wepos' ), array( 'status' => rest_authorization_required_code() ) );
        }

        return true;
    }

    /**
     * Update customer permission checking
     *
     * @since 1.0.5
     *
     * @return bool|\WP_Error
     */
    public function update_customer_permission_callback() {
        $can_update = wepos_current_user_can_manage() && current_user_can( 'create_customers' );

        if ( ! $can_update ) {
            return new \WP_Error( 'wepos_rest_cannot_update', __( 'Sorry, you are not allowed to update customers.', 'wepos' ), array( 'status' => rest_authorization_required_code() ) );
        }

        return true;
    }

    /**
     * Get customers permission checking
     *
     * @since 1.0.2
     *
     * @return bool|\WP_Error
     *
     */
    public function get_customers_permissions_check() {
        if ( ! ( wepos_current_user_can_manage() ) ) {
            return new \WP_Error( 'wepos_rest_cannot_view', __( 'Sorry, you are not allowed to view customers.', 'wepos' ), array( 'status' => rest_authorization_required_code() ) );
        }

        return true;
    }

    /**
     * Create a customer
     *
     * @since 1.0.5
     *
     * @return \WP_Error|\WP_REST_Response
     */
    public function create_customer( $request ) {
        return $this->create_item( $request );
    }

    /**
     * Get a customer
     *
     * @since 1.0.5
     *
     * @return \WP_Error|\WP_REST_Response
     */
    public function get_customer( $request ) {
        return $this->get_item( $request );
    }

    /**
     * Update a customer
     *
     * @since 1.0.5
     *
     * @return \WP_Error|\WP_REST_Response
     */
    public function update_customer( $request ) {
        return $this->update_item( $request );
    }

    /**
     * Get customers
     *
     * @since 1.0.5
     *
     * @return \WP_Error|\WP_REST_Response
     */
    public function get_customers( $request ) {
        if ( empty( $request['role'] ) ) {
            $request->set_param( 'role', 'customer' );
        }

        $has_search = ! empty( $request['search'] );
        $has_custom_sort = ( ! empty( $request['orderby'] ) && 'last_name' === $request['orderby'] );

        if ( $has_custom_sort ) {
            $request->set_param( 'wepos_orderby', 'last_name' );
            $request->set_param( 'orderby', 'name' );
        }

        if ( $has_search || $has_custom_sort ) {
            add_filter( 'woocommerce_rest_customer_query', array( $this, 'extend_customer_search' ), 10, 2 );
        }
        if ( $has_search ) {
            add_action( 'pre_user_query', array( $this, 'extend_user_query_search' ) );
        }

        $response = $this->get_items( $request );

        if ( $has_search || $has_custom_sort ) {
            remove_filter( 'woocommerce_rest_customer_query', array( $this, 'extend_customer_search' ), 10 );
        }
        if ( $has_search ) {
            remove_action( 'pre_user_query', array( $this, 'extend_user_query_search' ) );
        }

        return $response;
    }

    /**
     * Extend customer search to include user meta fields.
     *
     * @since 1.0.5
     *
     * @param array            $prepared_args Array of arguments for WP_User_Query.
     * @param \WP_REST_Request $request       The current request.
     *
     * @return array
     */
    public function extend_customer_search( $prepared_args, $request ) {
        $has_search = ! empty( $request['search'] );
        $has_custom_sort = ( ! empty( $request['wepos_orderby'] ) && 'last_name' === $request['wepos_orderby'] );

        if ( ! $has_search && ! $has_custom_sort ) {
            return $prepared_args;
        }

        if ( empty( $prepared_args['role'] ) && ! empty( $request['role'] ) && 'all' !== $request['role'] ) {
            $prepared_args['role'] = $request['role'];
        }

        if ( $has_search ) {
            $prepared_args['wepos_search']   = $request['search'];
            $prepared_args['search_columns'] = array( 'user_login', 'user_email', 'user_nicename', 'display_name' );
        }

        if ( $has_custom_sort ) {
            $prepared_args['meta_key'] = 'last_name';
            $prepared_args['orderby']  = 'meta_value';
            $prepared_args['order']    = ( ! empty( $request['order'] ) && 'asc' === strtolower( $request['order'] ) ) ? 'ASC' : 'DESC';
        }

        return $prepared_args;
    }

    /**
     * Add OR search against customer meta (first/last name, billing address).
     *
     * @since 1.0.5
     *
     * @param \WP_User_Query $query Current instance of WP_User_Query (passed by reference).
     *
     * @return void
     */
    public function extend_user_query_search( $query ) {
        if ( empty( $query->query_vars['wepos_search'] ) ) {
            return;
        }

        global $wpdb;

        $search = $query->query_vars['wepos_search'];
        $like   = '%' . $wpdb->esc_like( $search ) . '%';

        $meta_keys = array(
            'first_name',
            'last_name',
            'billing_first_name',
            'billing_last_name',
            'billing_email',
            'billing_phone',
            'billing_company',
            'billing_address_1',
            'billing_address_2',
            'billing_city',
            'billing_state',
            'billing_postcode',
            'billing_country',
        );

        $placeholders    = implode( ',', array_fill( 0, count( $meta_keys ), '%s' ) );
        $prepare_values  = array_merge( $meta_keys, array( $like ) );
        $meta_search_sql = $wpdb->prepare(
            "EXISTS (
                SELECT 1 FROM $wpdb->usermeta AS wepos_um
                WHERE wepos_um.user_id = $wpdb->users.ID
                  AND wepos_um.meta_key IN ($placeholders)
                  AND wepos_um.meta_value LIKE %s
            )",
            $prepare_values
        );

        $raw_search    = $query->query_vars['search'];
        $leading_wild  = ( ltrim( $raw_search, '*' ) !== $raw_search );
        $trailing_wild = ( rtrim( $raw_search, '*' ) !== $raw_search );
        if ( $leading_wild && $trailing_wild ) {
            $wild = 'both';
        } elseif ( $leading_wild ) {
            $wild = 'leading';
        } elseif ( $trailing_wild ) {
            $wild = 'trailing';
        } else {
            $wild = false;
        }
        if ( $wild ) {
            $raw_search = trim( $raw_search, '*' );
        }

        $search_columns = ! empty( $query->query_vars['search_columns'] )
            ? (array) $query->query_vars['search_columns']
            : array( 'user_login', 'user_email', 'user_nicename', 'display_name' );

        $search_sql  = $query->get_search_sql( $raw_search, $search_columns, $wild );
        $replacement = substr( $search_sql, 0, -1 ) . ' OR ' . $meta_search_sql . ')';

        if ( false !== strpos( $query->query_where, $search_sql ) ) {
            $query->query_where = str_replace( $search_sql, $replacement, $query->query_where );
        } else {
            $query->query_where .= ' AND (' . $meta_search_sql . ')';
        }
    }
}