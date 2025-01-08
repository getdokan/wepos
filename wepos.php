<?php
/*
Plugin Name: wePOS - Point Of Sale (POS) for WooCommerce
Plugin URI: https://wedevs.com/wepos
Description: A beautiful and fast Point of Sale (POS) system for WooCommerce
Version: 1.2.8
Author: weDevs
Author URI: https://wedevs.com/
Text Domain: wepos
Domain Path: /languages
WC requires at least: 5.0.0
WC tested up to: 8.9.2
License: GPL2
License URI: https://www.gnu.org/licenses/gpl-2.0.html
*/

/**
 * Copyright (c) YEAR weDevs (email: info@wedevs.com). All rights reserved.
 *
 * Released under the GPL license
 * http://www.opensource.org/licenses/gpl-license.php
 *
 * This is an add-on for WordPress
 * http://wordpress.org/
 *
 * **********************************************************************
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 * **********************************************************************
 */

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * WePOS class
 *
 * @class WePOS The class that holds the entire WePOS plugin
 */
final class WePOS {

    /**
     * Plugin version
     *
     * @var string
     */
    public $version = '1.2.8';

    /**
     * Holds various class instances
     *
     * @var array
     */
    private $container = [];

    /**
     * Constructor for the WePOS class
     *
     * Sets up all the appropriate hooks and actions
     * within our plugin.
     */
    public function __construct() {
        require_once __DIR__ . '/vendor/autoload.php';

        $this->define_constants();
        $this->includes();

        register_activation_hook( __FILE__, [ $this, 'activate' ] );
        register_deactivation_hook( __FILE__, [ $this, 'deactivate' ] );

        add_action( 'init', [ $this, 'add_rewrite_rules' ] );
        add_filter( 'query_vars', [ $this, 'register_query_var' ] );

        add_action( 'plugins_loaded', [ $this, 'woocommerce_not_loaded' ], 11 );

        // Admin notice for WooCommerce dependency
        add_action( 'admin_notices', [ $this, 'render_woocommerce_dependency_notice' ] );

        add_action( 'woocommerce_loaded', [ $this, 'init_plugin' ] );
        add_action( 'woocommerce_init', [ $this, 'on_wc_init' ] );


        // Handle Appsero tracker
        $this->appsero_init_tracker_wepos();
    }

    /**
     * Missing WooCommerce notice
     *
     * @since 1.1.9
     *
     * @return void
     */
    public function render_woocommerce_dependency_notice() {
        // Check wooCommerce is available and active
        $has_woocommerce = $this->has_woocommerce();

        if ( $has_woocommerce ) {
            return;
        }

        // Check if woocommerce installed
        $woocommerce_installed = $this->is_woocommerce_installed();

        if (  current_user_can( 'activate_plugins' ) ) {
            require_once WEPOS_PATH . '/templates/woocommerce-dependency-notice.php';
        }
    }

    /**
     * Handles scenarios when WooCommerce is not active
     *
     * @since 1.1.9
     *
     * @return void
     */
    public function woocommerce_not_loaded() {
        if ( did_action( 'woocommerce_loaded' ) || ! is_admin() ) {
            return;
        }
    }

    /**
     * Check whether woocommerce is installed and active
     *
     * @since 1.1.9
     *
     * @return bool
     */
    public function has_woocommerce() {
        return class_exists( 'WooCommerce' );
    }

    /**
     * Check whether woocommerce is installed
     *
     * @since 1.1.9
     *
     * @return bool
     */
    public function is_woocommerce_installed() {
        return in_array( 'woocommerce/woocommerce.php', array_keys( get_plugins() ), true );
    }

    /**
     * Get the template path.
     *
     * @since 1.1.9
     *
     * @return string
     */
    public function template_path() {
        return apply_filters( 'wepos_template_path', 'wepos/' );
    }

    /**
     * Add the required rewrite rules
     *
     * @return void
     */
    public function add_rewrite_rules()  {
        add_rewrite_rule( '^wepos/?$', 'index.php?wepos=true', 'top' );

        if ( get_transient( 'wepos-flush-rewrites' ) ) {
            flush_rewrite_rules( true );
            delete_transient( 'wepos-flush-rewrites' );
        }
    }

    /**
     * Register our query vars
     *
     * @param  array $vars
     *
     * @return array
     */
    public function register_query_var( $vars ) {
        $vars[] = 'wepos';

        return $vars;
    }

    /**
     * Initializes the WePOS() class
     *
     * Checks for an existing WePOS() instance
     * and if it doesn't find one, creates it.
     *
     * @return \WePOS
     */
    public static function init() {
        static $instance = false;

        if ( ! $instance ) {
            $instance = new WePOS();
        }

        return $instance;
    }

    /**
     * Magic getter to bypass referencing plugin.
     *
     * @param $prop
     *
     * @return mixed
     */
    public function __get( $prop ) {
        if ( array_key_exists( $prop, $this->container ) ) {
            return $this->container[ $prop ];
        }

        return $this->{$prop};
    }

    /**
     * Magic isset to bypass referencing plugin.
     *
     * @param $prop
     *
     * @return mixed
     */
    public function __isset( $prop ) {
        return isset( $this->{$prop} ) || isset( $this->container[ $prop ] );
    }

    /**
     * Define the constants
     *
     * @return void
     */
    public function define_constants() {
        define( 'WEPOS_VERSION', $this->version );
        define( 'WEPOS_FILE', __FILE__ );
        define( 'WEPOS_PATH', dirname( WEPOS_FILE ) );
        define( 'WEPOS_INCLUDES', WEPOS_PATH . '/includes' );
        define( 'WEPOS_URL', plugins_url( '', WEPOS_FILE ) );
        define( 'WEPOS_ASSETS', WEPOS_URL . '/assets' );
    }

