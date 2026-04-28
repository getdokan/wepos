<?php

/**
 * wePOS Footer
 *
 * @since 1.0.0
 *
 * @return void
 */
function wepos_footer() {
    do_action( 'wepos_footer' );
}

/**
 * Get translactions for wePos plugin
 *
 * @param string $domain
 * @param string $language_dir
 *
 * @return array
 */
function wepos_get_translations_for_plugin_domain( $domain, $language_dir = null ) {

    if ( $language_dir == null ) {
        $language_dir      = WEPOS_PATH . '/languages/';
    }

    $languages     = get_available_languages( $language_dir );
    $get_site_lang = is_admin() ? get_user_locale() : get_locale();
    $mo_file_name  = $domain . '-' . $get_site_lang;
    $translations  = [];

    if ( in_array( $mo_file_name, $languages ) && file_exists( $language_dir . $mo_file_name . '.mo' ) ) {
        $mo = new MO();
        if ( $mo->import_from_file( $language_dir . $mo_file_name . '.mo' ) ) {
            $translations = $mo->entries;
        }
    }

    return [
        'header'       => isset( $mo ) ? $mo->headers : '',
        'translations' => $translations,
    ];
}

/**
 * Returns Jed-formatted localization data.
 *
 * @param  string $domain Translation domain.
 *
 * @return array
 */
function wepos_get_jed_locale_data( $domain, $language_dir = null ) {
    $plugin_translations = wepos_get_translations_for_plugin_domain( $domain, $language_dir );
    $translations = get_translations_for_domain( $domain );

    $locale = array(
        'domain'      => $domain,
        'locale_data' => array(
            $domain => array(
                '' => array(
                    'domain' => $domain,
                    'lang'   => is_admin() ? get_user_locale() : get_locale(),
                ),
            ),
        ),
    );

    if ( ! empty( $translations->headers['Plural-Forms'] ) ) {
        $locale['locale_data'][ $domain ]['']['plural_forms'] = $translations->headers['Plural-Forms'];
    } else if ( ! empty( $plugin_translations['header'] ) ) {
        $locale['locale_data'][ $domain ]['']['plural_forms'] = $plugin_translations['header']['Plural-Forms'];
    }

    $entries = array_merge( $plugin_translations['translations'], $translations->entries );

    foreach ( $entries as $msgid => $entry ) {
        $locale['locale_data'][ $domain ][ $msgid ] = $entry->translations;
    }

    return $locale;
}

/**
 * Recursively sort an array of taxonomy terms hierarchically. Child categories will be
 * placed under a 'children' member of their parent term.
 *
 * @param Array   $cats     taxonomy term objects to sort
 * @param Array   $into     result array to put them in
 * @param integer $parent_id the current parent ID to put them in
 *
 * @return array
 */
function wepos_sort_terms_hierarchicaly( &$cats, &$into, $parent_id = 0 ) {
    foreach ( $cats as $i => $cat) {
        if ( $cat->parent == $parent_id ) {
            $into[$cat->term_id] = $cat;
            unset( $cats[$i] );
        }
    }

    foreach ( $into as $top_cat ) {
        $top_cat->children = array();
        wepos_sort_terms_hierarchicaly( $cats, $top_cat->children, $top_cat->term_id );
    }
}

/**
 * Get product category by hirarchycal
 *
 * @since 1.0.0
 *
 * @return array
 */
function wepos_get_product_category() {
    $categories        = get_terms( 'product_cat', [ 'hide_empty' => false ] );
    $category_hierarchy = [];
    wepos_sort_terms_hierarchicaly( $categories, $category_hierarchy );
    return $category_hierarchy;
}

/**
 * Get Post Type array
 *
 * @since 1.0.0
 *
 * @param  string $post_type
 *
 * @return array
 */
function wepos_get_post_type( $post_type ) {
    $pages_array = array( '-1' => __( '- select -', 'wepos' ) );
    $pages       = get_posts( array('post_type' => $post_type, 'numberposts' => -1) );

    if ( $pages ) {
        foreach ($pages as $page) {
            $pages_array[$page->ID] = $page->post_title;
        }
    }

    return $pages_array;
}

/**
 * Get settings sections
 *
 * @since 1.0.0
 *
 * @return array
 */
