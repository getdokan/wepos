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
     * All caps subject to the vendor → staff cascade.
     *
     * When the parent vendor lacks one of these caps, the cap is
     * forced off for the child user regardless of per-user overrides.
     * Ensures that admin revocation propagates automatically and that
     * staff never gain a permission the vendor does not hold.
     *
     * @since 1.5.0
     *
     * @return string[]
     */
    public static function cascadable_caps() {
        $caps = array_merge(
            [
                'access_wepos',
                'manage_wepos',
                'wepos_view_all_outlets',
            ],
            self::managed_caps(),
            \apply_filters( 'wepos_access_page_capabilities', [ 'wepos_page_settings', 'wepos_page_view_pos' ] ),
            [
                'create_customers',
                'read_private_products',
                'edit_products',
                'edit_others_products',
                'edit_published_products',
                'read_private_shop_orders',
                'publish_shop_orders',
                'edit_shop_orders',
                'edit_others_shop_orders',
                'edit_users',
                'list_users',
                'manage_product_terms',
                'read_private_shop_coupons',
                'read',
            ]
        );

        /**
         * Filter the list of caps subject to the vendor → staff cascade.
         *
         * @since 1.5.0
         *
         * @param string[] $caps Cap slugs.
         */
        return \apply_filters( 'wepos_cascadable_staff_caps', $caps );
    }

    /**
     * Per-request cache of parent vendor caps, keyed by vendor ID.
     *
     * @var array<int, array<string, bool>>
     */
    private static $parent_caps_cache = [];

    /**
     * Per-request cache of resolved parent vendor IDs, keyed by user ID.
     *
     * Values: vendor ID, 0 = no parent, or -1 = resolution in flight.
     *
     * @var array<int, int>
     */
    private static $parent_id_cache = [];

    /**
     * Reentry guard for the cascade filter.
     *
     * The WP cap resolution helpers triggered during parent-vendor lookup
     * can themselves fire `user_has_cap`, which would recurse back into
     * this filter and overflow the stack. The flag stops that at the door.
     *
     * @var bool
     */
    private static $cascade_in_progress = false;

    /**
     * Apply the vendor → staff cascade to a `user_has_cap` payload.
     *
     * When the user is vendor staff or a cashier linked to a vendor,
     * any cap the parent vendor lacks is forced off for the child.
     *
     * @since 1.5.0
     *
     * @param array<string, bool> $allcaps Current user cap map.
     * @param \WP_User|int|null   $user    User object or ID.
     *
     * @return array<string, bool>
     */
    public static function apply_cascade( $allcaps, $user ) {
        if ( ! is_array( $allcaps ) ) {
            return $allcaps;
        }

        if ( self::$cascade_in_progress ) {
            return $allcaps;
        }

        $user_id = 0;

        if ( is_object( $user ) && isset( $user->ID ) ) {
            $user_id = (int) $user->ID;
        } elseif ( is_numeric( $user ) ) {
            $user_id = (int) $user;
        }

        if ( ! $user_id ) {
            return $allcaps;
        }

        self::$cascade_in_progress = true;

        try {
            $parent_vendor = self::cached_parent_vendor_id( $user_id );

            if ( ! $parent_vendor || $parent_vendor === $user_id ) {
                return $allcaps;
            }

            // Apply the vendor's Access overlay first so vendor-set toggles
            // (`add_cap` equivalent) take effect dynamically. Storing the
            // overlay only in vendor user meta — not as per-user `add_cap`
            // entries — means the toggles disappear cleanly when Dokan is
            // deactivated and resume when Dokan is reactivated, since the
            // filter that calls this method only registers under Dokan.
            $allcaps = self::apply_vendor_overlay( $allcaps, $user_id, $parent_vendor );

            $parent_caps = self::parent_vendor_caps( $parent_vendor );

            foreach ( self::cascadable_caps() as $cap ) {
                if ( empty( $parent_caps[ $cap ] ) ) {
                    $allcaps[ $cap ] = false;
                }
            }

            return $allcaps;
        } finally {
            self::$cascade_in_progress = false;
        }
    }

    /**
     * Apply the parent vendor's Access overlay (`_wepos_vendor_role_caps`)
     * to the user's cap map for their primary wePOS role.
     *
     * Overlay shape: `[ 'cashier' => [ cap => bool, ... ], 'vendor_staff' => [...] ]`.
     *
     * Only caps the vendor herself currently holds may be granted — vendors
     * cannot promote a child user above themselves. Caps the vendor lacks
     * are still forced off later by the cascade.
     *
     * @since 1.5.1
     *
     * @param array<string, bool> $allcaps        Cap map being filtered.
     * @param int                 $user_id        Child user ID.
     * @param int                 $parent_vendor  Parent vendor user ID.
     *
     * @return array<string, bool>
     */
    private static function apply_vendor_overlay( $allcaps, $user_id, $parent_vendor ) {
        $user = \get_userdata( $user_id );

        if ( ! $user || empty( $user->roles ) ) {
            return $allcaps;
        }

        $role_slug = null;

        foreach ( [ 'vendor_staff', 'cashier' ] as $candidate ) {
            if ( in_array( $candidate, (array) $user->roles, true ) ) {
                $role_slug = $candidate;
                break;
            }
        }

        if ( ! $role_slug ) {
            return $allcaps;
        }

        $overlay = \get_user_meta( $parent_vendor, '_wepos_vendor_role_caps', true );

        if ( ! is_array( $overlay ) || empty( $overlay[ $role_slug ] ) || ! is_array( $overlay[ $role_slug ] ) ) {
            return $allcaps;
        }

        $vendor_caps = self::parent_vendor_caps( $parent_vendor );

        foreach ( $overlay[ $role_slug ] as $cap => $grant ) {
            $grant = (bool) $grant;

            if ( $grant && empty( $vendor_caps[ $cap ] ) ) {
                // Vendor cannot grant a cap they do not hold. Cascade
                // would force this off anyway — make it explicit here.
                $allcaps[ $cap ] = false;
                continue;
            }

            $allcaps[ $cap ] = $grant;
        }

        return $allcaps;
    }

    /**
     * Cached variant of parent_vendor_id — used only inside the cascade
     * filter to avoid re-running the filter-heavy resolver per cap check.
     *
     * @param int $user_id User ID.
     *
     * @return int
     */
    private static function cached_parent_vendor_id( $user_id ) {
        if ( array_key_exists( $user_id, self::$parent_id_cache ) ) {
            return self::$parent_id_cache[ $user_id ];
        }

        $resolved = self::parent_vendor_id( $user_id );
        self::$parent_id_cache[ $user_id ] = (int) $resolved;

        return self::$parent_id_cache[ $user_id ];
    }

    /**
     * Resolve the parent vendor's effective caps, using a per-request cache
     * to avoid triggering repeated user_has_cap filter recursion.
     *
     * @param int $vendor_id Vendor user ID.
     *
     * @return array<string, bool>
     */
    private static function parent_vendor_caps( $vendor_id ) {
        if ( isset( self::$parent_caps_cache[ $vendor_id ] ) ) {
            return self::$parent_caps_cache[ $vendor_id ];
        }

        $vendor = \get_userdata( $vendor_id );

        if ( ! $vendor ) {
            self::$parent_caps_cache[ $vendor_id ] = [];
            return self::$parent_caps_cache[ $vendor_id ];
        }

        $allcaps = isset( $vendor->allcaps ) && is_array( $vendor->allcaps ) ? $vendor->allcaps : [];

        self::$parent_caps_cache[ $vendor_id ] = $allcaps;

        return $allcaps;
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

        // Personal sections (cashier/theme prefs) tie to POS frontend access.
        if ( ! empty( $config['personal'] ) ) {
            return self::effective_access_pos( $user_id );
        }

        // Store-level settings are dashboard-scoped — access_wepos (POS
        // frontend cap) must not gate them.
        return self::resolve_section_cap( $user_id, $config['view'] );
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
            // Admin-only sections — staff inherit via parent vendor.
            return self::resolve_admin_cap( $user_id );
        }

        // Personal sections (cashier/theme prefs) tie to POS frontend access.
        if ( ! empty( $config['personal'] ) ) {
            return self::effective_access_pos( $user_id );
        }

        if ( ! self::effective_manage_pos( $user_id ) ) {
            return false;
        }

        return self::resolve_section_cap( $user_id, $config['edit'] );
    }

    /**
     * Resolve a section-level cap (view_* / edit_*) honouring the
     * vendor → staff delegation rules.
     *
     * Rules, in order:
     *  1. Non-staff users → direct cap resolution (role + user caps).
     *  2. Staff with an explicit per-user override in wp_capabilities
     *     (set via vendor Access page's add_cap( $cap, false/true )) →
     *     that override wins so vendors can hide a tab per-staff.
     *  3. Staff without an explicit override → inherit from parent vendor.
     *
     * @since 1.5.0
     *
     * @param int    $user_id User ID.
     * @param string $cap     Capability slug.
     *
     * @return bool
     */
    private static function resolve_section_cap( $user_id, $cap ) {
        if ( ! $user_id ) {
            return false;
        }

        $is_staff = \apply_filters( 'wepos_is_vendor_staff', false, $user_id );

        if ( ! $is_staff ) {
            if ( self::has_full_access( $user_id ) ) {
                return true;
            }
            return self::resolve_cap( $cap, $user_id );
        }

        $override = self::explicit_user_cap( $user_id, $cap );

        if ( null !== $override ) {
            return $override;
        }

        $parent = self::parent_vendor_id( $user_id );

        if ( ! $parent || $parent === $user_id ) {
            // Orphan staff — fall back to per-user resolution.
            if ( self::has_full_access( $user_id ) ) {
                return true;
            }
            return self::resolve_cap( $cap, $user_id );
        }

        if ( self::has_full_access( $parent ) ) {
            return true;
        }

        return self::resolve_cap( $cap, $parent );
    }

    /**
     * Resolve manage_wepos / manage_woocommerce for admin-only sections,
     * honouring the vendor → staff delegation rules.
     *
     * @since 1.5.0
     *
     * @param int $user_id User ID.
     *
     * @return bool
     */
    private static function resolve_admin_cap( $user_id ) {
        if ( ! $user_id ) {
            return false;
        }

        $is_staff = \apply_filters( 'wepos_is_vendor_staff', false, $user_id );

        if ( $is_staff ) {
            // Respect per-user revocation of manage_wepos when set explicitly.
            $override = self::explicit_user_cap( $user_id, 'manage_wepos' );

            if ( false === $override ) {
                return false;
            }

            $parent = self::parent_vendor_id( $user_id );

            if ( $parent && $parent !== $user_id ) {
                return \user_can( $parent, 'manage_wepos' )
                    || \user_can( $parent, 'manage_woocommerce' );
            }
        }

        return \user_can( $user_id, 'manage_wepos' )
            || \user_can( $user_id, 'manage_woocommerce' );
    }

    /**
     * Read the explicit per-user cap value stored in wp_capabilities.
     *
     * Returns the stored boolean when the vendor's Access page wrote an
     * explicit add_cap( $cap, true|false ) for this user, or null when no
     * explicit decision exists and the cap is resolved through role defaults
     * or the parent vendor.
     *
     * @since 1.5.0
     *
     * @param int    $user_id User ID.
     * @param string $cap     Capability slug.
     *
     * @return bool|null
     */
    private static function explicit_user_cap( $user_id, $cap ) {
        $user = \get_userdata( $user_id );

        if ( ! $user || ! is_array( $user->caps ) ) {
            return null;
        }

        if ( ! array_key_exists( $cap, $user->caps ) ) {
            return null;
        }

        return (bool) $user->caps[ $cap ];
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

        // Vendor staff never carry manage_wepos themselves — they act on the
        // parent vendor's store, so manage authority is inherited wholesale
        // from the vendor. An explicit per-user revoke (via the vendor Access
        // page's add_cap( $cap, false )) still wins so vendors can keep a
        // specific staff member out of settings entirely.
        if ( \apply_filters( 'wepos_is_vendor_staff', false, $user_id ) ) {
            $override = self::explicit_user_cap( $user_id, 'manage_wepos' );

            if ( false === $override ) {
                return false;
            }

            $parent_vendor = self::parent_vendor_id( $user_id );

            if ( $parent_vendor && $parent_vendor !== $user_id ) {
                return \user_can( $parent_vendor, 'manage_wepos' )
                    || \user_can( $parent_vendor, 'manage_woocommerce' );
            }
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
     * Resolve a section-level cap via the full WP cap resolution, so
     * role-level grants, per-user add_cap overrides, and the vendor →
     * staff cascade filter all apply consistently.
     *
     * @param string $cap     Capability slug.
     * @param int    $user_id User ID.
     *
     * @return bool
     */
    private static function resolve_cap( $cap, $user_id ) {
        if ( ! $user_id ) {
            return false;
        }

        return \user_can( $user_id, $cap );
    }

    /**
     * Site admin / shop manager fallback so section caps are granted
     * automatically when not explicitly configured.
     *
     * Dokan vendors do NOT bypass section caps: admins must be able to
     * disable a specific settings tab for vendors from the Access matrix.
     *
     * @param int $user_id User ID.
     *
     * @return bool
     */
    private static function has_full_access( $user_id ) {
        return \user_can( $user_id, 'manage_options' ) || \user_can( $user_id, 'manage_woocommerce' );
    }
}
