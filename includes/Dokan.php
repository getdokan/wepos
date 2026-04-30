<?php
namespace WeDevs\WePOS;

/**
 * Dokan base compability
 *
 * @since 1.0.2
 */
/**
* className
*/
class Dokan {

    /**
     * Load autometically when class initiate
     *
     * @since 1.0.2
     */
    public function __construct() {
        add_filter( 'wepos_frontend_permissions', [ $this, 'frontend_permissions' ], 10, 1 );
        add_filter( 'woocommerce_rest_product_object_query', [ $this, 'filter_vendor_products' ], 10, 2 );
        add_filter( 'wepos_rest_product_query_args', [ $this, 'exclude_dokan_specific_products_from_pos' ], 10, 2 );
        add_action( 'dokan_new_seller_created', [ $this, 'after_create_vendor' ], 15, 2 );
        add_filter( 'dokan_get_dashboard_nav', [ $this, 'show_pos_menu' ], 15 );

        add_filter( 'wepos_settings_fields', [ $this, 'add_dokan_settings' ], 11 );
        add_filter( 'wepos_rest_manager_permissions', [ $this, 'manager_permission' ], 10 );

        // Vendor-scoped settings overlay/save. Runs at priority 20 so wepos-pro's
        // priority-10 handlers win when installed — core handles vendor-level
        // overrides when pro isn't present.
        add_filter( 'wepos_settings_for_user', [ $this, 'load_vendor_settings' ], 20, 3 );
        add_filter( 'wepos_pre_save_settings', [ $this, 'save_vendor_settings' ], 20, 4 );

        // Dokan profile <-> wePOS store-info sync.
        add_filter( 'wepos_settings_for_user', [ $this, 'sync_store_info_from_dokan' ], 30, 3 );

        // Vendor-dashboard staff permissions — inject a wePOS capability group
        // into Dokan's permissions matrix (legacy PHP template + new React
        // dashboard both consume `dokan_get_all_cap`) and persist changes on
        // save.
        add_filter( 'dokan_get_all_cap', [ $this, 'add_wepos_staff_caps_group' ] );
        add_filter( 'dokan_get_all_cap_labels', [ $this, 'add_wepos_staff_caps_label' ] );
        add_action( 'dokan_after_save_staff', [ $this, 'save_wepos_staff_caps' ], 10, 2 );
        add_action( 'dokan_stuffs_content_inside_before', [ $this, 'maybe_render_staff_cascade_notice' ] );
        // Dokan Pro's React staff permissions UI saves via a REST endpoint
        // that calls add_cap/remove_cap, which leaves role-granted wePOS caps
        // intact on a revoke. Re-apply our caps as explicit user-level overrides
        // after that request completes.
        add_filter( 'rest_request_after_callbacks', [ $this, 'reapply_wepos_caps_after_dokan_rest_save' ], 10, 3 );

        // If vendor created via REST API
        add_action( 'dokan_new_vendor', [ $this, 'after_create_vendor_via_rest' ], 15 );

        // Pass vendor context to frontend localized data.
        add_filter( 'wepos_localize_data', [ $this, 'add_vendor_context' ] );
        add_filter( 'wepos_admin_react_localize_data', [ $this, 'add_vendor_context' ] );

        // Grant POS capabilities to vendor staff when they are created or role changes.
        add_action( 'dokan_new_staff_created', [ $this, 'grant_staff_pos_caps' ] );
        add_action( 'set_user_role', [ $this, 'maybe_grant_pos_caps_on_role_change' ], 10, 3 );

        // Dequeue Dokan styles on wePos admin pages to prevent CSS conflicts.
        add_action( 'admin_enqueue_scripts', [ $this, 'dequeue_dokan_styles_on_wepos_pages' ], 99 );

        // Vendor staff permission check.
        add_filter( 'wepos_is_vendor_staff', [ $this, 'is_vendor_staff' ], 10, 2 );

        // Vendor → staff/cashier cap cascade. When the admin revokes a wePOS-managed
        // cap on the vendor, mirror the revoke to every cap check for the vendor's
        // staff/cashiers — even if the vendor's own Access overlay says the cap is on.
        add_filter( 'user_has_cap', [ $this, 'cascade_vendor_caps_to_staff' ], 20, 4 );
    }

    /**
     * Force-off every cascadable cap on the vendor's staff/cashiers when
     * the parent vendor lacks it.
     *
     * @since 1.5.0
     *
     * @param array<string, bool> $allcaps Caps map for the user being checked.
     * @param string[]            $caps    Required primitive caps for the current check.
     * @param array               $args    Original cap check args.
     * @param \WP_User|null       $user    User object.
     *
     * @return array<string, bool>
     */
    public function cascade_vendor_caps_to_staff( $allcaps, $caps, $args, $user ) {
        return \WeDevs\WePOS\Settings\Caps::apply_cascade( $allcaps, $user );
    }

