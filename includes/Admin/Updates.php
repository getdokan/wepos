<?php

namespace WeDevs\WePOS\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Wepos Update class
 *
 * Performas upgrade wepos latest version
 *
 * @since 2.1
 *
 * @package Wepos
 */
class Updates {

    /** @var array DB updates that need to be run */
    private static $updates = [
        '1.0.2' => 'upgrade-1.0.2.php',
        '1.0.4' => 'upgrade-1.0.4.php',
        '1.2.8' => 'upgrade-1.2.8.php',
        '1.3.0' => 'upgrade-1.3.0.php',
    ];

    /**
     * Constructor loader function
     *
     * Load autometically when class instantiate.
     *
     * @since 1.0
     */
    function __construct() {
        add_action( 'admin_notices', array( $this, 'show_update_notice' ) );
        add_action( 'admin_init', array( $this, 'do_updates' ) );
    }

    /**
     * Check if need any update
     *
     * @since 1.0
     *
     * @return boolean
     */
    public function is_needs_update() {
        $installed_version = get_option( 'we_pos_version' );

        // may be it's the first install
        if ( ! $installed_version ) {
            return false;
        }

        if ( version_compare( $installed_version, WEPOS_VERSION, '<' ) ) {
            return true;
        }

        return false;
    }

    /**
     * Show update notice
     *
     * @since 1.0
     *
     * @return void
     */
    public function show_update_notice() {
        if ( ! current_user_can( 'update_plugins' ) || ! $this->is_needs_update() ) {
            return;
        }

        $installed_version = get_option( 'we_pos_version' );
        $updates_versions  = array_keys( self::$updates );

        if ( ! is_null( $installed_version ) && version_compare( $installed_version, end( $updates_versions ), '<' ) ) {
            $url = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
            ?>
                <div id="message" class="updated">
                    <p><?php printf( '<strong>%s  &#8211; %s</strong>', esc_attr__( 'WePOS Data Update Required', 'wepos' ), esc_attr__( 'We need to update your install to the latest version', 'wepos' ) ); ?></p>
                    <p class="submit"><a href="<?php echo esc_url( add_query_arg( [ 'wepos_do_update' => true ], $url ) ); ?>" class="wepos-update-btn button-primary"><?php esc_attr_e( 'Run the updater', 'wepos' ); ?></a></p>
                </div>

                <script type="text/javascript">
                    jQuery('.wepos-update-btn').click('click', function(){
                        return confirm( '<?php esc_attr_e( 'It is strongly recommended that you backup your database before proceeding. Are you sure you wish to run the updater now?', 'wepos' ); ?>' );
                    });
                </script>
            <?php
        } else {
            update_option( 'we_pos_version', WEPOS_VERSION );
        }
    }


    /**
     * Do all updates when Run updater btn click
     *
     * @since 1.0
     *
     * @return void
     */
    public function do_updates() {
        if ( isset( $_GET['wepos_do_update'] ) && sanitize_text_field( wp_unslash( $_GET['wepos_do_update'] ) ) ) {
            $this->perform_updates();
        }
    }


    /**
     * Perform all updates
     *
     * @since 1.0
     *
     * @return void
     */
    public function perform_updates() {
        if ( ! $this->is_needs_update() ) {
            return;
        }

        $installed_version = get_option( 'we_pos_version' );

        foreach ( self::$updates as $version => $path ) {
            if ( version_compare( $installed_version, $version, '<' ) ) {
                include WEPOS_INCLUDES . '/admin/updates/' . $path;
                update_option( 'we_pos_version', $version );
            }
        }

        update_option( 'we_pos_version', WEPOS_VERSION );

        $url = wp_unslash( add_query_arg( [ 'page' => 'wepos' ], admin_url( 'admin.php' ) ) );
        $location = esc_url( $url ) . '#/settings';
        wp_redirect( $location );
        exit();
    }

}
