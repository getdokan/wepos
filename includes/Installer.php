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
     * Capability schema option key.
     *
     * Tracks whether the default role capabilities have been synced for
     * the current plugin version. This is separate from we_pos_version so
     * safe capability backfills do not interfere with manual data updaters.
     *
     * @since 1.4.0
     *
     * @var string
     */
    const CAPABILITIES_VERSION_OPTION = 'wepos_capabilities_version';

    /**
     * Cap-schema revision. Bump whenever default role capabilities change
     * so existing installs backfill the new caps even when WEPOS_VERSION
     * has not bumped (e.g. zip overwrite during dev).
     *
     * Revision history:
     *  1 — initial section caps + page caps for admin/shop_manager/editor/cashier.
     *  2 — added section view/edit caps to seller and vendor_staff roles.
     *
     * @since 1.5.0
     *
     * @var int
     */
    const CAPABILITIES_SCHEMA_REVISION = 3;

    /**
     * Option key tracking the most recent cap-schema revision applied.
     *
     * @since 1.5.0
     *
     * @var string
     */
    const CAPABILITIES_REVISION_OPTION = 'wepos_capabilities_revision';

    /**
     * Run The Installer.
     *
     * @since 1.3.0
     *
     * @return void
     */
    public function run() {
        $this->add_version_info();
        $this->set_default_layout_style();
        $this->maybe_sync_capabilities();
        $this->add_user_roles();
        $this->flush_rewrites();
        $this->schedule_cron_jobs();
    }

    /**
     * Sync default role capabilities when needed.
     *
     * This runs safely on activation and on normal plugin loads after a manual
     * file update (for example, replacing the plugin directory via unzip).
     * Only missing capabilities are added, so explicit role-level denies
     * created from the Access settings are preserved.
     *
     * @since 1.4.0
     *
     * @return void
     */
    public function maybe_sync_capabilities() {
        $stored_version  = get_option( self::CAPABILITIES_VERSION_OPTION );
        $stored_revision = (int) get_option( self::CAPABILITIES_REVISION_OPTION, 0 );

        $version_synced  = $stored_version
            && version_compare( $stored_version, WEPOS_VERSION, '>=' );
        $revision_synced = $stored_revision >= self::CAPABILITIES_SCHEMA_REVISION;

        if ( $version_synced && $revision_synced ) {
            return;
        }

        $this->add_wepos_capabilities();

        update_option( self::CAPABILITIES_VERSION_OPTION, WEPOS_VERSION );
        update_option( self::CAPABILITIES_REVISION_OPTION, self::CAPABILITIES_SCHEMA_REVISION );
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
     * Set default POS layout style to React UI.
     *
     * On first install or plugin activation, set the layout to 'latest' (React UI)
     * so new users get the React UI by default. Users can switch back via settings.
     *
     * @since 1.3.3
     *
     * @return void
     */
    private function set_default_layout_style() {
        $options = get_option( 'wepos_appearance', [] );

        // Carry over any legacy value previously stored under wepos_general.
        if ( empty( $options['pos_layout_style'] ) ) {
            $legacy = get_option( 'wepos_general', [] );
            if ( ! empty( $legacy['pos_layout_style'] ) ) {
                $options['pos_layout_style'] = $legacy['pos_layout_style'];
                unset( $legacy['pos_layout_style'] );
                update_option( 'wepos_general', $legacy );
            }
        }

        if ( empty( $options['pos_layout_style'] ) ) {
            $options['pos_layout_style'] = 'latest';
        }

        if ( empty( $options['admin_ui_style'] ) ) {
            $options['admin_ui_style'] = 'new';
        }

        update_option( 'wepos_appearance', $options );
    }

    /**
     * Add wePOS capabilities to default roles.
     *
     * Default capability assignments:
     * - Administrator: access_wepos + manage_wepos + all page caps
     * - Shop Manager:  access_wepos + manage_wepos + all page caps
     * - Editor:        access_wepos + all page caps
     *
     * @since 1.4.0
     *
     * @return void
     */
    private function add_wepos_capabilities() {
        foreach ( self::get_default_role_capabilities() as $role_slug => $caps ) {
            $role = get_role( $role_slug );

            if ( ! $role ) {
                continue;
            }

            foreach ( $caps as $cap ) {
                if ( array_key_exists( $cap, $role->capabilities ) ) {
                    continue;
                }

                $role->add_cap( $cap );
            }
        }
    }

    /**
     * Get the default role capability map.
     *
     * A capability is only backfilled when it is missing from the role, so
     * access settings that explicitly store a capability as false are left
     * untouched. Extensions such as wePOS Pro can extend this map to register
     * defaults for roles like cashier.
     *
     * @since 1.4.0
     *
     * @return array<string, string[]>
     */
    public static function get_default_role_capabilities() {
        $page_caps = apply_filters( 'wepos_access_page_capabilities', [
            'wepos_page_settings',
            'wepos_page_view_pos',
        ] );

        $settings_caps = [
            'view_general_settings',
            'edit_general_settings',
            'view_tax_settings',
            'edit_tax_settings',
            'view_barcode_settings',
            'edit_barcode_settings',
        ];

        $defaults = [
            'administrator' => array_merge(
                [ 'access_wepos', 'manage_wepos', 'wepos_view_all_outlets' ],
                $page_caps,
                $settings_caps
            ),
            'shop_manager'  => array_merge(
                [ 'access_wepos', 'manage_wepos', 'wepos_view_all_outlets' ],
                $page_caps,
                $settings_caps
            ),
            'editor'        => array_merge(
                [ 'access_wepos', 'wepos_view_all_outlets' ],
                $page_caps
            ),
            'cashier'       => [
                'access_wepos',
                'wepos_page_view_pos',
            ],
            'seller'        => array_merge(
                [ 'access_wepos', 'manage_wepos', 'wepos_view_all_outlets' ],
                $page_caps,
                $settings_caps
            ),
            'vendor_staff'  => array_merge(
                [
                    'access_wepos',
                    // Required so vendor staff can create/update/read orders placed at the POS.
                    // Without these, the first sale succeeds on the server but the follow-up
                    // order fetch returns "Sorry, you cannot access this resource".
                    'publish_shop_orders',
                    'edit_shop_orders',
                    'read_private_shop_orders',
                ],
                $settings_caps
            ),
        ];

        return apply_filters( 'wepos_default_role_capabilities', $defaults );
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
