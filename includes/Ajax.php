<?php
namespace WeDevs\WePOS;

// Don't call the file directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajax Class.
 */
class Ajax {

    /**
     * Class constructor.
     *
     * @since WEPOS_LITE_SINCE
     */
    public function __construct() {
        add_filter( 'heartbeat_received', [ $this, 'heartbeat_received_data_handler' ], 10, 2 );
        add_filter( 'heartbeat_nopriv_received', [ $this, 'heartbeat_received_data_handler' ], 10, 2 );
    }

    /**
     * Receive Heartbeat data and respond.
     *
     * Processes data received via a Heartbeat request, and returns additional data to pass back to the front end.
     *
     * @param array $response Heartbeat response data to pass back to front end.
     * @param array $data     Data received from the front end (unslashed).
     *
     * @return array
     */
    public function heartbeat_received_data_handler( $response, $data ) {
        $counter_id = ! empty( $data['wepos_counter_id'] ) ? absint( wp_unslash( $data['wepos_counter_id'] ) ) : 0;

        if ( empty( $counter_id ) ) {
            return $response;
        }

        $response['product_logs']       = wepos()->products_log->get_product_logs( [ 'counter_id' => $counter_id ] );
        $response['heartbeat_interval'] = 15;

        return $response;
    }
}
