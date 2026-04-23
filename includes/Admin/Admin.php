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

        $hook = add_menu_page( __( 'wePOS', 'wepos' ), __( 'wePOS', 'wepos' ), $capability, $slug, [ $this, 'plugin_page' ], 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCAyMiAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMTAuNzg4OVYyNS41MjM1TDUuMTcxMjQgMTYuOTMyOEM2LjI0NjczIDE1LjE0NjEgOC4xNzk1NiAxNC4wNTM2IDEwLjI2NDggMTQuMDUzNkgxNC41NUMxOC40MzA1IDE0LjA1MzYgMjEuNTc2MyAxMC45MDc2IDIxLjU3NjMgNy4wMjY4QzIxLjU3NjMgMy4xNDYgMTguNDMwNSAwIDE0LjU1IDBIMTAuNzg4MkM0LjgzMDAzIDAgMCA0LjgzMDM4IDAgMTAuNzg4OVoiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl8yODY5Xzc1NjMpIi8+CjxtYXNrIGlkPSJtYXNrMF8yODY5Xzc1NjMiIHN0eWxlPSJtYXNrLXR5cGU6YWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjAiIHk9IjAiIHdpZHRoPSIyMiIgaGVpZ2h0PSIyNiI+CjxnIG9wYWNpdHk9IjAuMTYwMzE5Ij4KPHBhdGggZD0iTTAuMDAzOTA2MjUgMTAuNzg4OVYyNS41MjM1TDUuMTc1MTUgMTYuOTMyOEM2LjI1MDYzIDE1LjE0NjEgOC4xODM0NiAxNC4wNTM2IDEwLjI2ODcgMTQuMDUzNkgxNC41NTM5QzE4LjQzNDUgMTQuMDUzNiAyMS41ODAyIDEwLjkwNzYgMjEuNTgwMiA3LjAyNjhDMjEuNTgwMiAzLjE0NiAxOC40MzQ1IDAgMTQuNTUzOSAwSDEwLjc5MjFDNC44MzM5MyAwIDAuMDAzOTA2MjUgNC44MzAzOCAwLjAwMzkwNjI1IDEwLjc4ODlaIiBmaWxsPSJ1cmwoI3BhaW50MV9saW5lYXJfMjg2OV83NTYzKSIvPgo8L2c+CjwvbWFzaz4KPGcgbWFzaz0idXJsKCNtYXNrMF8yODY5Xzc1NjMpIj4KPHBhdGggb3BhY2l0eT0iMC4xNjAzMTkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMC40NDMzNTkgMjUuNTIwOEMxLjc4MTE4IDE0LjkxODUgNC44NzczNSA5LjYxNzMzIDkuNzMxODcgOS42MTczM0MxNy4wMTM2IDkuNjE3MzMgMjAuMDEwNyAxMC41MzIxIDIwLjAxMDcgMy4wMDYwNkMyMC4wMTA3IC0yLjAxMTI3IDI3LjAwMzkgLTAuMzIwNzggNDAuOTkwMyA4LjA3NzUzTDguMzA5ODYgMjkuNzE5NkwwLjQ0MzM1OSAyNS41MjA4WiIgZmlsbD0idXJsKCNwYWludDJfbGluZWFyXzI4NjlfNzU2MykiLz4KPC9nPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzI4NjlfNzU2MyIgeDE9IjEyLjk0NDciIHkxPSIzLjE0MjE4IiB4Mj0iMi4xMDgzMyIgeTI9IjE4Ljc4NTciIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agb2Zmc2V0PSIwLjAwMDQyMjI5NyIgc3RvcC1jb2xvcj0iIzBBQ0VGRSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0OTVBRkYiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDFfbGluZWFyXzI4NjlfNzU2MyIgeDE9IjEwLjc5MjEiIHkxPSIwIiB4Mj0iMTAuNzkyMSIgeTI9IjI1LjUyMzUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzI2NUZGOSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0MzM5RkYiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDJfbGluZWFyXzI4NjlfNzU2MyIgeDE9IjIwLjcxNjgiIHkxPSIwLjE5MTQwNiIgeDI9IjIwLjcxNjgiIHkyPSIyOS43MTk2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMyNjVGRjkiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNDMzOUZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg==', 59 );

        if ( current_user_can( $capability ) ) {
            $menu_items = apply_filters( 'wepos_admin_menu', [
                [
                    'title'    => __( 'Settings', 'wepos' ),
                    'cap'      => $capability,
                    'page_key' => 'settings',
                    'url'      => 'admin.php?page=' . $slug . '#/settings',
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
