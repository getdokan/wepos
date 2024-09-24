<?php

namespace WeDevs\WePOS\REST;

/**
 * Coupon API Controller.
 *
 * @since WEPOS_SINCE
 *
 * @package wepos
 */
class CouponController extends \WC_REST_Coupons_Controller {

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
    protected $base = 'coupons';

    /**
     * Create Item Permission Checking.
     *
     * @since WEPOS_SINCE
     *
     * @param \WP_REST_Request $request
     *
     * @return bool|\WP_Error
     *
     */
    public function create_item_permissions_check( $request ) {
        $parent_permission = parent::create_item_permissions_check( $request );

        if ( true === $parent_permission ) {
            return true;
        }

        if ( apply_filters( 'wepos_rest_manager_permissions', false ) ) {
            return true;
        }

        return $parent_permission;
    }
}
