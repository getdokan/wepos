<?php
namespace WeDevs\WePOS;

// Don't call the file directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Products Log Class.
 */
class ProductsLog {

    /**
     * Table name for product logs.
     *
     * @var string
     *
     * @since WEPOS_LITE_SINCE
     */
    private $table_product_logs;

    /**
     * Table name for product log counters.
     *
     * @var string
     *
     * @since WEPOS_LITE_SINCE
     */
    private $table_product_log_counters;

    /**
     * Counter id.
     *
     * @var string
     *
     * @since WEPOS_LITE_SINCE
     */
    public $counter_id;

    /**
     * Class Constructor.
     *
     * @since WEPOS_LITE_SINCE
     */
    public function __construct() {
        global $wpdb;

        $cashier_data = wepos_get_cashier_data_by_user_id( get_current_user_id() );

        // Default counter number will be 1 if wePOS Pro not installed.
        $this->counter_id = isset( $cashier_data->counter_id ) ? $cashier_data->counter_id : 1;

        $this->table_product_logs         = "{$wpdb->prefix}wepos_product_logs";
        $this->table_product_log_counters = "{$wpdb->prefix}wepos_product_log_counters";

        add_action( 'woocommerce_new_product', [ $this, 'insert_product_log' ], 10, 2 );
        add_action( 'woocommerce_update_product', [ $this, 'insert_product_log' ], 10, 2 );
        add_action( 'wepos_rest_counter_deleted', [ $this, 'decrement_all_product_logs_counter_counts' ] );
    }

