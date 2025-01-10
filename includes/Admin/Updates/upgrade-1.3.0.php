<?php

/**
 * Updater function for wePOS v1.3.0.
 *
 * @since WEPOS_LITE_SINCE
 *
 * @return void
 */
function wepos_1_3_0_updates() {
    wepos_create_product_log_tables();
}

/**
 * Create product log database tables.
 *
 * @since WEPOS_LITE_SINCE
 *
 * @return void
 */
function wepos_create_product_log_tables() {
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

    // Include 'upgrade.php' if not included earlier.
    if ( ! function_exists( 'dbDelta' ) ) {
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    }

    // Create tables through looping.
    foreach ( $tables as $key => $table ) {
        dbDelta( $table );
    }
}

wepos_1_3_0_updates();
