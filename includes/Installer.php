<?php
namespace WeDevs\WePOS;


defined( 'ABSPATH' ) || exit;

/**
 * Installer Class.
 *
 * @since 1.3.0
 *
 * @package wepos
 */
class Installer {

    /**
     * Run The Installer.
     *
     * @since 1.3.0
     *
     * @return void
     */
    public function run() {
        $this->add_version_info();
        $this->add_user_roles();
        $this->flush_rewrites();
        $this->schedule_cron_jobs();
    }

    /**
     * Add Version Info.
     *
     * @since 1.3.0
     *
     * @return void
     */
    private function add_version_info() {
        $installed = get_option( 'we_pos_installed' );

        if ( ! $installed ) {
            update_option( 'we_pos_installed', time() );
        }

        update_option( 'we_pos_version', WEPOS_VERSION );
    }

    /**
     * Add User Roles.
     *
     * @since 1.3.0
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
     * @since 1.3.0
     *
     * @return void
     */
    private function flush_rewrites() {
        set_transient( 'wepos-flush-rewrites', 1 );
    }

    /**
     * Schedule Cron Jobs.
     *
     * @since 1.3.0
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