function wepos_get_settings_sections() {
    $sections = [
        [
            'id'    => 'wepos_general',
            'title' => __( 'General', 'wepos' ),
            'icon'  => 'dashicons-admin-generic'
        ],
        [
            'id'    => 'wepos_receipts',
            'title' => __( 'Receipts', 'wepos' ),
            'icon'  => 'dashicons-media-text'
        ],
    ];

    // Access section is only visible to administrators.
    if ( current_user_can( 'manage_options' ) ) {
        $sections[] = [
            'id'    => 'wepos_access',
            'title' => __( 'Access', 'wepos' ),
            'icon'  => 'dashicons-admin-users'
        ];
    }

    return apply_filters( 'wepos_settings_sections', $sections );
}

/**
 * Get settings fields
 *
 * @since 1.0.0
 *
 * @return array
 */
function wepos_get_settings_fields() {
    $settings_fields = [
        'wepos_general' => [
            'enable_fee_tax' => [
                'name'    => 'enable_fee_tax',
                'label'   => __( 'Calculate tax for Fee', 'wepos' ),
                'desc'    => __( 'Choose if tax caluclate for fee in POS cart and checkout', 'wepos' ),
                'type'    => 'select',
                'default' => 'yes',
                'options' => [
                    'yes' => __( 'Yes', 'wepos' ),
                    'no'  => __( 'No', 'wepos' ),
                ]
            ],
            'barcode_scanner_field' => [
                'name'    => 'barcode_scanner_field',
                'label'   => __( 'Barcode Scanner field', 'wepos' ),
                'desc'    => __( 'Choose your barcode field. If you select <code>Custom Field</code> then you need to set barcode number manually in product edit page', 'wepos' ),
                'type'    => 'select',
                'default' => 'sku',
                'options' => [
                    'id'     => __( 'ID', 'wepos' ),
                    'sku'    => __( 'SKU', 'wepos' ),
                    'custom' => __( 'Custom field', 'wepos' ),
                ]
            ],
            'enable_pos_only_products' => [
                'name'    => 'enable_pos_only_products',
                'label'   => __( 'Enable POS only products', 'wepos' ),
                'desc'    => __( 'Enable per-product POS visibility control (POS & Online / POS Only / Online Only).', 'wepos' ),
                'type'    => 'checkbox',
                'default' => 'no',
            ],
            'enable_decimal_quantities' => [
                'name'    => 'enable_decimal_quantities',
                'label'   => __( 'Enable decimal quantities', 'wepos' ),
                'desc'    => __( 'Allow cashiers to enter fractional product quantities in the POS cart and admin stock inputs.', 'wepos' ),
                'type'    => 'checkbox',
                'default' => 'no',
            ],
        ],
        'wepos_receipts' => [
            'receipt_header' => [
                'name'    => 'receipt_header',
                'label'   => __( 'Order receipt header', 'wepos' ),
                'desc'    => __( 'Enter your order receipt header', 'wepos' ),
                'type'    => 'wpeditor',
                'default' => get_option( 'blogname' )
            ],
            'receipt_footer' => [
                'name'    => 'receipt_footer',
                'label'   => __( 'Order receipt footer', 'wepos' ),
                'desc'    => __( 'Enter your order receipt footer text', 'wepos' ),
                'type'    => 'wpeditor',
                'default' => __( 'Thank you', 'wepos' )
            ],
        ],
    ];

    return apply_filters( 'wepos_settings_fields', $settings_fields );
}

/**
 * Get the value of a settings field
 *
 * @param string $option settings field name
 * @param string $section the section name this field belongs to
 * @param string $default default text if it's not found
 *
 * @return mixed
 */
function wepos_get_option( $option, $section, $default = '' ) {

    $options = get_option( $section );

    if ( isset( $options[ $option ] ) ) {
        return $options[ $option ];
    }

    return $default;
}

/**
 * Get the capability required for the admin menu.
 *
 * Uses manage_wepos so roles granted this cap via Access settings
 * (e.g. Cashier) can access the wePOS admin pages.
 *
 * @since 1.4.0
 *
 * @return string
 */
function wepos_admin_menu_capability() {
    return 'manage_wepos';
}

/**
 * Map manage_wepos to users who have manage_woocommerce.
 *
 * This ensures backward compatibility — users with manage_woocommerce
 * can always access wePOS admin even if manage_wepos hasn't been
 * explicitly granted (e.g. on sites that haven't reactivated the plugin).
 *
 * @since 1.4.0
 *
 * @param string[] $caps    Required primitive capabilities.
 * @param string   $cap     Capability being checked.
 * @param int      $user_id User ID.
 *
 * @return string[]
 */
