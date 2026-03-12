<?php
namespace WeDevs\WePOS\REST;

/**
 * Tax API Controller
 */
class SettingController extends \WP_REST_Controller {

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
	protected $base = 'settings';

    /**
     * Register all routes related with settings
     *
     * @since 1.1.2
     *
     * @return void
     */
    public function register_routes() {
        register_rest_route( $this->namespace, '/' . $this->base, array(
            array(
                'methods'              => \WP_REST_Server::READABLE,
                'callback'             => array( $this, 'get_settings' ),
                'args'                 => $this->get_collection_params(),
                'permission_callback'  => [ $this, 'get_setting_permission_check' ]
            ),
        ) );
    }

	/**
	 * Setting permission check
	 *
	 * @since 1.1.2
     *
     * @return bool|\WP_Error
     *
     */
	public function get_setting_permission_check() {
		if ( ! ( current_user_can( 'manage_woocommerce' ) || apply_filters( 'wepos_rest_manager_permissions', false ) ) ) {
			return new \WP_Error( 'wepos_rest_cannot_batch', __( 'Sorry, you are not allowed view this resource.', 'wepos' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	/**
	 * Get settings
	 *
     * @since 1.0.0
     *
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     *
     */
	public function get_settings( $request ) {
		$settings = [];

		foreach ( wepos_get_settings_fields() as $section_key => $settings_options ) {
			$section_option = get_option( $section_key, [] );
			foreach ( $settings_options as $settings_key => $settings_value ) {
				$settings[$section_key][$settings_key] = isset( $section_option[$settings_key] ) ? $section_option[$settings_key] : $settings_options[$settings_key]['default'];
			}
		}

		$tax_display_on_shop = get_option( 'woocommerce_tax_display_shop', 'excl' );
		$tax_display_on_cart = get_option( 'woocommerce_tax_display_cart', 'excl' );
		$tax_based_on = get_option( 'woocommerce_tax_based_on', 'shipping' );
		$settings['woo_tax'] = [
			'wc_tax_display_shop' => $tax_display_on_shop,
			'wc_tax_display_cart' => $tax_display_on_cart,
			'wc_tax_based_on'    => $tax_based_on,
		];

		return rest_ensure_response( $settings );
	}

}
