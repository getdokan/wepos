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

        $hook = add_menu_page( __( 'WePOS', 'wepos' ), __( 'WePOS', 'wepos' ), $capability, $slug, [ $this, 'plugin_page' ], 'data:image/svg+xml;base64,' . base64_encode( '<svg width="80px" height="56px" viewBox="0 0 80 56" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Artboard" transform="translate(-67.000000, -84.000000)" fill="#BDC3C7"><g id="wePos-Icon" transform="translate(67.000000, 84.000000)"><path d="M57.3887029,47.0519939 C57.3929959,47.0561924 57.3972944,47.0603865 57.4015986,47.0645761 C57.1607079,48.6472574 57.4263388,50.2340423 58.1183697,51.6193085 C58.0164185,51.8752305 57.9279623,52.1371399 57.8537631,52.4038959 L42.2130469,55.7721161 C40.8168184,56.0727013 39.3730017,56.0759928 37.9754586,55.7815958 L9.39254061,49.7600182 C8.87958668,49.6520551 8.50781997,49.2051931 8.49414821,48.6802553 L8.00038734,29.5926376 C7.98487515,28.9939689 8.4370949,28.4866739 9.03260523,28.4342723 L33.3120738,26.297524 C33.7331377,26.2605269 34.0984629,25.991409 34.2595005,25.6001085 L37.9172221,16.7032885 C38.3891608,15.5551928 40.0953702,15.8933017 40.0953702,17.134746 L40.0953702,50.3389376 L57.3887029,47.0519939 Z" id="Combined-Shape"></path><path d="M7.72983363,6.32763208 L0.108465183,22.4087248 C-0.263937513,23.1945677 0.37330241,24.0812696 1.24763346,23.9940402 L29.8696473,21.1392264 C30.2741355,21.0988568 30.62563,20.8475532 30.7905287,20.4807227 L40,0 L8.55077644,5.70209904 C8.19086606,5.76739124 7.88500142,6.00039224 7.72983363,6.32763208 Z" id="Path"></path><path d="M77.6258139,17.4557122 C75.6707756,14.8800882 72.7457877,13.0568768 69.3427908,12.5575102 L52.741635,10.1002944 C50.1854545,9.72440913 47.5277507,10.4169354 45.5020349,12.0455494 L40,2.30926389e-13 L71.7150663,5.69210125 C72.0763257,5.75701686 72.3824866,5.99413376 72.5347873,6.32700442 L77.6258139,17.4557122 Z M79.9423617,22.5348784 C79.9739875,22.6291132 79.9920774,22.7239915 79.9979052,22.8177024 C79.9804438,22.7230832 79.9619253,22.6288039 79.9423617,22.5348784 Z" id="Combined-Shape"></path><path d="M78.5540081,53.3608855 L77.8583953,53.3608855 C77.4069201,53.3608855 77.0092988,52.8229087 76.8674836,52.4016124 L69.8601941,31.4151744 C72.4272298,30.4532292 74.2079986,27.939702 74.2079986,25.1197775 C74.2079986,21.8153176 71.7675196,18.9775792 68.4716611,18.4939345 L51.8631195,16.0356301 C50.9242666,15.8975732 49.9118133,16.1638895 49.1919662,16.7793563 C48.4739143,17.3948231 48,18.2819503 48,19.2234096 L48,30.890558 C48,31.8320174 48.4739143,32.7271608 49.1919662,33.3426276 C49.9118133,33.9572037 50.8937494,34.2324269 51.8326023,34.09437 L59.7652812,32.9293475 C59.7652812,32.9293475 61.5972113,38.5166459 61.57926,38.5264435 C61.7013288,39.0002905 61.6941483,39.5088745 61.5334841,40.0005354 L61.1762533,41.0916307 C60.9518621,41.7783527 61.2004876,42.5202974 61.7946755,42.9371404 L62.7478895,43.6069393 C63.5916006,44.1983574 64.0017877,45.1986023 63.8483041,46.1899403 C63.8483041,46.1988472 63.8447139,46.2068634 63.8411236,46.2130982 C63.8222747,46.3342321 63.7989381,46.4544752 63.7594452,46.5702649 L63.3447702,47.9009558 C63.2235989,48.5271108 63.4749171,49.167517 64.0089682,49.5442788 L64.9621822,50.213187 C65.8382056,50.7823379 66.0006648,51.4939993 66.0006648,51.4939993 C66.1074751,51.8101942 66.0616993,52.158454 65.8651325,52.4283331 C65.6685658,52.6991028 65.3580083,52.8576457 65.0223191,52.8576457 C64.2207936,52.8576457 63.5763419,53.6343273 63.5763419,54.4288228 C63.5763419,55.224209 64.2270765,56 65.0259093,56 L67.4412566,56 L78.0684254,56 L78.5504178,56 C79.3519433,56 79.9999852,55.4744929 79.9999852,54.6817788 C80.0035755,53.8863926 79.3537384,53.3608855 78.5540081,53.3608855 Z" id="Combined-Shape-Copy-2"></path></g></g></g></svg>' ), 59 );

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