    /**
     * Check if user is a vendor staff
     *
     * @since 1.4.0
     *
     * @param bool $is_staff
     * @param int  $user_id
     *
     * @return bool
     */
    public function is_vendor_staff( $is_staff, $user_id = null ) {
        $user_id = $user_id ?: get_current_user_id();

        if ( ! $user_id ) {
            return false;
        }

        // Role membership is the source of truth. `user_can( $user_id, 'vendor_staff' )`
        // only works because WP maps role slugs into allcaps at load time — if the caps
        // cache is cold or a context runs user_can before roles are hydrated, the cap
        // check can misfire. Inspect $user->roles directly for a reliable answer.
        $user = get_userdata( $user_id );

        if ( ! $user || empty( $user->roles ) ) {
            return false;
        }

        return in_array( 'vendor_staff', (array) $user->roles, true );
    }

    /**
     * Manager permissions
     *
     * Grants wepos management access to Dokan vendors (dokandar)
     * and cashiers that have an active vendor association (via
     * POS session or _vendor_id meta).
     *
     * @since 1.0.4
     *
     * @return bool
     */
    public function manager_permission( $valid ) {
        // Vendor dashboard access is cap-independent of access_wepos —
        // access_wepos gates only the POS register frontend, not the
        // vendor dashboard pages (outlets, settings, reports, receipts).
        if ( current_user_can( 'dokandar' ) ) {
            $user_id = get_current_user_id();
            if ( $user_id && dokan_is_seller_enabled( $user_id ) ) {
                return true;
            }
        }

        // Cashiers and Vendor Staff can use wePOS dashboard REST endpoints
        // as long as their parent vendor is enabled. Frontend POS access
        // is gated separately via access_wepos.
        if ( current_user_can( 'cashier' ) || apply_filters( 'wepos_is_vendor_staff', false ) ) {
            $vendor_id = wepos_get_vendor_id_for_user();
            if ( $vendor_id && dokan_is_seller_enabled( $vendor_id ) ) {
                return true;
            }
        }

        return $valid;
    }

    /**
     * Handle frontend view permission for dokan vendors
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function frontend_permissions( $valid ) {
        $user_id = get_current_user_id();

        if ( ! $user_id ) {
            return $valid;
        }

        // Vendors: must have access_wepos (admin-revocable) AND an enabled store.
        if ( dokan_is_user_seller( $user_id ) ) {
            if ( ! current_user_can( 'access_wepos' ) ) {
                return $valid;
            }

            if ( dokan_is_seller_enabled( $user_id ) ) {
                return true;
            }

            return $valid;
        }

        // Cashiers / vendor staff: cap must be present (cascade already revokes
        // when parent vendor lacks it) and parent vendor must be enabled.
        if ( current_user_can( 'cashier' ) || apply_filters( 'wepos_is_vendor_staff', false ) ) {
            if ( ! current_user_can( 'access_wepos' ) ) {
                return $valid;
            }

            $vendor_id = wepos_get_vendor_id_for_user();
            if ( $vendor_id && dokan_is_seller_enabled( $vendor_id ) ) {
                return true;
            }
        }

        return $valid;
    }

    /**
     * Filter product queries so vendors, vendor staff, and cashiers
     * only see the vendor's own products.
     *
     * @since 1.0.2
     *
     * @param array            $args    Product query args.
     * @param \WP_REST_Request $request REST request.
     *
     * @return array
     */
    public function filter_vendor_products( $args, $request ) {
        // Site admins see everything (admin + all vendors).
        if ( current_user_can( 'manage_options' ) ) {
            return $args;
        }

        $vendor_id = wepos_get_vendor_id_for_user();
        $outlet_id = absint( $request->get_param( 'outlet_id' ) );

        if ( $vendor_id > 0 ) {
            /** @var \WP_User $vendor */
            $vendor = get_userdata( $vendor_id );

            // If the vendor exists and is not a site admin, restrict products to that vendor.
            if ( $vendor instanceof \WP_User && ! $vendor->has_cap( 'manage_options' ) ) {
                $args['author'] = $vendor_id;

                return $args;
            }
        }

        // Shop managers and any non-vendor user assigned to an admin outlet
        // (cashier, editor, etc.) sell admin products only — exclude every
        // vendor's products from the listing. `wepos_view_all_outlets` covers
        // admin-side roles (editor, custom) that lack manage_woocommerce but
        // are granted full POS scope by the Access settings.
        if (
            current_user_can( 'manage_woocommerce' )
            || current_user_can( 'wepos_view_all_outlets' )
            || wepos_user_is_assigned_cashier()
        ) {
            $vendor_ids = get_users( [
                'role'   => 'seller',
                'fields' => 'ID',
            ] );

            if ( ! empty( $vendor_ids ) ) {
                // Pass exclusions via the `author` query var as a negative,
                // comma-separated list (WP_Query translates this to
                // author__not_in). `author__not_in` itself is stripped by
                // WC_REST_Posts_Controller::prepare_items_query because it
                // isn't in the public query-var whitelist.
                $args['author'] = implode(
                    ',',
                    array_map(
                        static function ( $id ) {
                            return '-' . absint( $id );
                        },
                        $vendor_ids
                    )
                );
            }

            return $args;
        }

        // Legacy fallback: outlet_id supplied for a non-cashier non-vendor user.
        if ( $outlet_id > 0 ) {
            return $args;
        }

        // Non-admin user with no vendor context should see no products.
        $args['post__in'] = [ 0 ];

        return $args;
    }

