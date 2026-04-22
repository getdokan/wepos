<?php
/**
 * wePOS — Vendor Dashboard POS Access page.
 *
 * Lists the vendor's staff + cashiers and lets the vendor toggle
 * access_wepos / manage_wepos per user. Toggles are disabled when
 * the vendor's own access_wepos is off (admin-imposed cascade).
 *
 * @var \WeDevs\WePOS\Dokan $dokan_integration Current Dokan integration instance.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$vendor_id          = get_current_user_id();
$vendor             = get_user_by( 'id', $vendor_id );
$vendor_access_off  = ! user_can( $vendor_id, 'access_wepos' );
$vendor_manage_off  = ! user_can( $vendor_id, 'manage_wepos' );
$dokan_integration  = new \WeDevs\WePOS\Dokan();
$users              = $dokan_integration->get_vendor_pos_users( $vendor_id );
$saved_flag         = get_transient( 'wepos_pos_access_saved_' . $vendor_id );

if ( $saved_flag ) {
    delete_transient( 'wepos_pos_access_saved_' . $vendor_id );
}

?>
<div class="dokan-dashboard-wrap">
    <?php
    if ( function_exists( 'dokan_get_template_part' ) ) {
        dokan_get_template_part( 'global/dashboard-nav', '', [ 'active_menu' => 'pos/access' ] );
    }
    ?>

    <div class="dokan-dashboard-content">
        <article class="dokan-pos-access-content">
            <header class="dokan-dashboard-header">
                <h1 class="entry-title"><?php esc_html_e( 'POS Access', 'wepos' ); ?></h1>
                <p class="description">
                    <?php esc_html_e( 'Grant or revoke POS access for your staff and cashiers. Users with "Access POS" can open the POS frontend; users with "Manage POS" can also change operational settings.', 'wepos' ); ?>
                </p>
            </header>

            <?php if ( $saved_flag ) : ?>
                <div class="dokan-alert dokan-alert-success" style="margin-bottom:16px;">
                    <?php esc_html_e( 'POS access updated.', 'wepos' ); ?>
                </div>
            <?php endif; ?>

            <?php if ( $vendor_access_off ) : ?>
                <div class="dokan-alert dokan-alert-warning" style="margin-bottom:16px;">
                    <?php esc_html_e( 'Your store does not currently have POS access. Access toggles for your staff and cashiers will not take effect until the site administrator enables POS access for your store.', 'wepos' ); ?>
                </div>
            <?php elseif ( $vendor_manage_off ) : ?>
                <div class="dokan-alert dokan-alert-info" style="margin-bottom:16px;">
                    <?php esc_html_e( 'Your store cannot manage POS settings. Staff granted "Manage POS" will only be able to view POS content until the site administrator enables POS management for your store.', 'wepos' ); ?>
                </div>
            <?php endif; ?>

            <form method="post" class="dokan-form-horizontal">
                <?php wp_nonce_field( 'wepos_pos_access', 'wepos_pos_access_nonce' ); ?>

                <?php if ( empty( $users ) ) : ?>
                    <p>
                        <?php esc_html_e( 'You do not have any staff or cashiers yet. Create a staff member from your Staff menu to manage POS access.', 'wepos' ); ?>
                    </p>
                <?php else : ?>
                    <table class="dokan-table dokan-table-striped" style="width:100%;">
                        <thead>
                            <tr>
                                <th><?php esc_html_e( 'Name', 'wepos' ); ?></th>
                                <th><?php esc_html_e( 'Email', 'wepos' ); ?></th>
                                <th><?php esc_html_e( 'Role', 'wepos' ); ?></th>
                                <th style="text-align:center;"><?php esc_html_e( 'Access POS', 'wepos' ); ?></th>
                                <th style="text-align:center;"><?php esc_html_e( 'Manage POS', 'wepos' ); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                        <?php foreach ( $users as $user ) :
                            $access = user_can( $user->ID, 'access_wepos' );
                            $manage = user_can( $user->ID, 'manage_wepos' );
                            $role   = ! empty( $user->roles ) ? reset( $user->roles ) : '';
                            $role_label = ucfirst( str_replace( '_', ' ', $role ) );
                            $access_disabled = $vendor_access_off ? 'disabled' : '';
                            $manage_disabled = ( $vendor_access_off || $vendor_manage_off ) ? 'disabled' : '';
                        ?>
                            <tr>
                                <td><?php echo esc_html( $user->display_name ); ?></td>
                                <td><?php echo esc_html( $user->user_email ); ?></td>
                                <td><?php echo esc_html( $role_label ); ?></td>
                                <td style="text-align:center;">
                                    <input
                                        type="checkbox"
                                        name="wepos_staff[<?php echo esc_attr( $user->ID ); ?>][access_wepos]"
                                        value="1"
                                        <?php checked( $access ); ?>
                                        <?php echo esc_attr( $access_disabled ); ?>
                                    />
                                </td>
                                <td style="text-align:center;">
                                    <input
                                        type="checkbox"
                                        name="wepos_staff[<?php echo esc_attr( $user->ID ); ?>][manage_wepos]"
                                        value="1"
                                        <?php checked( $manage ); ?>
                                        <?php echo esc_attr( $manage_disabled ); ?>
                                    />
                                </td>
                            </tr>
                        <?php endforeach; ?>
                        </tbody>
                    </table>

                    <p style="margin-top:16px;">
                        <button type="submit" class="dokan-btn dokan-btn-theme" <?php disabled( $vendor_access_off ); ?>>
                            <?php esc_html_e( 'Save Access', 'wepos' ); ?>
                        </button>
                    </p>
                <?php endif; ?>
            </form>
        </article>
    </div>
</div>
