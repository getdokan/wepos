<?php

namespace WeDevs\WePOS\Admin;

/**
 * Panel Switcher
 *
 * Handles switching between legacy Vue and new React admin panel interfaces.
 * Each admin page can independently be switched between Vue and React.
 *
 * @since 1.3.0
 */
class PanelSwitcher {

    /**
     * Default transient expiration time in seconds (30 days).
     *
     * @since 1.3.0
     *
     * @var int
     */
    protected $transient_expiration = 30 * DAY_IN_SECONDS;

    /**
     * Cached switchable pages.
     *
     * @since 1.3.0
     *
     * @var array
     */
    private $switchable_pages = [];

    /**
     * Constructor.
     *
     * @since 1.3.0
     */
    public function __construct() {
        add_action( 'admin_init', [ $this, 'handle_switch_request' ] );
        add_action( 'admin_menu', [ $this, 'filter_admin_submenus' ], 20 );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_switching_script' ] );
        add_filter( 'admin_footer_text', [ $this, 'render_switch_container' ] );
    }

    /**
     * Get the list of switchable admin pages.
     *
     * Each page has a key (route slug), and a vue_url + react_url pair.
     * Extensions (wepos-pro) can add pages via the filter.
     *
     * @since 1.3.0
     *
     * @return array
     */
    public function get_switchable_pages() {
        if ( ! empty( $this->switchable_pages ) ) {
            return $this->switchable_pages;
        }

        $this->switchable_pages = apply_filters( 'wepos_switchable_admin_pages', [
            'settings' => [
                'vue_url'   => 'admin.php?page=wepos#/settings',
                'react_url' => 'admin.php?page=wepos-dashboard#/settings',
            ],
        ] );

        return $this->switchable_pages;
    }

