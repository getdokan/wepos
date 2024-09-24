const { LICENSE_KEY } = process.env;

export const dbData = {
    wepos: {
        optionName: {
            weposProLicense: 'appsero_465d36b721b45d397f531ea03bbb5f40_manage_license',
        },

        license: {
            key: LICENSE_KEY,
            status: 'activate',
            remaining: 8,
            activation_limit: 10,
            expiry_days: 13356,
            title: 'Business',
            source_id: 'wepos-pro-business',
            recurring: 1,
        },

        deactivateLicense: {
            key: '',
            status: 'deactivate',
        },
    },

    // wp

    optionName: {
        activePlugins: 'active_plugins',
    },

    siteSettings: {
        users_can_register: 1,
        start_of_week: 1,
        date_format: 'F j, Y',
        time_format: 'g:i a',
        permalink_structure: '/%postname%/',
        default_role: 'subscriber',
        timezone_string: 'Asia/Dhaka',
    },

    // woocommerce

    woocommerceSettings: {
        woocommerce_enable_myaccount_registration: 'yes',
    },
};