function wepos_map_meta_cap( $caps, $cap, $user_id ) {
    if ( 'manage_wepos' === $cap || 'access_wepos' === $cap ) {
        $user = get_userdata( $user_id );

        if ( ! $user ) {
            return $caps;
        }

        // If the cap is explicitly set in any of the user's roles
        // (true or false via Access settings), respect that value directly.
        foreach ( $user->roles as $role_slug ) {
            $role = get_role( $role_slug );
            if ( $role && array_key_exists( $cap, $role->capabilities ) ) {
                return $caps;
            }
        }

        // Fallback: grant access if user has manage_options or manage_woocommerce
        // (covers admin and shop manager when not configured via Access settings).
        // Editor must be explicitly assigned as a cashier to access POS — no cap fallback.
        if ( $user->has_cap( 'manage_options' ) || $user->has_cap( 'manage_woocommerce' ) ) {
            return [ 'exist' ];
        }
    }

    return $caps;
}
add_filter( 'map_meta_cap', 'wepos_map_meta_cap', 10, 3 );

/**
 * Allow users with manage_wepos capability to access WP admin.
 *
 * WooCommerce blocks users without edit_posts, manage_woocommerce, or
 * view_admin_dashboard from accessing wp-admin. This filter ensures
 * roles granted manage_wepos (e.g. Cashier via Access settings) can
 * reach the wePOS admin pages.
 *
 * @since 1.4.0
 *
 * @param bool $prevent_access Whether to prevent admin access.
 *
 * @return bool
 */
function wepos_allow_admin_access( $prevent_access ) {
    if ( $prevent_access && current_user_can( 'manage_wepos' ) ) {
        return false;
    }

    return $prevent_access;
}
add_filter( 'woocommerce_prevent_admin_access', 'wepos_allow_admin_access', 10, 1 );

/**
 * Check if the current user can manage wePOS settings.
 *
 * @since 1.4.0
 *
 * @return bool
 */
function wepos_current_user_can_manage() {
    if (
        current_user_can( 'manage_wepos' )
        || current_user_can( 'manage_woocommerce' )
        || wepos_user_is_assigned_cashier()
        || apply_filters( 'wepos_rest_manager_permissions', false )
    ) {
        return true;
    }

    // Vendor staff: scoped via vendor relation, not the cashier_outlet table.
    if ( apply_filters( 'wepos_is_vendor_staff', false, get_current_user_id() ) ) {
        return true;
    }

    return false;
}

/**
 * Check whether the given user is assigned to at least one outlet
 * via the wepos_cashier_outlet junction table.
 *
 * Used to gate POS access for non-admin users (e.g. editor, cashier)
 * who must be explicitly assigned before they can enter the POS.
 *
 * @since 2.0.1
 *
 * @param int $user_id Optional. Defaults to current user.
 *
 * @return bool
 */
function wepos_user_is_assigned_cashier( $user_id = 0 ) {
    global $wpdb;

    $user_id = $user_id ? absint( $user_id ) : get_current_user_id();

    if ( ! $user_id ) {
        return false;
    }

    $table = "{$wpdb->prefix}wepos_cashier_outlet";

    // Suppress warnings when the pro junction table doesn't exist on
    // wePOS-only installs — the query just yields null and we report false.
    $suppress = $wpdb->suppress_errors( true );
    $count    = $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(1) FROM `{$table}` WHERE user_id = %d", $user_id ) );
    $wpdb->suppress_errors( $suppress );

    return null !== $count && (int) $count > 0;
}

/**
 * Check whether the given user is allowed to enter the POS frontend.
 *
 * `access_wepos` capability is the single gate — granted to a role via
 * Access settings or to a specific user, it allows POS entry. Cashiers
 * still need outlet assignments to operate the register, but that check
 * is handled inside the register UI itself, not here.
 *
 * @since 2.0.1
 *
 * @param int $user_id Optional. Defaults to current user.
 *
 * @return bool
 */
function wepos_user_can_access_pos( $user_id = 0 ) {
    $user_id = $user_id ? absint( $user_id ) : get_current_user_id();

    if ( ! $user_id ) {
        return false;
    }

    return user_can( $user_id, 'access_wepos' );
}

/**
 * Check if the current user can access a specific wePOS admin page.
 *
 * If the page capability has been explicitly set for the user's role
 * (via Access settings), that value is used. Otherwise falls back to
 * checking manage_wepos so existing installs keep working.
 *
 * @since 1.4.0
 *
 * @param string $page_key Page identifier (e.g. 'settings', 'outlets', 'license').
 *
 * @return bool
 */