    /**
     * Handle the panel switch URL request.
     *
     * @since 1.3.0
     *
     * @return void
     */
    public function handle_switch_request() {
        if ( empty( $_GET['wepos_action'] ) || 'switch_panel' !== sanitize_key( wp_unslash( $_GET['wepos_action'] ) ) ) {
            return;
        }

        if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_GET['_wpnonce'] ) ), 'wepos_switch_panel' ) ) {
            return;
        }

        $page_key = sanitize_key( wp_unslash( $_GET['page_key'] ?? '' ) );
        $pages    = $this->get_switchable_pages();

        if ( ! isset( $pages[ $page_key ] ) ) {
            return;
        }

        $transient_key  = $this->get_transient_key( $page_key );
        $is_react       = get_transient( $transient_key );

        if ( $is_react ) {
            // Currently React, switch back to Vue.
            delete_transient( $transient_key );
            $redirect_url = admin_url( $pages[ $page_key ]['vue_url'] );
        } else {
            // Currently Vue, switch to React.
            set_transient( $transient_key, true, $this->transient_expiration );
            $redirect_url = admin_url( $pages[ $page_key ]['react_url'] );
        }

        wp_safe_redirect( $redirect_url );
        exit;
    }

    /**
     * Get the active panel for a given page key.
     *
     * @since 1.3.0
     *
     * @param string $page_key The page key (e.g., 'settings').
     *
     * @return string 'vue' or 'react'.
     */
    public static function get_active_panel( $page_key ) {
        $transient_key = 'wepos_react_' . sanitize_key( $page_key ) . '_page';

        return get_transient( $transient_key ) ? 'react' : 'vue';
    }

    /**
     * Build a nonce-protected switch URL for a given page key.
     *
     * @since 1.3.0
     *
     * @param string $page_key The page key.
     *
     * @return string
     */
    public static function get_switch_url( $page_key ) {
        return wp_nonce_url(
            add_query_arg(
                [
                    'wepos_action' => 'switch_panel',
                    'page_key'     => $page_key,
                ],
                admin_url( 'admin.php' )
            ),
            'wepos_switch_panel'
        );
    }

    /**
     * Filter admin submenus to show correct URL (Vue or React) for each switchable page.
     *
     * Runs at priority 20 on admin_menu, after menus are registered.
     *
     * @since 1.3.0
     *
     * @return void
     */
    public function filter_admin_submenus() {
        global $submenu;

        if ( ! isset( $submenu['wepos'] ) || ! is_array( $submenu['wepos'] ) ) {
            return;
        }

        $pages    = $this->get_switchable_pages();
        $filtered = [];

        foreach ( $submenu['wepos'] as $item ) {
            // Hide the bare "wepos-dashboard" submenu entry by clearing its title.
            // We keep the entry in the array so WordPress can still use it for
            // permission checks (removing it entirely causes "not allowed" errors).
            if ( isset( $item[2] ) && 'wepos-dashboard' === $item[2] ) {
                $item[0] = '';
                $filtered[] = $item;
                continue;
            }

            // Rewrite switchable page URLs based on active panel.
            foreach ( $pages as $key => $page ) {
                $is_vue_url   = isset( $item[2] ) && $item[2] === $page['vue_url'];
                $is_react_url = isset( $item[2] ) && $item[2] === $page['react_url'];

                if ( $is_vue_url || $is_react_url ) {
                    $active  = self::get_active_panel( $key );
                    $item[2] = 'react' === $active ? $page['react_url'] : $page['vue_url'];
                    break;
                }
            }

            $filtered[] = $item;
        }

        $submenu['wepos'] = $filtered; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
    }

    /**
     * Enqueue the panel switching script on wepos admin pages.
     *
     * @since 1.3.0
     *
     * @return void
     */
    public function enqueue_switching_script() {
        $screen = get_current_screen();

        if ( ! $screen ) {
            return;
        }

        $is_wepos_screen = (
            'toplevel_page_wepos' === $screen->id ||
            'wepos_page_wepos-dashboard' === $screen->id
        );

        if ( ! $is_wepos_screen ) {
            return;
        }

        $asset_file = WEPOS_PATH . '/build/wepos-admin-switching.asset.php';
        $asset_data = file_exists( $asset_file ) ? include $asset_file : [];

        $dependencies = isset( $asset_data['dependencies'] ) ? $asset_data['dependencies'] : [];
        $version      = isset( $asset_data['version'] ) ? $asset_data['version'] : WEPOS_VERSION;

        wp_enqueue_script(
            'wepos-admin-switching',
            WEPOS_URL . '/build/wepos-admin-switching.js',
            $dependencies,
            $version,
            true
        );

        $css_file = WEPOS_PATH . '/build/wepos-admin-switching.css';

        if ( file_exists( $css_file ) ) {
            wp_enqueue_style(
                'wepos-admin-switching',
                WEPOS_URL . '/build/wepos-admin-switching.css',
                [],
                $version
            );
        }

        // Determine which panel the current page is on.
        $current_panel = 'toplevel_page_wepos' === $screen->id ? 'vue' : 'react';

        // Build switch data for each switchable page.
        $pages      = $this->get_switchable_pages();
        $pages_data = [];

        foreach ( $pages as $key => $page ) {
            $pages_data[ $key ] = [
                'active'     => self::get_active_panel( $key ),
                'switch_url' => self::get_switch_url( $key ),
            ];
        }

        wp_add_inline_script(
            'wepos-admin-switching',
            'window.weposPanelSwitch = ' . wp_json_encode(
                [
                    'current_panel'  => $current_panel,
                    'supported_keys' => array_keys( $pages ),
                    'pages'          => $pages_data,
                    'nonce'          => wp_create_nonce( 'wepos_switch_panel' ),
                    'admin_url'      => admin_url(),
                ]
            ),
            'before'
        );
    }

    /**
     * Render the switch container in admin footer.
     *
     * Replaces the default WordPress admin footer text on wepos pages.
     *
     * @since 1.3.0
     *
     * @param string $text Footer text.
     *
     * @return string
     */
    public function render_switch_container( $text ) {
        $screen = get_current_screen();

        if ( ! $screen ) {
            return $text;
        }

        $is_wepos_screen = (
            'toplevel_page_wepos' === $screen->id ||
            'wepos_page_wepos-dashboard' === $screen->id
        );

        if ( ! $is_wepos_screen ) {
            return $text;
        }

        return '<span id="wepos-panel-switch"></span>';
    }

    /**
     * Get the transient key for a page.
     *
     * @since 1.3.0
     *
     * @param string $page_key The page key.
     *
     * @return string
     */
    private function get_transient_key( $page_key ) {
        return 'wepos_react_' . sanitize_key( $page_key ) . '_page';
    }
}
