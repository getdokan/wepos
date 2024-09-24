import { faker } from '@faker-js/faker';
const basicAuth = (username: string, password: string) => 'Basic ' + Buffer.from(username + ':' + password).toString('base64');

const { ADMIN, CUSTOMER, ADMIN_PASSWORD, USER_PASSWORD } = process.env;

export const payloads = {
    // wp
    createPost: {
        title: 'Hello rk',
        content: 'My Post Content.',
        status: 'publish',
    },

    createMedia: {
        title: 'avatar',
        alt_text: 'avatar_img',
        status: 'publish',
        post: '1',
    },

    createPage: () => ({
        title: 'test-page_' + faker.string.nanoid(10),
        status: 'publish',
    }),

    mediaAttributes: {
        title: 'avatar',
        caption: 'avatar_img',
        description: 'avatar_img',
        alt_text: 'avatar_img',
    },

    mimeTypes: {
        csv: 'text/csv',
        png: 'image/png',
        jpeg: 'image/jpeg',
        pdf: 'application/pdf',
        txt: 'text/plain',
        json: 'application/json',
        xml: 'application/xml',
        zip: 'application/zip',
    },

    // user auth

    userAuth: (username: string, password = USER_PASSWORD) => {
        return { Authorization: basicAuth(username, password) };
    },

    adminAuth: {
        Authorization: basicAuth(ADMIN, ADMIN_PASSWORD),
    },

    customerAuth: {
        Authorization: basicAuth(CUSTOMER, USER_PASSWORD),
    },

    admin: {
        username: ADMIN,
        password: ADMIN_PASSWORD,
    },

    //wepos

    // create receipt
    createReceipt: {
        style: {
            padding: {
                top: '20',
                right: '20',
                bottom: '20',
                left: '20',
            },
            headingFontSize: '18',
            paragraphFontSize: '14',
        },
        logo: {
            id: '0',
            title: '',
            url: '',
            width: '220',
            height: '60',
        },
        header: {
            showOutletName: true,
            showOutletAddress: true,
            showOutletPhone: true,
            phoneLabel: 'Phone',
            showOutletEmail: true,
            emailLabel: 'Email',
            showOutletFax: false,
            faxLabel: 'Fax',
            showOutletWebsite: false,
            websiteLabel: 'Website',
            showOrderDate: true,
            showCashierInfo: true,
            cashierNameLabel: 'Served By',
            counterNameLabel: 'Counter No',
            showOrderId: true,
            orderIdLabel: 'Invoice number',
            showCustomerDetails: true,
            customerNameLabel: 'Customer Name',
            customerIdLabel: 'Customer ID',
            showVatNumber: true,
            vatNumberLabel: 'Vat/Tax No.',
            vatNumber: '3847393XXXXX',
            showOrderNote: false,
            orderNoteLabel: 'Note',
            orderNote: 'Order note text',
        },
        items: {
            colSpanNo: '3',
            showUnitCostColumn: false,
            productColumnLabel: 'Product',
            costColumnLabel: 'Cost',
            quantityColumnLabel: 'Quantity',
            totalColumnLabel: 'Total',
            showDiscountRow: true,
            showTaxRow: true,
            showFeeRow: true,
            showPaymentMethod: true,
        },
        footer: {
            showFooter: false,
            footerText: '',
        },
    },

    // update receipt
    updateReceipt: {
        style: {
            padding: {
                top: '10',
                right: '10',
                bottom: '10',
                left: '10',
            },
            headingFontSize: '18',
            paragraphFontSize: '14',
        },
        logo: {
            id: '0',
            title: '',
            url: '',
            width: '220',
            height: '60',
        },
        header: {
            showOutletName: true,
            showOutletAddress: true,
            showOutletPhone: true,
            phoneLabel: 'Phone',
            showOutletEmail: true,
            emailLabel: 'Email',
            showOutletFax: false,
            faxLabel: 'Fax',
            showOutletWebsite: false,
            websiteLabel: 'Website',
            showOrderDate: true,
            showCashierInfo: true,
            cashierNameLabel: 'Served By',
            counterNameLabel: 'Counter No',
            showOrderId: true,
            orderIdLabel: 'Invoice number',
            showCustomerDetails: true,
            customerNameLabel: 'Customer Name',
            customerIdLabel: 'Customer ID',
            showVatNumber: true,
            vatNumberLabel: 'Vat/Tax No.',
            vatNumber: '3847393XXXXX',
            showOrderNote: false,
            orderNoteLabel: 'Note',
            orderNote: 'Order note text',
        },
        items: {
            colSpanNo: '3',
            showUnitCostColumn: false,
            productColumnLabel: 'Product',
            costColumnLabel: 'Cost',
            quantityColumnLabel: 'Quantity',
            totalColumnLabel: 'Total',
            showDiscountRow: true,
            showTaxRow: true,
            showFeeRow: true,
            showPaymentMethod: true,
        },
        footer: {
            showFooter: false,
            footerText: 'test footer text',
        },
    },

    // create outlet
    createOutlet: () => ({
        name: 'outlet_' + faker.string.nanoid(10),
        email: faker.string.nanoid(10) + '@yopmail.com',
        phone: faker.phone.number(),
        fax: faker.string.alphanumeric(10),
        website: faker.company.buzzNoun() + '.com',
        address_1: 'abc street',
        address_2: 'xyz street',
        country: 'US',
        state: 'NY',
        city: 'New York',
        postcode: '10006',
        meta: [],
    }),

    // create counter
    createCounter: () => ({
        name: 'counter_' + faker.string.nanoid(5),
        number: faker.string.numeric(5),
    }),

    // create cashier
    createCashier: () => ({
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        username: faker.person.firstName() + '_' + faker.string.nanoid(5),
        email: faker.internet.email(),
        website: 'cashier.com',
        phone: faker.phone.number(),
        password: USER_PASSWORD,
    }),

    // update cashier profile
    updateCashierProfile: () => ({
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        full_name: faker.person.firstName() + faker.person.lastName(),
        phone: faker.phone.number(),
    }),

    // login-logout cashier
    loginLogoutCashier: {
        outlet_id: '',
        counter_id: '',
    },

    // process payment
    processPayment: {
        id: '',
        payment_method: 'wepos_cash',
    },

    // admin profile
    adminProfile: {
        first_name: 'admin',
        last_name: 'a1',
        full_name: 'admin a1',
        phone: '0123456789',
    },

    // product

    createProduct: () => ({
        name: faker.commerce.productName() + ' (Simple)',
        type: 'simple',
        regular_price: faker.finance.amount({ min: 100, max: 200, dec: faker.helpers.arrayElement([0, 2]) }),
        status: 'publish',
        categories: [
            {
                // id: 48
                name: 'Uncategorized',
                slug: 'uncategorized',
            },
        ],
        featured: true,
        description: '<p>test description</p>',
        short_description: '<p>test short description</p>',
    }),

    updateProduct: () => ({ regular_price: faker.finance.amount({ min: 100, max: 200, dec: faker.helpers.arrayElement([0, 2]) }) }),

    // product category

    createCategoryRandom: () => ({
        name: faker.string.nanoid(5),
    }),

    createCategory: () => ({
        name: 'Electronics',
    }),

    // tags

    createTagsRandom: () => ({
        name: faker.string.nanoid(5),
    }),

    createTag: () => ({
        name: 'Gadgets',
    }),

    // coupon

    createCoupon: () => ({
        code: 'VC_' + faker.string.nanoid(10),
        discount_type: faker.helpers.arrayElement(['percent', 'fixed_product']),
        amount: faker.number.int({ min: 1, max: 10 }).toString(),
        product_ids: [15],
        individual_use: false,
        meta_data: [
            {
                key: 'apply_before_tax',
                value: 'no',
            },
            {
                key: 'apply_new_products',
                value: 'yes',
            },
            {
                key: 'show_on_store',
                value: 'yes',
            },
        ],
    }),

    createCoupon1: {
        code: 'c1_v1',
        discount_type: 'percent',
        amount: '10',
        product_ids: [],
        individual_use: false,
        meta_data: [
            {
                key: 'apply_before_tax',
                value: 'no',
            },
            {
                key: 'apply_new_products',
                value: 'yes',
            },
            {
                key: 'show_on_store',
                value: 'yes',
            },
        ],
    },

    updateCoupon: () => ({ amount: faker.number.int({ min: 1, max: 10 }).toString() }),

    // order

    updateOrder: {
        status: 'wc-pending',
    },

    createOrder: {
        // payment_method: 'bacs',
        // payment_method_title: 'Direct Bank Transfer',
        payment_method: 'wepos_cash',
        payment_method_title: 'Cash',
        status: 'completed',
        set_paid: true,
        customer_id: 0,
        billing: {
            first_name: 'customer1',
            last_name: 'c1',
            address_1: 'abc street',
            address_2: 'xyz street',
            city: 'New York',
            state: 'NY',
            postcode: '10003',
            country: 'US',
            email: 'customer1@yopmail.com',
            phone: '(555) 555-5555',
        },

        shipping: {
            first_name: 'customer1',
            last_name: 'c1',
            address_1: 'abc street',
            address_2: 'xyz street',
            city: 'New York',
            state: 'NY',
            postcode: '10003',
            country: 'US',
        },

        line_items: [
            {
                product_id: '',
                quantity: 1,
            },
            // {
            //     product_id: '',
            //     quantity: 1,
            // },
        ],

        shipping_lines: [
            {
                method_id: 'flat_rate',
                method_title: 'Flat Rate',
                total: '10.00',
            },
        ],

        coupon_lines: [],
        meta_data: [
            {
                key: '_wepos_is_pos_order',
                value: true,
            },
            {
                key: '_wepos_cash_tendered_amount',
                value: '0',
            },
            {
                key: '_wepos_cash_change_amount',
                value: '0',
            },
            {
                key: '_wepos_cashier_id',
                value: '',
            },
            {
                key: '_wepos_counter_id',
                value: '',
            },
            {
                key: '_wepos_outlet_id',
                value: '',
            },
        ],
    },

    createOrderNote: {
        note: 'test order note',
    },

    createOrderNoteForCustomer: {
        note: 'test order note' + faker.string.nanoid(10),
        customer_note: 'true',
    },

    // user

    createUser: () => ({
        username: faker.person.firstName() + '_' + faker.string.nanoid(5),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        roles: 'customer',
        password: USER_PASSWORD,
    }),

    //cashier user
    cashier: {
        username: 'admin2',
        first_name: 'admin2',
        last_name: 'a2',
        full_name: 'admin2 a2',
        email: 'admin2' + '@yopmail.com',
        roles: 'administrator',
        password: USER_PASSWORD,
    },

    // site settings

    siteSettings: {
        // title        : 'wepos',
        // description  : 'Just another WordPress site',
        // url          : 'http://wepos.test',
        // email        : 'shashwata@wedevs.com',
        timezone: 'Asia/Dhaka',
        date_format: 'F j, Y',
        time_format: 'g:i a',
        start_of_week: 1,
        language: '',
        // use_smilies           : true,
        // default_category      : 1,
        // default_post_format   : '0',
        // posts_per_page        : 10,
        // show_on_front         : 'posts',
        // page_on_front         : 0,
        // page_for_posts        : 0,
        // default_ping_status   : 'open',
        // default_comment_status: 'open',
        // site_logo             : 0,
        // site_icon             : 0
    },

    // shipping

    createShippingZone: {
        name: 'US',
        order: 0,
    },

    addShippingZoneLocation: [
        {
            code: 'US',
            type: 'country',
        },
    ],

    addShippingMethodFlatRate: {
        method_id: 'flat_rate',
    },

    addShippingMethodFreeShipping: {
        method_id: 'free_shipping',
    },

    addShippingMethodLocalPickup: {
        method_id: 'local_pickup',
    },

    // woocommerce settings: general , products, tax, shipping, checkout, account

    // general

    general: {
        update: [
            // store address
            {
                id: 'woocommerce_store_address',
                // label: 'Address line 1',
                value: 'abc street',
            },
            {
                id: 'woocommerce_store_address_2',
                // label: 'Address line 2',
                value: 'xyz street',
            },
            {
                id: 'woocommerce_store_city',
                // label: 'City',
                value: 'New York',
            },
            {
                id: 'woocommerce_default_country',
                // label: 'Country / State',
                value: 'US:NY',
            },
            {
                id: 'woocommerce_store_postcode',
                // label: 'Postcode / ZIP',
                value: '10006',
            },

            // general options
            {
                id: 'woocommerce_allowed_countries',
                // label: 'Selling location(s)',
                value: 'all', // 'all', 'all_except', 'specific'
            },
            {
                id: 'woocommerce_ship_to_countries',
                // label: 'Shipping location(s)',
                value: '', // '', 'specific', 'disabled'
            },
            {
                id: 'woocommerce_default_customer_address',
                // label: 'Default customer location',
                value: 'base', // '', 'base', 'geolocation', 'geolocation_ajax'
            },
            {
                id: 'woocommerce_calc_taxes',
                // label: 'Enable taxes',
                value: 'yes',
                // value: 'no',
            },
            {
                id: 'woocommerce_enable_coupons',
                // label: 'Enable coupons',
                value: 'yes',
            },

            // currency options
            {
                id: 'woocommerce_currency',
                // label: 'Currency',
                value: 'USD',
            },
            {
                id: 'woocommerce_currency_pos',
                // label: 'Currency position',
                value: 'left', // 'left', 'right', 'left_space', 'right_space'
            },
            {
                id: 'woocommerce_price_thousand_sep',
                // label: 'Thousand separator',
                value: '.',
                // value: '.',
            },

            {
                id: 'woocommerce_price_decimal_sep',
                // label: 'Decimal separator',
                value: ',',
                // value: ',',
            },
            {
                id: 'woocommerce_price_num_decimals',
                // label: 'Number of decimals',
                value: '2',
                // value: '4',
            },
        ],
    },

    // enable tax rate
    enableTaxRate: {
        update: [
            {
                id: 'woocommerce_calc_taxes',
                // label: 'Enable taxes',
                value: 'yes',
                // value: 'no',
            },
        ],
    },

    // create tax rate
    createTaxRate: {
        country: '',
        state: '',
        postcode: '',
        city: '',
        rate: '5',
        name: 'Tax',
        priority: 1,
        compound: false,
        shipping: true,
        order: 0,
        class: 'standard',
        postcodes: [],
        cities: [],
    },

    // account

    account: {
        update: [
            // Guest checkout
            {
                id: 'woocommerce_enable_guest_checkout',
                // description: "Allow customers to place orders without an account",
                value: 'yes',
            },
            {
                id: 'woocommerce_enable_checkout_login_reminder',
                // description: "Allow customers to log into an existing account during checkout",
                value: 'yes',
            },

            // Account creation
            {
                id: 'woocommerce_enable_signup_and_login_from_checkout',
                // description: "Allow customers to create an account during checkout",
                value: 'yes',
            },
            // {
            // 	id: 'woocommerce_enable_signup_from_checkout_for_subscriptions',
            // description: "Allow subscription customers to create an account during checkout",
            // 	value: 'yes',
            // },
            {
                id: 'woocommerce_enable_myaccount_registration',
                // description: "Allow customers to create an account on the \"My account\" page",
                value: 'yes',
            },
            {
                id: 'woocommerce_registration_generate_username',
                // description: "When creating an account, automatically generate an account username for the customer based on their name, surname or email",
                value: 'yes',
            },
            {
                id: 'woocommerce_registration_generate_password',
                // description: 'When creating an account, send the new user a link to set their password',
                value: 'no',
                // value: 'yes',
            },
        ],
    },

    bcs: {
        id: 'bacs',
        // title: 'Direct bank transfer',
        enabled: true,
        // method_title: 'Direct bank transfer',
    },

    cheque: {
        id: 'cheque',
        // title: 'Check payments',
        enabled: true,
        // method_title: 'Check payments',
    },
    cod: {
        id: 'cod',
        // title: 'Cash on delivery',
        enabled: true,
        // method_title: 'Cash on delivery',
    },

    // customer

    createCustomer: () => ({
        email: faker.internet.email(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        role: 'customer',
        username: faker.person.firstName() + faker.string.nanoid(5),
        password: String(USER_PASSWORD),
        billing: {
            first_name: faker.person.firstName(),
            last_name: faker.person.lastName(),
            company: '',
            address_1: 'abc street',
            address_2: 'xyz street',
            city: 'New York',
            postcode: '10003',
            country: 'US',
            state: 'NY',
            email: 'customer1@yopmail.com',
            phone: '0123456789',
        },
        shipping: {
            first_name: 'customer1',
            last_name: 'c1',
            company: '',
            address_1: 'abc street',
            address_2: 'xyz street',
            city: 'New York',
            postcode: '10003',
            country: 'US',
            state: 'NY',
            phone: '0123456789',
        },
    }),

    updateCustomer: () => ({
        email: faker.internet.email(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        role: 'customer',
        password: String(USER_PASSWORD),
        billing: {
            first_name: 'customer1',
            last_name: 'c1',
            company: '',
            address_1: 'abc street',
            address_2: 'xyz street',
            city: 'New York',
            postcode: '10003',
            country: 'US',
            state: 'NY',
            email: 'customer1@yopmail.com',
            phone: '0123456789',
        },
        shipping: {
            first_name: 'customer1',
            last_name: 'c1',
            company: '',
            address_1: 'abc street',
            address_2: 'xyz street',
            city: 'New York',
            postcode: '10003',
            country: 'US',
            state: 'NY',
            phone: '0123456789',
        },
    }),

    createCustomer1: {
        email: CUSTOMER + '@yopmail.com',
        first_name: CUSTOMER,
        last_name: 'c1',
        role: 'customer',
        username: CUSTOMER,
        password: USER_PASSWORD,
        billing: {
            first_name: CUSTOMER,
            last_name: 'c1',
            company: '',
            address_1: 'abc street',
            address_2: 'xyz street',
            city: 'New York',
            postcode: '10003',
            country: 'US',
            state: 'NY',
            email: CUSTOMER + '@yopmail.com',
            phone: '0123456789',
        },
        shipping: {
            first_name: CUSTOMER,
            last_name: 'c1',
            company: '',
            address_1: 'abc street',
            address_2: 'xyz street',
            city: 'New York',
            postcode: '10003',
            country: 'US',
            state: 'NY',
            phone: '0123456789',
        },
    },

    updateAddress: {
        billing: {
            first_name: faker.person.firstName(),
            last_name: faker.person.lastName(),
            company: '',
            address_1: 'abc street',
            address_2: 'xyz street',
            city: 'New York',
            postcode: '10003',
            country: 'US',
            state: 'NY',
            email: faker.person.firstName() + '@yopmail.com',
            phone: '0123456789',
        },
        shipping: {
            first_name: faker.person.firstName(),
            last_name: faker.person.lastName(),
            company: '',
            address_1: 'abc street',
            address_2: 'xyz street',
            city: 'New York',
            postcode: '10003',
            country: 'US',
            state: 'NY',
            phone: '0123456789',
        },
    },

    paramsForceDelete: {
        force: true,
    },

    paramsGetProductsWithPagination: {
        per_page: '10',
        page: '1',
    },
};
