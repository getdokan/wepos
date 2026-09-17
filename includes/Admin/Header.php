<?php

namespace WeDevs\WePOS\Admin;

/**
 * Admin panel header (top bar).
 *
 * Prints the header mount point on `in_admin_header` — above the page markup
 * and above the WordPress notices — and captures those notices into a hidden
 * wrapper the page bundle moves below the header. Final DOM order on every
 * wePOS React admin page: header → notices → app.
 *
 * The header ships inside the page bundle that is already enqueued
 * (`wepos-admin-react` / `wepos-appearance`), so there is no separate script
 * to build or enqueue — only its data is localized here.
 *
 * @since WEPOS_SINCE
 */
class Header {

    /**
     * Bundles that can carry the header. Script and style handles share
     * these names; the first one enqueued wins.
     *
     * @var string[]
     */
    const BUNDLES = [ 'wepos-admin-react', 'wepos-appearance' ];

    /**
     * Whether a page bundle picked up the header this request. Guards the
     * markup: without the bundle nothing would reveal the captured notices.
     *
     * @var bool
     */
    protected $mounted = false;

    public function __construct() {
        // Late — the page bundles enqueue on priority 10.
        add_action( 'admin_enqueue_scripts', [ $this, 'localize_header' ], 20 );
        add_action( 'in_admin_header', [ $this, 'render_container' ] );
        add_action( 'admin_notices', [ $this, 'inject_before_notices' ], -9999 );
        add_action( 'admin_notices', [ $this, 'inject_after_notices' ], PHP_INT_MAX );
    }

    /**
     * Hand the header data to the page bundle on the current screen.
     *
     * @since WEPOS_SINCE
     *
     * @return void
     */
    public function localize_header() {
        if ( ! current_user_can( wepos_admin_menu_capability() ) ) {
            return;
        }

        foreach ( self::BUNDLES as $handle ) {
            if ( ! wp_script_is( $handle, 'enqueued' ) ) {
                continue;
            }

            wp_localize_script(
                $handle,
                'weposAdminPanelHeaderSettings',
                [ 'header_info' => $this->get_header_info() ]
            );

            // Unscoped rules for the notice wrapper — it sits outside
            // `.pui-root` on purpose, since the importantized Tailwind
            // preflight there would strip core notice styling.
            if ( wp_style_is( $handle, 'enqueued' ) ) {
                wp_add_inline_style(
                    $handle,
                    // Cancel the 20px `#wpcontent` gutter so the bar sits flush
                    // against the admin menu, like the page content below it.
                    '#wepos-admin-panel-header{margin-inline-start:-20px}'
                    . '.wepos-notice-list-hide{display:none}'
                    . '#wepos-admin-notices{margin:0 0 1rem}'
                );
            }

            $this->mounted = true;
            break;
        }
    }

    /**
     * Data rendered by the header.
     *
     * @since WEPOS_SINCE
     *
     * @return array<string, mixed>
     */
    public function get_header_info() {
        /**
         * Filters the wePOS admin header data.
         *
         * @since WEPOS_SINCE
         *
         * @param array $header_info Header data passed to the React root.
         */
        return apply_filters(
            'wepos_admin_header_info',
            [
                'logo_url'      => WEPOS_ASSETS . '/images/logo.svg',
                'version'       => WEPOS_VERSION,
                'is_pro_active' => function_exists( 'wepos_pro' ),
                'pro_version'   => defined( 'WEPOS_PRO_VERSION' ) ? WEPOS_PRO_VERSION : '',
                'upgrade_url'   => Premium::is_visible() ? admin_url( Premium::get_page_url() ) : Premium::UPGRADE_URL,
                'docs_url'      => 'https://dokan.co/docs/wepos/getting-started/',
                'support_url'   => 'https://dokan.co/contact/',
                'feedback_url'  => 'https://dokan.co/contact/',
            ]
        );
    }

    /**
     * Print the header mount point and the notice slot.
     *
     * `in_admin_header` fires before `admin_notices`, so both ids exist by
     * the time the captured wrapper is printed — and before the footer
     * bundle moves that wrapper into the slot.
     *
     * @since WEPOS_SINCE
     *
     * @return void
     */
    public function render_container() {
        if ( ! $this->mounted ) {
            return;
        }

        echo '<div id="wepos-admin-panel-header" class="wepos-layout"></div>';
        echo '<div id="wepos-admin-notices"></div>';
    }

    /**
     * Open a hidden wrapper before admin notices render.
     *
     * Core relocates stray `.notice` elements to just after the first
     * `.wp-header-end`; printing that catcher inside the wrapper collects
     * them all in one hidden container.
     *
     * @since WEPOS_SINCE
     *
     * @return void
     */
    public function inject_before_notices() {
        if ( ! $this->mounted ) {
            return;
        }

        echo '<div class="wepos-notice-list-hide" id="wepos__notice-list">';
        echo '<div class="wp-header-end" id="wepos__notice-catcher"></div>';
    }

    /**
     * Close the wrapper opened in inject_before_notices().
     *
     * @since WEPOS_SINCE
     *
     * @return void
     */
    public function inject_after_notices() {
        if ( ! $this->mounted ) {
            return;
        }

        echo '</div>';
    }
}