    /**
     * Get product logs.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param array $args
     *
     * @return bool|array|\WP_Error
     */
    public function get_product_logs( $args = [] ) {
        global $wpdb;

        if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'cashier' ) ) {
            return false;
        }

        $defaults = [
            'counter_id' => $this->counter_id,
        ];

        $args            = wp_parse_args( $args, $defaults );
        $where_condition = $this->generate_where_condition( $args );

        $product_logs_query = $wpdb->prepare(
            "SELECT * FROM {$this->table_product_logs}
            {$where_condition['clause']};",
            $where_condition['args']
        );

        return $wpdb->get_results( $product_logs_query );
    }

    /**
     * Get product logs count.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param array $args
     *
     * @return bool|int|\WP_Error
     */
    public function get_product_logs_count( $args = [] ) {
        global $wpdb;

        if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'cashier' ) ) {
            return 0;
        }

        if ( empty( $args ) ) {
            return 0;
        }

        $where_condition = $this->generate_where_condition( $args );

        $product_logs_query = $wpdb->prepare(
            "SELECT COUNT(id) FROM {$this->table_product_logs}
            {$where_condition['clause']}",
            $where_condition['args']
        );

        return $wpdb->get_var( $product_logs_query );
    }

    /**
     * Handle product logs data.
     *
     * @since  WEPOS_LITE_SINCE
     *
     * @param  array $args
     *
     * @return array $product_logs_status
     */
    public function handle_product_logs_data( $args = [] ) {
        $product_logs_status = [
            'counter_inserted'       => false,
            'counter_counts_updated' => false,
            'logs_deleted'           => false,
        ];

        if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'cashier' ) ) {
            return $product_logs_status;
        }

        $product_logs = $this->get_product_logs();

        if ( empty( $product_logs ) ) {
            return $product_logs_status;
        }

        foreach( $product_logs as $product_log ) {
            $product_log_ids[] = $product_log->id;
        }

        $args['product_log_ids'] = $product_log_ids;


        if ( empty( $args['product_log_ids'] ) ) {
            return $product_logs_status;
        }

        $product_logs_status = [
            'counter_inserted'       => $this->insert_product_log_counters( $args ),
            'counter_counts_updated' => $this->increment_product_log_counter_counts( $args ),
            'logs_deleted'           => $this->delete_product_logs_by_checking_counter_count(),
        ];

        return $product_logs_status;
    }

    /**
     * Insert product log.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param int    $product_id
     * @param object $product
     *
     * @return void|\WP_Error
     */
    public function insert_product_log( $product_id, $product ) {
        global $wpdb;

        if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'cashier' ) ) {
            return false;
        }

        // Delete existing log for this product, if had any.
        $this->delete_product_log( [ 'product_id' => $product_id ] );

        $log_data = [
            'product_id'     => $product_id,
            'product_title'  => $product->get_title(),
            'product_type'   => $product->get_type(),
            'product_sku'    => $product->get_sku(),
            'product_price'  => $product->get_price(),
            'product_stock'  => $product->get_stock_quantity(),
            'counter_counts' => 0,
        ];

        $log_inserted = $wpdb->insert(
            $this->table_product_logs,
            $log_data,
            [
                '%d',
                '%s',
                '%s',
                '%s',
                '%f',
                '%d',
                '%d',
            ]
        );

        if ( ! $log_inserted ) {
            return new \WP_Error( 'failed-to-insert', __( 'Failed to insert product log data', 'wepos' ) );
        }
    }

    /**
     * Insert product log counter.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param int $product_log_id
     *
     * @return int|\WP_Error
     */
    public function insert_product_log_counter( $args = [] ) {
        global $wpdb;

        if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'cashier' ) ) {
            return 0;
        }

        if ( empty( $args['product_log_id'] ) ) {
            return 0;
        }

        $counter_data = [
            'product_log_id' => $args['product_log_id'],
            'counter_id'     => $this->counter_id,
        ];

        $counter_inserted = $wpdb->insert(
            $this->table_product_log_counters,
            $counter_data,
            [
                '%d',
                '%d',
            ]
        );

        if ( ! $counter_inserted ) {
            return new \WP_Error( 'failed-to-insert', __( 'Failed to insert product counter data', 'wepos' ) );
        }

        return $wpdb->insert_id;
    }

    /**
     * Insert product log counters.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param int $product_log_ids
     *
     * @return bool|int|\WP_Error
     */
    public function insert_product_log_counters( $args = [] ) {
        global $wpdb;

        if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'cashier' ) ) {
            return 0;
        }

        if ( empty( $args['product_log_ids'] ) ) {
            return 0;
        }

        $values = $this->generate_values_for_product_logs( $args );

        return $wpdb->query(
            $wpdb->prepare(
                "INSERT INTO {$this->table_product_log_counters}
                (product_log_id, counter_id)
                {$values['clause']};",
                $values['args']
            )
        );
    }

    /**
     * Increment product log counter count.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param int $product_log_id
     *
     * @return bool|\WP_Error
     */
    public function increment_product_log_counter_count( $args = [] ) {
        global $wpdb;

        if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'cashier' ) ) {
            return false;
        }

        if ( empty( $args['product_log_id'] ) ) {
            return false;
        }

        $count_updated = $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$this->table_product_logs} SET counter_counts = counter_counts + 1 WHERE id = %d",
                $args['product_log_id']
            )
        );

        if ( ! $count_updated ) {
            return new \WP_Error( 'failed-to-update', __( 'Failed to update product log counter count', 'wepos' ) );
        }

        return true;
    }

    /**
     * Increment product log counter counts.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param array $product_log_ids
     *
     * @return bool|int|\WP_Error
     */
    public function increment_product_log_counter_counts( $args = [] ) {
        global $wpdb;

        if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'cashier' ) ) {
            return false;
        }

        if ( empty( $args['product_log_ids'] ) ) {
            return false;
        }

        $where_condition = $this->generate_where_condition( $args );

        return $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$this->table_product_logs}
                SET counter_counts = counter_counts + 1
                {$where_condition['clause']};",
                $where_condition['args']
            )
        );
    }

    /**
     * Decrement all product logs counter counts.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param array $product_log_ids
     *
     * @return bool|int|\WP_Error
     */
    public function decrement_all_product_logs_counter_counts() {
        global $wpdb;

        if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'cashier' ) ) {
            return false;
        }

        return $wpdb->query(
            "UPDATE {$this->table_product_logs}
            SET counter_counts = counter_counts - 1
            WHERE counter_counts > 0;"
        );
    }

    /**
     * Delete product log.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param int $product_id
     *
     * @return bool|\WP_Error
     */
    public function delete_product_log( $args = [] ) {
        global $wpdb;

        if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'cashier' ) ) {
            return false;
        }

        $where_condition = $this->generate_where_condition( $args );

        $log_deleted = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$this->table_product_logs}
                {$where_condition['clause']}",
                $where_condition['args']
            )
        );

        if ( ! $log_deleted ) {
            return new \WP_Error( 'failed-to-delete', __( 'Failed to delete product log data', 'wepos' ) );
        }

        return true;
    }

    /**
     * Delete product logs by checking counter count.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @return void
     */
    public function delete_product_logs_by_checking_counter_count() {
        $counter_count = wepos_get_counters( [ 'count' => true ] );

        return $this->delete_product_log( [
            'counter_counts' => $counter_count['total_count']
        ] );
    }

    /**
     * Generate values for product logs.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param array $product_logs
     *
     * @return bool|array
     */
    public function generate_values_for_product_logs( $args = [] ) {
        if ( empty( $args['product_log_ids'] ) ) {
            return false;
        }

        $values['clause'] = "VALUES ";
        $values['args']   = [];

        foreach( $args['product_log_ids'] as $log_id_key => $log_id ) {
            $values['clause'] .= "( %d, %d )";

            if ( $log_id_key !== ( count( $args['product_log_ids'] ) - 1 ) ) {
                $values['clause'] .= ", ";
            }

            $values['args'][] = $log_id;
            $values['args'][] = $this->counter_id;
        }

        return $values;
    }

    /**
     * Generate where condition.
     *
     * @since WEPOS_LITE_SINCE
     *
     * @param array $args
     *
     * @return array $where_condition
     */
    public function generate_where_condition( $args ) {
        $where_condition['clause'] = ' WHERE %d = %d';
        $where_condition['args']   = [ 1, 1 ];

        if ( ! empty( $args['counter_counts'] ) ) {
            $where_condition['clause'] .= " AND counter_counts >= %d";
            $where_condition['args'][] = $args['counter_counts'];
        }

        if ( ! empty( $args['product_id'] ) ) {
            $where_condition['clause'] .= " AND product_id = %d";
            $where_condition['args'][] = $args['product_id'];
        }

        if ( ! empty( $args['product_log_ids'] ) ) {
            $where_condition['clause'] .= ' AND id IN ( ';

            foreach( $args['product_log_ids'] as $log_id_key => $log_id ) {
                $where_condition['args'][] = $log_id;
                $where_condition['clause'] .= '%d ';

                if ( $log_id_key !== ( count( $args['product_log_ids'] ) - 1 ) ) {
                    $where_condition['clause'] .= ',';
                }
            }

            $where_condition['clause'] .= ' )';
        } elseif ( ! empty( $args['counter_id'] ) ) {
            $where_condition['clause'] .= " AND id NOT IN( SELECT product_log_id FROM {$this->table_product_log_counters} WHERE counter_id = %d)";
            $where_condition['args'][] = $args['counter_id'];
        }

        return $where_condition;
    }
}