    /**
     * Exclude Dokan-specific non-POS products from wePOS product lists.
     *
     * @since 1.4.0
     *
     * @param array            $args    Product query args.
     * @param \WP_REST_Request $request Request object.
     *
     * @return array
     */
    public function exclude_dokan_specific_products_from_pos( $args, $request ) {
        $excluded_product_types = array_filter(
            array_map(
                'sanitize_title',
                (array) apply_filters( 'wepos_dokan_excluded_product_types', [ 'product_pack' ], $request, $args )
            )
        );

        if ( ! empty( $excluded_product_types ) ) {
            if ( ! isset( $args['tax_query'] ) || ! is_array( $args['tax_query'] ) ) {
                $args['tax_query'] = [];
            }

            $args['tax_query'][] = [
                'taxonomy' => 'product_type',
                'field'    => 'slug',
                'terms'    => $excluded_product_types,
                'operator' => 'NOT IN',
            ];
        }

        $excluded_product_ids = array_filter(
            array_map(
                'absint',
                (array) apply_filters(
                    'wepos_dokan_excluded_product_ids',
                    [
                        get_option( 'dokan_advertisement_product_id', 0 ),
                        get_option( 'dokan_reverse_withdrawal_product_id', 0 ),
                    ],
                    $request,
                    $args
                )
            )
        );

        if ( ! empty( $excluded_product_ids ) ) {
            $post_not_in         = isset( $args['post__not_in'] ) ? array_map( 'absint', (array) $args['post__not_in'] ) : [];
            $args['post__not_in'] = array_values( array_unique( array_merge( $post_not_in, $excluded_product_ids ) ) );
        }

        return $args;
    }

    /**
     * After create vendor set appropiate meta for pos
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function after_create_vendor( $user_id, $dokan_settings ) {
        if ( ! $user_id  ) {
            return;
        }

        if ( ! dokan_is_user_seller( $user_id ) ) {
            return;
        }

        $this->add_pos_caps_to_user( $user_id );
    }

    /**
     * After create vendor via REST set appropiate meta for pos
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function after_create_vendor_via_rest( $user_id ) {
        if ( ! $user_id  ) {
            return;
        }

        if ( ! dokan_is_user_seller( $user_id ) ) {
            return;
        }

        $this->add_pos_caps_to_user( $user_id );
    }

    /**
     * Show pos meny for vendor
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function show_pos_menu( $url ) {
        $settings = wepos_get_option( 'show_pos_menu_dashboard', 'wepos_general', 'yes' );

        if ( 'yes' === $settings ) {
            $url['pos'] = [
                'title'      => __( 'wePos', 'wepos' ),
                'icon'       => '<img alt="wePOS" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=" style="display:inline-block;width:20px;height:20px;background-color:currentColor;-webkit-mask:url(\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMiAyNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAxMC43ODg5VjI1LjUyMzVMNS4xNzEyNCAxNi45MzI4QzYuMjQ2NzMgMTUuMTQ2MSA4LjE3OTU2IDE0LjA1MzYgMTAuMjY0OCAxNC4wNTM2SDE0LjU1QzE4LjQzMDUgMTQuMDUzNiAyMS41NzYzIDEwLjkwNzYgMjEuNTc2MyA3LjAyNjhDMjEuNTc2MyAzLjE0NiAxOC40MzA1IDAgMTQuNTUgMEgxMC43ODgyQzQuODMwMDMgMCAwIDQuODMwMzggMCAxMC43ODg5WiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==\') center/contain no-repeat;mask:url(\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMiAyNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAxMC43ODg5VjI1LjUyMzVMNS4xNzEyNCAxNi45MzI4QzYuMjQ2NzMgMTUuMTQ2MSA4LjE3OTU2IDE0LjA1MzYgMTAuMjY0OCAxNC4wNTM2SDE0LjU1QzE4LjQzMDUgMTQuMDUzNiAyMS41NzYzIDEwLjkwNzYgMjEuNTc2MyA3LjAyNjhDMjEuNTc2MyAzLjE0NiAxOC40MzA1IDAgMTQuNTUgMEgxMC43ODgyQzQuODMwMDMgMCAwIDQuODMwMzggMCAxMC43ODg5WiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==\') center/contain no-repeat;" />',
                'url'        => dokan_get_navigation_url( 'pos' ),
                'pos'        => 55,
                'permission' => 'dokandar',
                'submenu'    => [],
            ];

            // Hide View POS when access_wepos is revoked. For vendors the cap
            // is set on the seller role by the admin Access matrix; for vendor
            // staff it comes from the vendor's `_wepos_vendor_role_caps`
            // overlay via the cap cascade. Same check covers both.
            if ( current_user_can( 'access_wepos' ) ) {
                $url['pos']['submenu']['view-pos'] = [
                    'title'  => __( 'View POS', 'wepos' ),
                    'icon'   => '<i class="fas fa-desktop"></i>',
                    'url'    => untrailingslashit( get_site_url() ) . '/wepos/#',
                    'pos'    => 50,
                    'target' => '_blank',
                ];
            }
        }

        return $url;
    }

    /**
     * Set dokan settings for wepos
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function add_dokan_settings( $settings_fields ) {
        $settings_fields['wepos_general']['show_pos_menu_dashboard'] = [
            'name'    => 'show_pos_menu_dashboard',
            'label'   => __( 'Show POS menu', 'wepos' ),
            'desc'    => __( 'Show POS menu in vendor dashboard', 'wepos' ),
            'type'    => 'select',
            'default' => 'yes',
            'options' => [
                'yes' => __( 'Yes', 'wepos' ),
                'no'  => __( 'No', 'wepos' ),
            ]
        ];

        return $settings_fields;
    }

    /**
     * Add vendor context to localized frontend/admin data.
     *
     * @since 1.4.0
     *
     * @param array $data Localized data array.
     *
     * @return array
     */
    public function add_vendor_context( $data ) {
        $data['is_dokan_active']  = true;
        $data['is_vendor']        = wepos_is_dokan_vendor() && ! current_user_can( 'manage_woocommerce' );
        $data['vendor_id']        = wepos_get_vendor_id_for_user();
        $data['is_vendor_staff']  = apply_filters( 'wepos_is_vendor_staff', false );
        $data['is_cashier']       = current_user_can( 'cashier' );
        $data['is_admin_user']    = current_user_can( 'manage_woocommerce' );

        return $data;
    }

