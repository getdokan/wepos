import { faker } from '@faker-js/faker';
import 'dotenv/config';

const { ADMIN, CUSTOMER, CASHIER, ADMIN_PASSWORD, USER_PASSWORD, LICENSE_KEY, SITE_PATH } = process.env;

interface user {
    username: string;
    password: string;
}

interface admin {
    username: string;
    password: string;
}

export { admin, user };

export const data = {
    envData: 'utils/data.json',

    systemInfo: 'playwright/systemInfo.json',

    auth: {
        adminAuthFile: 'playwright/.auth/adminStorageState.json',
        cashierAuthFile: 'playwright/.auth/cashierStorageState.json',

        adminAuth: {
            storageState: 'playwright/.auth/adminStorageState.json',
        },

        cashierAuth: {
            storageState: 'playwright/.auth/cashierStorageState.json',
        },

        noAuth: {
            storageState: { cookies: [], origins: [] },
        },
    },

    // keyboard key
    key: {
        arrowDown: 'ArrowDown',
        enter: 'Enter',
        home: 'Home',
        end: 'End',
    },

    // plugin
    plugin: {
        pluginsLite: ['basic-auth', 'wepos', 'woocommerce'],
        plugins: ['basic-auth', 'wepos', 'wepos-pro', 'woocommerce'],
        weposPro: ['wepos-pro'],
        activeClass: 'active',
        pluginName: {
            weposLite: 'wepos',
            weposPro: 'wepos-pro',
        },
    },

    // user
    user: {
        username: () => faker.person.firstName('male'),
        password: String(USER_PASSWORD),

        userDetails: {
            emailDomain: '@email.com',
            name: () => faker.person.firstName('male'),
            firstName: () => faker.person.firstName('male'),
            lastName: () => faker.person.lastName('male'),
            // email: faker.internet.email(),
            email: () => faker.person.firstName('male') + '@email.com',
            role: 'customer',
        },
    },

    // admin
    admin: {
        username: String(ADMIN),
        password: String(ADMIN_PASSWORD),
    },

    cashierUser: {
        username: String(CASHIER),
        password: String(USER_PASSWORD),
    },

    // customer details
    customerDetails: () => ({
        firstName: faker.person.firstName('male'),
        lastName: faker.person.lastName('male'),
        email: faker.person.firstName('male') + '@email.com',
        address1: 'abc street',
        address2: 'xyz street',
        country: 'United States (US)',
        state: 'New York',
        city: 'New York',
        zipCode: '10006',
        phone: faker.phone.number(),
    }),

    // wepos settings
    weposSettings: {
        // general settings
        general: {
            calculateTaxForFee: 'yes', // yes, no
            barcodeScannerField: 'sku', // id, sku, custom
            saveSuccessMessage: 'Setting has been saved successfully.',
        },

        // receipts settings
        receipts: {
            orderReceiptHeader: 'test header text',
            orderReceiptFooter: 'test footer text',
            saveSuccessMessage: 'Setting has been saved successfully.',
        },
    },

    // outlet
    outlet: () => ({
        outletName: 'outlet_' + faker.string.nanoid(10),

        address1: 'abc street',
        address2: 'xyz street',
        country: 'United States (US)',
        state: 'New York',
        city: 'New York',
        zipCode: '10006',

        email: faker.string.nanoid(10) + '@yopmail.com',
        phone: faker.phone.number(),
        fax: faker.string.alphanumeric(10),
        website: faker.company.buzzNoun() + '.com',
    }),

    // counter
    counter: () => ({
        name: 'counter_' + faker.string.nanoid(5),
        number: faker.string.numeric(5),
    }),

    // cashier
    cashier: () => ({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        website: 'cashier.com',
    }),

    productDetails: () => ({
        title: faker.commerce.productName() + ' (Simple)',
        category: 'Uncategorized',
        tag: 'simple',
        sku: faker.string.nanoid(10),
        price: faker.finance.amount({ min: 100, max: 200, dec: faker.helpers.arrayElement([0, 2]) }),
        weight: String(faker.number.int(100)),
        visibility: 'visible', // visible, catalog, search, hidden
        stockQuantity: String(faker.number.int(1000)),
        allowBackOrders: 'yes',
    }),

    cashierProfileDetails: {
        firstName: 'admin',
        lastName: 'a1',
        phone: '1234567890',
        address: 'abc street, New York, US',
    },

    paymentGateway: {
        name: 'cash',
        card: {
            customer: {
                customerEmail: CUSTOMER + '@yopmail.com',
                customerFullName: 'customer1 c1',
            },
            last4Digit: '4242',
            cardType: 'visa', //visa, master, american_express, diners_club, discover, jcb, unionpay, others
            invoiceNumber: '123456',
        },
    },

    // receipt
    receipt: {
        //  logo settings
        logoDetails: {
            logo: 'utils/sampleData/avatar.png',
            height: '50',
            width: '50',
        },

        // style settings
        styleDetails: {
            paddingTop: '10',
            paddingRight: '10',
            paddingBottom: '10',
            paddingLeft: '10',
            headerFontSize: '20',
            paragraphFontSize: '16',
        },

        // header details
        headersDetails: {
            phoneLabel: 'Phone',
            emailLabel: 'Email',
            cashierNameLabel: 'Served By',
            counterNameLabel: 'Counter No',
            invoiceIdLabel: 'Invoice number',
            customerNameLabel: 'Customer Name',
            counterIdLabel: 'Customer ID',
            taxLabel: 'Tax No',
            taxNumber: '1234567XXXXX',
        },

        // item details
        itemDetails: {
            productColumnLabel: 'Product',
            unitCostColumnLabel: 'Cost',
            quantityColumnLabel: 'Quantity',
            totalColumnLabel: 'Total',
        },

        footerDetails: {
            footerText: 'test footer text',
        },
    },

    // wepos license
    weposLicense: {
        correctKey: LICENSE_KEY,
        incorrectKey: 'ABC-123-DEF-456-GHI-789',
    },

    uniqueId: {
        uuid: faker.string.uuid(),
        nanoId: faker.string.nanoid(10),
    },

    // predefined test data
    predefined: {
        simpleProduct: {
            product1: {
                name: 'p1_a1',
                productName: () => 'p1_a1',
            },
        },

        customerInfo: {
            firstName: 'customer1',
            lastName: 'c1',
            fullName: 'customer1 c1',
            billingName: 'customer1 c1',
            username: 'customer1',
            email: CUSTOMER + '@yopmail.com',
        },

        category: 'Electronics',
        tag: 'Gadgets',
    },

    subUrls: {
        frontend: {
            myAccount: 'my-account',
        },

        ajax: '/admin-ajax.php',
        post: '/post.php',

        backend: {
            login: 'wp-login.php',
            adminLogin: 'wp-admin',
            adminLogout: 'wp-login.php?action=logout',
            adminDashboard: 'wp-admin',
            user: 'wp-admin/user-edit.php',
            setupWP: 'wp-admin/install.php',
            general: 'wp-admin/options-general.php',
            permalinks: 'wp-admin/options-permalink.php',
            plugins: 'wp-admin/plugins.php',
            activatePlugin: 'wp-admin/plugins.php?action=activate',
            deactivatePlugin: 'wp-admin/plugins.php?action=deactivate',
            widgets: 'wp-admin/widgets.php',
            editUser: (userId: string) => `wp-admin/user-edit.php?user_id=${userId}`,

            wepos: {
                outlets: 'wp-admin/admin.php?page=wepos#/outlets',
                receipts: 'wp-admin/admin.php?page=wepos#/receipts',
                reports: 'wp-admin/admin.php?page=wepos#/reports',
                settings: 'wp-admin/admin.php?page=wepos#/settings',
                viewPos: 'wepos/#/',
                license: 'wp-admin/admin.php?page=wepos-license',

                submenu: {
                    products: 'wepos/#/products',
                    orders: 'wepos/#/orders',
                    customers: 'wepos/#/customers',
                    settings: 'wepos/#/settings',
                    orderDetails: (orderId: string) => `wepos/#/orders/${orderId}`,
                },
            },

            wc: {
                products: 'wp-admin/edit.php?post_type=product',
                productDetails: (productId: string) => `wp-admin/post.php?post=${productId}&action=edit`,
                addNewProducts: 'wp-admin/post-new.php?post_type=product',
                addNewCategories: 'wp-admin/edit-tags.php?taxonomy=product_cat&post_type=product',
                addNewAttributes: 'wp-admin/edit.php?post_type=product&page=product_attributes',
                searchAttribute: 'wp-admin/admin-ajax.php?action=woocommerce_json_search_product_attributes',
                term: 'wp-admin/admin-ajax.php?term',
                taxonomyTerms: 'wp-admin/admin-ajax.php?action=woocommerce_json_search_taxonomy_terms',
                taxonomy: 'wp-admin/edit-tags.php?taxonomy',
                coupons: 'wp-admin/edit.php?post_type=shop_coupon',
                addCoupon: 'wp-admin/post-new.php?post_type=shop_coupon',
                orders: 'wp-admin/edit.php?post_type=shop_order',
                settings: 'wp-admin/admin.php?page=wc-settings',
            },
        },

        api: {
            wepos: {
                outlet: 'wepos/v1/outlets',
                receipts: 'wepos/v1/receipts',
                cashiers: 'wepos/v1/cashiers',
                payment: 'wepos/v1/payment',
                profile: 'wepos/v1/profile',
                products: 'wepos/v1/products',
                orders: 'wepos/v1/orders',
                customers: 'wepos/v1/customers',
                posDashboard: ['wepos/v1/settings', '/wepos/v1/taxes', 'wepos/v1/products', 'wepos/v1/payment/gateways', 'wepos/v1/receipts', 'wc/v3/products/categories'],
            },

            wc: {
                products: 'wc/v3/products',
                orders: 'wc/v3/orders',
                customers: 'wc/v3/customers',
                coupons: 'wepos/v1/coupons',
            },
        },
    },

    // image
    image: {
        avatar: 'utils/sampleData/avatar.png',
        wepos: 'utils/sampleData/wepos.png',
    },

    // command
    command: {
        permalink: 'npm run wp-env run tests-cli wp rewrite structure /%postname%/',
        permalinkLocal: `cd ${SITE_PATH} && wp rewrite structure /%postname%/ && wp rewrite flush`,
        activateTheme: `cd ${SITE_PATH} && wp theme activate storefront`,
    },
};
