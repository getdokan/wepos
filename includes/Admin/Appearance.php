<?php

namespace WeDevs\WePOS\Admin;

/**
 * Appearance admin subpage.
 *
 * Standalone React-only page that controls which UI (React/Vue) renders on the
 * frontend POS and in the wePOS admin dashboard. Always React — never swaps to
 * legacy Vue like the other wePOS admin pages.
 *
 * @since 1.5.0
 */
class Appearance {

    /**
     * Admin page slug.
     *
     * @var string
     */
    const PAGE_SLUG = 'wepos-appearance';

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'register_page' ] );
        add_action( 'admin_menu', [ $this, 'reorder_submenus' ], 30 );
        add_action( 'admin_head', [ $this, 'hide_duplicate_submenu_css' ] );
    }

    /**
     * Register the Appearance submenu page.
     *
     * @return void
     */
    public function register_page() {
        $capability = wepos_admin_menu_capability();

        $hook = add_submenu_page(
            'wepos',
            __( 'Appearance', 'wepos' ),
            __( 'Appearance', 'wepos' ),
            $capability,
            self::PAGE_SLUG,
            [ $this, 'render_page' ]
        );

        if ( $hook ) {
            add_action( 'load-' . $hook, [ $this, 'init_hooks' ] );
        }
    }

    /**
     * Reorder the wePOS submenu so Appearance sits on top and hide the
     * auto-generated duplicate entry for `wepos-dashboard` (kept in the
     * submenu array for permission checks but visually suppressed).
     *
     * Runs after all admin_menu callbacks so any extensions (e.g. pro)
     * have already added their items.
     *
     * @return void
     */
    public function reorder_submenus() {
        global $submenu;

        if ( empty( $submenu['wepos'] ) || ! is_array( $submenu['wepos'] ) ) {
            return;
        }

        $admin_ui_style = wepos_get_option( 'admin_ui_style', 'wepos_appearance', 'new' );
        $use_react      = 'new' === $admin_ui_style;

        $appearance_item = null;
        $without_appearance = [];

        foreach ( $submenu['wepos'] as $item ) {
            if ( isset( $item[2] ) && self::PAGE_SLUG === $item[2] ) {
                // Capture the first occurrence — drop any duplicates.
                if ( $appearance_item === null ) {
                    $appearance_item = $item;
                }
                continue;
            }

            // Hide the bare "wepos-dashboard" entry created by
            // add_submenu_page — the slug must stay registered for
            // permission checks but the visible link is driven by the
            // Settings submenu URL (rewritten based on admin_ui_style).
            if ( isset( $item[2] ) && 'wepos-dashboard' === $item[2] ) {
                $item[0] = '';
                $without_appearance[] = $item;
                continue;
            }

            // Rewrite hash-based URLs from vue slug to react slug (or vice
            // versa) so all submenu clicks stay on the same physical page
            // and React Router can handle them without a full reload.
            if ( isset( $item[2] ) ) {
                $item[2] = $this->rewrite_submenu_url( $item[2], $use_react );
            }

            $without_appearance[] = $item;
        }

        if ( ! $appearance_item ) {
            return;
        }

        // Insert Appearance immediately before the Settings entry so
        // extension-provided items (Dashboard/Outlets/Receipts/…) keep
        // their relative ordering on top.
        $reordered    = [];
        $inserted     = false;
        $settings_url = 'admin.php?page=wepos#/settings';
        $settings_alt = 'admin.php?page=wepos-dashboard#/settings';

        foreach ( $without_appearance as $item ) {
            $url = $item[2] ?? '';

            if ( ! $inserted && ( $url === $settings_url || $url === $settings_alt ) ) {
                $reordered[] = $appearance_item;
                $inserted    = true;
            }

            $reordered[] = $item;
        }

        // Fallback: if Settings wasn't found, append Appearance at the end.
        if ( ! $inserted ) {
            $reordered[] = $appearance_item;
        }

        $submenu['wepos'] = $reordered; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
    }

    /**
     * Attach enqueue hook only for this page.
     *
     * @return void
     */
    public function init_hooks() {
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
    }

    /**
     * Enqueue the Appearance React bundle + shared components.
     *
     * @return void
     */
    public function enqueue_scripts() {
        $asset_file = WEPOS_PATH . '/build/wepos-appearance.asset.php';
        $asset_data = file_exists( $asset_file ) ? include $asset_file : [];

        $dependencies = isset( $asset_data['dependencies'] ) ? $asset_data['dependencies'] : [];
        $version      = isset( $asset_data['version'] ) ? $asset_data['version'] : WEPOS_VERSION;

        // Shared components bundle — same pattern as Dashboard.php.
        $comp_asset_file = WEPOS_PATH . '/build/wepos-components.asset.php';
        $comp_asset_data = file_exists( $comp_asset_file ) ? include $comp_asset_file : [ 'dependencies' => [], 'version' => $version ];
        $comp_script_file = WEPOS_PATH . '/build/wepos-components.js';

        if ( file_exists( $comp_script_file ) ) {
            wp_enqueue_script(
                'wepos-react-components',
                WEPOS_URL . '/build/wepos-components.js',
                $comp_asset_data['dependencies'],
                $comp_asset_data['version'],
                true
            );
            wp_set_script_translations( 'wepos-react-components', 'wepos', WEPOS_PATH . '/languages' );
            // Carrier exposes `@wedevs/plugin-ui` + `react-router-dom` on
            // `window` — main appearance bundle externalizes them.
            $dependencies[] = 'wepos-react-components';
        }

        wp_enqueue_script( 'wp-hooks' );
        wp_add_inline_script(
            'wp-hooks',
            'if (typeof window.__weposReactHooks === "undefined") {'
            . '  window.__weposReactHooks = wp.hooks.createHooks();'
            . '}'
            . ' window.__weposReactRouterDOM = window.__weposReactRouterDOM || {};'
            . ' window.__weposPluginUI = window.__weposPluginUI || {};',
            'after'
        );

        wp_enqueue_script(
            'wepos-appearance',
            WEPOS_URL . '/build/wepos-appearance.js',
            $dependencies,
            $version,
            true
        );
        wp_set_script_translations( 'wepos-appearance', 'wepos', WEPOS_PATH . '/languages' );

        $css_filename = is_rtl() ? 'wepos-appearance-rtl.css' : 'wepos-appearance.css';
        $css_file     = WEPOS_PATH . '/build/' . $css_filename;
        $css_urls     = [];

        if ( file_exists( $css_file ) ) {
            wp_enqueue_style(
                'wepos-appearance',
                WEPOS_URL . '/build/' . $css_filename,
                [],
                $version
            );
            $css_urls[] = add_query_arg( 'ver', $version, WEPOS_URL . '/build/' . $css_filename );
        }

        // Fall back to the admin react bundle's CSS if dedicated appearance CSS
        // hasn't been emitted (e.g. main.css import reused). Keeps Shadow DOM
        // styled even when webpack splits styles under the admin chunk.
        $admin_css = is_rtl() ? 'wepos-admin-react-rtl.css' : 'wepos-admin-react.css';
        if ( file_exists( WEPOS_PATH . '/build/' . $admin_css ) ) {
            $css_urls[] = add_query_arg( 'ver', $version, WEPOS_URL . '/build/' . $admin_css );
        }

        $css_urls = array_values( array_map( 'esc_url', $css_urls ) );

        $appearance = wp_parse_args(
            get_option( 'wepos_appearance', [] ),
            [
                'pos_layout_style' => 'latest',
                'admin_ui_style'   => 'new',
            ]
        );

        wp_localize_script(
            'wepos-appearance',
            'weposAppearance',
            [
                'cssUrls'  => $css_urls,
                'rest'     => [
                    'root'  => esc_url_raw( get_rest_url() ),
                    'nonce' => wp_create_nonce( 'wp_rest' ),
                ],
                'settings' => $appearance,
                'urls'     => [
                    'settings' => admin_url( 'admin.php?page=wepos-dashboard#/settings' ),
                ],
            ]
        );
    }

    /**
     * Rewrite wePOS submenu URLs so they all target the currently-active
     * panel slug. Keeps every hash route on the same admin page, letting
     * React Router (or the Vue router) handle navigation without a full
     * page reload.
     *
     * Routes registered via the `wepos_react_only_hash_routes` filter have
     * no Vue equivalent and are always pinned to the React dashboard slug.
     *
     * @param string $url      Original submenu URL.
     * @param bool   $use_react True when the React admin UI is active.
     *
     * @return string
     */
    private function rewrite_submenu_url( $url, $use_react ) {
        /**
         * Hash routes that only exist in the React admin and must never be
         * routed to the Vue shell.
         *
         * @since 1.5.0
         *
         * @param string[] $routes Array of hash paths, e.g. ['/license'].
         */
        $react_only_routes = apply_filters( 'wepos_react_only_hash_routes', [] );

        foreach ( $react_only_routes as $route ) {
            if ( false !== strpos( $url, '#' . $route ) ) {
                return str_replace( 'page=wepos#', 'page=wepos-dashboard#', $url );
            }
        }

        $source = $use_react ? 'page=wepos#' : 'page=wepos-dashboard#';
        $target = $use_react ? 'page=wepos-dashboard#' : 'page=wepos#';

        if ( strpos( $url, $source ) !== false ) {
            return str_replace( $source, $target, $url );
        }

        return $url;
    }

    /**
     * Hide the blank wepos-dashboard submenu entry.
     *
     * The entry is kept in $submenu (with an empty title) so WordPress
     * permission checks still allow access to the React dashboard, but
     * the empty row is suppressed visually.
     *
     * @return void
     */
    public function hide_duplicate_submenu_css() {
        echo '<style>#toplevel_page_wepos .wp-submenu a[href="admin.php?page=wepos-dashboard"]{display:none}</style>';
    }

    /**
     * Mount point for the React app.
     *
     * @return void
     */
    public function render_page() {
        echo '<div class="wrap"><div id="wepos-appearance-app"></div></div>';
    }
}