    /**
     * Grant POS-related capabilities to vendor staff.
     *
     * Vendor staff get the same order/user caps that vendors receive,
     * so they can operate the POS frontend. They do NOT get dokandar
     * or manage_wepos — they are treated like cashiers.
     *
     * @since 1.4.0
     *
     * @param int   $user_id       The new vendor user ID.
     * @param array $dokan_settings Dokan settings array.
     *
     * @return void
     */
    /**
     * Grant POS capabilities to a newly created vendor staff member.
     *
     * Fired by Dokan Pro's vendor-staff module when a new staff is created.
     *
     * @since 1.4.0
     *
     * @param int $user_id Staff user ID.
     *
     * @return void
     */
    public function grant_staff_pos_caps( $user_id ) {
        $this->add_pos_caps_to_user( $user_id );
    }

    /**
     * Grant POS capabilities when a user's role changes to vendor_staff.
     *
     * @since 1.4.0
     *
     * @param int    $user_id   User ID.
     * @param string $new_role  New role slug.
     * @param array  $old_roles Previous roles.
     *
     * @return void
     */
    public function maybe_grant_pos_caps_on_role_change( $user_id, $new_role, $old_roles ) {
        if ( 'vendor_staff' === $new_role ) {
            $this->add_pos_caps_to_user( $user_id );
        }
    }

    /**
     * Add POS-related capabilities to a user.
     *
     * Gives vendor staff the same order/product/user capabilities
     * that cashiers need to operate the POS frontend.
     *
     * @since 1.4.0
     *
     * @param int $user_id User ID.
     *
     * @return void
     */
    private function add_pos_caps_to_user( $user_id ) {
        $user = get_user_by( 'id', $user_id );

        if ( ! $user ) {
            return;
        }

        $caps = [
            'publish_shop_orders',
            'edit_shop_orders',
            'edit_others_shop_orders',
            'read_private_shop_orders',
            'read_private_products',
            'list_users',
            'create_customers',
            'manage_product_terms',
            'read_private_shop_coupons',
            'view_general_settings',
            'edit_general_settings',
            'view_tax_settings',
            'edit_tax_settings',
            'view_barcode_settings',
            'edit_barcode_settings',
        ];

        foreach ( $caps as $cap ) {
            $user->add_cap( $cap );
        }
    }

    /**
     * Dequeue Dokan styles and scripts on wePos admin pages.
     *
     * Dokan loads global CSS (global-admin.css, tailwind, notices) on all
     * admin pages. These conflict with plugin-ui styles on wePos pages.
     *
     * @since 1.4.0
     *
     * @param string $hook Current admin page hook.
     *
     * @return void
     */
    public function dequeue_dokan_styles_on_wepos_pages( $hook ) {
        // Use $hook parameter — more reliable than get_current_screen() which may be null.
        $is_wepos_page = (
            strpos( $hook, 'wepos' ) !== false
            || ( isset( $_GET['page'] ) && strpos( sanitize_text_field( wp_unslash( $_GET['page'] ) ), 'wepos' ) !== false )
        );

        if ( ! $is_wepos_page ) {
            return;
        }

        // Dequeue ALL Dokan styles on wePos pages to prevent CSS conflicts.
        global $wp_styles;

        if ( ! $wp_styles ) {
            return;
        }

        foreach ( $wp_styles->queue as $handle ) {
            if ( strpos( $handle, 'dokan' ) !== false ) {
                wp_dequeue_style( $handle );
            }
        }
    }

    // =========================================================================
    // Vendor-Scoped Settings
    // =========================================================================

