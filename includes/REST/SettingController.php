<?php
namespace WeDevs\WePOS\REST;

use WeDevs\WePOS\Settings\Caps;

/**
 * Settings API Controller
 *
 * Supports outlet-specific settings overrides.
 * When an outlet_id is provided, settings are merged:
 *   global defaults ← outlet overrides
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
	 * Sections that can be overridden per outlet.
	 *
	 * @var string[]
	 */
	private $overridable_sections = [ 'woo_general', 'woo_tax', 'wepos_general', 'wepos_barcode' ];

	/**
	 * Sections stored per-user (not per-outlet or globally).
	 *
	 * @var string[]
	 */
	private $personal_sections = [ 'wepos_cashier', 'wepos_theme' ];

	/**
	 * Default payload for the server-backed barcode scanner section.
	 *
	 * @var array
	 */
	private $barcode_defaults = [
		'averageTimeThreshold' => 24,
		'minimumLength'        => 8,
		'prefix'               => '',
		'suffix'               => '',
	];

	/**
	 * Currency-related keys within woo_general that can be restored to WC defaults.
	 *
	 * @var string[]
	 */
	private $currency_keys = [
		'currency',
		'currency_pos',
		'price_decimal_sep',
		'price_num_decimals',
		'price_thousand_sep',
		'thousands_group_style',
	];

	/**
	 * Tax-related WooCommerce option defaults for restore.
	 *
	 * @var array
	 */
	private $tax_option_defaults = [
		'woocommerce_calc_taxes'           => 'no',
		'woocommerce_prices_include_tax'   => 'no',
		'woocommerce_tax_based_on'         => 'shipping',
		'woocommerce_shipping_tax_class'   => 'inherit',
		'woocommerce_tax_round_at_subtotal' => 'no',
		'woocommerce_tax_display_shop'     => 'excl',
		'woocommerce_tax_display_cart'     => 'excl',
		'woocommerce_tax_total_display'    => 'itemized',
		'woocommerce_price_display_suffix' => '',
	];

	/**
	 * Tax-related keys within woo_tax that can be restored to defaults.
	 *
	 * @var string[]
	 */
	private $tax_keys = [
		'wc_tax_enabled',
		'wc_prices_include_tax',
		'wc_tax_based_on',
		'wc_shipping_tax_class',
		'wc_tax_round_at_subtotal',
		'wc_tax_display_shop',
		'wc_tax_display_cart',
		'wc_tax_total_display',
		'wc_price_display_suffix',
	];

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
                'args'                 => array_merge( $this->get_collection_params(), array(
                    'outlet_id' => array(
                        'type'              => 'integer',
                        'sanitize_callback' => 'absint',
                        'default'           => 0,
                    ),
                ) ),
                'permission_callback'  => [ $this, 'read_setting_permission_check' ]
            ),
            array(
                'methods'              => \WP_REST_Server::CREATABLE,
                'callback'             => array( $this, 'update_settings' ),
                'permission_callback'  => [ $this, 'get_setting_permission_check' ]
            ),
        ) );

        register_rest_route( $this->namespace, '/' . $this->base . '/tax-rates', array(
            array(
                'methods'              => \WP_REST_Server::READABLE,
                'callback'             => array( $this, 'get_tax_rates' ),
                'permission_callback'  => [ $this, 'read_setting_permission_check' ]
            ),
        ) );
    }

	/**
	 * Permission check for reading settings.
	 *
	 * Any user with POS access can read settings — the POS frontend
	 * needs currency, tax, and store data to render properly.
	 *
	 * Falls back to wepos_current_user_can_manage() so roles granted
	 * access via the wepos_rest_manager_permissions filter (e.g. cashier
	 * in wepos-pro) also pass even if access_wepos isn't in the DB yet.
	 *
	 * @since 1.4.0
	 *
	 * @return bool|\WP_Error
	 */
	public function read_setting_permission_check() {
		if ( current_user_can( 'access_wepos' ) || wepos_current_user_can_manage() ) {
			return true;
		}

		return new \WP_Error( 'wepos_rest_cannot_view', __( 'Sorry, you are not allowed to view this resource.', 'wepos' ), array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Permission check for updating settings.
	 *
	 * @since 1.1.2
     *
     * @return bool|\WP_Error
     *
     */
	public function get_setting_permission_check() {
		// POS users can save personal sections (cashier/theme) even without
		// manage_wepos. Per-section gating is enforced inside update_settings().
		if ( current_user_can( 'access_wepos' ) || wepos_current_user_can_manage() ) {
			return true;
		}

		return new \WP_Error( 'wepos_rest_cannot_batch', __( 'Sorry, you are not allowed to update this resource.', 'wepos' ), array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Build global settings from WooCommerce options and wepos options.
	 *
	 * @return array
	 */
	private function get_global_settings() {
		$settings = [];

		foreach ( wepos_get_settings_fields() as $section_key => $settings_options ) {
			$section_option = get_option( $section_key, [] );
			foreach ( $settings_options as $settings_key => $settings_value ) {
				$settings[ $section_key ][ $settings_key ] = isset( $section_option[ $settings_key ] ) ? $section_option[ $settings_key ] : $settings_options[ $settings_key ]['default'];
			}
		}

		// WooCommerce tax settings
		$settings['woo_tax'] = [
			'wc_tax_enabled'          => get_option( 'woocommerce_calc_taxes', 'no' ),
			'wc_prices_include_tax'   => get_option( 'woocommerce_prices_include_tax', 'no' ),
			'wc_tax_based_on'         => get_option( 'woocommerce_tax_based_on', 'shipping' ),
			'wc_shipping_tax_class'   => get_option( 'woocommerce_shipping_tax_class', 'inherit' ),
			'wc_tax_round_at_subtotal' => get_option( 'woocommerce_tax_round_at_subtotal', 'no' ),
			'wc_tax_display_shop'     => get_option( 'woocommerce_tax_display_shop', 'excl' ),
			'wc_tax_display_cart'     => get_option( 'woocommerce_tax_display_cart', 'excl' ),
			'wc_tax_total_display'    => get_option( 'woocommerce_tax_total_display', 'itemized' ),
			'wc_price_display_suffix' => get_option( 'woocommerce_price_display_suffix', '' ),
		];

		// WooCommerce general / store settings
		$currency = get_option( 'woocommerce_currency', 'USD' );
		$settings['woo_general'] = [
			'store_name'           => get_option( 'blogname', '' ),
			'store_city'           => get_option( 'woocommerce_store_city', '' ),
			'store_postcode'       => get_option( 'woocommerce_store_postcode', '' ),
			'store_address'        => get_option( 'woocommerce_store_address', '' ),
			'store_address_2'      => get_option( 'woocommerce_store_address_2', '' ),
			'default_country'      => get_option( 'woocommerce_default_country', 'US:CA' ),
			'currency'             => $currency,
			'currency_symbol'      => html_entity_decode( get_woocommerce_currency_symbol( $currency ) ),
			'currency_pos'         => get_option( 'woocommerce_currency_pos', 'left' ),
			'price_decimal_sep'    => get_option( 'woocommerce_price_decimal_sep', '.' ),
			'price_num_decimals'   => get_option( 'woocommerce_price_num_decimals', '2' ),
			'price_thousand_sep'   => get_option( 'woocommerce_price_thousand_sep', ',' ),
			'thousands_group_style' => get_option( 'wepos_thousands_group_style', 'thousand' ),
			'locale'               => get_locale(),
			'default_customer'     => get_option( 'wepos_default_customer', 0 ),
			'default_customer_is_cashier' => get_option( 'wepos_default_customer_is_cashier', 'no' ),
		];

		// Get available tax classes for the dropdown
		$tax_classes = \WC_Tax::get_tax_classes();
		$tax_class_options = [ '' => __( 'Standard', 'wepos' ) ];
		foreach ( $tax_classes as $class ) {
			$tax_class_options[ sanitize_title( $class ) ] = $class;
		}
		$settings['tax_classes'] = $tax_class_options;

		// Get all currencies with symbols
		$all_currencies = get_woocommerce_currencies();
		$currencies_with_symbols = [];
		foreach ( $all_currencies as $code => $name ) {
			$currencies_with_symbols[ $code ] = [
				'name'   => $name,
				'symbol' => html_entity_decode( get_woocommerce_currency_symbol( $code ) ),
			];
		}
		$settings['currencies'] = $currencies_with_symbols;

		// Server-backed barcode scanner settings.
		$barcode = get_option( 'wepos_barcode', [] );
		$settings['wepos_barcode'] = is_array( $barcode )
			? array_merge( $this->barcode_defaults, $barcode )
			: $this->barcode_defaults;

		// Appearance: controls which UI (React/Vue) renders on frontend + admin.
		$appearance = get_option( 'wepos_appearance', [] );
		$settings['wepos_appearance'] = array_merge(
			[
				'pos_layout_style' => 'latest',
				'admin_ui_style'   => 'new',
			],
			is_array( $appearance ) ? $appearance : []
		);

		return $settings;
	}

	/**
	 * Load personal sections (cashier UX + theme) for the current user.
	 *
	 * @param int $user_id Current user ID (0 = logged-out).
	 *
	 * @return array
	 */
	private function get_personal_settings( $user_id ) {
		if ( ! $user_id ) {
			return [
				'wepos_cashier' => (object) [],
				'wepos_theme'   => (object) [],
			];
		}

		$cashier = get_user_meta( $user_id, '_wepos_cashier_settings', true );
		$theme   = get_user_meta( $user_id, '_wepos_theme_settings', true );

		return [
			'wepos_cashier' => is_array( $cashier ) ? $cashier : (object) [],
			'wepos_theme'   => is_array( $theme ) ? $theme : (object) [],
		];
	}

	/**
	 * Get outlet-specific overrides.
	 *
	 * @param int $outlet_id
	 *
	 * @return array
	 */
	private function get_outlet_overrides( $outlet_id ) {
		if ( ! $outlet_id ) {
			return [];
		}

		return get_option( "wepos_outlet_settings_{$outlet_id}", [] );
	}

	/**
	 * Deep-merge outlet overrides onto global settings.
	 *
	 * Only overridable sections are merged; reference data (tax_classes, currencies)
	 * always comes from the global source.
	 *
	 * @param array $global    Global settings.
	 * @param array $overrides Outlet overrides.
	 *
	 * @return array
	 */
	private function merge_outlet_settings( $global, $overrides ) {
		if ( empty( $overrides ) ) {
			return $global;
		}

		$merged = $global;

		foreach ( $this->overridable_sections as $section ) {
			if ( isset( $overrides[ $section ] ) && isset( $merged[ $section ] ) ) {
				$merged[ $section ] = array_merge( $merged[ $section ], $overrides[ $section ] );
			}
		}

		// Resolve currency_symbol when outlet overrides the currency code
		if ( ! empty( $overrides['woo_general']['currency'] ) ) {
			$merged['woo_general']['currency_symbol'] = html_entity_decode(
				get_woocommerce_currency_symbol( $overrides['woo_general']['currency'] )
			);
		}

		return $merged;
	}

	/**
	 * Get settings — optionally outlet-specific.
	 *
     * @since 1.0.0
     *
     * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
     */
	public function get_settings( $request ) {
		$outlet_id = absint( $request->get_param( 'outlet_id' ) );

		$settings = $this->get_global_settings();

		if ( $outlet_id ) {
			$overrides = $this->get_outlet_overrides( $outlet_id );

			// Include WC defaults so frontend can show "default" values and restore
			$settings['woo_defaults'] = $settings['woo_general'];

			// Check if outlet has currency-specific overrides
			$has_currency_override = false;
			if ( ! empty( $overrides['woo_general'] ) ) {
				foreach ( $this->currency_keys as $key ) {
					if ( isset( $overrides['woo_general'][ $key ] ) ) {
						$has_currency_override = true;
						break;
					}
				}
			}
			$settings['has_outlet_currency_override'] = $has_currency_override;

			$settings = $this->merge_outlet_settings( $settings, $overrides );
		}

		/**
		 * Filter settings before returning to the client.
		 *
		 * Extensions (e.g. wepos-pro Dokan) can use this to overlay
		 * vendor-specific settings stored in user meta.
		 *
		 * @since 1.4.0
		 *
		 * @param array            $settings  Merged settings array.
		 * @param int              $outlet_id Outlet ID (0 = global).
		 * @param \WP_REST_Request $request   REST request.
		 */
		$settings = apply_filters( 'wepos_settings_for_user', $settings, $outlet_id, $request );

		$user_id  = get_current_user_id();
		$settings = array_merge( $settings, $this->get_personal_settings( $user_id ) );
		// Settings data is always returned so the POS cart (currency, tax, barcode) keeps working
		// even when the signed-in user lacks view/edit permission on a given section. Admin
		// settings UI hides restricted tabs/fields using the `_permissions` payload below.
		$settings['_permissions'] = $this->build_permissions_payload( $user_id );

		return rest_ensure_response( $settings );
	}

	/**
	 * Build per-section view/edit permission map so the frontend can
	 * gate tab visibility and save actions without re-deriving caps.
	 *
	 * @param int $user_id Current user ID.
	 *
	 * @return array{can_view: array<string, bool>, can_edit: array<string, bool>}
	 */
	private function build_permissions_payload( $user_id ) {
		$sections = [ 'woo_general', 'wepos_general', 'woo_tax', 'wepos_barcode', 'wepos_cashier', 'wepos_theme' ];

		$can_view = [];
		$can_edit = [];

		foreach ( $sections as $section ) {
			$can_view[ $section ] = Caps::can_view( $section, $user_id );
			$can_edit[ $section ] = Caps::can_edit( $section, $user_id );
		}

		return [
			'can_view' => $can_view,
			'can_edit' => $can_edit,
		];
	}

	/**
	 * Update settings.
	 *
	 * When `_outlet_id` is present in the body, changes are saved as
	 * outlet-specific overrides. Otherwise they update the global WC options.
	 *
	 * @since 1.2.0
	 *
	 * @param \WP_REST_Request $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function update_settings( $request ) {
		$params    = $request->get_json_params();
		$outlet_id = isset( $params['_outlet_id'] ) ? absint( $params['_outlet_id'] ) : 0;
		$restore_currency         = ! empty( $params['_restore_currency'] );
		$restore_tax              = ! empty( $params['_restore_tax'] );
		$restore_default_customer = ! empty( $params['_restore_default_customer'] );
		$restore_barcode          = ! empty( $params['_restore_barcode'] );
		$restore_pos_settings     = ! empty( $params['_restore_pos_settings'] );

		// Remove meta keys so they don't get saved as setting values
		unset(
			$params['_outlet_id'],
			$params['_restore_currency'],
			$params['_restore_tax'],
			$params['_restore_default_customer'],
			$params['_restore_barcode'],
			$params['_restore_pos_settings'],
			$params['_permissions']
		);

		// Per-section edit gating — silently drop sections the user cannot edit.
		$user_id = get_current_user_id();
		foreach ( array_keys( $params ) as $section ) {
			$config = Caps::section_config( $section );

			if ( null === $config ) {
				if ( ! wepos_current_user_can_manage() ) {
					unset( $params[ $section ] );
				}
				continue;
			}

			if ( ! Caps::can_edit( $section, $user_id ) ) {
				unset( $params[ $section ] );
			}
		}

		// Route personal sections to user meta regardless of outlet_id.
		foreach ( $this->personal_sections as $personal_section ) {
			if ( isset( $params[ $personal_section ] ) ) {
				$this->save_personal_section( $user_id, $personal_section, $params[ $personal_section ] );
				unset( $params[ $personal_section ] );
			}
		}

		/**
		 * Allow extensions to intercept settings saves.
		 *
		 * Return a truthy value to signal the save was handled
		 * (e.g. vendor settings saved to user meta). Return null
		 * to let the default save logic run.
		 *
		 * @since 1.4.0
		 *
		 * @param mixed            $handled   null = not handled yet.
		 * @param int              $outlet_id Outlet ID (0 = global).
		 * @param array            $params    Settings data.
		 * @param \WP_REST_Request $request   REST request.
		 */
		$handled = apply_filters( 'wepos_pre_save_settings', null, $outlet_id, $params, $request );

		if ( is_wp_error( $handled ) ) {
			return $handled;
		}

		if ( null === $handled ) {
			// Default save logic — no extension intercepted.
			//
			// `_restore_pos_settings` is the catch-all reset (clears every
			// overridable section) and takes precedence. Otherwise, the
			// narrower restore flags can combine in a single request so a
			// single UI button can reset more than one concern at once
			// (e.g. the General tab's "Restore to Default" button clears
			// both currency and default_customer). A plain save runs only
			// when no restore flag is present.
			$is_restore = $restore_pos_settings || $restore_currency || $restore_tax || $restore_default_customer || $restore_barcode;

			if ( $restore_pos_settings ) {
				if ( $outlet_id ) {
					$this->restore_outlet_pos_defaults( $outlet_id );
				} else {
					$this->restore_global_pos_defaults();
				}
			} else {
				if ( $restore_currency ) {
					if ( $outlet_id ) {
						$this->restore_outlet_currency_defaults( $outlet_id );
					} else {
						$this->restore_global_currency_defaults();
					}
				}
				if ( $restore_tax ) {
					if ( $outlet_id ) {
						$this->restore_outlet_tax_defaults( $outlet_id );
					} else {
						$this->restore_global_tax_defaults();
					}
				}
				if ( $restore_default_customer ) {
					if ( $outlet_id ) {
						$this->restore_outlet_default_customer_defaults( $outlet_id );
					} else {
						$this->restore_global_default_customer_defaults();
					}
				}
				if ( $restore_barcode ) {
					if ( $outlet_id ) {
						$this->restore_outlet_barcode_defaults( $outlet_id );
					} else {
						$this->restore_global_barcode_defaults();
					}
				}
			}

			if ( ! $is_restore ) {
				if ( $outlet_id ) {
					$this->save_outlet_settings( $outlet_id, $params );
				} else {
					$this->save_global_settings( $params );
				}
			}
		}

		// Return the merged settings for this outlet (or global if no outlet)
		$request->set_param( 'outlet_id', $outlet_id );

		return $this->get_settings( $request );
	}

	/**
	 * Save settings as outlet-specific overrides.
	 *
	 * @param int   $outlet_id
	 * @param array $params
	 */
	private function save_outlet_settings( $outlet_id, $params ) {
		$option_key = "wepos_outlet_settings_{$outlet_id}";
		$existing   = get_option( $option_key, [] );

		foreach ( $this->overridable_sections as $section ) {
			if ( isset( $params[ $section ] ) ) {
				$existing[ $section ] = array_merge(
					isset( $existing[ $section ] ) ? $existing[ $section ] : [],
					array_map( 'sanitize_text_field', $params[ $section ] )
				);
			}
		}

		update_option( $option_key, $existing );
	}

	/**
	 * Remove currency-related keys from outlet-specific overrides,
	 * restoring WooCommerce defaults for this outlet.
	 *
	 * @param int $outlet_id
	 */
	private function restore_outlet_currency_defaults( $outlet_id ) {
		$option_key = "wepos_outlet_settings_{$outlet_id}";
		$existing   = get_option( $option_key, [] );

		if ( ! empty( $existing['woo_general'] ) ) {
			foreach ( $this->currency_keys as $key ) {
				unset( $existing['woo_general'][ $key ] );
			}

			// Clean up empty section
			if ( empty( $existing['woo_general'] ) ) {
				unset( $existing['woo_general'] );
			}
		}

		if ( empty( $existing ) ) {
			delete_option( $option_key );
		} else {
			update_option( $option_key, $existing );
		}
	}

	/**
	 * Reset global WooCommerce currency/general options to their defaults.
	 */
	private function restore_global_currency_defaults() {
		$defaults = [
			'woocommerce_currency'          => 'USD',
			'woocommerce_currency_pos'      => 'left',
			'woocommerce_price_decimal_sep' => '.',
			'woocommerce_price_num_decimals' => '2',
			'woocommerce_price_thousand_sep' => ',',
			'wepos_thousands_group_style'   => 'thousand',
		];

		foreach ( $defaults as $option_name => $default_value ) {
			update_option( $option_name, $default_value );
		}
	}

	/**
	 * Remove default-customer keys from outlet-specific overrides,
	 * so this outlet re-inherits from vendor (Dokan) or admin.
	 *
	 * @since 1.5.0
	 *
	 * @param int $outlet_id
	 */
	private function restore_outlet_default_customer_defaults( $outlet_id ) {
		$option_key = "wepos_outlet_settings_{$outlet_id}";
		$existing   = get_option( $option_key, [] );

		if ( ! empty( $existing['woo_general'] ) ) {
			unset( $existing['woo_general']['default_customer'] );
			unset( $existing['woo_general']['default_customer_is_cashier'] );

			if ( empty( $existing['woo_general'] ) ) {
				unset( $existing['woo_general'] );
			}
		}

		if ( empty( $existing ) ) {
			delete_option( $option_key );
		} else {
			update_option( $option_key, $existing );
		}
	}

	/**
	 * Reset the global Default Customer options to their ship defaults
	 * ("Guest" customer, cashier-mode off).
	 *
	 * @since 1.5.0
	 */
	private function restore_global_default_customer_defaults() {
		update_option( 'wepos_default_customer', 0 );
		update_option( 'wepos_default_customer_is_cashier', 'no' );
	}

	/**
	 * Remove tax-related keys from outlet-specific overrides,
	 * restoring WooCommerce defaults for this outlet.
	 *
	 * @param int $outlet_id
	 */
	private function restore_outlet_tax_defaults( $outlet_id ) {
		$option_key = "wepos_outlet_settings_{$outlet_id}";
		$existing   = get_option( $option_key, [] );

		if ( ! empty( $existing['woo_tax'] ) ) {
			foreach ( $this->tax_keys as $key ) {
				unset( $existing['woo_tax'][ $key ] );
			}

			if ( empty( $existing['woo_tax'] ) ) {
				unset( $existing['woo_tax'] );
			}
		}

		// Also restore enable_fee_tax in wepos_general
		if ( ! empty( $existing['wepos_general'] ) ) {
			unset( $existing['wepos_general']['enable_fee_tax'] );

			if ( empty( $existing['wepos_general'] ) ) {
				unset( $existing['wepos_general'] );
			}
		}

		if ( empty( $existing ) ) {
			delete_option( $option_key );
		} else {
			update_option( $option_key, $existing );
		}
	}

	/**
	 * Reset global WooCommerce tax options to their defaults.
	 */
	private function restore_global_tax_defaults() {
		foreach ( $this->tax_option_defaults as $option_name => $default_value ) {
			update_option( $option_name, $default_value );
		}

		// Reset enable_fee_tax to its default
		$existing = get_option( 'wepos_general', [] );
		$existing['enable_fee_tax'] = 'yes';
		update_option( 'wepos_general', $existing );
	}

	/**
	 * Remove barcode keys from outlet-specific overrides so this outlet
	 * re-inherits from vendor (Dokan) or admin defaults.
	 *
	 * @param int $outlet_id
	 */
	private function restore_outlet_barcode_defaults( $outlet_id ) {
		$option_key = "wepos_outlet_settings_{$outlet_id}";
		$existing   = get_option( $option_key, [] );

		if ( isset( $existing['wepos_barcode'] ) ) {
			unset( $existing['wepos_barcode'] );
		}

		if ( empty( $existing ) ) {
			delete_option( $option_key );
		} else {
			update_option( $option_key, $existing );
		}
	}

	/**
	 * Reset global barcode option to ship defaults.
	 */
	private function restore_global_barcode_defaults() {
		delete_option( 'wepos_barcode' );
	}

	/**
	 * Reset all POS settings (General + Tax + Barcode) to defaults globally.
	 */
	private function restore_global_pos_defaults() {
		$this->restore_global_currency_defaults();
		$this->restore_global_tax_defaults();

		delete_option( 'wepos_barcode' );
	}

	/**
	 * Reset all POS settings overrides (General + Tax + Barcode) for an outlet.
	 *
	 * @param int $outlet_id
	 */
	private function restore_outlet_pos_defaults( $outlet_id ) {
		$option_key = "wepos_outlet_settings_{$outlet_id}";
		$existing   = get_option( $option_key, [] );

		foreach ( $this->overridable_sections as $section ) {
			unset( $existing[ $section ] );
		}

		if ( empty( $existing ) ) {
			delete_option( $option_key );
		} else {
			update_option( $option_key, $existing );
		}
	}

	/**
	 * Save settings globally (update WC options directly).
	 *
	 * @param array $params
	 */
	private function save_global_settings( $params ) {
		// Update WooCommerce general settings
		if ( isset( $params['woo_general'] ) ) {
			$general = $params['woo_general'];
			$woo_general_map = [
				'store_name'        => 'blogname',
				'store_city'        => 'woocommerce_store_city',
				'store_postcode'    => 'woocommerce_store_postcode',
				'store_address'     => 'woocommerce_store_address',
				'store_address_2'   => 'woocommerce_store_address_2',
				'default_country'   => 'woocommerce_default_country',
				'currency'          => 'woocommerce_currency',
				'currency_pos'      => 'woocommerce_currency_pos',
				'price_decimal_sep' => 'woocommerce_price_decimal_sep',
				'price_num_decimals' => 'woocommerce_price_num_decimals',
				'price_thousand_sep' => 'woocommerce_price_thousand_sep',
				'thousands_group_style' => 'wepos_thousands_group_style',
			];

			foreach ( $woo_general_map as $key => $option_name ) {
				if ( isset( $general[ $key ] ) ) {
					update_option( $option_name, sanitize_text_field( $general[ $key ] ) );
				}
			}

			if ( isset( $general['default_customer'] ) ) {
				update_option( 'wepos_default_customer', absint( $general['default_customer'] ) );
			}
			if ( isset( $general['default_customer_is_cashier'] ) ) {
				update_option( 'wepos_default_customer_is_cashier', sanitize_text_field( $general['default_customer_is_cashier'] ) );
			}
		}

		// Update WooCommerce tax settings
		if ( isset( $params['woo_tax'] ) ) {
			$tax = $params['woo_tax'];
			$woo_tax_map = [
				'wc_tax_enabled'           => 'woocommerce_calc_taxes',
				'wc_prices_include_tax'    => 'woocommerce_prices_include_tax',
				'wc_tax_based_on'          => 'woocommerce_tax_based_on',
				'wc_shipping_tax_class'    => 'woocommerce_shipping_tax_class',
				'wc_tax_round_at_subtotal' => 'woocommerce_tax_round_at_subtotal',
				'wc_tax_display_shop'      => 'woocommerce_tax_display_shop',
				'wc_tax_display_cart'      => 'woocommerce_tax_display_cart',
				'wc_tax_total_display'     => 'woocommerce_tax_total_display',
				'wc_price_display_suffix'  => 'woocommerce_price_display_suffix',
			];

			foreach ( $woo_tax_map as $key => $option_name ) {
				if ( isset( $tax[ $key ] ) ) {
					update_option( $option_name, sanitize_text_field( $tax[ $key ] ) );
				}
			}
		}

		// Update wepos plugin settings
		if ( isset( $params['wepos_general'] ) ) {
			$existing = get_option( 'wepos_general', [] );
			$updated = array_merge( $existing, array_map( 'sanitize_text_field', $params['wepos_general'] ) );
			update_option( 'wepos_general', $updated );
		}

		if ( isset( $params['wepos_receipts'] ) ) {
			$existing = get_option( 'wepos_receipts', [] );
			$updated = array_merge( $existing, $params['wepos_receipts'] );
			update_option( 'wepos_receipts', $updated );
		}

		if ( isset( $params['wepos_appearance'] ) && is_array( $params['wepos_appearance'] ) ) {
			$existing = get_option( 'wepos_appearance', [] );
			if ( ! is_array( $existing ) ) {
				$existing = [];
			}

			$incoming = $params['wepos_appearance'];
			$clean    = [];

			if ( isset( $incoming['pos_layout_style'] ) ) {
				$clean['pos_layout_style'] = in_array( $incoming['pos_layout_style'], [ 'latest', 'legacy' ], true )
					? $incoming['pos_layout_style']
					: 'latest';
			}

			if ( isset( $incoming['admin_ui_style'] ) ) {
				$clean['admin_ui_style'] = in_array( $incoming['admin_ui_style'], [ 'new', 'legacy' ], true )
					? $incoming['admin_ui_style']
					: 'new';
			}

			update_option( 'wepos_appearance', array_merge( $existing, $clean ) );
		}

		if ( isset( $params['wepos_barcode'] ) && is_array( $params['wepos_barcode'] ) ) {
			$existing = get_option( 'wepos_barcode', [] );
			if ( ! is_array( $existing ) ) {
				$existing = [];
			}
			$updated  = array_merge( $existing, $this->sanitize_barcode_payload( $params['wepos_barcode'] ) );
			update_option( 'wepos_barcode', $updated );
		}
	}

	/**
	 * Sanitize the barcode payload with per-key rules.
	 *
	 * @param array $payload Raw payload.
	 *
	 * @return array
	 */
	private function sanitize_barcode_payload( $payload ) {
		$clean = [];

		if ( isset( $payload['averageTimeThreshold'] ) ) {
			$clean['averageTimeThreshold'] = max( 1, absint( $payload['averageTimeThreshold'] ) );
		}

		if ( isset( $payload['minimumLength'] ) ) {
			$clean['minimumLength'] = max( 0, absint( $payload['minimumLength'] ) );
		}

		if ( array_key_exists( 'prefix', $payload ) ) {
			$clean['prefix'] = sanitize_text_field( (string) $payload['prefix'] );
		}

		if ( array_key_exists( 'suffix', $payload ) ) {
			$clean['suffix'] = sanitize_text_field( (string) $payload['suffix'] );
		}

		return $clean;
	}

	/**
	 * Save a personal section to the user's own meta.
	 *
	 * @param int    $user_id User ID.
	 * @param string $section Section key (e.g. wepos_cashier).
	 * @param mixed  $data    Payload.
	 *
	 * @return void
	 */
	private function save_personal_section( $user_id, $section, $data ) {
		if ( ! $user_id || ! is_array( $data ) ) {
			return;
		}

		$meta_key = '_' . $section . '_settings';

		update_user_meta( $user_id, $meta_key, $data );
	}

	/**
	 * Get tax rates grouped by tax class
	 *
	 * @since 1.2.0
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function get_tax_rates( $request ) {
		global $wpdb;

		$tax_classes = \WC_Tax::get_tax_classes();
		$tax_class_slugs = [ '' ]; // Standard rate

		foreach ( $tax_classes as $class ) {
			$tax_class_slugs[] = sanitize_title( $class );
		}

		$result = [];

		foreach ( $tax_class_slugs as $slug ) {
			$label = $slug === '' ? __( 'Standard rate', 'wepos' ) : \WC_Tax::get_tax_class_by( 'slug', $slug )['name'] ?? ucfirst( str_replace( '-', ' ', $slug ) );

			$rates = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT * FROM {$wpdb->prefix}woocommerce_tax_rates WHERE tax_rate_class = %s ORDER BY tax_rate_order, tax_rate_id",
					$slug
				)
			);

			$formatted_rates = [];
			foreach ( $rates as $rate ) {
				// Get postcodes for this rate
				$postcodes = $wpdb->get_col(
					$wpdb->prepare(
						"SELECT location_code FROM {$wpdb->prefix}woocommerce_tax_rate_locations WHERE tax_rate_id = %d AND location_type = 'postcode'",
						$rate->tax_rate_id
					)
				);

				// Get cities for this rate
				$cities = $wpdb->get_col(
					$wpdb->prepare(
						"SELECT location_code FROM {$wpdb->prefix}woocommerce_tax_rate_locations WHERE tax_rate_id = %d AND location_type = 'city'",
						$rate->tax_rate_id
					)
				);

				$formatted_rates[] = [
					'id'            => (int) $rate->tax_rate_id,
					'country'       => $rate->tax_rate_country ?: '*',
					'state'         => $rate->tax_rate_state ?: '*',
					'postcode'      => ! empty( $postcodes ) ? implode( ', ', $postcodes ) : '*',
					'city'          => ! empty( $cities ) ? implode( ', ', $cities ) : '*',
					'rate'          => $rate->tax_rate,
					'name'          => $rate->tax_rate_name,
					'priority'      => (int) $rate->tax_rate_priority,
					'compound'      => (bool) $rate->tax_rate_compound,
					'shipping'      => (bool) $rate->tax_rate_shipping,
				];
			}

			$result[] = [
				'slug'  => $slug,
				'label' => $label,
				'rates' => $formatted_rates,
			];
		}

		// Total count of all rates
		$total = $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}woocommerce_tax_rates" );

		return rest_ensure_response( [
			'tax_classes' => $result,
			'total'       => (int) $total,
		] );
	}
}