function wepos_user_can_access_page( $page_key ) {
    $cap  = 'wepos_page_' . $page_key;
    $user = wp_get_current_user();

    if ( ! $user || ! $user->exists() ) {
        return false;
    }

    // If the cap is explicitly set in any of the user's roles, respect it.
    foreach ( $user->roles as $role_slug ) {
        $role = get_role( $role_slug );
        if ( $role && array_key_exists( $cap, $role->capabilities ) ) {
            return ! empty( $role->capabilities[ $cap ] );
        }
    }

    // Fallback: admin, shop manager, and editor get access when cap isn't explicitly set.
    return current_user_can( 'manage_options' ) || current_user_can( 'manage_woocommerce' ) || current_user_can( 'edit_others_posts' );
}

/**
 * Get list of page keys the current user can access.
 *
 * @since 1.4.0
 *
 * @return string[]
 */
function wepos_get_user_allowed_pages() {
    $page_caps = apply_filters( 'wepos_access_page_capabilities', [
        'wepos_page_appearance',
        'wepos_page_settings',
        'wepos_page_view_pos',
    ] );

    $allowed = [];

    foreach ( $page_caps as $cap ) {
        // Extract page_key from capability name (strip 'wepos_page_' prefix).
        $page_key = str_replace( 'wepos_page_', '', $cap );
        if ( wepos_user_can_access_page( $page_key ) ) {
            $allowed[] = $page_key;
        }
    }

    return $allowed;
}

/**
 * Block REST API requests for pages the user cannot access.
 *
 * Maps REST route prefixes to page keys. Extensions can add mappings
 * via the 'wepos_rest_route_page_map' filter.
 *
 * @since 1.4.0
 *
 * @param mixed            $result  Response to replace the requested version with.
 * @param \WP_REST_Server  $server  Server instance.
 * @param \WP_REST_Request $request Request used to generate the response.
 *
 * @return mixed|\WP_Error
 */
function wepos_check_page_access_on_rest( $result, $server, $request ) {
    // Only gate authenticated requests — public/unauthenticated calls pass through.
    if ( ! is_user_logged_in() ) {
        return $result;
    }

    $route_page_map = apply_filters( 'wepos_rest_route_page_map', [
        '/wepos/v1/settings' => 'settings',
    ] );

    $route = $request->get_route();

    foreach ( $route_page_map as $prefix => $page_key ) {
        if ( strpos( $route, $prefix ) === 0 ) {
            // Skip page-level gating for all /wepos/v1/settings routes.
            // The settings endpoints serve the POS frontend (currency, tax, store data)
            // and have their own permission_callback for both read and write access.
            if ( $prefix === '/wepos/v1/settings' ) {
                break;
            }

            if ( ! wepos_user_can_access_page( $page_key ) ) {
                return new \WP_Error(
                    'wepos_rest_page_access_denied',
                    __( 'You do not have access to this resource.', 'wepos' ),
                    [ 'status' => 403 ]
                );
            }
            break;
        }
    }

    return $result;
}
add_filter( 'rest_pre_dispatch', 'wepos_check_page_access_on_rest', 10, 3 );

/**
 * Detects if current page is wePOS frontend page
 *
 * @return bool
 */
function wepos_is_frontend() {
    $hasPermission = false;

    if ( wp_validate_boolean( get_query_var( 'wepos' ) ) ) {
        if ( wepos_user_can_access_pos() || apply_filters( 'wepos_frontend_permissions', false ) ) {
            $hasPermission = true;
        }
    }

    return $hasPermission;
}

function wepos_get_product_price( $product ) {
    $price = $product->get_price();

    if ( $product->is_taxable() ) {

        if ( WC()->cart->display_prices_including_tax() ) {
            $row_price        = wc_get_price_including_tax( $product, array( 'qty' => $quantity ) );
            $product_subtotal = wc_price( $row_price );

            if ( ! wc_prices_include_tax() && WC()->cart->get_subtotal_tax() > 0 ) {
                $product_subtotal .= ' <small class="tax_label">' . WC()->countries->inc_tax_or_vat() . '</small>';
            }
        } else {
            $row_price        = wc_get_price_excluding_tax( $product, array( 'qty' => $quantity ) );
            $product_subtotal = wc_price( $row_price );

            if ( wc_prices_include_tax() && $this->get_subtotal_tax() > 0 ) {
                $product_subtotal .= ' <small class="tax_label">' . WC()->countries->ex_tax_or_vat() . '</small>';
            }
        }
    } else {
        $row_price        = $price * $quantity;
        $product_subtotal = wc_price( $row_price );
    }

    return apply_filters( 'woocommerce_cart_product_subtotal', $product_subtotal, $product, $quantity, $this );
}

