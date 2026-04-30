<?php
namespace WeDevs\WePOS\REST;

/**
* Tax API Controller
*/
class TaxController extends \WC_REST_Taxes_V2_Controller {

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
    protected $base = 'taxes';

    /**
     * Register the routes for taxes.
     */
    public function register_routes() {
        register_rest_route( $this->namespace, '/' . $this->base, array(
            array(
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_taxes' ),
                'permission_callback' => array( $this, 'get_taxes_permissions_check' ),
                'args'                => $this->get_collection_params(),
            )
        ) );
    }

    /**
     * Get taxes permission checking
     *
     * @since 1.0.2
     *
     * @return bool|\WP_Error
     *
     */
    public function get_taxes_permissions_check() {
        if ( ! ( wepos_current_user_can_manage() ) ) {
            return new \WP_Error( 'wepos_rest_cannot_batch', __( 'Sorry, you are not allowed view this resource.', 'wepos' ), array( 'status' => rest_authorization_required_code() ) );
        }


        return true;
    }

    /**
     * Get taxes
     *
     * @since 1.0.0
     *
     * @return \WP_Error|\WP_REST_Response
     *
     */
    public function get_taxes( $request ) {
        return $this->get_items( $request );
    }

}
