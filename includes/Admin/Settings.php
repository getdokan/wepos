<?php
namespace WeDevs\WePOS\Admin;

/**
* Admin Settings Class
*
* @package WePOS
*
* @since 1.0.0
*/
class Settings {

    /**
     * Settings constructor
     *
     * @since 1.0.0
     */
    public function __construct() {
        add_filter( 'wepos_localize_data', array( $this, 'settings_localize_data' ), 10 );
        add_action( 'wp_ajax_wepos_get_setting_values', array( $this, 'get_settings_value' ), 10 );
        add_action( 'wp_ajax_wepos_save_settings', array( $this, 'save_settings_value' ), 10 );
    }

    /**
     * Get settings values
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function get_settings_value() {
        if ( ! wepos_current_user_can_manage() ) {
            wp_send_json_error( __( 'You have no permission to get settings value', 'wepos' ) );
        }

        $_post_data = wp_unslash( $_POST );

        if ( ! wp_verify_nonce( sanitize_text_field( $_post_data['nonce'] ), 'wepos_nonce' ) ) {
            wp_send_json_error( __( 'Invalid nonce', 'wepos' ) );
        }

        $settings = array();

        foreach ( $this->get_settings_sections() as $key => $section ) {
            $settings[$section['id']] = get_option( $section['id'], array() );
        }

        wp_send_json_success( $settings );
    }

    /**
     * Save settings value
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function save_settings_value() {
        try {
            if ( ! wepos_current_user_can_manage() ) {
                throw new Exception( __( 'You are not authorized to perform this action.', 'wepos' ), 401 );
            }

            $_post_data = wp_unslash( $_POST );
            if ( ! wp_verify_nonce( sanitize_text_field( $_post_data['nonce'] ), 'wepos_nonce' ) ) {
                throw new Exception( __( 'Invalid nonce', 'wepos' ), 403 );
            }

            $option_name = $_post_data['section'];

            if ( empty( $option_name ) ) {
                throw new Exception( __( 'Setting not saved properly', 'wepos' ), 400 );
            }

            $option_value = $this->sanitize_options( $_post_data['settingsData'] );
            $option_value = apply_filters( 'wepos_save_settings_value', $option_value );

            do_action( 'wepos_before_saving_settings', $option_name, $option_value );

            update_option( $option_name, $option_value );

            do_action( 'wepos_after_saving_settings', $option_name, $option_value );

            wp_send_json_success( array(
                'settings' => array(
                    'name'  => $option_name,
                    'value' => $option_value,
                ),
                'message' => __( 'Setting has been saved successfully.', 'wepos' ),
            ) );

        } catch ( Exception $e ) {
            $error_code = $e->getCode() ? $e->getCode() : 422;
            wp_send_json_error( new WP_Error( 'error_saving_wepos_settings', $e->getMessage() ), $error_code );
        }
    }

    /**
     * Sanitize callback for Settings API
     *
     * @return mixed
     */
    function sanitize_options( $options ) {
        if ( ! $options ) {
            return $options;
        }

        foreach( $options as $option_slug => $option_value ) {
            $sanitize_callback = $this->get_sanitize_callback( $option_slug );

            // If callback is set, call it
            if ( $sanitize_callback ) {
                $options[ $option_slug ] = call_user_func( $sanitize_callback, $option_value );
                continue;
            }
        }

        return $options;
    }

    /**
     * Get sanitization callback for given option slug
     *
     * @param string $slug option slug
     *
     * @return mixed string or bool false
     */
    function get_sanitize_callback( $slug = '' ) {
        if ( empty( $slug ) ) {
            return false;
        }

        // Iterate over registered fields and see if we can find proper callback
        foreach( $this->get_settings_fields() as $section => $options ) {
            foreach ( $options as $option ) {
                if ( $option['name'] != $slug ) {
                    continue;
                }

                // Return the callback name
                return isset( $option['sanitize_callback'] ) && is_callable( $option['sanitize_callback'] ) ? $option['sanitize_callback'] : false;
            }
        }

        return false;
    }

    /**
     * Load settings sections and fields
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function settings_localize_data( $data ) {
        if ( ! is_admin() ) {
            return $data;
        }

        $data['settings_sections'] = $this->get_settings_sections();

        $settings_fields = array();
        foreach ( $this->get_settings_fields() as $key => $section_fields ) {
            foreach ( $section_fields as $settings_key => $value ) {
                $settings_fields[$key][$value['name']] = $value;
            }
        }

        $data['settings_fields']   = $settings_fields;

        return $data;
    }

    /**
     * Get setting sections
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function get_settings_sections() {
        return wepos_get_settings_sections();
    }

    /**
     * Returns all the settings fields
     *
     * @since 1.0.0
     *
     * @return array settings fields
     */
    public function get_settings_fields() {
        return wepos_get_settings_fields();
    }

}