    /**
     * Sections a vendor may store as overrides.
     *
     * @var string[]
     */
    private $vendor_mergeable_sections = [ 'wepos_general', 'woo_general', 'woo_tax', 'wepos_barcode' ];

    /**
     * Whether wePOS Pro provides vendor settings handling.
     *
     * When pro is installed it registers `wepos_settings_for_user` and
     * `wepos_pre_save_settings` at priority 10 and exposes outlet-ownership
     * helpers. Core defers to pro in that case to avoid double-applying
     * overlays or conflicting with outlet-ownership validation.
     *
     * @return bool
     */
    private function pro_handles_vendor_settings() {
        return function_exists( 'wepos_user_owns_outlet' );
    }

    /**
     * Overlay vendor-level + outlet-level settings on read.
     *
     * @since 1.5.0
     *
     * @param array $settings  Merged settings.
     * @param int   $outlet_id Outlet ID (0 = vendor-level).
     * @param mixed $request   REST request (unused here).
     *
     * @return array
     */
    public function load_vendor_settings( $settings, $outlet_id, $request ) {
        if ( $this->pro_handles_vendor_settings() ) {
            return $settings;
        }

        if ( current_user_can( 'manage_woocommerce' ) ) {
            return $settings;
        }

        $vendor_id = wepos_get_vendor_id_for_user();

        if ( $vendor_id <= 0 ) {
            return $settings;
        }

        $vendor_settings = get_user_meta( $vendor_id, '_wepos_vendor_settings', true );

        if ( ! empty( $vendor_settings ) && is_array( $vendor_settings ) ) {
            $settings = $this->merge_vendor_settings_into( $settings, $vendor_settings );
        }

        if ( $outlet_id ) {
            $outlet_settings = get_user_meta( $vendor_id, "_wepos_outlet_settings_{$outlet_id}", true );

            if ( ! empty( $outlet_settings ) && is_array( $outlet_settings ) ) {
                $settings = $this->merge_vendor_settings_into( $settings, $outlet_settings );
            }
        }

        return $settings;
    }

    /**
     * Intercept settings save for vendors — store overrides in user meta
     * so global WC options remain untouched.
     *
     * @since 1.5.0
     *
     * @param mixed $handled   null = not yet handled.
     * @param int   $outlet_id Outlet ID (0 = vendor-level).
     * @param array $params    Settings payload.
     * @param mixed $request   REST request.
     *
     * @return mixed
     */
    public function save_vendor_settings( $handled, $outlet_id, $params, $request ) {
        if ( null !== $handled || $this->pro_handles_vendor_settings() ) {
            return $handled;
        }

        if ( current_user_can( 'manage_woocommerce' ) ) {
            return $handled;
        }

        $vendor_id = wepos_get_vendor_id_for_user();

        if ( $vendor_id <= 0 ) {
            return $handled;
        }

        // Restore flags are stripped from $params upstream — read them off
        // the original request body. Mirrors wepos-pro's Dokan handler so
        // vendors get the same restore-to-default semantics with lite alone.
        $raw                      = $request instanceof \WP_REST_Request ? $request->get_json_params() : [];
        $restore_pos_settings     = ! empty( $raw['_restore_pos_settings'] );
        $restore_currency         = ! empty( $raw['_restore_currency'] );
        $restore_tax              = ! empty( $raw['_restore_tax'] );
        $restore_default_customer = ! empty( $raw['_restore_default_customer'] );
        $restore_barcode          = ! empty( $raw['_restore_barcode'] );

        $meta_key = $outlet_id
            ? "_wepos_outlet_settings_{$outlet_id}"
            : '_wepos_vendor_settings';

        if ( $restore_pos_settings ) {
            return $this->restore_vendor_pos_settings( $vendor_id, $meta_key );
        }

        if ( $restore_currency || $restore_tax || $restore_default_customer || $restore_barcode ) {
            return $this->restore_vendor_section_settings(
                $vendor_id,
                $meta_key,
                $restore_currency,
                $restore_tax,
                $restore_default_customer,
                $restore_barcode
            );
        }

        // Mirror vendor store-info writes to Dokan's profile source of truth.
        if ( isset( $params['woo_general'] ) && is_array( $params['woo_general'] ) ) {
            $this->sync_store_info_to_dokan( $vendor_id, $params['woo_general'] );
        }

        $existing = get_user_meta( $vendor_id, $meta_key, true );
        $merged   = $this->deep_merge_vendor_settings(
            is_array( $existing ) ? $existing : [],
            $params
        );

        update_user_meta( $vendor_id, $meta_key, $merged );

        return true;
    }

    /**
     * Drop every overridable POS section from the vendor's settings meta
     * so the vendor falls back to the global (admin) defaults on next read.
     *
     * @since 1.5.1
     *
     * @param int    $vendor_id Vendor user ID.
     * @param string $meta_key  Vendor- or outlet-scoped settings meta key.
     *
     * @return true
     */
    private function restore_vendor_pos_settings( $vendor_id, $meta_key ) {
        $existing = get_user_meta( $vendor_id, $meta_key, true );

        if ( ! is_array( $existing ) || empty( $existing ) ) {
            return true;
        }

        foreach ( [ 'woo_general', 'woo_tax', 'wepos_general', 'wepos_barcode' ] as $section ) {
            unset( $existing[ $section ] );
        }

        if ( empty( $existing ) ) {
            delete_user_meta( $vendor_id, $meta_key );
        } else {
            update_user_meta( $vendor_id, $meta_key, $existing );
        }

        return true;
    }

