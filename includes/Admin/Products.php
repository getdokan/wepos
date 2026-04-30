<?php
namespace WeDevs\WePOS\Admin;

/**
* Admin product class
*
* @since 1.0.0
*/
class Products {

    const POS_VISIBILITY_META = '_wepos_pos_visibility';

    /**
     * Product Constructor
     *
     * @since 1.0.0
     */
    public function __construct() {
        add_action( 'woocommerce_product_options_general_product_data', [ $this, 'add_barcode_field' ] );
        add_action( 'woocommerce_product_after_variable_attributes', [ $this, 'add_variation_barcode_field' ], 10, 3 );
        add_action( 'woocommerce_process_product_meta', [ $this, 'save_field' ] );
        add_action( 'woocommerce_save_product_variation', [ $this, 'save_variation_data' ], 10, 2 );

        // POS Visibility (Feature 1) — renders in the Publish metabox next to
        // Catalog visibility so merchants see it where they already control
        // other publish-time visibility rules.
        //
        // Public-facing hooks for this feature (pre_get_posts, template_redirect,
        // WC REST filters, REST pos_visibility read/write) live in
        // `WeDevs\WePOS\Common` because this class is only instantiated for
        // admin requests, while those hooks must run on the frontend and REST.
        add_action( 'post_submitbox_misc_actions', [ $this, 'add_pos_visibility_field' ] );
        add_action( 'woocommerce_process_product_meta', [ $this, 'save_pos_visibility' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_pos_visibility_script' ] );

        // POS Visibility — WooCommerce Quick Edit on the products list table.
        add_action( 'quick_edit_custom_box', [ $this, 'quick_edit_pos_visibility_field' ], 10, 2 );
        add_action( 'manage_product_posts_custom_column', [ $this, 'inject_pos_visibility_row_data' ], 99, 2 );
        add_action( 'woocommerce_product_quick_edit_save', [ $this, 'save_quick_edit_pos_visibility' ] );
        add_action( 'admin_footer-edit.php', [ $this, 'quick_edit_pos_visibility_script' ] );

        // Decimal quantity support (Feature 2). The Decimal Quantities
        // toggle is enforced on the server: when OFF and the stock field
        // was actually changed in this save cycle, the fractional part is
        // floored to an integer. No UI override is applied — WooCommerce's
        // native `step="any"` is left in place to avoid HTML5 step-base
        // validation errors on products that already hold decimal stock.
        add_action( 'woocommerce_admin_process_product_object', [ $this, 'enforce_integer_stock_on_save' ] );
        add_action( 'woocommerce_admin_process_variation_object', [ $this, 'enforce_integer_stock_on_save' ] );
    }

    /**
     * Add barcode field
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function add_barcode_field() {
        $barcode_field = wepos_get_option( 'barcode_scanner_field', 'wepos_general', 'sku' );
        if ( $barcode_field != 'custom' ) {
            return;
        }
        echo '<div class="show_if_simple">';
        woocommerce_wp_text_input( [
            'id' => '_wepos_barcode',
            'label' => __( 'Barcode', 'wepos' ),
            'class' => 'wepos-barcode-field',
            'desc_tip' => true,
            'description' => __( 'Enter your unique barcode number or text for this product', 'wepos' ),
        ] );
        echo '</div>';
    }

    /**
     * Load barcode field for variations
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function add_variation_barcode_field( $loop, $variation_data, $variation ) {
        $barcode_field = wepos_get_option( 'barcode_scanner_field', 'wepos_general', 'sku' );

        if ( $barcode_field != 'custom' ) {
            return;
        }

        $variaton_product = wc_get_product( $variation->ID );
        ?>
        <div>
            <?php
                woocommerce_wp_text_input(
                    array(
                        'id'            => "_wepos_barcode{$loop}",
                        'name'          => "_wepos_barcode[{$loop}]",
                        'value'         => $variaton_product->get_meta( '_wepos_barcode' ),
                        'label'         => __( 'Barcode', 'wepos' ),
                        'wrapper_class' => 'form-row form-row-full',
                        'desc_tip' => true,
                        'description' => __( 'Enter your unique barcode number or text for this product', 'wepos' ),
                    )
                );
            ?>
        </div>
        <?php
    }

    /**
     * Save product custom fields
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function save_field( $post_id ) {
        $product    = wc_get_product( $post_id );
        $postdata   = wp_unslash( $_POST );
        $barcode    = isset( $postdata['_wepos_barcode'] ) ? sanitize_text_field( $postdata['_wepos_barcode'] ) : '';
        if ( $product->is_type( 'simple' ) ) {
            $product->update_meta_data( '_wepos_barcode', $barcode );
        } else {
            $product->update_meta_data( '_wepos_barcode', '' );
        }
        $product->save();
    }

    /**
     * Save variation data
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function save_variation_data( $variation_id, $i ) {
        $product  = wc_get_product( $variation_id );
        $postdata = wp_unslash( $_POST );
        $barcode  = isset( $postdata['_wepos_barcode'][$i] ) ?  sanitize_text_field( $postdata['_wepos_barcode'][$i] ) : '';
        $product->update_meta_data( '_wepos_barcode', $barcode );
        $product->save();
    }

    /**
     * Output the POS Visibility widget in the Publish metabox — styled to
     * match WooCommerce's own "Catalog visibility" click-to-edit control.
     *
     * Hooked on `post_submitbox_misc_actions` (runs for any post type) so we
     * scope to `product` here.
     *
     * @since 1.5.0
     *
     * @return void
     */
    public function add_pos_visibility_field() {
        global $post;

        if ( ! $post || 'product' !== $post->post_type ) {
            return;
        }

        if ( 'yes' !== wepos_get_option( 'enable_pos_only_products', 'wepos_general', 'no' ) ) {
            return;
        }

        $value = get_post_meta( $post->ID, self::POS_VISIBILITY_META, true );
        if ( empty( $value ) ) {
            $value = 'pos_and_online';
        }

        $options = self::get_pos_visibility_options();
        $current_label = isset( $options[ $value ] ) ? $options[ $value ] : $options['pos_and_online'];
        $radio_name    = self::POS_VISIBILITY_META;
        ?>
        <div class="misc-pub-section misc-pub-wepos-pos-visibility" id="wepos-pos-visibility">
            <?php esc_html_e( 'POS visibility:', 'wepos' ); ?>
            <strong id="wepos-pos-visibility-display"><?php echo esc_html( $current_label ); ?></strong>
            <a href="#wepos-pos-visibility" id="wepos-pos-visibility-show" class="hide-if-no-js" style="display:inline;">
                <?php esc_html_e( 'Edit', 'wepos' ); ?>
            </a>

            <div id="wepos-pos-visibility-select" class="hide-if-js" style="display:none;margin-top:6px;">
                <?php foreach ( $options as $key => $label ) : ?>
                    <label style="display:block;margin:5px 0;">
                        <input type="radio"
                            name="<?php echo esc_attr( $radio_name ); ?>"
                            value="<?php echo esc_attr( $key ); ?>"
                            <?php checked( $value, $key ); ?> />
                        <?php echo esc_html( $label ); ?>
                    </label>
                <?php endforeach; ?>
                <p>
                    <a href="#wepos-pos-visibility" id="wepos-pos-visibility-save" class="hide-if-no-js button"><?php esc_html_e( 'OK', 'wepos' ); ?></a>
                    <a href="#wepos-pos-visibility" id="wepos-pos-visibility-cancel" class="hide-if-no-js"><?php esc_html_e( 'Cancel', 'wepos' ); ?></a>
                </p>
            </div>
        </div>
        <?php

    }

    /**
     * Enqueue the Publish-metabox mini-editor enhancement for POS
     * visibility. Scoped to product edit screens and gated on the
     * "Enable POS only products" toggle so it never loads elsewhere.
     *
     * @since 1.5.0
     *
     * @param string $hook Current admin page hook.
     *
     * @return void
     */
    public function enqueue_pos_visibility_script( $hook ) {
        if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) ) {
            return;
        }

        $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
        if ( ! $screen || 'product' !== $screen->post_type ) {
            return;
        }

        if ( 'yes' !== wepos_get_option( 'enable_pos_only_products', 'wepos_general', 'no' ) ) {
            return;
        }

        wp_enqueue_script(
            'wepos-pos-visibility',
            plugins_url( 'assets/vendors/wepos-pos-visibility.js', WEPOS_FILE ),
            [],
            WEPOS_VERSION,
            true
        );
    }

