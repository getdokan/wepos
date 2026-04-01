<?php
namespace WeDevs\WePOS\REST;

/**
 * Access Settings API Controller
 *
 * Manages role-based capabilities for POS access.
 *
 * @since 1.4.0
 */
class AccessController extends \WP_REST_Controller {

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
	protected $base = 'settings/access';

	/**
	 * WePOS-specific capabilities.
	 *
	 * @var string[]
	 */
	private $wepos_caps = [
		'access_wepos',
		'manage_wepos',
	];

	/**
	 * WooCommerce capabilities relevant to POS operations.
	 *
	 * @var string[]
	 */
	private $wc_caps = [
		'create_customers',
		'read_private_products',
		'edit_products',
		'edit_others_products',
		'edit_published_products',
		'read_private_shop_orders',
		'publish_shop_orders',
		'edit_shop_orders',
		'edit_others_shop_orders',
		'edit_users',
		'list_users',
		'manage_product_terms',
		'read_private_shop_coupons',
	];

	/**
	 * WordPress core capabilities.
	 *
	 * @var string[]
	 */
	private $wp_caps = [
		'read',
	];

	/**
	 * WePOS admin page capabilities.
	 *
	 * Controls which admin pages a role can access.
	 * Filterable via 'wepos_access_page_capabilities' so pro can add its own pages.
	 *
	 * @var string[]
	 */
	private $page_caps = [
		'wepos_page_settings',
		'wepos_page_view_pos',
	];

	/**
	 * Get page capabilities (filterable so pro can add its own pages).
	 *
	 * @since 1.4.0
	 *
	 * @return string[]
	 */
	public function get_page_caps() {
		return apply_filters( 'wepos_access_page_capabilities', $this->page_caps );
	}

	/**
	 * Register routes.
	 *
	 * @since 1.4.0
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route( $this->namespace, '/' . $this->base, [
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_access_settings' ],
				'permission_callback' => [ $this, 'read_permission_check' ],
			],
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'update_access_settings' ],
				'permission_callback' => [ $this, 'update_permission_check' ],
			],
		] );
	}

	/**
	 * Permission check for reading access settings.
	 *
	 * Only administrators can view access settings.
	 *
	 * @since 1.4.0
	 *
	 * @return bool|\WP_Error
	 */
	public function read_permission_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'wepos_rest_cannot_read',
				__( 'Sorry, you are not allowed to view this resource.', 'wepos' ),
				[ 'status' => rest_authorization_required_code() ]
			);
		}

		return true;
	}

	/**
	 * Permission check for updating access settings.
	 *
	 * Only administrators can update access settings.
	 *
	 * @since 1.4.0
	 *
	 * @return bool|\WP_Error
	 */
	public function update_permission_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'wepos_rest_cannot_update',
				__( 'Sorry, you are not allowed to update access settings.', 'wepos' ),
				[ 'status' => rest_authorization_required_code() ]
			);
		}

		return true;
	}

	/**
	 * Get access settings for all roles.
	 *
	 * @since 1.4.0
	 *
	 * @return \WP_REST_Response
	 */
	public function get_access_settings() {
		return rest_ensure_response( $this->build_access_data() );
	}

	/**
	 * Update capabilities for a single role.
	 *
	 * Expects JSON body: { "role_slug": { "wepos": { ... }, "wc": { ... }, "wp": { ... } } }
	 *
	 * @since 1.4.0
	 *
	 * @param \WP_REST_Request $request
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_access_settings( \WP_REST_Request $request ) {
		global $wp_roles;

		$data  = $request->get_json_params();
		$roles = array_keys( $wp_roles->roles );

		// Only process valid role slugs
		$update = array_intersect_key( $data, array_flip( $roles ) );

		if ( count( $update ) !== 1 ) {
			return new \WP_Error(
				'wepos_rest_invalid_request',
				__( 'Please update one role at a time.', 'wepos' ),
				[ 'status' => 400 ]
			);
		}

		$slug = array_keys( $update )[0];
		$role = get_role( $slug );

		if ( ! $role ) {
			return new \WP_Error(
				'wepos_rest_invalid_role',
				__( 'Invalid role.', 'wepos' ),
				[ 'status' => 404 ]
			);
		}

		$caps_data = $update[ $slug ];

		// Flatten grouped capabilities into a single array
		$flattened = [];
		foreach ( [ 'wepos', 'wc', 'wp', 'pages' ] as $group ) {
			if ( isset( $caps_data[ $group ] ) && is_array( $caps_data[ $group ] ) ) {
				foreach ( $caps_data[ $group ] as $cap => $grant ) {
					$flattened[ $cap ] = wp_validate_boolean( $grant );
				}
			}
		}

		// Safety: never remove essential caps from administrator
		if ( 'administrator' === $slug ) {
			foreach ( [ 'read', 'access_wepos', 'manage_wepos' ] as $protected ) {
				if ( isset( $flattened[ $protected ] ) && ! $flattened[ $protected ] ) {
					unset( $flattened[ $protected ] );
				}
			}
		}

		// Only allow known capabilities
		$allowed_caps = array_merge( $this->wepos_caps, $this->wc_caps, $this->wp_caps, $this->get_page_caps() );

		foreach ( $flattened as $cap => $grant ) {
			if ( ! in_array( $cap, $allowed_caps, true ) ) {
				continue;
			}

			$role->add_cap( $cap, $grant );
		}

		return rest_ensure_response( $this->build_access_data() );
	}

	/**
	 * Build access data for all roles.
	 *
	 * @since 1.4.0
	 *
	 * @return array
	 */
	private function build_access_data() {
		global $wp_roles;

		$result = [];

		foreach ( $wp_roles->roles as $slug => $role_data ) {
			$caps = isset( $role_data['capabilities'] ) ? $role_data['capabilities'] : [];

			$result[ $slug ] = [
				'name'         => translate_user_role( $role_data['name'] ),
				'capabilities' => [
					'wepos' => $this->get_caps_status( $caps, $this->wepos_caps ),
					'wc'    => $this->get_caps_status( $caps, $this->wc_caps ),
					'wp'    => $this->get_caps_status( $caps, $this->wp_caps ),
					'pages' => $this->get_page_caps_status( $caps ),
				],
			];
		}

		return $result;
	}

	/**
	 * Get capability status for a group.
	 *
	 * @param array    $role_caps  All capabilities for the role.
	 * @param string[] $group_caps Capabilities in this group.
	 *
	 * @return array<string, bool>
	 */
	private function get_caps_status( $role_caps, $group_caps ) {
		$status = [];

		foreach ( $group_caps as $cap ) {
			$status[ $cap ] = ! empty( $role_caps[ $cap ] );
		}

		return $status;
	}

	/**
	 * Get effective page capability status for a role.
	 *
	 * If a page cap is not explicitly set but the role has manage_wepos,
	 * show it as enabled (matching the fallback in wepos_user_can_access_page).
	 *
	 * @param array $role_caps All capabilities for the role.
	 *
	 * @return array<string, bool>
	 */
	private function get_page_caps_status( $role_caps ) {
		$is_admin = ! empty( $role_caps['manage_options'] );
		$status   = [];

		foreach ( $this->get_page_caps() as $cap ) {
			if ( array_key_exists( $cap, $role_caps ) ) {
				// Explicitly set — use the stored value.
				$status[ $cap ] = ! empty( $role_caps[ $cap ] );
			} else {
				// Only administrator gets access by default.
				$status[ $cap ] = $is_admin;
			}
		}

		return $status;
	}
}