    /**
     * Drop only the keys covered by the narrower restore flags so the
     * vendor falls back to the admin defaults for those slices while
     * keeping the rest of their overrides intact.
     *
     * @since 1.5.1
     *
     * @param int    $vendor_id                Vendor user ID.
     * @param string $meta_key                 Vendor- or outlet-scoped meta key.
     * @param bool   $restore_currency         Drop currency keys.
     * @param bool   $restore_tax              Drop tax keys.
     * @param bool   $restore_default_customer Drop default-customer keys.
     *
     * @return true
     */
    private function restore_vendor_section_settings( $vendor_id, $meta_key, $restore_currency, $restore_tax, $restore_default_customer, $restore_barcode = false ) {
        $existing = get_user_meta( $vendor_id, $meta_key, true );

        if ( ! is_array( $existing ) || empty( $existing ) ) {
            return true;
        }

        $tax_keys = [
            'wc_tax_enabled', 'wc_prices_include_tax', 'wc_tax_based_on',
            'wc_shipping_tax_class', 'wc_tax_round_at_subtotal',
            'wc_tax_display_shop', 'wc_tax_display_cart',
            'wc_tax_total_display', 'wc_price_display_suffix',
        ];

        $currency_keys = [
            'currency', 'currency_pos', 'price_decimal_sep',
            'price_num_decimals', 'price_thousand_sep', 'thousands_group_style',
        ];

        $default_customer_keys = [
            'default_customer', 'default_customer_is_cashier',
        ];

        if ( $restore_tax && isset( $existing['woo_tax'] ) && is_array( $existing['woo_tax'] ) ) {
            foreach ( $tax_keys as $key ) {
                unset( $existing['woo_tax'][ $key ] );
            }

            if ( empty( $existing['woo_tax'] ) ) {
                unset( $existing['woo_tax'] );
            }
        }

        if ( ( $restore_currency || $restore_default_customer ) && isset( $existing['woo_general'] ) && is_array( $existing['woo_general'] ) ) {
            $keys = array_merge(
                $restore_currency ? $currency_keys : [],
                $restore_default_customer ? $default_customer_keys : []
            );

            foreach ( $keys as $key ) {
                unset( $existing['woo_general'][ $key ] );
            }

            if ( empty( $existing['woo_general'] ) ) {
                unset( $existing['woo_general'] );
            }
        }

        if ( $restore_barcode && isset( $existing['wepos_barcode'] ) ) {
            unset( $existing['wepos_barcode'] );
        }

        if ( empty( $existing ) ) {
            delete_user_meta( $vendor_id, $meta_key );
        } else {
            update_user_meta( $vendor_id, $meta_key, $existing );
        }

        return true;
    }

    /**
     * Overlay Dokan profile store fields onto the `woo_general` section
     * so Vendor Dashboard reads stay in sync with Dokan's profile.
     *
     * Runs after load_vendor_settings so it wins on conflicts.
     *
     * @since 1.5.0
     *
     * @param array $settings  Settings payload.
     * @param int   $outlet_id Outlet ID.
     * @param mixed $request   REST request.
     *
     * @return array
     */
    public function sync_store_info_from_dokan( $settings, $outlet_id, $request ) {
        if ( current_user_can( 'manage_woocommerce' ) ) {
            return $settings;
        }

        $vendor_id = wepos_get_vendor_id_for_user();

        if ( $vendor_id <= 0 || ! function_exists( 'dokan' ) ) {
            return $settings;
        }

        $profile = get_user_meta( $vendor_id, 'dokan_profile_settings', true );

        if ( ! is_array( $profile ) ) {
            return $settings;
        }

        $address = isset( $profile['address'] ) && is_array( $profile['address'] ) ? $profile['address'] : [];

        $field_map = [
            'store_name'      => isset( $profile['store_name'] ) ? $profile['store_name'] : null,
            'store_address'   => isset( $address['street_1'] ) ? $address['street_1'] : null,
            'store_address_2' => isset( $address['street_2'] ) ? $address['street_2'] : null,
            'store_city'      => isset( $address['city'] ) ? $address['city'] : null,
            'store_postcode'  => isset( $address['zip'] ) ? $address['zip'] : null,
            'default_country' => isset( $address['country'], $address['state'] )
                ? $address['country'] . ':' . $address['state']
                : ( isset( $address['country'] ) ? $address['country'] : null ),
        ];

        if ( ! isset( $settings['woo_general'] ) || ! is_array( $settings['woo_general'] ) ) {
            $settings['woo_general'] = [];
        }

        foreach ( $field_map as $key => $value ) {
            if ( null === $value || '' === $value ) {
                continue;
            }
            $settings['woo_general'][ $key ] = $value;
        }

        return $settings;
    }

