<?php

/**
 * Run Updates to Schedule Cron Jobs.
 *
 * @since WEPOS_SINCE
 *
 * @return void
 */
function wepos_1_2_8_updates() {
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

wepos_1_2_8_updates();