    /**
     * Save the POS Visibility meta on product save.
     *
     * @since 1.5.0
     *
     * @param int $post_id
     *
     * @return void
     */
    public function save_pos_visibility( $post_id ) {
        if ( 'yes' !== wepos_get_option( 'enable_pos_only_products', 'wepos_general', 'no' ) ) {
            return;
        }

        $postdata = wp_unslash( $_POST );

        if ( ! isset( $postdata[ self::POS_VISIBILITY_META ] ) ) {
            return;
        }

        $value = sanitize_text_field( $postdata[ self::POS_VISIBILITY_META ] );
        if ( ! array_key_exists( $value, self::get_pos_visibility_options() ) ) {
            $value = 'pos_and_online';
        }

        update_post_meta( $post_id, self::POS_VISIBILITY_META, $value );
    }

    /**
     * Render the POS Visibility select inside WooCommerce's Quick Edit row.
     *
     * `quick_edit_custom_box` fires once per column; we only render on the
     * `product_cat` column so we appear inside the standard WC quick-edit
     * layout (and only once per row).
     *
     * @since 1.5.0
     *
     * @param string $column_name
     * @param string $post_type
     *
     * @return void
     */
    public function quick_edit_pos_visibility_field( $column_name, $post_type ) {
        if ( 'product_cat' !== $column_name || 'product' !== $post_type ) {
            return;
        }

        if ( 'yes' !== wepos_get_option( 'enable_pos_only_products', 'wepos_general', 'no' ) ) {
            return;
        }

        $options = self::get_pos_visibility_options();
        ?>
        <br class="clear" />
        <label>
            <span class="title"><?php esc_html_e( 'POS Visibility', 'wepos' ); ?></span>
            <span class="input-text-wrap">
                <select name="<?php echo esc_attr( self::POS_VISIBILITY_META ); ?>" class="wepos-pos-visibility-qe-select">
                    <?php foreach ( $options as $key => $label ) : ?>
                        <option value="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></option>
                    <?php endforeach; ?>
                </select>
            </span>
        </label>
        <?php
    }

