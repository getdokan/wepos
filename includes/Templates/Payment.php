<?php

namespace WeDevs\WePOS\Templates;

/**
 * POS pay-for-order iframe — wcpos-parity custom template.
 *
 * Flow:
 *  1. POS React modal opens an iframe at `?wepos_pay_for_order={id}`.
 *  2. We redirect to WC's standard `/checkout/order-pay/{id}/` URL with
 *     `wepos_iframe=1` so `WC_Form_Handler::pay_action` can handle the
 *     POST submission natively (works for every gateway out of the box).
 *  3. On the order-pay page (with iframe flag) we render our own minimal
 *     HTML template instead of the active theme's chrome — header, nav,
 *     footer all gone. Custom CSS hides #place_order; the parent triggers
 *     the click via postMessage so the cashier can drive checkout from the
 *     POS modal footer.
 *  4. On the order-received page (with iframe flag) we render a "Payment
 *     received" shell that postMessages the parent to advance to receipt.
 *  5. Admin can dequeue conflicting theme/plugin assets via a
 *     "Checkout Settings" troubleshooting modal saved per site.
 *
 * Settings option:
 *   wepos_pay_template_settings = [
 *     'disable_wp_head'    => bool,
 *     'disable_wp_footer'  => bool,
 *     'dequeue_styles'     => string[],
 *     'dequeue_scripts'    => string[],
 *   ]
 *
 * @since 2.1.0
 */
class Payment {

    const IFRAME_FLAG    = 'wepos_iframe';
    const SETTINGS_OPTION = 'wepos_pay_template_settings';

    /**
     * Bootstrap query var, redirect, template render, and url-marker plumbing.
     */
    public static function bootstrap() {
        add_filter( 'query_vars', [ __CLASS__, 'register_query_var' ] );
        add_action( 'template_redirect', [ __CLASS__, 'maybe_redirect_to_pay_page' ], 0 );

        // Render the custom iframe template *after* WC's pay_action ran (wp_loaded:20)
        // and *before* the theme takes over (template_redirect default 10).
        add_action( 'template_redirect', [ __CLASS__, 'maybe_render_iframe_template' ], 5 );

        // Persist troubleshooting form submissions early so the new
        // dequeue list applies to the same render that follows.
        add_action( 'init', [ __CLASS__, 'maybe_save_troubleshooting_form' ] );

        // Preserve the iframe marker across every WC redirect so the
        // thank-you page also renders inside our shell.
        add_filter( 'woocommerce_get_return_url', [ __CLASS__, 'append_iframe_flag' ] );
        add_filter( 'woocommerce_get_checkout_payment_url', [ __CLASS__, 'append_iframe_flag' ] );
        add_filter( 'woocommerce_get_checkout_order_received_url', [ __CLASS__, 'append_iframe_flag' ] );
        add_filter( 'wp_redirect', [ __CLASS__, 'append_iframe_flag_to_redirect' ] );
    }

    /**
     * Register `wepos_pay_for_order` query var.
     *
     * @param array $vars
     *
     * @return array
     */
    public static function register_query_var( $vars ) {
        $vars[] = 'wepos_pay_for_order';
        return $vars;
    }

    /**
     * Are we serving a request that originated inside the POS iframe?
     *
     * @return bool
     */
    public static function is_iframe_request() {
        return ! empty( $_GET[ self::IFRAME_FLAG ] ) || ! empty( $_POST[ self::IFRAME_FLAG ] );
    }

    /**
     * Append `wepos_iframe=1` to a URL so the marker survives redirects.
     *
     * @param string $url
     *
     * @return string
     */
    public static function append_iframe_flag( $url ) {
        if ( ! self::is_iframe_request() || ! is_string( $url ) || '' === $url ) {
            return $url;
        }

        if ( false !== strpos( $url, self::IFRAME_FLAG . '=' ) ) {
            return $url;
        }

        return add_query_arg( self::IFRAME_FLAG, '1', $url );
    }