    /**
     * Mirror vendor store-info updates into Dokan's profile settings.
     *
     * @since 1.5.0
     *
     * @param int   $vendor_id Vendor user ID.
     * @param array $general   woo_general payload.
     *
     * @return void
     */
    private function sync_store_info_to_dokan( $vendor_id, $general ) {
        $profile = get_user_meta( $vendor_id, 'dokan_profile_settings', true );

        if ( ! is_array( $profile ) ) {
            $profile = [];
        }

        if ( ! isset( $profile['address'] ) || ! is_array( $profile['address'] ) ) {
            $profile['address'] = [];
        }

        if ( isset( $general['store_name'] ) ) {
            $profile['store_name'] = sanitize_text_field( $general['store_name'] );
        }

        if ( isset( $general['store_address'] ) ) {
            $profile['address']['street_1'] = sanitize_text_field( $general['store_address'] );
        }

        if ( isset( $general['store_address_2'] ) ) {
            $profile['address']['street_2'] = sanitize_text_field( $general['store_address_2'] );
        }

        if ( isset( $general['store_city'] ) ) {
            $profile['address']['city'] = sanitize_text_field( $general['store_city'] );
        }

        if ( isset( $general['store_postcode'] ) ) {
            $profile['address']['zip'] = sanitize_text_field( $general['store_postcode'] );
        }

        if ( isset( $general['default_country'] ) ) {
            $parts = explode( ':', $general['default_country'] );
            $profile['address']['country'] = isset( $parts[0] ) ? sanitize_text_field( $parts[0] ) : '';
            $profile['address']['state']   = isset( $parts[1] ) ? sanitize_text_field( $parts[1] ) : '';
        }

        update_user_meta( $vendor_id, 'dokan_profile_settings', $profile );
    }

    /**
     * Merge a vendor settings overlay onto the base settings array.
     *
     * Only allowed sections are merged; `currency_symbol` is resolved
     * when the overlay includes a currency code.
     *
     * @param array $base     Base settings.
     * @param array $override Vendor overrides.
     *
     * @return array
     */
    private function merge_vendor_settings_into( $base, $override ) {
        foreach ( $this->vendor_mergeable_sections as $section ) {
            if ( isset( $override[ $section ] ) && is_array( $override[ $section ] ) ) {
                $base[ $section ] = array_merge(
                    isset( $base[ $section ] ) && is_array( $base[ $section ] ) ? $base[ $section ] : [],
                    $override[ $section ]
                );
            }
        }

        if ( ! empty( $override['woo_general']['currency'] ) && function_exists( 'get_woocommerce_currency_symbol' ) ) {
            $base['woo_general']['currency_symbol'] = html_entity_decode(
                get_woocommerce_currency_symbol( $override['woo_general']['currency'] )
            );
        }

        return $base;
    }

    /**
     * Deep-merge incoming payload into stored vendor settings, preserving
     * unrelated keys within each section.
     *
     * @param array $existing Stored settings.
     * @param array $incoming Incoming payload.
     *
     * @return array
     */
    private function deep_merge_vendor_settings( $existing, $incoming ) {
        foreach ( $this->vendor_mergeable_sections as $section ) {
            if ( isset( $incoming[ $section ] ) && is_array( $incoming[ $section ] ) ) {
                $existing[ $section ] = array_merge(
                    isset( $existing[ $section ] ) && is_array( $existing[ $section ] ) ? $existing[ $section ] : [],
                    $incoming[ $section ]
                );
            }
        }

        return $existing;
    }

    // =========================================================================
    // Vendor Dashboard Staff Permissions
    // =========================================================================

    /**
     * Staff-facing capability slugs rendered in the Dokan permissions matrix.
     *
     * Labels map to the `Access POS` / `Manage POS` UX even though the
     * underlying capability symbols are kept as access_wepos / manage_wepos
     * for backward compatibility.
     *
     * @return array<string, string>
     */
    private function get_staff_pos_caps() {
        return [
            'access_wepos'           => __( 'Access POS', 'wepos' ),
            'manage_wepos'           => __( 'Manage POS', 'wepos' ),
            'view_general_settings'  => __( 'View General Settings', 'wepos' ),
            'edit_general_settings'  => __( 'Edit General Settings', 'wepos' ),
            'view_tax_settings'      => __( 'View Tax Settings', 'wepos' ),
            'edit_tax_settings'      => __( 'Edit Tax Settings', 'wepos' ),
            'view_barcode_settings'  => __( 'View Barcode Settings', 'wepos' ),
            'edit_barcode_settings'  => __( 'Edit Barcode Settings', 'wepos' ),
        ];
    }

    /**
     * Add the wePOS cap group to Dokan's staff permissions matrix.
     *
     * @since 1.5.0
     *
     * @param array<string, array<string, string>> $caps Grouped Dokan caps.
     *
     * @return array<string, array<string, string>>
     */
    public function add_wepos_staff_caps_group( $caps ) {
        if ( ! is_array( $caps ) ) {
            return $caps;
        }

        $caps['wepos'] = $this->get_staff_pos_caps();

        return $caps;
    }