/**
 * Function current_datetime() compatibility for wp version < 5.3
 *
 * @since 1.3.0
 *
 * @return DateTimeImmutable
 */
function wepos_current_datetime() {
    if ( function_exists( 'current_datetime' ) ) {
        return current_datetime();
    }

    return new DateTimeImmutable( 'now', wepos_wp_timezone() );
}

/**
 * Function wp_timezone() compatibility for wp version < 5.3
 *
 * @since 1.3.0
 *
 * @return DateTimeZone
 */
function wepos_wp_timezone() {
    if ( function_exists( 'wp_timezone' ) ) {
        return wp_timezone();
    }

    return new DateTimeZone( wepos_wp_timezone_string() );
}

/**
 * Function wp_timezone_string() compatibility for wp version < 5.3
 *
 * @since 1.3.0
 *
 * @return string
 */
function wepos_wp_timezone_string() {
    if ( function_exists( 'wp_timezone_string' ) ) {
        return wp_timezone_string();
    }

    $timezone_string = get_option( 'timezone_string' );

    if ( $timezone_string ) {
        return $timezone_string;
    }

    $offset  = (float) get_option( 'gmt_offset' );
    $hours   = (int) $offset;
    $minutes = ( $offset - $hours );

    $sign      = ( $offset < 0 ) ? '-' : '+';
    $abs_hour  = abs( $hours );
    $abs_mins  = abs( $minutes * 60 );
    $tz_offset = sprintf( '%s%02d:%02d', $sign, $abs_hour, $abs_mins );

    return $tz_offset;
}

/**
 * Check if Dokan multi-vendor plugin is active.
 *
 * @since 1.4.0
 *
 * @return bool
 */
function wepos_is_dokan_active() {
    return class_exists( 'WeDevs_Dokan' );
}

/**
 * Check if a user is a Dokan vendor (seller) and is enabled.
 *
 * @since 1.4.0
 *
 * @param int|null $user_id User ID, defaults to current user.
 *
 * @return bool
 */
function wepos_is_dokan_vendor( $user_id = null ) {
    if ( ! wepos_is_dokan_active() ) {
        return false;
    }

    $user_id = $user_id ?: get_current_user_id();

    // $exclude_staff = true — Dokan Pro grants `dokandar` to the vendor_staff
    // role so dokan_is_user_seller() otherwise returns true for staff too,
    // which would mask staff as vendors in every caller of this helper.
    return dokan_is_user_seller( $user_id, true ) && dokan_is_seller_enabled( $user_id );
}

/**
 * Get the vendor ID for a user.
 *
 * - If the user is a vendor, returns their own user ID.
 * - If the user is vendor staff, returns the parent vendor's user ID.
 * - Extensions can resolve vendor context via the wepos_resolve_vendor_id
 *   filter (e.g. from a cashier's active POS session).
 * - Otherwise returns 0 (admin or non-vendor).
 *
 * @since 1.4.0
 *
 * @param int|null $user_id User ID, defaults to current user.
 *
 * @return int Vendor user ID, or 0 if not a vendor context.
 */
function wepos_get_vendor_id_for_user( $user_id = null ) {
    if ( ! wepos_is_dokan_active() ) {
        return 0;
    }

    $user_id = $user_id ?: get_current_user_id();

    // Vendor staff: parent vendor stored in user meta (_vendor_id). Check
    // staff first because dokan_is_user_seller() is false for staff and
    // would otherwise route into the resolve_vendor_id fallback, leaving
    // staff settings reads/writes orphaned from the vendor's store.
    if ( apply_filters( 'wepos_is_vendor_staff', false, $user_id ) ) {
        $parent = absint( get_user_meta( $user_id, '_vendor_id', true ) );
        if ( $parent ) {
            return $parent;
        }
    }

    if ( wepos_is_dokan_vendor( $user_id ) ) {
        return $user_id;
    }

    // Allow extensions (e.g. wepos-pro) to resolve vendor context for
    // other user types such as cashiers with an active POS session.
    return absint( apply_filters( 'wepos_resolve_vendor_id', 0, $user_id ) );
}
