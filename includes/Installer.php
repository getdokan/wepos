<?php

namespace WeDevs\WePOS;

defined( 'ABSPATH' ) || exit;

/**
 * Installer Class.
 *
 * @since WEPOS_SINCE
 *
 * @package wepos
 */
class Installer {

    /**
     * Run The Installer.
     *
     * @since WEPOS_SINCE
     *
     * @return void
     */
    public function run() {
        $this->add_installation_data();
        $this->add_user_roles();
        $this->flush_rewrites();
        $this->create_tables();
        $this->schedule_cron_jobs();
    }

    /**
     * Add installation data.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @return void
     */
    public function add_installation_data() {
        $installed = get_option( 'we_pos_installed' );

        if ( ! $installed ) {
            update_option( 'we_pos_installed', time() );
        }

        update_option( 'we_pos_version', WEPOS_VERSION );
    }

    /**
     * Add User Roles.
     *
     * @since WEPOS_SINCE
     *
     * @return void
     */
    private function add_user_roles() {
        if ( function_exists( 'dokan' ) ) {
            $users_query = new \WP_User_Query( [
                'role__in' => [ 'seller', 'vendor_staff' ],
            ] );
            $users       = $users_query->get_results();

            if ( count( $users ) > 0 ) {
                foreach ( $users as $user ) {
                    $user->add_cap( 'publish_shop_orders' );
                    $user->add_cap( 'list_users' );
                }
            }
        }
    }

    /**
     * Flush Rewrites.
     *
     * @since WEPOS_SINCE
     *
     * @return void
     */
    private function flush_rewrites() {
        set_transient( 'wepos-flush-rewrites', 1 );
    }

    /**
     * Create database tables.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @return void
     */
    public function create_tables() {
        global $wpdb;

        include_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $collate = $wpdb->get_charset_collate();
        $tables  = [
            "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}wepos_product_logs` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `product_id` bigint unsigned NOT NULL,
                `product_title` text(255) NOT NULL,
                `product_type` varchar(100) NOT NULL,
                `product_sku` varchar(100) NULL,
                `product_price` decimal (19,
                4) NOT NULL DEFAULT 0.0000,
            `product_stock` bigint signed NULL,
            `counter_counts` bigint unsigned NULL DEFAULT 0,
            PRIMARY KEY (`id`)
            ) ENGINE=InnoDB AUTO_INCREMENT=1 {$collate};",

            "CREATE TABLE IF NOT EXISTS `{$wpdb->prefix}wepos_product_log_counters` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `product_log_id` bigint unsigned NOT NULL,
                `counter_id` bigint unsigned NOT NULL,
                PRIMARY KEY (`id`),
            FOREIGN KEY (product_log_id) REFERENCES {$wpdb->prefix}wepos_product_logs (id) ON DELETE CASCADE
            ) ENGINE=InnoDB AUTO_INCREMENT=1 {$collate};",
        ];

        foreach ( $tables as $key => $table ) {
            dbDelta( $table );
        }
    }

    /**
     * Schedule Cron Jobs.
     *
     * @since WEPOS_SINCE
     *
     * @return void
     */
    private function schedule_cron_jobs() {
        if ( ! function_exists( 'WC' ) || ! WC()->queue() ) {
            return;
        }

        // Schedule daily cron job.
        $hook = 'wepos_daily_midnight_cron';

        // Check if we've defined the cron hook.
        $cron_schedule = as_next_scheduled_action( $hook ); // This method will return false if the hook is not scheduled
        if ( ! $cron_schedule ) {
            as_unschedule_all_actions( $hook );
        }

        // Schedule recurring cron action.
        $now = wepos_current_datetime()->modify( 'midnight' )->getTimestamp();
        WC()->queue()->schedule_cron( $now, '0 0 * * *', $hook, [], 'dokan' );
    }
}