    /**
     * Same as append_iframe_flag, but for raw `wp_redirect` calls (covers
     * gateway-specific redirects that bypass WC URL filters).
     *
     * @param string $location
     *
     * @return string
     */
    public static function append_iframe_flag_to_redirect( $location ) {
        if ( ! self::is_iframe_request() || ! is_string( $location ) || '' === $location ) {
            return $location;
        }

        // Only rewrite same-host redirects — never tag a hop to an external
        // gateway (Stripe, PayPal hosted) with our internal flag.
        $home_host    = wp_parse_url( home_url(), PHP_URL_HOST );
        $target_host  = wp_parse_url( $location, PHP_URL_HOST );

        if ( $target_host && $home_host && $target_host !== $home_host ) {
            return $location;
        }

        if ( false !== strpos( $location, self::IFRAME_FLAG . '=' ) ) {
            return $location;
        }

        return add_query_arg( self::IFRAME_FLAG, '1', $location );
    }

    /**
     * Stage 1 — `?wepos_pay_for_order={id}` redirects to standard WC pay URL.
     *
     * @return void
     */
    public static function maybe_redirect_to_pay_page() {
        $order_id = isset( $_GET['wepos_pay_for_order'] ) ? absint( $_GET['wepos_pay_for_order'] ) : 0;

        if ( ! $order_id ) {
            return;
        }

        if ( ! is_user_logged_in() || ! wepos_user_can_access_pos() ) {
            wp_die( esc_html__( 'You do not have permission to access this page.', 'wepos' ), 403 );
        }

        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            wp_die( esc_html__( 'Sorry, this order is invalid and cannot be paid for.', 'wepos' ) );
        }

        $url = $order->get_checkout_payment_url();

        // Force the iframe marker on the FIRST hop. After this point
        // append_iframe_flag* filters take over and propagate it through
        // every WC-driven redirect (pay → process → thank-you).
        $url = add_query_arg( self::IFRAME_FLAG, '1', $url );

        $gateway = isset( $_GET['gateway'] ) ? sanitize_key( wp_unslash( $_GET['gateway'] ) ) : '';
        if ( $gateway ) {
            $url = add_query_arg( 'wepos_gateway', $gateway, $url );
        }