    /**
     * Stamp the current POS visibility value into each product row so the
     * Quick Edit JS can copy it into the select when the row is opened.
     *
     * @since 1.5.0
     *
     * @param string $column
     * @param int    $post_id
     *
     * @return void
     */
    public function inject_pos_visibility_row_data( $column, $post_id ) {
        if ( 'name' !== $column ) {
            return;
        }

        if ( 'yes' !== wepos_get_option( 'enable_pos_only_products', 'wepos_general', 'no' ) ) {
            return;
        }

        $value = get_post_meta( $post_id, self::POS_VISIBILITY_META, true );
        if ( empty( $value ) ) {
            $value = 'pos_and_online';
        }

        echo '<span class="wepos-pos-visibility-data" style="display:none;">' . esc_html( $value ) . '</span>';
    }

    /**
     * Persist the POS visibility value submitted from Quick Edit.
     *
     * WooCommerce's `WC_Admin_List_Table_Products::quick_edit_save()` calls
     * `$product->save()` BEFORE firing the `woocommerce_product_quick_edit_save`
     * action, so meta mutated inside this handler will not be flushed to the
     * database unless we save again. `save_meta_data()` is enough — it
     * persists the dirty meta without re-running the full product save.
     *
     * @since 1.5.0
     *
     * @param \WC_Product $product
     *
     * @return void
     */
    public function save_quick_edit_pos_visibility( $product ) {
        if ( 'yes' !== wepos_get_option( 'enable_pos_only_products', 'wepos_general', 'no' ) ) {
            return;
        }

        if ( ! isset( $_REQUEST[ self::POS_VISIBILITY_META ] ) ) {
            return;
        }

        $value = sanitize_text_field( wp_unslash( $_REQUEST[ self::POS_VISIBILITY_META ] ) );
        if ( ! array_key_exists( $value, self::get_pos_visibility_options() ) ) {
            $value = 'pos_and_online';
        }

        $product->update_meta_data( self::POS_VISIBILITY_META, $value );
        $product->save_meta_data();
    }