    /**
     * Load the plugin after all plugins are loaded
     *
     * @return void
     */
    public function init_plugin() {
        $this->init_hooks();

        do_action( 'wepos_loaded' );
    }

    /**
     * Placeholder for activation function
     *
     * Nothing being called here yet.
     *
     * @return void
     */
    public function activate() {
        $installer = new WeDevs\WePOS\Installer();

        $installer->run();
    }

    /**
     * Placeholder for deactivation function
     *
     * Nothing being called here yet.
     *
     * @return void
     */
    public function deactivate() {
        $users_query = new WP_User_Query( [
            'role__in' => [ 'seller', 'vendor_staff' ]
        ] );
        $users = $users_query->get_results();

        if ( count( $users ) > 0 ) {
            foreach ( $users as $user ) {
                $user->remove_cap( 'publish_shop_orders' );
                $user->remove_cap( 'list_users' );
            }
        }
    }

    /**
     * Include the required files
     *
     * @return void
     */
    public function includes() {
        require_once WEPOS_INCLUDES . '/functions.php';
    }

    /**
     * Initialize the hooks
     *
     * @return void
     */
    public function init_hooks() {
        add_action( 'init', [ $this, 'init_classes' ] );
        add_action( 'init', [ $this, 'localization_setup' ] );
    }

    /**
     * Instantiate the required classes
     *
     * @return void
     */
    public function init_classes() {
        if ( is_admin() ) {
            $this->container['admin']    = new WeDevs\WePOS\Admin\Admin();
            $this->container['settings'] = new WeDevs\WePOS\Admin\Settings();

            new WeDevs\WePOS\Admin\Products();
            new WeDevs\WePOS\Admin\Updates();
            new WeDevs\WePOS\Admin\LimitedTimePromotion();
            new WeDevs\WePOS\Admin\Discounts();
        } else {
            $this->container['frontend'] = new WeDevs\WePOS\Frontend();
        }

        if ( class_exists( 'WeDevs_Dokan' ) ) {
            $this->container['dokan'] = new WeDevs\WePOS\Dokan();
        }

        $this->container['common'] = new WeDevs\WePOS\Common();
        $this->container['rest']   = new WeDevs\WePOS\REST\Manager();
        $this->container['assets'] = new WeDevs\WePOS\Assets();

        // Payment gateway manager
        $this->container['gateways'] = new \WeDevs\WePOS\Gateways\Manager();
    }

    /**
     * Initialize plugin for localization
     *
     * @uses load_plugin_textdomain()
     */
    public function localization_setup() {
        load_plugin_textdomain( 'wepos', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );
    }

    /**
     * On WC init, include cart required files in REST request
     *
     * @since 1.0.5
     *
     * @return void
     */
    public function on_wc_init() {
        if ( wc()->is_rest_api_request() ) {
            $namespace = '/wepos/v1/';

            $rest_bases = [
                'products',
            ];

            foreach ( $rest_bases as $rest_base ) {
                $endpoint = $namespace . $rest_base;

                if ( strpos( $_SERVER['REQUEST_URI'], $endpoint ) ) {
                    $this->include_wc_files();
                    break;
                }
            }
        }
    }

    /**
     * Initialize the plugin tracker
     *
     * @return void
     */
    public function appsero_init_tracker_wepos() {
        if ( ! class_exists( 'WeDevs\WePOS\Dependencies\Appsero\Client' ) ) {
            return;
        }

        $client = new WeDevs\WePOS\Dependencies\Appsero\Client( '48fa1273-3e91-4cd6-9c07-d18ad6bc2f54', 'wePos', __FILE__ );

        // Active insights
        $client->insights()
            ->add_extra( function () {
                $products = wc_get_products( [ 'fields' => 'ids', 'paginate' => true ] );
                $orders   = wc_get_orders( [ 'fields' => 'ids', 'paginate' => true ] );

                return [
                    'products' => $products->total,
                    'orders'   => $orders->total
               ];
           } )
           ->init();
    }

    /**
     * Include cart required files in REST request
     *
     * @since 1.0.5
     *
     * @return void
     */
    public function include_wc_files() {
        if ( ! wc()->cart ) {
            include_once WC_ABSPATH . 'includes/wc-cart-functions.php';
            include_once WC_ABSPATH . 'includes/wc-notice-functions.php';
            include_once WC_ABSPATH . 'includes/class-wc-cart.php';
            include_once WC_ABSPATH . 'includes/class-wc-tax.php';
            include_once WC_ABSPATH . 'includes/class-wc-shipping-zones.php';
            include_once WC_ABSPATH . 'includes/class-wc-customer.php';
            include_once WC_ABSPATH . 'includes/class-wc-session-handler.php';

            // Session class, handles session data for users - can be overwritten if custom handler is needed.
            $session_class = apply_filters( 'woocommerce_session_handler', 'WC_Session_Handler' );
            wc()->session  = new $session_class();
            wc()->session->init();

            wc()->customer = new WC_Customer( get_current_user_id(), true );
            // Cart needs the customer info.
            wc()->cart = new WC_Cart();

            // Customer should be saved during shutdown.
            add_action( 'shutdown', [ wc()->customer, 'save' ], 10 );
        }
    }
} // WePOS

function wepos() {
    return WePOS::init();
}

// Kick off plugin
wepos();