        wp_safe_redirect( $url );
        exit;
    }

    /**
     * Stage 2 — render the custom iframe template on order-pay / order-received.
     *
     * @return void
     */
    public static function maybe_render_iframe_template() {
        if ( ! self::is_iframe_request() ) {
            return;
        }

        global $wp;

        if ( ! defined( 'WEPOS_PAY_FOR_ORDER_REQUEST' ) ) {
            define( 'WEPOS_PAY_FOR_ORDER_REQUEST', true );
        }

        if ( isset( $wp->query_vars['order-pay'] ) ) {
            self::render_pay_template( absint( $wp->query_vars['order-pay'] ) );
            exit;
        }

        if ( function_exists( 'is_order_received_page' ) && is_order_received_page() ) {
            $order_id = absint( $wp->query_vars['order-received'] ?? 0 );
            self::render_received_template( $order_id );
            exit;
        }
    }

    /**
     * Render the pay-for-order shell — wp_head/footer included so gateway
     * scripts (Stripe Elements etc.) load, but theme chrome is suppressed.
     *
     * @param int $order_id
     *
     * @return void
     */
    private static function render_pay_template( $order_id ) {
        $settings = self::get_template_settings();

        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            wp_die( esc_html__( 'Order not found.', 'wepos' ) );
        }

        // Required so payment_fields render in checkout context.
        if ( ! defined( 'WOOCOMMERCE_CHECKOUT' ) ) {
            define( 'WOOCOMMERCE_CHECKOUT', true );
        }

        add_filter( 'woocommerce_is_checkout', '__return_true' );
        add_filter( 'woocommerce_checkout_show_terms', '__return_false' );
        add_filter( 'show_admin_bar', '__return_false' );

        if ( ! empty( $settings['dequeue_styles'] ) || ! empty( $settings['dequeue_scripts'] ) ) {
            add_action( 'wp_enqueue_scripts', [ __CLASS__, 'dequeue_listed_assets' ], 100 );
        }

        // Reload gateways with the current customer in context.
        WC()->payment_gateways()->init();
        $available_gateways = WC()->payment_gateways()->get_available_payment_gateways();

        // Pre-select the gateway requested by the POS modal.
        $chosen = isset( $_GET['wepos_gateway'] ) ? sanitize_key( wp_unslash( $_GET['wepos_gateway'] ) ) : '';
        if ( $chosen && isset( $available_gateways[ $chosen ] ) ) {
            foreach ( $available_gateways as $id => $gateway ) {
                $gateway->chosen = ( $id === $chosen );
            }
        }

        $order_button_text = apply_filters( 'woocommerce_pay_order_button_text', __( 'Pay for order', 'wepos' ) );

        self::render_html_shell( $order, $available_gateways, $order_button_text, $settings );
    }

    /**
     * Render the actual HTML — own doctype, head, body. Mirrors wcpos.
     *
     * @param \WC_Order             $order
     * @param \WC_Payment_Gateway[] $available_gateways
     * @param string                $order_button_text
     * @param array                 $settings
     */
    private static function render_html_shell( $order, $available_gateways, $order_button_text, $settings ) {
        $disable_wp_head   = ! empty( $settings['disable_wp_head'] );
        $disable_wp_footer = ! empty( $settings['disable_wp_footer'] );
        $troubleshooting   = self::get_troubleshooting_form_html( $settings );

        ?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php
    if ( ! $disable_wp_head ) {
        wp_head();
    } elseif ( function_exists( 'wp_enqueue_block_template_skip_link' ) ) {
        wp_enqueue_block_template_skip_link();
    }
    ?>
    <style>
        html, body, ul, li, fieldset, address {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            margin: 0 !important;
            padding: 0 !important;
            color: #000 !important;
            background: #fff !important;
        }
        body { padding: 16px !important; }
        h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; font-weight: 600; line-height: 1.3; }
        h1 { font-size: 18px; margin-bottom: 15px; }
        h2 { font-size: 16px; margin-bottom: 12px; }
        #wpadminbar { display: none !important; }
        html { margin-top: 0 !important; padding-top: 0 !important; }
        .woocommerce { color: #000 !important; background: #fff !important; }
        .woocommerce-error,
        .woocommerce-info,
        .woocommerce-message {
            padding: 8px 12px;
            margin-bottom: 12px;
            border-radius: 3px;
        }
        .woocommerce-error { background: #f8d7da; color: #721c24; }
        .woocommerce-info { background: #d1ecf1; color: #0c5460; }
        .woocommerce-message { background: #d4edda; color: #155724; }
        .wc_payment_methods { padding: 0; margin: 0; list-style: none; }
        .wc_payment_methods li {
            border-top: 1px solid #ddd;
            margin-bottom: 10px;
            list-style: none;
        }
        .wc_payment_methods li label {
            display: inline-block;
            padding: 10px;
            cursor: pointer;
            margin-bottom: 0;
        }
        .wc_payment_methods li div.payment_box { display: none; padding: 10px; }
        .wc_payment_methods li input[type="radio"] {
            display: inline-block;
            margin-right: 10px;
            vertical-align: middle;
        }
        .wc_payment_methods li input[type="radio"] + label { display: inline-block; vertical-align: middle; }
        .wc_payment_methods li input[type="radio"]:checked + label { font-weight: bold; }
        .wc_payment_methods li input[type="radio"]:checked + label + div.payment_box {
            display: block;
            padding-left: 42px;
            background: #f7f7f7;
        }
        .wc_payment_methods li fieldset { border: none; }
        /* Hide the native WC submit — POS modal owns the action button. */
        #payment button#place_order { display: none; }
        .wepos-troubleshooting { text-align: right; margin-bottom: 12px; }
        .wepos-troubleshooting button {
            background: #007cba; border: none; color: #fff;
            padding: 8px 14px; border-radius: 3px; cursor: pointer;
        }
        .wepos-troubleshooting-modal {
            display: none; position: fixed; z-index: 1000;
            left: 0; top: 0; width: 100%; height: 100%;
            overflow: auto; background: rgba(0,0,0,0.4);
        }
        .wepos-troubleshooting-modal-content {
            background: #fff; margin: 2% auto; padding: 20px;
            border: 1px solid #888; width: 90%; max-height: 90%;
            overflow: auto; position: relative;
        }
        .wepos-close-troubleshooting {
            position: absolute; top: 5px; right: 12px;
            color: #aaa; font-size: 28px; font-weight: bold; cursor: pointer;
        }
        table.shop_table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 20px; }
        table.shop_table thead th { border-bottom: 2px solid #ddd; padding: 5px; text-align: left; font-weight: bold; }
        table.shop_table tbody td { border-bottom: 1px solid #ddd; padding: 5px; }
        table.shop_table tfoot th { padding: 5px; text-align: right; }
    </style>
    <script>
        // Parent (POS React app) sends 'wepos:process-payment' to trigger checkout.
        window.addEventListener('message', function (event) {
            if (event.data && event.data.type === 'wepos:process-payment') {
                var btn = document.getElementById('place_order');
                if (btn) {
                    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                }
            }
        }, false);

        // Notify parent each time the iframe loads, so the POS modal can
        // re-enable its Process button after navigation.
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'wepos:pay-frame-ready' }, '*');
            }
        } catch (e) {}
    </script>
</head>
<body <?php body_class( 'wepos-pay-iframe' ); ?>>
    <div class="woocommerce">
        <?php echo $troubleshooting; ?>
        <?php woocommerce_output_all_notices(); ?>

        <?php
        wc_get_template(
            'checkout/form-pay.php',
            [
                'order'              => $order,
                'available_gateways' => $available_gateways,
                'order_button_text'  => $order_button_text,
            ]
        );
        ?>
    </div>

    <?php
    if ( ! $disable_wp_footer ) {
        wp_footer();
    }
    ?>
</body>
</html>
        <?php
    }

    /**
     * Render success template — minimal "payment received" view that postMessages parent.
     *
     * @param int $order_id
     */
    private static function render_received_template( $order_id ) {
        ?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>" />
    <title><?php esc_html_e( 'Payment received', 'wepos' ); ?></title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 32px;
            text-align: center;
            color: #000;
            background: #fff;
        }
        .wepos-success {
            color: #16a34a;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="wepos-success"><?php esc_html_e( 'Payment received', 'wepos' ); ?></div>
    <div><?php esc_html_e( 'Returning to POS…', 'wepos' ); ?></div>
    <script>
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(
                    { type: 'wepos:payment_complete', orderId: <?php echo (int) $order_id; ?> },
                    '*'
                );
            }
        } catch (e) {}
    </script>
