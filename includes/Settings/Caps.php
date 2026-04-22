<?php
namespace WeDevs\WePOS\Settings;

/**
 * Settings capability helper.
 *
 * Resolves section-level view/edit permissions and applies the
 * vendor → staff cascade: if a vendor's POS access is disabled by
 * the site admin, the vendor's staff cannot override that.
 *
 * @since 1.5.0
 */
class Caps {

    /**
     * Section-level capability map.
     *
     * Keys are payload section names sent by the settings UI; values
     * describe the view/edit capabilities required for that section.
     *
     * Sections not listed here are treated as admin-only and
     * fall back to the coarse manage_wepos / manage_woocommerce gate.
     *
     * @var array<string, array{view: string, edit: string, personal?: bool}>
     */
    private static $section_map = [
        'woo_general'    => [ 'view' => 'view_general_settings', 'edit' => 'edit_general_settings' ],
        'wepos_general'  => [ 'view' => 'view_general_settings', 'edit' => 'edit_general_settings' ],
        'woo_tax'        => [ 'view' => 'view_tax_settings',     'edit' => 'edit_tax_settings' ],
        'wepos_barcode'  => [ 'view' => 'view_barcode_settings', 'edit' => 'edit_barcode_settings' ],
        'wepos_cashier'  => [ 'view' => 'access_wepos',          'edit' => 'access_wepos', 'personal' => true ],
        'wepos_theme'    => [ 'view' => 'access_wepos',          'edit' => 'access_wepos', 'personal' => true ],
    ];

    /**
     * All section-level capability slugs managed by the Access matrix.
     *
     * @return string[]
     */
    public static function managed_caps() {
        return [
            'view_general_settings',
            'edit_general_settings',
            'view_tax_settings',
            'edit_tax_settings',
            'view_barcode_settings',
            'edit_barcode_settings',
        ];
    }

    /**
     * Get a section's capability config.
     *
     * @param string $section Section payload key.
     *
     * @return array{view: string, edit: string, personal?: bool}|null
     */
    public static function section_config( $section ) {
        return isset( self::$section_map[ $section ] ) ? self::$section_map[ $section ] : null;
    }

    /**
     * Whether a user can view a given settings section.
     *
     * @param string $section Payload section key (e.g. woo_general).
     * @param int    $user_id User ID (0 = current user).
     *
     * @return bool
     */
    public static function can_view( $section, $user_id = 0 ) {
        $user_id = $user_id ?: \get_current_user_id();
        $config  = self::section_config( $section );

        // Reference data (tax_classes, currencies, outlets) always readable.
        if ( null === $config ) {
            return true;
        }

        if ( ! self::effective_access_pos( $user_id ) ) {
            return false;
        }

        // Personal sections require only POS access and map to the same user.
        if ( ! empty( $config['personal'] ) ) {
            return (bool) $user_id;
        }

        if ( self::has_full_access( $user_id ) ) {
            return true;
        }

        return self::resolve_cap( $config['view'], $user_id );
    }

    /**
     * Whether a user can edit a given settings section.
     *
     * @param string $section Payload section key.
     * @param int    $user_id User ID (0 = current user).
     *
     * @return bool
     */
    public static function can_edit( $section, $user_id = 0 ) {
        $user_id = $user_id ?: \get_current_user_id();
        $config  = self::section_config( $section );

        if ( null === $config ) {
            return \user_can( $user_id, 'manage_wepos' ) || \user_can( $user_id, 'manage_woocommerce' );
        }

        if ( ! empty( $config['personal'] ) ) {
            return self::effective_access_pos( $user_id );
        }

        if ( ! self::effective_manage_pos( $user_id ) ) {
            return false;
        }

        if ( self::has_full_access( $user_id ) ) {
            return true;
        }

        return self::resolve_cap( $config['edit'], $user_id );
    }

    /**
     * Effective access_pos after applying vendor → staff cascade.
     *
     * @param int $user_id User ID (0 = current user).
     *
     * @return bool
     */
    public static function effective_access_pos( $user_id = 0 ) {
        $user_id = $user_id ?: \get_current_user_id();

        if ( ! $user_id ) {
            return false;
        }

        if ( ! \user_can( $user_id, 'access_wepos' ) ) {
            return false;
        }

        $parent_vendor = self::parent_vendor_id( $user_id );

        if ( $parent_vendor && $parent_vendor !== $user_id ) {
            if ( ! \user_can( $parent_vendor, 'access_wepos' ) ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Effective manage_pos after applying vendor → staff cascade.
     *
     * @param int $user_id User ID (0 = current user).
     *
     * @return bool
     */
    public static function effective_manage_pos( $user_id = 0 ) {
        $user_id = $user_id ?: \get_current_user_id();

        if ( ! $user_id ) {
            return false;
        }

        if ( ! ( \user_can( $user_id, 'manage_wepos' ) || \user_can( $user_id, 'manage_woocommerce' ) ) ) {
            return false;
        }

        $parent_vendor = self::parent_vendor_id( $user_id );

        if ( $parent_vendor && $parent_vendor !== $user_id ) {
            if ( ! \user_can( $parent_vendor, 'manage_wepos' ) ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Resolve the parent vendor ID for a staff user.
     *
     * Returns the user's own ID when they are the vendor, 0 for
     * site admins, or the linked vendor ID from _vendor_id meta.
     *
     * @param int $user_id User ID.
     *
     * @return int
     */
    public static function parent_vendor_id( $user_id ) {
        if ( ! $user_id || ! function_exists( 'wepos_get_vendor_id_for_user' ) ) {
            return 0;
        }

        return \absint( \wepos_get_vendor_id_for_user( $user_id ) );
    }

    /**
     * Resolve a section-level cap, respecting explicit false values
     * stored on roles while falling back to the coarse manager check.
     *
     * @param string $cap     Capability slug.
     * @param int    $user_id User ID.
     *
     * @return bool
     */
    private static function resolve_cap( $cap, $user_id ) {
        $user = \get_userdata( $user_id );

        if ( ! $user ) {
            return false;
        }

        foreach ( $user->roles as $role_slug ) {
            $role = \get_role( $role_slug );
            if ( $role && array_key_exists( $cap, $role->capabilities ) ) {
                return ! empty( $role->capabilities[ $cap ] );
            }
        }

        return false;
    }

    /**
     * Site admin / shop manager / editor / Dokan vendor fallback so section
     * caps are granted automatically when not explicitly configured.
     *
     * Dokan vendors manage their own store — their section access is gated by
     * `access_wepos` / `manage_wepos` and scoped to vendor meta, so granular
     * section caps are not required.
     *
     * @param int $user_id User ID.
     *
     * @return bool
     */
    private static function has_full_access( $user_id ) {
        if ( \user_can( $user_id, 'manage_options' ) || \user_can( $user_id, 'manage_woocommerce' ) ) {
            return true;
        }

        // Dokan vendor acting on their own store.
        if ( function_exists( 'wepos_get_vendor_id_for_user' ) ) {
            $vendor_id = \absint( \wepos_get_vendor_id_for_user( $user_id ) );
            if ( $vendor_id === $user_id && \user_can( $user_id, 'dokandar' ) ) {
                return true;
            }
        }

        return false;
    }
}
