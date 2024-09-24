export const selector = {
    // selectors
    frontend: {
        // fronted menus
        home: '//a[contains(text(),"Home")]',
        cart: '//a[contains(text(),"Cart")]',
        checkout: '//a[contains(text(),"Checkout")]',
        myAccount: '//a[contains(text(),"My account")]',
        shop: '//a[contains(text(),"Shop")]',

        // user login
        username: '#username',
        userPassword: '#password',
        rememberMe: '#rememberme',
        logIn: '//button[@value="Log in"]',
        lostPassword: '.woocommerce-LostPassword > a',

        // user logout
        customerLogout: '.woocommerce-MyAccount-navigation-link--customer-logout > a',
        vendorLogout: '.fa-power-off',

        // page not found
        pageNotFound: '//h1[text()="Oops! That page can’t be found."]',
    },

    backend: {
        // page not found
        pageNotFound: '//h1[text()="Oops! That page can’t be found."]',

        // setup
        alreadyInstalled: '//h1[contains(text(), "Already Installed")]',
        languageContinue: '#language-continue',
        letsGo: '//a[contains(text(), "go!")]',

        // db setup
        dbName: '#dbname',
        dbUserName: '#uname',
        dbPassword: '#pwd',
        dbHost: '#dbhost',
        dbTablePrefix: '#prefix',
        submit: '.step input',
        runTheInstallation: '.step a',

        // site info
        siteTitle: '#weblog_title',
        adminUserName: '#user_login',
        adminPassword: '#pass1',
        adminEmail: '#admin_email',
        searchEngineVisibility: '#blog_public',
        installWp: '#submit',
        successLoginIn: '.step a',

        // admin login
        email: '#user_login',
        password: '#user_pass',
        rememberMe: '#rememberme',
        login: '#wp-submit',
        dashboardMenu: '.wp-first-item > .wp-menu-name',
        dashboardText: '.wrap h1',

        // admin logout
        userMenu: 'li#wp-admin-bar-my-account',
        logout: 'li#wp-admin-bar-logout a',

        // logout message
        logoutSuccessMessage: 'div#login-message p',

        // login error
        loginError: '#login_error',
    },

    wpMedia: {
        uploadFiles: '//div[@class="supports-drag-drop" and @style="position: relative;"]//button[@id="menu-item-upload"]',
        mediaLibrary: '//div[@class="supports-drag-drop" and @style="position: relative;"]//button[@id="menu-item-browse"]',
        // wp image upload
        wpUploadFiles: '#menu-item-upload',
        uploadedMedia: 'div.attachment-preview',
        uploadedMediaFirst: '(//div[@class="supports-drag-drop" and @style="position: relative;"]//div[contains(@class,"attachment-preview")])[1]',
        selectFiles: '//div[@class="supports-drag-drop" and @style="position: relative;"]//button[@class="browser button button-hero"]',
        selectFilesInput: '//div[@class="supports-drag-drop" and @style="position: relative;"]//input[@type="file"]',
        selectUploadedMedia: '(//div[@class="supports-drag-drop" and @style="position: relative;"]//h2[contains(text(),"Media list")]/..//ul//li/div)[1]',
        select: '//div[@class="supports-drag-drop" and @style="position: relative;"]//button[contains(@class, "media-button-select")]',
    },

    // admin

    admin: {
        // admin dashboard
        aDashboard: {
            // dashboard menus
            dashboard: '.wp-first-item .wp-menu-name',
            posts: '.menu-icon-post .wp-menu-name',
            media: '.menu-icon-media .wp-menu-name',
            pages: '.menu-icon-page .wp-menu-name',
            comments: '.menu-icon-comments .wp-menu-name',
            wooCommerce: '.toplevel_page_woocommerce .wp-menu-name',
            wepos: '.toplevel_page_wepos .wp-menu-name',
            appearance: '.menu-icon-appearance .wp-menu-name',
            plugins: '.menu-icon-plugins .wp-menu-name',
            users: '.menu-icon-users .wp-menu-name',
            tools: '.menu-icon-tools .wp-menu-name',
            settings: '.menu-icon-settings .wp-menu-name',
            // collapse menu
            collapseMenu: '#collapse-button',
        },

        // dashboard
        dashboard: {
            // menus
            home: '//li[@id="menu-dashboard"]//a[contains(text(),"Home")]',
            updates: '//li[@id="menu-dashboard"]//a[contains(text(),"Updates ")]',
        },

        // wepos
        wepos: {
            // wepos menus
            menus: {
                outlets: '//li[contains(@class,"toplevel_page_wepos")]//a[text()="Outlets"]',
                receipts: '//li[contains(@class,"toplevel_page_wepos")]//a[text()="Receipts"]',
                reports: '//li[contains(@class,"toplevel_page_wepos")]//a[text()="Reports"]',
                settings: '//li[contains(@class,"toplevel_page_wepos")]//a[text()="Settings"]',
                viewPos: '//li[contains(@class,"toplevel_page_wepos")]//a[text()="View POS"]',
                license: '//li[contains(@class,"toplevel_page_wepos")]//a[text()="License"]',
            },

            // outlets
            outlets: {
                outletsText: '//h2//span[text()="Outlets"]',
                addOutlet: '//a[contains(text(),"Add Outlet")]',
                noOutletsFound: 'div.no-outlet-found p',

                outlets: 'div.outlet',
                outletBody: {
                    outletHeader: 'div.outlet div.header',
                    outletContent: 'div.outlet div.content',
                    outletFooter: 'div.outlet div.footer',
                },

                outlet: (outletName: string) => `//div[@class='outlet']//h3[text()='${outletName}']/../../..`,

                outletContent: {
                    // outlet tabs
                    outletCounter: (outletName: string) => `//div[@class='outlet']//h3[text()='${outletName}']/../../..//div[@class="tabs"]//span[text()='Counter']/..`,
                    outletCashier: (outletName: string) => `//div[@class='outlet']//h3[text()='${outletName}']/../../..//div[@class="tabs"]//span[text()='Cashier']/..`,

                    // counter
                    counter: (counterName: string) => `//div[@class='counter-content']//span[text()='${counterName}']/../..`,
                    editCounter: (counterName: string) => `//div[@class='counter-content']//span[text()='${counterName}']/../..//span[@class="flaticon-circle-edit"]/..`,
                    deleteCounter: (counterName: string) => `//div[@class='counter-content']//span[text()='${counterName}']/../..//span[@class="flaticon-delete"]/..`,

                    // cashier
                    cashier: (counterName: string) => `//div[@class='cashier-content']//span[text()='${counterName}']/../..`,
                    deleteCashier: (counterName: string) => `//div[@class='cashier-content']//span[text()='${counterName}']/../..//span[@class="flaticon-delete"]/..`,

                    cancelDelete: '//div[@class="confirm-action"]//button[text()="Cancel"]',
                    confirmDelete: '//div[@class="confirm-action"]//button[text()="Delete"]',
                },

                // outlet details
                outletDetails: {
                    outletName: '//input[@placeholder="Outlet Name"]',
                    outletLocation: {
                        address1: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Address 1")]',
                        address2: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Address 2")]',
                        countryDropdown: 'div.outlet-country div.multiselect__select',
                        countryInput: 'div.outlet-country input.multiselect__input',
                        searchedCountry: 'div.outlet-country span.multiselect__option--highlight',
                        stateDropdown: 'div.outlet-state div.multiselect__select',
                        stateInput: 'div.outlet-state input.multiselect__input',
                        searchedState: 'div.outlet-state span.multiselect__option--highlight',
                        state: '//div[@class="wepos-modal"]//input[contains(@placeholder,"State")]',
                        city: '//div[@class="wepos-modal"]//input[contains(@placeholder,"City")]',
                        zipCode: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Postal/Zip Code")]',
                    },

                    // contact details
                    contactDetails: {
                        email: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Email")]',
                        phone: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Phone")]',
                        fax: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Fax")]',
                        website: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Website")]',
                    },
                },

                createOutlet: '//button[text()="Create Outlet"]',
                updateOutlet: '//button[text()="Update Outlet"]',

                outletMoreOption: (outletName: string) => `//div[@class='outlet']//h3[text()='${outletName}']/../../..//div[@class="v-popover"]`,
                outletMoreOptions: {
                    addCounter: '//div[contains(@class,"wepos-outlet-settings")]//a[contains(text(),"Add Counter")]',
                    addCashier: '//div[contains(@class,"wepos-outlet-settings")]//a[contains(text(),"Add Cashier")]',
                    editOutlet: '//div[contains(@class,"wepos-outlet-settings")]//a[contains(text(),"Edit")]',
                    deleteOutlet: '//div[contains(@class,"wepos-outlet-settings")]//a[contains(text(),"Delete")]',
                },

                addCounter: 'div.counter-content a',
                counter: {
                    name: '//div[@class="wepos-modal"]//input[@placeholder="Counter Name"]',
                    number: '//div[@class="wepos-modal"]//input[@placeholder="Counter Number"]',
                    addCounter: '//div[@class="wepos-modal"]//button[text()="Create Counter"]',
                    updateCounter: '//div[@class="wepos-modal"]//button[text()="Update Counter"]',
                },

                addCashier: 'div.cashier-content a',
                cashier: {
                    cashierDropdown: 'div.wepos-new-cashier-form  div.multiselect__select',
                    cashierInput: 'input.multiselect__input',
                    searchedCashier: 'span.multiselect__option--highlight',

                    createCashier: 'a.create-new-cashier-link',

                    // cashier details
                    cashierDetails: {
                        firstName: '//div[@class="wepos-modal"]//input[contains(@placeholder,"First name")]',
                        lastName: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Last Name")]',
                        email: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Email")]',
                        phone: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Phone")]',
                        website: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Website")]',
                        create: '//div[@class="wepos-modal"]//button[text()="Create Cashier"]',
                    },

                    assignCashier: '//div[@class="wepos-modal"]//button[text()="Assign Cashiers"]',
                },
            },

            // receipts
            receipts: {
                receiptsText: '//span[text()="Receipt Settings"]',
                backToOutlets: '//a[contains(text(), "Back to Outlets")]',
                saveReceipt: '//button[text()="Save Receipt"]',

                receiptSection: 'div.preivew-section',
                settingsSection: 'div.settings-section',

                receiptPage: 'div.preivew-section div.receipt-page',

                // sections
                sections: {
                    stylesSection: '//h2[text()="Styles"]/..//span',
                    headerDetailsSection: '//h2[text()="Header Details"]/..//span',
                    itemDetailsSection: '//h2[text()="Items Details"]/..//span',
                    footerDetailsSection: '//h2[text()="Footer Details"]/..//span',
                },

                // logo settings
                logoDetails: {
                    uploadLogo: 'div.image',
                    uploadedImage: '//img/../..//div[@class="image"]',
                    height: 'div.height input',
                    width: 'div.width input',
                },

                // style settings
                styleDetails: {
                    paddingTop: '//div[text()="Padding (px)"]/..//input[1]',
                    paddingRight: '//div[text()="Padding (px)"]/..//input[2]',
                    paddingBottom: '//div[text()="Padding (px)"]/..//input[3]',
                    paddingLeft: '//div[text()="Padding (px)"]/..//input[4]',
                    headerFontSize: '//div[text()="Heading Font Size (px)"]/..//input',
                    paragraphFontSize: '//div[text()="Paragraph Font Size (px)"]/..//input',
                },

                // header details
                headersDetails: {
                    showOutletName: '//div[text()="Show Outlet Name"]/..//label',
                    showOutletPhone: '//div[text()="Show Outlet Phone"]/..//label',
                    phoneLabel: '//div[text()="Phone Label"]/..//input',
                    showOutletEmail: '//div[text()="Show Outlet Email"]/..//label',
                    emailLabel: '//div[text()="Email Label"]/..//input',
                    showOutletFaxNumber: '//div[text()="Show Outlet Fax Number"]/..//label',
                    showOutletWebsite: '//div[text()="Show Outlet Website"]/..//label',
                    showOutletAddress: '//div[text()="Show Outlet Address"]/..//label',
                    showCashierCounterInfo: '//div[text()="Show Cashier/Counter Info"]/..//label',
                    cashierNameLabel: '//div[text()="Cashier Name Label"]/..//input',
                    counterNameLabel: '//div[text()="Counter Name Label"]/..//input',
                    showOrderDate: '//div[text()="Show Order Date"]/..//label',
                    showOrderInvoiceNumber: '//div[text()="Show Order/Invoice Number"]/..//label',
                    invoiceIdLabel: '//div[text()="Invoice/Order ID Label"]/..//input',
                    showCustomerInfo: '//div[text()="Show Customer Info"]/..//label',
                    customerNameLabel: '//div[text()="Customer Name Label"]/..//input',
                    counterIdLabel: '//div[text()="Counter ID Label"]/..//input',
                    showTaxNumber: '//div[text()="Show Vat/Tax Number"]/..//label',
                    taxLabel: '//div[text()="Vat/Tax Label"]/..//input',
                    taxNumber: '//div[text()="Vat/Tax Number"]/..//input',
                    showOrderNote: '//div[text()="Show Order Note"]/..//label',
                },

                // item details
                itemDetails: {
                    showUnitCostColumn: '//div[text()="Show Unit Cost Column"]/..//label',
                    productColumnLabel: '//div[text()="Product Column Label"]/..//input',
                    unitCostColumnLabel: '//div[text()="Unit Cost Column Label"]/..//input',
                    quantityColumnLabel: '//div[text()="Quantity Column Label"]/..//input',
                    totalColumnLabel: '//div[text()="Total Column Label"]/..//input',
                    showDiscountRow: '//div[text()="Show Discount Row"]/..//label',
                    showTaxRow: '//div[text()="Show Tax Row"]/..//label',
                    showFeeRow: '//div[text()="Show Fee Row"]/..//label',
                    showPaymentMethod: '//div[text()="Show Payment Method"]/..//label',
                },

                // footer details
                footerDetails: {
                    showFooterSection: '//div[text()="Show Footer section"]/..//label',
                    footerIframe: '//div[text()="Footer Text"]/..//iframe',
                    footerHtmlBody: '#tinymce',
                },
            },

            // reports
            reports: {
                reportText: '//h1[text()="Reports"]',
                exportReport: 'div.reports-filtering-buttons button.export-btn',

                // filters
                filterReport: 'div.reports-filtering-buttons button.filter-btn',
                filterSection: 'div.reports-filtering-section',
                filters: {
                    filterByPaymentMethod: '(//span[@class="select2-selection__arrow"])[1]',
                    filterByCustomer: '(//span[@class="select2-selection__arrow"])[2]',
                    filterByOutlet: '(//span[@class="select2-selection__arrow"])[3]',
                    filterByCashier: '(//span[@class="select2-selection__arrow"])[4]',
                    filterInput: '.select2-search.select2-search--dropdown .select2-search__field',
                    result: (value: string) => `//li[contains(@class, "select2-results__option select2-results__option--selectable") and contains(text(),"${value}")]`,
                    closeFilteredResult: 'button[class="select2-selection__clear"]',
                    reset: 'a.filtering-reset-btn',
                },

                overview: {
                    salesAmount: '//div[@class="overview-section"]//div[@class="summary-single summary-amount"]',
                    totalItems: '//div[@class="overview-section"]//div[@class="summary-single summary-order-qty"]',
                    totalOrders: '//div[@class="overview-section"]//div[@class="summary-single summary-order-qty"]',
                    chart: 'canvas#line-chart',
                },

                noReports: 'div.no-reports',
                reportsTable: 'table.reports-table',
            },

            // settings
            settings: {
                settingsText: '//h2[text()="Settings"]',

                sections: {
                    settingsMenuSection: 'div.wepos-settings h2.nav-tab-wrapper',
                    settingsMenuDetailsSection: 'div.wepos-settings div.metabox-holder',
                },

                saveChanges: (type: string) => `div#wepos_${type} input#submit`,
                saveSuccessMessage: 'div#setting-message_updated',

                // setting menus
                menus: {
                    general: '//a[contains(@class, "nav-tab") and contains(text(),"General")]',
                    receipts: '//a[contains(@class, "nav-tab") and contains(text(),"Receipts")]',
                },

                general: {
                    calculateTaxForFee: 'select#wepos_general\\[enable_fee_tax\\]', // yes, no
                    barcodeScannerField: 'select#wepos_general\\[barcode_scanner_field\\]', // id, sku, custom
                },

                receipts: {
                    headerIframe: 'tr.receipt_header iframe',
                    headerHtmlBody: '#tinymce',
                    footerIframe: 'tr.receipt_footer iframe',
                    footerHtmlBody: '#tinymce',
                },
            },

            modal: {
                modal: 'div.wepos-modal ',
                modalContent: 'div.wepos-modal div.wepos-modal-content',
                closeModal: 'span.modal-close',
            },

            viewPos: {
                loginForm: 'div.wepos-entrance-form',
                outlet: 'select#outlet',
                counter: 'select#counter',
                goToPos: 'input[value="Go to POS"]',
                backToMainSite: '.footer a',

                //sidebar
                sideBar: {
                    sidebar: 'div.wepos-sidebar-nav',
                    cashierAvatar: 'div.wepos-sidebar-nav div.avatar',

                    //menus
                    home: '//li//span[contains(text(),"Home")]/..',
                    products: '//li//span[contains(text(),"Products")]/..',
                    orders: '//li//span[contains(text(),"Orders")]/..',
                    customers: '//li//span[contains(text(),"Customers")]/..',
                    settings: '//li//span[contains(text(),"Settings")]/..',
                    help: '//li//span[contains(text(),"Help")]/..',
                    logout: '//span[contains(text(),"Logout")]',
                },

                // products
                products: {
                    productsText: '//h1[text()="Products"]',
                    searchProduct: 'div.wepos-search input[name="search"]',
                    bulkAction: 'div.wepos-simple-select select', // delete
                    apply: 'button.bulk-action-btn',

                    productTable: 'table.wepos-table',

                    allRows: '(//table[@class="wepos-table"]//tr//input)[1]',
                    productRow: (productName: string) => `//td[@class="name" and text()="${productName}"]/..`,
                    productCheckBox: (productName: string) => `//td[@class="name" and text()="${productName}"]/..//td//input[@name="check_all"]`,
                    productRowAction: (productName: string) => `//td[@class="name" and text()='${productName}']/..//td[@class="action"]`,
                    editProduct: '//a[.="Edit"]',
                    deleteProduct: '//a[.="Delete"]',

                    quickEdit: {
                        title: 'section.product-edit-content #title',

                        categoryDropdown: '//label[text()="Categories"]/..//div[@class="multiselect__select"]',
                        categoryInput: '//label[text()="Categories"]/..//input[@class="multiselect__input"]',
                        searchedCategory: '//label[text()="Categories"]/..//span[@class="multiselect__option multiselect__option--highlight"]',

                        tagsDropdown: '//label[text()="Tags"]/..//div[@class="multiselect__select"]',
                        tagsInput: '//label[text()="Tags"]/..//input[@class="multiselect__input"]',
                        searchedTags: '//label[text()="Tags"]/..//span[@class="multiselect__option multiselect__option--highlight"]',

                        sku: 'section.product-edit-content #sku',
                        price: 'section.product-edit-content #price',
                        salePrice: 'section.product-edit-content #sale_price',
                        weight: 'section.product-edit-content #weight',
                        visibility: '//label[text()="Visibility"]/..//select', // visible, catalog, search, hidden
                        manageStocks: 'section.product-edit-content #manage_stock',
                        stockQuantity: 'section.product-edit-content #stock_qty',
                        allowBackOrders: '//label[text()="Allow backorders?"]/..//select', // no, notify, yes
                    },

                    cancel: '//footer//button[text()="Cancel"]',
                    update: '//footer//button[text()="Update"]',

                    pagination: 'ul.pagination',

                    productDeleteMessage: '//h2[normalize-space()="Product has been deleted."]',
                },

                // orders
                orders: {
                    ordersText: '//h1[text()="Orders"]',

                    searchOrder: 'div.wepos-search input[name="search"]',
                    bulkAction: 'div.wepos-simple-select select', // delete, edit
                    apply: 'button.bulk-action-btn',

                    filter: 'div.order-date-filter button',
                    filters: {
                        filterByDate: '//input[@placeholder="Date range"]',
                        filterByCustomer: {
                            customerDropdown: 'div.multiselect__select',
                            customerInput: 'input.multiselect__input',
                            searchedCustomer: 'span.multiselect__option--highlight',
                        },
                        filterByStatus: (status: string) => `//ul[@class="order-statuses"]//li//a[contains(text(),"${status}")]`,
                        filterByCustomerDropdown: 'div.category div.multiselect__select',
                        customerInput: 'input.multiselect__input',
                        searchedCustomer: 'span.multiselect__option--highlight',
                        filter: '//button[text()="Filter"]',
                    },

                    orderTable: 'table.wepos-table',
                    numberOfRowsFound: 'table.wepos-table tbody tr',
                    orderRowByCustomer: (customer: string) => `//td[contains(text(),"${customer}")]/..`,
                    orderRowByStatus: (status: string) => `//td[text()[normalize-space()='${status}']]/..`,
                    orderRow: (orderNumber: string) => `//a[contains(text(),'Order ${orderNumber}')]/../..`,
                    orderCheckBox: (orderNumber: string) => `//a[contains(text(),'Order ${orderNumber}')]/../..//td//input[@name="check_all"]`,
                    orderRowAction: (orderNumber: string) => `//a[contains(text(),'Order ${orderNumber}')]/../..//td[@class="action"]//button`,

                    viewOrderDetails: '//a[contains(text(),"View Details")]',
                    refund: '//a[text()="Refund"]',

                    // order details
                    orderDetails: {
                        ordersText: '//h1[text()="Orders"]',

                        sections: {
                            oderDetails: '(//h3[contains(text(),"Order")]/../..)[1]',
                            billingAddress: '//h3[text()="Billing Address"]/../..',
                            shippingAddress: '//h3[text()="Shipping Address"]/../..',
                            generalDetails: '//h3[text()="General Details"]/../..',
                            orderNoteDiv: '//h3[text()="Order Notes"]/../..',
                        },

                        deleteNote: (note: string) => `//p[text()='${note}']/..//button[text()[normalize-space()='Delete Note']]`,
                        orderNoteInput: '//p[text()="Add Note"]/..//textarea', // Customer Note, Admin Note
                        orderNoteType: '//p[text()="Add Note"]/..//select',
                        addNote: '//button[text()[normalize-space()="Add Note"]]',

                        orderNoteCreated: '//h2[text()="Order note created."]',
                        orderNoteDeleted: '//h2[text()="Order note deleted."]',
                    },

                    allRows: '(//table[@class="wepos-table"]//tr//input)[1]',

                    pagination: 'ul.pagination',
                },

                // customers
                customers: {
                    customerText: '//h1[text()[normalize-space()="Customers"]]',
                    addNewCustomer: '//button[text()[normalize-space()="Add New Customer"]]',
                    searchCustomer: 'div.wepos-search input[name="search"]',
                    bulkAction: 'div.wepos-simple-select select', // delete
                    apply: 'button.bulk-action-btn',

                    customerTable: 'table.wepos-table',
                    allRows: '(//table[@class="wepos-table"]//tr//input)[1]',
                    customerRowByEmail: (customerEmail: string) => `//td[@class="email" and text()="${customerEmail}"]/..`,
                    customerCheckBox: (customerEmail: string) => `//td[@class="email" and text()="${customerEmail}"]/..//td//input[@name="check_all"]`,
                    customerRowAction: (customerEmail: string) => `//td[@class="email" and text()='${customerEmail}']/..//td[@class="action"]`,
                    editCustomer: '//a[.="Edit"]',
                    deleteCustomer: '//a[.="Delete"]',

                    pagination: 'ul.pagination',

                    customerAddMessage: '//h2[normalize-space()="New customer added."]',
                    customerUpdateMessage: '//h2[normalize-space()="Customer information updated."]',
                    customerDeleteMessage: '//h2[normalize-space()="Customer has been deleted."]',
                    customerBatchUpdateMessage: '//h2[normalize-space()="Customers have been deleted."]',
                },

                settings: {
                    firstName: '#first_name',
                    lastName: '#last_name',
                    phone: '#phone',
                    address: '#address',
                    update: '//button[text()[normalize-space()="Update"]]',
                },

                //pos sections
                posSections: {
                    productContainer: 'div.content-product',
                    cartContainer: 'div.content-cart',
                },

                // search product
                searchProduct: 'input#product-search',
                searchedProduct: (productName: string) => `//li[@class='product-search-item selected']//a[contains(text(),'${productName}')]`,
                searchType: (type: string) => `//div[@class='search-type']//a[contains(text(),'${type}')]`, // Product, Scan

                // category
                categoryDropdown: 'div.category div.multiselect__select',
                categoryInput: 'input.multiselect__input',
                uncategorized: '//span[text()[normalize-space()="Uncategorized"]]/..',
                searchedCategory: 'span.multiselect__option--highlight',
                selectedCategory: (category: string) => `//a[contains(text(),'${category}')]/../..//li[@class='router-link-exact-active router-link-active']`,

                // view style
                layoutStyle: (style: string) => `.toggle-view .${style}-view`, // list, grid

                // product container
                productContainer: '.items-wrapper',

                // search customer
                searchCustomer: 'input#customer-search',
                searchedCustomer: '//li[@class="customer-search-item selected"]//span[contains(@class,"name")]',

                // add new customer
                addNewCustomer: 'span.add-new-customer',
                customerDetails: {
                    firstName: '//div[@class="wepos-modal"]//input[contains(@placeholder,"First Name")]',
                    lastName: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Last Name")]',
                    email: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Email")] ',
                    address1: ' //div[@class="wepos-modal"]//input[contains(@placeholder,"Address 1")]',
                    address2: ' //div[@class="wepos-modal"]//input[contains(@placeholder,"Address 2")]',
                    countryDropdown: 'div.customer-country div.multiselect__select',
                    countryInput: 'div.customer-country input.multiselect__input',
                    searchedCountry: 'div.customer-country span.multiselect__option--highlight',
                    stateDropdown: 'div.customer-state div.multiselect__select',
                    stateInput: 'div.customer-state input.multiselect__input',
                    searchedState: 'div.customer-state span.multiselect__option--highlight',

                    city: '//div[@class="wepos-modal"]//input[contains(@placeholder,"City")]',
                    zipCode: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Zip/Postal Code")]',
                    phone: '//div[@class="wepos-modal"]//input[contains(@placeholder,"Phone")]',
                    addCustomer: 'button.add-new-customer-btn',
                },

                // more options
                moreOption: 'div.more-options button.wepos-button',
                moreOptions: {
                    emptyCart: '//a[.="Empty Cart"]',
                    help: '//a[.="Help"]',
                    switchCounter: '//a[.="Switch Counter"]',
                    logout: '//a[.="Logout"]',
                },

                shortcutKeys: '//h2[text()="Shortcut Keys"]',

                // cart
                cart: {
                    cart: 'div.content-cart',
                    emptyCart: '//table[@class="cart-table"]//p[text()="Empty Cart"]',
                    cartTitle: 'span.cart-title',
                    cartProduct: (productName: string) => `//tbody//tr//td[text()[normalize-space()='${productName}']]`,
                    cartProductQuantity: (productName: string) => `//tbody//tr//td[text()[normalize-space()='${productName}']]/..//td[@class='qty']`,
                    removeCartProduct: (productName: string) => `//tbody//tr//td[text()[normalize-space()='${productName}']]/..//td[@class='remove']`,
                    editCartProduct: (productName: string) => `//tbody//tr//td[text()[normalize-space()='${productName}']]/..//td[@class='action']`,
                    productQuantityInput: (productName: string) => `//tbody//tr//td[text()[normalize-space()='${productName}']]/..//following-sibling::tr[@class='update-quantity-wrap'][1]//span[@class='qty-number']//input`,

                    // subtotal
                    subtotal: '//table[@class="cart-total-table"]//td[contains(text(), "Subtotal")]',

                    // cart options
                    addDiscount: '//tr[@class="cart-action"]//a[contains(text(),"Add Discount")]',
                    addFee: '//tr[@class="cart-action"]//a[contains(text(),"Add Fee")]',

                    feeDetails: {
                        feeInput: 'div.fee-keypad input',
                        feeType: (type: string) => `//button[@data-action="${type}"]`, //percent, flat
                        feeAmount: (type: string) => `//table[@class='cart-total-table']//td[contains(text(), '${type}')]//span[@class='name']`,
                    },

                    // add note
                    addNote: '//tr[@class="cart-action"]//a[contains(text(),"Add Note")]',
                    noteDetails: {
                        noteInput: 'div.customer-note textarea',
                        addNote: 'button.add-note-btn',
                    },
                    noteText: 'td.note-text',

                    payNow: 'tr.pay-now',
                },

                // sale summary
                saleSummary: {
                    payAmount: 'span.pay-amount',

                    byCash: '//div[@class="payment-gateway"]//input[@value="wepos_cash"]/..',
                    byCard: '//div[@class="payment-gateway"]//input[@value="wepos_card"]/..',

                    cashInput: 'input#input-cash-amount',

                    card: {
                        last4Digit: 'input#card-digits',
                        cardType: 'select#card-type', //visa, master, american_express, diners_club, discover, jcb, unionpay, others
                        invoiceNumber: 'input#card-invoice',
                    },

                    backToSale: 'div.footer a.back-btn',
                    processPayment: 'button.process-checkout-btn',

                    saleCompleted: '//h2[text()="Sale Completed"]',
                    printReceipt: 'button.print-btn',
                    newSale: 'button.new-sale-btn',
                },
            },

            // license
            license: {
                licenseText: '.appsero-license-settings-wrapper h1',

                activateSection: {
                    licenseSection: '.appsero-license-settings.appsero-license-section',
                    licenseKeyInput: '.license-input-fields .license-input-key input',
                    activateLicense: '//button[contains(text(),"Activate License")]',
                },

                deactivateLicense: 'button.deactive-button',
                refreshLicense: 'button.appsero-license-refresh-button',
                activateLicenseInfo: 'div.active-license-info',

                successNotice: 'div.notice-success.appsero-license-section',
                errorNotice: 'div.notice-error.appsero-license-section',
            },

            confirmAction: 'button.swal2-confirm',
            cancelAction: 'button.swal2-cancel',
        },
    },
};
