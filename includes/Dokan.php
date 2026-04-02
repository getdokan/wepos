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
        add_action( 'dokan_new_seller_created', [ $this, 'after_create_vendor' ], 15, 2 );
        add_filter( 'dokan_get_dashboard_nav', [ $this, 'show_pos_menu' ], 15 );
        add_filter( 'wepos_settings_fields', [ $this, 'add_dokan_settings' ], 11 );
        add_filter( 'wepos_rest_manager_permissions', [ $this, 'manager_permission' ], 10 );

        // If vendor created via REST API
        add_action( 'dokan_new_vendor', [ $this, 'after_create_vendor_via_rest' ], 15 );

        // Pass vendor context to frontend localized data.
        add_filter( 'wepos_localize_data', [ $this, 'add_vendor_context' ] );
        add_filter( 'wepos_admin_react_localize_data', [ $this, 'add_vendor_context' ] );

        // Grant vendor staff POS capabilities when their parent vendor is enabled.
        add_action( 'dokan_new_seller_created', [ $this, 'grant_vendor_staff_caps' ], 20, 2 );

        // Dequeue Dokan styles on wePos admin pages to prevent CSS conflicts.
        add_action( 'admin_enqueue_scripts', [ $this, 'dequeue_dokan_styles_on_wepos_pages' ], 99 );
    }

    /**
     * Manager permissions
     *
     * @since 1.0.4
     *
     * @return void
     */
    public function manager_permission( $valid ) {
        if ( current_user_can( 'dokandar' ) ) {
            return true;
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
        if ( dokan_is_user_seller( get_current_user_id() ) && dokan_is_seller_enabled( get_current_user_id() ) ) {
	        return true;
        } else if ( current_user_can( 'cashier' ) && current_user_can( 'access_wepos' ) ) {
            return true;
        } else if ( wepos_is_dokan_vendor_staff() ) {
            // Vendor staff can access POS if their parent vendor is enabled.
            $vendor_id = wepos_get_vendor_id_for_user();
            if ( $vendor_id && dokan_is_seller_enabled( $vendor_id ) ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Prepare object for product query
     *
     * filter by author
     *
     * @since 1.0.2
     *
     * @return void
     */
    public function filter_vendor_products( $args, $request ) {
        if ( ! current_user_can( 'manage_woocommerce' ) && dokan_is_user_seller( dokan_get_current_user_id() ) ) {
            $args['author'] = dokan_get_current_user_id();
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

        $user = get_user_by( 'id', $user_id );
        $user->add_cap( 'publish_shop_orders' );
        $user->add_cap( 'list_users' );
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

        $user = get_user_by( 'id', $user_id );
        $user->add_cap( 'publish_shop_orders' );
        $user->add_cap( 'list_users' );
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
            $url['wepos'] = [
                'title' => __( 'View POS', 'wepos' ),
                'icon'  => '<i class="fa fa-barcode" aria-hidden="true"></i>',
                'url'   => untrailingslashit( get_site_url() ) . '/wepos/#',
                'pos'   => 195,
            ];
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
        $data['is_vendor']        = wepos_is_dokan_vendor();
        $data['vendor_id']        = wepos_get_vendor_id_for_user();
        $data['is_vendor_staff']  = wepos_is_dokan_vendor_staff();

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
    public function grant_vendor_staff_caps( $user_id, $dokan_settings ) {
        // This hook fires for new vendors, not staff directly.
        // Staff caps are granted when staff are created via Dokan's vendor-staff module.
        // We hook into user role changes to grant POS caps to vendor_staff users.
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
}