    /**
     * Copy each row's stored POS visibility value into the Quick Edit select
     * when the row is opened.
     *
     * @since 1.5.0
     *
     * @return void
     */
    public function quick_edit_pos_visibility_script() {
        $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
        if ( ! $screen || 'edit-product' !== $screen->id ) {
            return;
        }

        if ( 'yes' !== wepos_get_option( 'enable_pos_only_products', 'wepos_general', 'no' ) ) {
            return;
        }
        ?>
        <script>
        jQuery(function($){
            if ( typeof inlineEditPost === 'undefined' ) { return; }

            var originalEdit = inlineEditPost.edit;
            inlineEditPost.edit = function( id ) {
                originalEdit.apply( this, arguments );

                var postId = 0;
                if ( typeof id === 'object' ) {
                    postId = parseInt( this.getId( id ), 10 );
                }

                if ( ! postId ) { return; }

                var $row       = $( '#post-' + postId );
                var $editRow   = $( '#edit-' + postId );
                var stored     = $.trim( $row.find( '.wepos-pos-visibility-data' ).text() );

                if ( stored ) {
                    $editRow.find( '.wepos-pos-visibility-qe-select' ).val( stored );
                }
            };
        });
        </script>
        <?php
    }

    /**
     * Server-side guard: when Decimal Quantities is OFF, truncate any
     * fractional stock quantity to an integer before the product (or
     * variation) is saved. Prevents decimals from slipping through via
     * form manipulation, clipboard paste, or other UI bypasses.
     *
     * IMPORTANT: only acts when the stock field was actually modified in
     * this save cycle. A product edited for unrelated reasons (name,
     * description, price, etc.) must not have its historical decimal stock
     * silently truncated. We use WC's own change-tracking via
     * `WC_Data::get_changes()` — a property is only present there if its
     * new value differs from the stored value.
     *
     * Runs for both `woocommerce_admin_process_product_object` (simple /
     * variable products) and `woocommerce_admin_process_variation_object`
     * (each individual variation).
     *
     * @since 1.5.0
     *
     * @param \WC_Product $product
     *
     * @return void
     */
    public function enforce_integer_stock_on_save( $product ) {
        if ( 'yes' === wepos_get_option( 'enable_decimal_quantities', 'wepos_general', 'no' ) ) {
            return;
        }

        if ( ! is_object( $product ) || ! method_exists( $product, 'get_stock_quantity' ) ) {
            return;
        }

        // Skip if the user didn't touch the stock field in this save.
        $changes = method_exists( $product, 'get_changes' ) ? $product->get_changes() : array();
        if ( ! array_key_exists( 'stock_quantity', $changes ) ) {
            return;
        }

        $stock = $product->get_stock_quantity();
        if ( null === $stock || ! is_numeric( $stock ) ) {
            return;
        }

        $stock_float = (float) $stock;
        if ( floor( $stock_float ) === $stock_float ) {
            return; // User set a whole-number value — fine.
        }

        $product->set_stock_quantity( (int) floor( $stock_float ) );
    }

    /**
     * Canonical list of POS Visibility options.
     *
     * @return array<string,string>
     */
    public static function get_pos_visibility_options() {
        return [
            'pos_and_online' => __( 'POS & Online', 'wepos' ),
            'pos_only'       => __( 'POS Only', 'wepos' ),
            'online_only'    => __( 'Online Only', 'wepos' ),
        ];
    }
}
