<?php

namespace WeDevs\WePOS\Admin;

/**
 * Premium submenu.
 *
 * Adds a "Premium" entry at the bottom of the wePOS submenu pointing at the
 * React admin's `#/premium` route.
 *
 * The item is appended on `admin_menu` at priority 31 — after
 * Appearance::reorder_submenus() (priority 30) rebuilds the submenu array —
 * so it always stays last and keeps its React dashboard URL untouched.
 *
 * @since WEPOS_SINCE
 */
class Premium {

    /**
     * Parent menu slug.
     *
     * @var string
     */
    const PARENT_SLUG = 'wepos';

    /**
     * React router hash route rendered by this menu item.
     *
     * @var string
     */
    const HASH_ROUTE = '/premium';

    /**
     * Upgrade landing page.
     *
     * @var string
     */
    const UPGRADE_URL = 'https://dokan.co/wordpress/wepos/pricing/?utm_source=free-pro-dashboard&utm_medium=wordpress-menu&utm_campaign=free-to-pro-upgrade';

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'register_menu' ], 31 );
        add_filter( 'wepos_react_only_hash_routes', [ $this, 'register_react_only_route' ] );
    }

    /**
     * Whether the Premium menu should be visible.
     *
     * Extensions (e.g. wePOS Pro) can hide the upsell entry by returning
     * false from the `wepos_show_premium_menu` filter.
     *
     * @since WEPOS_SINCE
     *
     * @return bool
     */
    public static function is_visible() {

        if( function_exists( 'wepos_pro' ) ) {
            return false;
        }
        /**
         * Toggle the Premium upsell submenu.
         *
         * @since WEPOS_SINCE
         *
         * @param bool $show Whether to show the Premium menu.
         */
        return (bool) apply_filters( 'wepos_show_premium_menu', true );
    }

    /**
     * Append the Premium item to the bottom of the wePOS submenu.
     *
     * @since WEPOS_SINCE
     *
     * @return void
     */
    public function register_menu() {
        global $submenu;

        if ( ! self::is_visible() ) {
            return;
        }

        if ( empty( $submenu[ self::PARENT_SLUG ] ) || ! is_array( $submenu[ self::PARENT_SLUG ] ) ) {
            return;
        }

        $capability = wepos_admin_menu_capability();

        if ( ! current_user_can( $capability ) ) {
            return;
        }

        $title = sprintf(
            '<span>%1$s</span><img src="%2$s" alt="" class="wepos-premium-menu-icon" width="15" height="15" />',
            esc_html__( 'Premium', 'wepos' ),
            esc_url( WEPOS_ASSETS . '/images/premium.svg' )
        );

        // Index 3 is the page title, index 4 the CSS class WordPress copies
        // onto both the <li> and the <a> — used to gold-tint the label.
        $submenu[ self::PARENT_SLUG ][] = [ // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
            $title,
            $capability,
            self::get_page_url(),
            __( 'Premium', 'wepos' ),
            'wepos-premium-menu-item',
        ];
    }

    /**
     * Admin URL of the Premium page.
     *
     * @since WEPOS_SINCE
     *
     * @return string
     */
    public static function get_page_url() {
        return 'admin.php?page=wepos-dashboard#' . self::HASH_ROUTE;
    }

    /**
     * Pin `#/premium` to the React dashboard slug.
     *
     * The route only exists in the React admin, so Appearance must never
     * rewrite it to the legacy Vue page.
     *
     * @since WEPOS_SINCE
     *
     * @param string[] $routes Existing React-only hash routes.
     *
     * @return string[]
     */
    public function register_react_only_route( $routes ) {
        $routes[] = self::HASH_ROUTE;

        return $routes;
    }

}