</body>
</html>
        <?php
    }

    /**
     * Build the troubleshooting modal markup. Mirrors wcpos's checkout-settings UI.
     *
     * @param array $settings
     *
     * @return string
     */
    private static function get_troubleshooting_form_html( $settings ) {
        global $wp_styles, $wp_scripts;

        $style_handles  = $wp_styles ? $wp_styles->queue : [];
        $script_handles = $wp_scripts ? $wp_scripts->queue : [];

        $dequeued_styles  = isset( $settings['dequeue_styles'] ) ? (array) $settings['dequeue_styles'] : [];
        $dequeued_scripts = isset( $settings['dequeue_scripts'] ) ? (array) $settings['dequeue_scripts'] : [];

        $all_styles  = array_unique( array_merge( $style_handles, $dequeued_styles ) );
        $all_scripts = array_unique( array_merge( $script_handles, $dequeued_scripts ) );

        $nonce = wp_create_nonce( 'wepos_pay_template_settings' );

        ob_start();
        ?>
        <div class="wepos-troubleshooting">
            <button type="button" class="wepos-open-troubleshooting"><?php esc_html_e( 'Checkout Settings', 'wepos' ); ?></button>
        </div>

        <div id="wepos-troubleshooting-modal" class="wepos-troubleshooting-modal">
            <div class="wepos-troubleshooting-modal-content">
                <span class="wepos-close-troubleshooting">&times;</span>
                <form method="post">
                    <p class="woocommerce-info"><?php esc_html_e( 'Scripts and styles may interfere with the POS payment template. Use this form to dequeue any problematic handles.', 'wepos' ); ?></p>

                    <h3><?php esc_html_e( 'Disable All Styles and Scripts', 'wepos' ); ?></h3>
                    <label><input type="checkbox" name="disable_wp_head" value="1" <?php checked( ! empty( $settings['disable_wp_head'] ) ); ?>> <?php esc_html_e( 'Disable wp_head', 'wepos' ); ?></label><br>
                    <label><input type="checkbox" name="disable_wp_footer" value="1" <?php checked( ! empty( $settings['disable_wp_footer'] ) ); ?>> <?php esc_html_e( 'Disable wp_footer', 'wepos' ); ?></label>

                    <div style="display:flex; gap:24px; margin-top:16px;">
                        <div style="flex:1;">
                            <h3><?php esc_html_e( 'Disable Selected Styles', 'wepos' ); ?></h3>
                            <?php foreach ( $all_styles as $handle ) :
                                // Checked = currently loaded (admin un-checks to dequeue).
                                $checked = ! in_array( $handle, $dequeued_styles, true );
                                ?>
                                <label><input type="checkbox" name="styles[]" value="<?php echo esc_attr( $handle ); ?>" <?php checked( $checked ); ?>> <?php echo esc_html( $handle ); ?></label><br>
                                <input type="hidden" name="all_styles[]" value="<?php echo esc_attr( $handle ); ?>">
                            <?php endforeach; ?>
                        </div>
                        <div style="flex:1;">
                            <h3><?php esc_html_e( 'Disable Selected Scripts', 'wepos' ); ?></h3>
                            <?php foreach ( $all_scripts as $handle ) :
                                $checked = ! in_array( $handle, $dequeued_scripts, true );
                                ?>
                                <label><input type="checkbox" name="scripts[]" value="<?php echo esc_attr( $handle ); ?>" <?php checked( $checked ); ?>> <?php echo esc_html( $handle ); ?></label><br>
                                <input type="hidden" name="all_scripts[]" value="<?php echo esc_attr( $handle ); ?>">
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <input type="hidden" name="<?php echo esc_attr( self::IFRAME_FLAG ); ?>" value="1" />
                    <input type="hidden" name="wepos_troubleshooting_nonce" value="<?php echo esc_attr( $nonce ); ?>" />

                    <p style="margin-top:16px;">
                        <button type="submit" name="wepos_save_pay_template_settings" value="1"><?php esc_html_e( 'Save', 'wepos' ); ?></button>
                    </p>
                </form>
            </div>
        </div>

        <script>
            (function () {
                var openBtn = document.querySelector('.wepos-open-troubleshooting');
                var modal   = document.getElementById('wepos-troubleshooting-modal');
                var closeEl = document.querySelector('.wepos-close-troubleshooting');
                if (!openBtn || !modal) return;
                openBtn.addEventListener('click', function () { modal.style.display = 'block'; });
                if (closeEl) closeEl.addEventListener('click', function () { modal.style.display = 'none'; });
                window.addEventListener('click', function (e) {
                    if (e.target === modal) modal.style.display = 'none';
                });
            }());
        </script>
        <?php
        return ob_get_clean();
    }

    /**
     * Persist the troubleshooting form on submit.
     */
    public static function maybe_save_troubleshooting_form() {
        if ( empty( $_POST['wepos_save_pay_template_settings'] ) ) {
            return;
        }

        $nonce = isset( $_POST['wepos_troubleshooting_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['wepos_troubleshooting_nonce'] ) ) : '';
        if ( ! wp_verify_nonce( $nonce, 'wepos_pay_template_settings' ) ) {
            return;
        }

        if ( ! current_user_can( 'manage_woocommerce' ) ) {
            return;
        }

        $all_styles      = isset( $_POST['all_styles'] ) && is_array( $_POST['all_styles'] ) ? array_map( 'sanitize_text_field', wp_unslash( $_POST['all_styles'] ) ) : [];
        $kept_styles     = isset( $_POST['styles'] ) && is_array( $_POST['styles'] ) ? array_map( 'sanitize_text_field', wp_unslash( $_POST['styles'] ) ) : [];
        $all_scripts     = isset( $_POST['all_scripts'] ) && is_array( $_POST['all_scripts'] ) ? array_map( 'sanitize_text_field', wp_unslash( $_POST['all_scripts'] ) ) : [];
        $kept_scripts    = isset( $_POST['scripts'] ) && is_array( $_POST['scripts'] ) ? array_map( 'sanitize_text_field', wp_unslash( $_POST['scripts'] ) ) : [];

        // Unchecked = should be dequeued.
        $dequeue_styles  = array_values( array_diff( $all_styles, $kept_styles ) );
        $dequeue_scripts = array_values( array_diff( $all_scripts, $kept_scripts ) );

        update_option( self::SETTINGS_OPTION, [
            'disable_wp_head'   => ! empty( $_POST['disable_wp_head'] ),
            'disable_wp_footer' => ! empty( $_POST['disable_wp_footer'] ),
            'dequeue_styles'    => $dequeue_styles,
            'dequeue_scripts'   => $dequeue_scripts,
        ] );

        // Redirect back to self (POST → GET) so the new settings load on next render.
        $url = remove_query_arg( [ 'wepos_save_pay_template_settings' ] );
        wp_safe_redirect( $url );
        exit;
    }

    /**
     * Load saved template settings, with safe defaults.
     *
     * @return array
     */
    public static function get_template_settings() {
        $defaults = [
            'disable_wp_head'   => false,
            'disable_wp_footer' => false,
            'dequeue_styles'    => [],
            'dequeue_scripts'   => [],
        ];

        $saved = get_option( self::SETTINGS_OPTION, [] );
        if ( ! is_array( $saved ) ) {
            $saved = [];
        }

        $merged = array_merge( $defaults, $saved );

        $merged['dequeue_styles']  = (array) apply_filters( 'wepos_pay_template_dequeue_styles', $merged['dequeue_styles'] );
        $merged['dequeue_scripts'] = (array) apply_filters( 'wepos_pay_template_dequeue_scripts', $merged['dequeue_scripts'] );

        return $merged;
    }

    /**
     * Strip the configured handles right before render.
     */
    public static function dequeue_listed_assets() {
        global $wp_styles, $wp_scripts;

        $settings = self::get_template_settings();

        if ( $wp_styles && ! empty( $settings['dequeue_styles'] ) ) {
            foreach ( $wp_styles->queue as $handle ) {
                if ( in_array( $handle, $settings['dequeue_styles'], true ) ) {
                    wp_dequeue_style( $handle );
                }
            }
        }

        if ( $wp_scripts && ! empty( $settings['dequeue_scripts'] ) ) {
            foreach ( $wp_scripts->queue as $handle ) {
                if ( in_array( $handle, $settings['dequeue_scripts'], true ) ) {
                    wp_dequeue_script( $handle );
                }
            }
        }
    }
}