    /**
     * Register the wePOS group label.
     *
     * @since 1.5.0
     *
     * @param array<string, string> $labels Cap group labels.
     *
     * @return array<string, string>
     */
    public function add_wepos_staff_caps_label( $labels ) {
        if ( ! is_array( $labels ) ) {
            return $labels;
        }

        $labels['wepos'] = __( 'wePOS Permissions', 'wepos' );

        return $labels;
    }

    /**
     * Persist the wePOS caps submitted on the staff permissions form.
     *
     * Dokan's template posts a boolean for every cap input; anything
     * absent from the payload is treated as off. The vendor → staff
     * cascade is enforced at read time in Settings\Caps::effective_*.
     *
     * @since 1.5.0
     *
     * @param int $vendor_id Vendor user ID who owns this staff member.
     * @param int $staff_id  Staff user ID.
     *
     * @return void
     */
    public function save_wepos_staff_caps( $vendor_id, $staff_id ) {
        if ( ! $staff_id || ! isset( $_POST['_dokan_manage_staff_permission_nonce'] ) ) {
            return;
        }

        $nonce = sanitize_text_field( wp_unslash( $_POST['_dokan_manage_staff_permission_nonce'] ) );

        if ( ! wp_verify_nonce( $nonce, 'dokan_manage_staff_permission' ) ) {
            return;
        }

        $staff_user = get_user_by( 'id', $staff_id );

        if ( ! $staff_user ) {
            return;
        }

        foreach ( array_keys( $this->get_staff_pos_caps() ) as $cap ) {
            $granted = ! empty( $_POST[ $cap ] );

            // Use add_cap( $cap, false ) so the user-level override wins over
            // the role default — otherwise revoking a cap granted by the
            // vendor_staff role is a no-op.
            $staff_user->add_cap( $cap, $granted );
        }
    }

    /**
     * Re-apply wePOS caps as explicit user-level overrides after Dokan Pro's
     * React staff permissions endpoint writes.
     *
     * The upstream handler calls $staff->remove_cap( $cap ) when a toggle is
     * turned off, but WP_User::remove_cap only clears the user-level entry —
     * a role-granted copy of the cap (e.g. access_wepos on vendor_staff)
     * survives and the revoke silently no-ops. We translate the same intent
     * into add_cap( $cap, false ) so the user-level false wins.
     *
     * @since 1.5.0
     *
     * @param \WP_REST_Response|\WP_HTTP_Response|\WP_Error|mixed $response REST response.
     * @param array                                              $handler  Matched route handler.
     * @param \WP_REST_Request                                   $request  REST request.
     *
     * @return mixed The original response (unmodified).
     */
    public function reapply_wepos_caps_after_dokan_rest_save( $response, $handler, $request ) {
        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $route = $request->get_route();
        if ( ! preg_match( '#^/dokan/v1/vendor-staff/(\d+)/capabilities$#', $route, $m ) ) {
            return $response;
        }

        $method = $request->get_method();
        if ( 'PUT' !== $method && 'POST' !== $method ) {
            return $response;
        }

        $staff = get_user_by( 'id', (int) $m[1] );
        if ( ! $staff ) {
            return $response;
        }

        $capabilities = $request->get_param( 'capabilities' );
        if ( ! is_array( $capabilities ) ) {
            return $response;
        }

        $managed = array_keys( $this->get_staff_pos_caps() );

        foreach ( $capabilities as $entry ) {
            if ( ! is_array( $entry ) || empty( $entry['capability'] ) ) {
                continue;
            }

            if ( ! in_array( $entry['capability'], $managed, true ) ) {
                continue;
            }

            $staff->add_cap( $entry['capability'], ! empty( $entry['access'] ) );
        }

        return $response;
    }

    /**
     * Surface a banner on the permissions page when the vendor's own
     * POS access is disabled by the site admin — explains why staff
     * toggles appear inert.
     *
     * @since 1.5.0
     *
     * @return void
     */
    public function maybe_render_staff_cascade_notice() {
        if ( ! function_exists( 'dokan_get_navigation_url' ) ) {
            return;
        }

        if ( empty( $_GET['action'] ) || 'edit' !== $_GET['action'] ) {
            return;
        }

        $vendor_id = get_current_user_id();

        if ( ! $vendor_id ) {
            return;
        }

        $access_off = ! user_can( $vendor_id, 'access_wepos' );
        $manage_off = ! user_can( $vendor_id, 'manage_wepos' );

        if ( ! $access_off && ! $manage_off ) {
            return;
        }

        $message = $access_off
            ? __( 'Your store currently does not have POS access. Staff toggles under wePOS Permissions will stay disabled until the site administrator enables POS access for your store.', 'wepos' )
            : __( 'Your store cannot manage POS settings. Staff members granted Manage POS here will only be able to view POS content until POS management is enabled for your store.', 'wepos' );

        echo '<div class="dokan-alert dokan-alert-warning" style="margin-bottom:16px;">' . esc_html( $message ) . '</div>';
    }
}
