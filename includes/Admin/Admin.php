<?php
namespace WeDevs\WePOS\Admin;

/**
 * Admin Pages Handler
 */
class Admin {

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'admin_menu' ] );
        add_filter( 'manage_edit-shop_order_columns', [ $this, 'add_pos_order_column' ], 10 );
        add_action( 'manage_shop_order_posts_custom_column', [ $this, 'render_is_pos_order_content' ], 10, 2);
        add_action( 'admin_print_styles', [ $this, 'add_pos_column_style' ] );
    }

    /**
     * Register our menu page
     *
     * @return void
     */
    public function admin_menu() {
        global $submenu;

        $capability = wepos_admin_menu_capability();
        $slug       = 'wepos';

        $hook = add_menu_page( __( 'wePOS', 'wepos' ), __( 'wePOS', 'wepos' ), $capability, $slug, [ $this, 'plugin_page' ], 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMiAyNiIgZmlsbD0iY3VycmVudENvbG9yIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMCAxMC43ODg5VjI1LjUyMzVMNS4xNzEyNCAxNi45MzI4QzYuMjQ2NzMgMTUuMTQ2MSA4LjE3OTU2IDE0LjA1MzYgMTAuMjY0OCAxNC4wNTM2SDE0LjU1QzE4LjQzMDUgMTQuMDUzNiAyMS41NzYzIDEwLjkwNzYgMjEuNTc2MyA3LjAyNjhDMjEuNTc2MyAzLjE0NiAxOC40MzA1IDAgMTQuNTUgMEgxMC43ODgyQzQuODMwMDMgMCAwIDQuODMwMzggMCAxMC43ODg5WiIgZmlsbD0iY3VycmVudENvbG9yIi8+CjxtYXNrIGlkPSJtYXNrMF8yODY5Xzc1NjMiIHN0eWxlPSJtYXNrLXR5cGU6YWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjAiIHk9IjAiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyNiI+CjxnIG9wYWNpdHk9IjAuMTYwMzE5Ij4KPHBhdGggZD0iTTAuMDAzOTA2MjUgMTAuNzg4OVYyNS41MjM1TDUuMTc1MTUgMTYuOTMyOEM2LjI1MDYzIDE1LjE0NjEgOC4xODM0NiAxNC4wNTM2IDEwLjI2ODcgMTQuMDUzNkgxNC41NTM5QzE4LjQzNDUgMTQuMDUzNiAyMS41ODAyIDEwLjkwNzYgMjEuNTgwMiA3LjAyNjhDMjEuNTgwMiAzLjE0NiAxOC40MzQ1IDAgMTQuNTUzOSAwSDEwLjc5MjFDNC44MzM5MyAwIDAuMDAzOTA2MjUgNC44MzAzOCAwLjAwMzkwNjI1IDEwLjc4ODlaIiBmaWxsPSJjdXJyZW50Q29sb3IiLz4KPC9nPgo8L21hc2s+CjxnIG1hc2s9InVybCgjbWFzazBfMjg2OV83NTYzKSI+CjxwYXRoIG9wYWNpdHk9IjAuMTYwMzE5IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTAuNDQzMzU5IDI1LjUyMDhDMS43ODExOCAxNC45MTg1IDQuODc3MzUgOS42MTczMyA5LjczMTg3IDkuNjE3MzNDMTcuMDEzNiA5LjYxNzMzIDIwLjAxMDcgMTAuNTMyMSAyMC4wMTA3IDMuMDA2MDZDMjAuMDEwNyAtMi4wMTEyNyAyNy4wMDM5IC0wLjMyMDc4IDQwLjk5MDMgOC4wNzc1M0w4LjMwOTg2IDI5LjcxOTZMMC40NDMzNTkgMjUuNTIwOFoiIGZpbGw9ImN1cnJlbnRDb2xvciIvPgo8L2c+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMjg2OV83NTYzIiB4MT0iMTIuOTQ0NyIgeTE9IjMuMTQyMTgiIHgyPSIyLjEwODMzIiB5Mj0iMTguNzg1NyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBvZmZzZXQ9IjAuMDAwNDIyMjk3IiBzdG9wLWNvbG9yPSIjMEFDRUZFIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzQ5NUFGRiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfMjg2OV83NTYzIiB4MT0iMTAuNzkyMSIgeTE9IjAiIHgyPSIxMC43OTIxIiB5Mj0iMjUuNTIzNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMjY1RkY5Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzQzMzlGRiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50Ml9saW5lYXJfMjg2OV83NTYzIiB4MT0iMjAuNzE2OCIgeTE9IjAuMTkxNDA2IiB4Mj0iMjAuNzE2OCIgeTI9IjI5LjcxOTYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzI2NUZGOSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0MzM5RkYiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K', 59 );

        if ( current_user_can( $capability ) ) {
            $admin_ui_style = wepos_get_option( 'admin_ui_style', 'wepos_appearance', 'new' );
            $settings_url   = 'legacy' === $admin_ui_style
                ? 'admin.php?page=' . $slug . '#/settings'
                : 'admin.php?page=wepos-dashboard#/settings';

            $menu_items = apply_filters( 'wepos_admin_menu', [
                [
                    'title'    => __( 'Settings', 'wepos' ),
                    'cap'      => $capability,
                    'page_key' => 'settings',
                    'url'      => $settings_url,
                ],
                [
                    'title'    => __( 'View POS', 'wepos' ),
                    'cap'      => $capability,
                    'page_key' => 'view_pos',
                    'url'      => site_url() . '/wepos/#',
                ],
            ], $slug, $capability, $hook );

            foreach ( $menu_items as $key => $item ) {
                // Skip menu items the user cannot access based on page caps.
                if ( ! empty( $item['page_key'] ) && ! wepos_user_can_access_page( $item['page_key'] ) ) {
                    continue;
                }

                $submenu[ $slug ][] = array( $item['title'], $item['cap'], $item['url'] );
            }
        }

        add_action( 'load-' . $hook, [ $this, 'init_hooks' ] );
    }


    /**
     * Initialize our hooks for the admin page
     *
     * @return void
     */
    public function init_hooks() {
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
    }

    /**
     * Load scripts and styles for the app
     *
     * @return void
     */
    public function enqueue_scripts() {
        wp_enqueue_style( 'wepos-flaticon' );
        wp_enqueue_style( 'wepos-tinymce' );
        wp_enqueue_style( 'wepos-style' );
        wp_enqueue_style( 'wepos-bootstrap' );
        wp_enqueue_style( 'wepos-admin' );
        wp_enqueue_style( 'wepos-select2' );

        wp_enqueue_script( 'wepos-tinymce-plugin' );
        wp_enqueue_script( 'wepos-vendor' );
        wp_enqueue_script( 'wepos-blockui' );
        wp_enqueue_script( 'wepos-select2' );

        wp_enqueue_script( 'wepos-bootstrap' );
        do_action( 'wepos_load_admin_scripts' );
        wp_enqueue_script( 'wepos-admin' );
    }

    /**
     * Render our admin page
     *
     * @return void
     */
    public function plugin_page() {
        $admin_ui_style = wepos_get_option( 'admin_ui_style', 'wepos_appearance', 'new' );

        // When the new (React) admin UI is active, the top-level wepos slug is
        // only reached via direct URL — redirect to the React dashboard so the
        // user never sees the legacy Vue shell.
        if ( 'new' === $admin_ui_style ) {
            wp_safe_redirect( admin_url( 'admin.php?page=wepos-dashboard' ) );
            exit;
        }

        echo '<div class="wrap"><div id="wepos-admin-app"></div></div>';
    }

    /**
     * Add pos order column
     *
     * @since 1.0.4
     *
     * @param array $defaults
     */
    public function add_pos_order_column($defaults) {
        $defaults['is_pos_order'] = apply_filters( 'wepos_shop_order_pos_column_title', __( 'Is POS', 'wepos' ) );

        return $defaults;
    }

    /**
     * Render if is pos order content
     *
     * @since 1.0.4
     *
     * @param string $column_name
     * @param integer $post_id
     *
     * @return string
     */
    public function render_is_pos_order_content( $column_name, $post_id ) {
        if ( $column_name === 'is_pos_order' ) {
            $order = wc_get_order( $post_id );

            if ( 'wepos' === $order->get_created_via() ) {
                echo '<span class="dashicons dashicons-store"></span>';
            } else {
                echo '&ndash;';
            }
        }
    }

    /**
     * Added column styles
     *
     * @since 1.0.4
     */
    public function add_pos_column_style() {
        $css = '.widefat .column-is_pos_order { width: 9% !important; text-align: center; } .widefat .column-is_pos_order span.dashicons-store{ font-size: 17px; margin-top: 3px; }';
        wp_add_inline_style( 'woocommerce_admin_styles', $css );
    }
}
