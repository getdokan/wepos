import 'dotenv/config';

const SERVER_URL = process.env.SERVER_URL ? process.env.SERVER_URL : process.env.BASE_URL + '/wp-json';

export const endPoints = {
    serverUrl: `${SERVER_URL}`,
    getAllWeposEndpointsV1: `${SERVER_URL}/wepos/v1`,

    // settings
    getWeposSettings: `${SERVER_URL}/wepos/v1/settings`,
    getTaxSettings: `${SERVER_URL}/wepos/v1/taxes`,

    // customers
    getAllCustomers: `${SERVER_URL}/wepos/v1/customers`,
    createCustomer: `${SERVER_URL}/wepos/v1/customers`,

    // coupons
    getAllCoupons: `${SERVER_URL}/wepos/v1/coupons`,
    getSingleCoupon: (couponId: string) => `${SERVER_URL}/wepos/v1/coupons/${couponId}`,
    createCoupon: `${SERVER_URL}/wepos/v1/coupons`,
    updateCoupon: (couponId: string) => `${SERVER_URL}/wepos/v1/coupons/${couponId}`,
    deleteCoupon: (couponId: string) => `${SERVER_URL}/wepos/v1/coupons/${couponId}`,
    updateBatchCoupons: `${SERVER_URL}/wepos/v1/coupons/batch`, // method: approved, pending, delete

    // products
    getAllProducts: `${SERVER_URL}/wepos/v1/products`,
    updateProduct: (productId: string) => `${SERVER_URL}/wepos/v1/products/${productId}`,

    // orders
    getAllOrders: `${SERVER_URL}/wepos/v1/orders`,
    getSingleOrder: (orderId: string) => `${SERVER_URL}/wepos/v1/orders/${orderId}`,

    // order notes
    getAllOrderNotes: (orderId: string) => `${SERVER_URL}/wepos/v1/orders/${orderId}/notes`,
    createOrderNote: (orderId: string) => `${SERVER_URL}/wepos/v1/orders/${orderId}/notes`,
    deleteOrderNote: (orderId: string, noteId: string) => `${SERVER_URL}/wepos/v1/orders/${orderId}/notes/${noteId}`,

    // outlets
    getAllOutlets: `${SERVER_URL}/wepos/v1/outlets`,
    createOutlet: `${SERVER_URL}/wepos/v1/outlets`,
    updateOutlet: (outletId: string) => `${SERVER_URL}/wepos/v1/outlets/${outletId}`,
    deleteOutlet: (outletId: string) => `${SERVER_URL}/wepos/v1/outlets/${outletId}`,

    // counters
    createCounter: (outletId: string) => `${SERVER_URL}/wepos/v1/outlets/${outletId}/counters`,
    updateCounter: (outletId: string, counterId: string) => `${SERVER_URL}/wepos/v1/outlets/${outletId}/counters/${counterId}`,
    deleteCounter: (outletId: string, counterId: string) => `${SERVER_URL}/wepos/v1/outlets/${outletId}/counters/${counterId}`,

    // cashiers
    getSingleCashier: (cashierId: string) => `${SERVER_URL}/wepos/v1/cashiers/${cashierId}`,
    createCashier: (outletId: string) => `${SERVER_URL}/wepos/v1/outlets/${outletId}/cashiers/create`,
    assignCashier: (outletId: string) => `${SERVER_URL}/wepos/v1/outlets/${outletId}/cashiers`,
    deleteCashier: (outletId: string, cashierId: string) => `${SERVER_URL}/wepos/v1/outlets/${outletId}/cashiers/${cashierId}`,

    // cashier profile
    getCashierProfile: (cashierId: string) => `${SERVER_URL}/wepos/v1/profile/${cashierId}`,
    updateCashierProfile: (cashierId: string) => `${SERVER_URL}/wepos/v1/profile/${cashierId}`,

    // cashier login
    getLoginStatus: (cashierId: string) => `${SERVER_URL}/wepos/v1/cashiers/${cashierId}/login`,
    loginCashier: (cashierId: string) => `${SERVER_URL}/wepos/v1/cashiers/${cashierId}/login`,
    logoutCashier: (cashierId: string) => `${SERVER_URL}/wepos/v1/cashiers/${cashierId}/login`,

    // receipts
    getReceipt: `${SERVER_URL}/wepos/v1/receipts`,
    updateReceipt: `${SERVER_URL}/wepos/v1/receipts`,

    // payment
    getAllPaymentGateways: `${SERVER_URL}/wepos/v1/payment/gateways`,
    getPaymentSummary: `${SERVER_URL}/wepos/v1/payment/summary`,
    getPaymentReports: `${SERVER_URL}/wepos/v1/payment/reports`,
    getExportedReport: `${SERVER_URL}/wepos/v1/payment/reports/export`,
    processPayment: `${SERVER_URL}/wepos/v1/payment/process`,

    // wooCommerce
    wc: {
        // coupons
        getAllCoupons: `${SERVER_URL}/wc/v3/coupons`,
        getSingleCoupon: (couponId: string) => `${SERVER_URL}/wc/v3/coupons/${couponId}`,
        createCoupon: `${SERVER_URL}/wc/v3/coupons`,
        updateCoupon: (couponId: string) => `${SERVER_URL}/wc/v3/coupons/${couponId}`,
        deleteCoupon: (couponId: string) => `${SERVER_URL}/wc/v3/coupons/${couponId}`,
        updateBatchCoupons: `${SERVER_URL}/wc/v3/coupons/batch`,

        // customers
        getAllCustomers: `${SERVER_URL}/wc/v3/customers`,
        getSingleCustomer: (customerId: string) => `${SERVER_URL}/wc/v3/customers/${customerId}`,
        createCustomer: `${SERVER_URL}/wc/v3/customers`,
        updateCustomer: (customerId: string) => `${SERVER_URL}/wc/v3/customers/${customerId}`,
        deleteCustomer: (customerId: string) => `${SERVER_URL}/wc/v3/customers/${customerId}`,
        getCustomerDownloads: (customerId: string) => `${SERVER_URL}/wc/v3/customers/${customerId}/downloads`,
        updateBatchCustomers: `${SERVER_URL}/wc/v3/customers/batch`,

        // orders
        getAllOrders: `${SERVER_URL}/wc/v3/orders`,
        getSingleOrder: (orderId: string) => `${SERVER_URL}/wc/v3/orders/${orderId}`,
        createOrder: `${SERVER_URL}/wc/v3/orders`,
        updateOrder: (orderId: string) => `${SERVER_URL}/wc/v3/orders/${orderId}`,
        deleteOrder: (orderId: string) => `${SERVER_URL}/wc/v3/orders/${orderId}`,
        updateBatchOrders: `${SERVER_URL}/wc/v3/orders/batch`,

        // order notes
        getAllOrderNotes: (orderId: string) => `${SERVER_URL}/wc/v3/orders/${orderId}/notes`,
        getSingleOrderNote: (orderId: string, noteId: string) => `${SERVER_URL}/wc/v3/orders/${orderId}/notes/${noteId}`,
        createOrderNote: (orderId: string) => `${SERVER_URL}/wc/v3/orders/${orderId}/notes`,
        deleteOrderNote: (orderId: string, noteId: string) => `${SERVER_URL}/wc/v3/orders/${orderId}/notes/${noteId}`,

        // refunds
        getAllRefunds: (orderId: string) => `${SERVER_URL}/wc/v3/orders/${orderId}/refunds`,
        getSingleRefund: (orderId: string, refundId: string) => `${SERVER_URL}/wc/v3/orders/${orderId}/refunds/${refundId}`,
        createRefund: (orderId: string) => `${SERVER_URL}/wc/v3/orders/${orderId}/refunds`,
        deleteRefund: (orderId: string, refundId: string) => `${SERVER_URL}/wc/v3/orders/${orderId}/refunds/${refundId}`,

        // products
        getAllProducts: `${SERVER_URL}/wc/v3/products`,
        getSingleProduct: (productId: string) => `${SERVER_URL}/wc/v3/products/${productId}`,
        createProduct: `${SERVER_URL}/wc/v3/products`,
        updateProduct: (productId: string) => `${SERVER_URL}/wc/v3/products/${productId}`,
        deleteProduct: (productId: string) => `${SERVER_URL}/wc/v3/products/${productId}`,
        updateBatchProducts: `${SERVER_URL}/wc/v3/products/batch`,

        // product variations
        getAllProductVariations: (productId: string) => `${SERVER_URL}/wc/v3/products/${productId}/variations`,
        getSingleProductVariation: (productId: string, variationId: string) => `${SERVER_URL}/wc/v3/products/${productId}/variations/${variationId}`,
        createProductVariation: (productId: string) => `${SERVER_URL}/wc/v3/products/${productId}/variations`,
        updateProductVariation: (productId: string, variationId: string) => `${SERVER_URL}/wc/v3/products/${productId}/variations/${variationId}`,
        deleteProductVariation: (productId: string, variationId: string) => `${SERVER_URL}/wc/v3/products/${productId}/variations/${variationId}`,
        updateBatchProductVariations: (productId: string) => `${SERVER_URL}/wc/v3/products/${productId}/variations/batch`,

        // product attributes
        getAllAttributes: `${SERVER_URL}/wc/v3/products/attributes`,
        getSingleAttribute: (attributeId: string) => `${SERVER_URL}/wc/v3/products/attributes/${attributeId}`,
        createAttribute: `${SERVER_URL}/wc/v3/products/attributes`,
        updateAttribute: (attributeId: string) => `${SERVER_URL}/wc/v3/products/attributes/${attributeId}`,
        deleteAttribute: (attributeId: string) => `${SERVER_URL}/wc/v3/products/attributes/${attributeId}`,
        updateBatchAttributes: `${SERVER_URL}/wc/v3/products/attributes/batch`,

        // product attribute terms
        getAllAttributeTerms: (attributeId: string) => `${SERVER_URL}/wc/v3/products/attributes/${attributeId}/terms`,
        getSingleAttributeTerm: (attributeId: string, attributeTermId: string) => `${SERVER_URL}/wc/v3/products/attributes/${attributeId}/terms/${attributeTermId}`,
        createAttributeTerm: (attributeId: string) => `${SERVER_URL}/wc/v3/products/attributes/${attributeId}/terms`,
        updateAttributeTerm: (attributeId: string, attributeTermId: string) => `${SERVER_URL}/wc/v3/products/attributes/${attributeId}/terms/${attributeTermId}`,
        deleteAttributeTerm: (attributeId: string, attributeTermId: string) => `${SERVER_URL}/wc/v3/products/attributes/${attributeId}/terms/${attributeTermId}`,
        updateBatchAttributeTerms: (attributeId: string) => `${SERVER_URL}/wc/v3/products/attributes/${attributeId}/terms/batch`,

        // product categories
        getAllCategories: `${SERVER_URL}/wc/v3/products/categories`,
        getSingleCategory: (categoryId: string) => `${SERVER_URL}/wc/v3/products/categories/${categoryId}`,
        createCategory: `${SERVER_URL}/wc/v3/products/categories`,
        updateCategory: (categoryId: string) => `${SERVER_URL}/wc/v3/products/categories/${categoryId}`,
        deleteCategory: (categoryId: string) => `${SERVER_URL}/wc/v3/products/categories/${categoryId}`,
        updateBatchCategories: `${SERVER_URL}/wc/v3/products/categories/batch`,

        // product shipping class
        getAllShippingClasses: `${SERVER_URL}/wc/v3/products/shipping_classes`,
        getSingleShippingClass: (shippingClassId: string) => `${SERVER_URL}/wc/v3/products/shipping_classes/${shippingClassId}`,
        createShippingClass: `${SERVER_URL}/wc/v3/products/shipping_classes`,
        updateShippingClass: (shippingClassId: string) => `${SERVER_URL}/wc/v3/products/shipping_classes/${shippingClassId}`,
        deleteShippingClass: (shippingClassId: string) => `${SERVER_URL}/wc/v3/products/shipping_classes/${shippingClassId}`,
        updateBatchShippingClass: `${SERVER_URL}/wc/v3/products/shipping_classes/batch`,

        // product tags
        getAllTags: `${SERVER_URL}/wc/v3/products/tags`,
        getSingleTag: (tagId: string) => `${SERVER_URL}/wc/v3/products/tags/${tagId}`,
        createTag: `${SERVER_URL}/wc/v3/products/tags`,
        updateTag: (tagId: string) => `${SERVER_URL}/wc/v3/products/tags/${tagId}`,
        deleteTag: (tagId: string) => `${SERVER_URL}/wc/v3/products/tags/${tagId}`,
        updateBatchTags: `${SERVER_URL}/wc/v3/products/tags/batch`,

        // product reviews
        getAllReviews: `${SERVER_URL}/wc/v3/products/reviews`,
        getSingleReview: (reviewId: string) => `${SERVER_URL}/wc/v3/products/reviews/${reviewId}`,
        createReview: `${SERVER_URL}/wc/v3/products/reviews`,
        updateReview: (reviewId: string) => `${SERVER_URL}/wc/v3/products/reviews/${reviewId}`,
        deleteReview: (reviewId: string) => `${SERVER_URL}/wc/v3/products/reviews/${reviewId}`,
        updateBatchReview: `${SERVER_URL}/wc/v3/products/reviews/batch`,

        // reports
        getAllReports: `${SERVER_URL}/wc/v3/reports`,
        getSalesReport: `${SERVER_URL}/wc/v3/reports/sales`,
        getTopSellersReport: `${SERVER_URL}/wc/v3/reports/top_sellers`,
        getCouponsTotalsReport: `${SERVER_URL}/wc/v3/reports/coupons/totals`,
        getCustomersTotalsReport: `${SERVER_URL}/wc/v3/reports/customers/totals`,
        getOrdersTotalsReport: `${SERVER_URL}/wc/v3/reports/orders/totals`,
        getProductsTotalsReport: `${SERVER_URL}/wc/v3/reports/products/totals`,
        getReviewsTotalsReport: `${SERVER_URL}/wc/v3/reports/reviews/totals`,

        // tax rates
        getAllTaxRates: `${SERVER_URL}/wc/v3/taxes`,
        getSingleTaxRate: (taxId: string) => `${SERVER_URL}/wc/v3/taxes/${taxId}`,
        createTaxRate: `${SERVER_URL}/wc/v3/taxes`,
        updateTaxRate: (taxId: string) => `${SERVER_URL}/wc/v3/taxes/${taxId}`,
        deleteTaxRate: (taxId: string) => `${SERVER_URL}/wc/v3/taxes/${taxId}`,
        updateBatchTaxRates: `${SERVER_URL}/wc/v3/taxes/batch`,

        // tax classes
        getAllTaxClasses: `${SERVER_URL}/wc/v3/taxes/classes`,
        createTaxClass: `${SERVER_URL}/wc/v3/taxes/classes`,
        deleteTaxClass: (slug: string) => `${SERVER_URL}/wc/v3/taxes/classes/${slug}`,

        // shipping zones
        getAllShippingZones: `${SERVER_URL}/wc/v3/shipping/zones`,
        getSingleShippingZone: (zoneId: string) => `${SERVER_URL}/wc/v3/shipping/zones/${zoneId}`,
        createShippingZone: `${SERVER_URL}/wc/v3/shipping/zones`,
        updateShippingZone: (zoneId: string) => `${SERVER_URL}/wc/v3/shipping/zones/${zoneId}`,
        deleteShippingZone: (zoneId: string) => `${SERVER_URL}/wc/v3/shipping/zones/${zoneId}`,
        // shipping zone locations
        getAllShippingZoneLocations: (zoneId: string) => `${SERVER_URL}/wc/v3/shipping/zones/${zoneId}/locations`,
        addShippingZoneLocation: (zoneId: string) => `${SERVER_URL}/wc/v3/shipping/zones/${zoneId}/locations`,
        // shipping zone methods
        getAllShippingZoneMethods: (zoneId: string) => `${SERVER_URL}/wc/v3/shipping/zones/${zoneId}/methods`,
        getSingleShippingZoneMethod: (zoneId: string, methodId: string) => `${SERVER_URL}/wc/v3/shipping/zones/${zoneId}/methods/${methodId}`,
        addShippingZoneMethod: (zoneId: string) => `${SERVER_URL}/wc/v3/shipping/zones/${zoneId}/methods`,
        updateShippingZoneMethod: (zoneId: string, methodId: string) => `${SERVER_URL}/wc/v3/shipping/zones/${zoneId}/methods/${methodId}`,
        deleteShippingZoneMethod: (zoneId: string, methodId: string) => `${SERVER_URL}/wc/v3/shipping/zones/${zoneId}/methods/${methodId}`,
        // shipping methods
        getAllShippingMethods: `${SERVER_URL}/wc/v3/shipping_methods`,
        getSingleShippingMethod: (shippingId: string) => `${SERVER_URL}/wc/v3/shipping_methods/${shippingId}`,

        // payment gateways
        getAllPaymentGateways: `${SERVER_URL}/wc/v3/payment_gateways`,
        getSinglePaymentGateway: (paymentGatewayId: string) => `${SERVER_URL}/wc/v3/payment_gateways/${paymentGatewayId}`,
        updatePaymentGateway: (paymentGatewayId: string) => `${SERVER_URL}/wc/v3/payment_gateways/${paymentGatewayId}`,

        // settings
        getAllSettingsGroups: `${SERVER_URL}/wc/v3/settings`,
        getAllSettingOptions: (groupId: string) => `${SERVER_URL}/wc/v3/settings/${groupId}`,
        getSingleSettingOption: (groupId: string, optionId: string) => `${SERVER_URL}/wc/v3/settings/${groupId}/${optionId}`,
        updateSingleSettingOption: (groupId: string, optionId: string) => `${SERVER_URL}/wc/v3/settings/${groupId}/${optionId}`,
        updateBatchSettingOptions: (groupId: string) => `${SERVER_URL}/wc/v3/settings/${groupId}/batch`,

        // system status
        getAllSystemStatus: `${SERVER_URL}/wc/v3/system_status`,

        // data
        getCurrentCurrency: `${SERVER_URL}/wc/v3/data/currencies/current`,
    },

    wp: {
        // users
        getAllUsers: `${SERVER_URL}/wp/v2/users`,
        getCurrentUser: `${SERVER_URL}/wp/v2/users/me`,
        getUserById: (userId: string) => `${SERVER_URL}/wp/v2/users/${userId}`,
        createUser: `${SERVER_URL}/wp/v2/users`,
        updateUser: (userId: string) => `${SERVER_URL}/wp/v2/users/${userId}`,
        deleteUser: (userId: string) => `${SERVER_URL}/wp/v2/users/${userId}`,

        // plugins
        getAllPlugins: `${SERVER_URL}/wp/v2/plugins`,
        getSinglePlugin: (plugin: string) => `${SERVER_URL}/wp/v2/plugins/${plugin}`,
        updatePlugin: (plugin: string) => `${SERVER_URL}/wp/v2/plugins/${plugin}`,
        deletePlugin: (plugin: string) => `${SERVER_URL}/wp/v2/plugins/${plugin}`,

        // pages
        getAllPages: `${SERVER_URL}/wp/v2/pages`,
        getSinglePage: (pageId: string) => `${SERVER_URL}/wp/v2/pages/${pageId}`,
        createPage: `${SERVER_URL}/wp/v2/pages`,
        updatePage: (pageId: string) => `${SERVER_URL}/wp/v2/pages/${pageId}`,
        deletePage: (pageId: string) => `${SERVER_URL}/wp/v2/pages/${pageId}`,

        // media
        getAllMediaItems: `${SERVER_URL}/wp/v2/media`,
        getSingleMediaItem: (mediaId: string) => `${SERVER_URL}/wp/v2/media/${mediaId}`,
        createMediaItem: `${SERVER_URL}/wp/v2/media`,
        updateMediaItem: (mediaId: string) => `${SERVER_URL}/wp/v2/media/${mediaId}`,
        deleteMediaItem: (mediaId: string) => `${SERVER_URL}/wp/v2/media/${mediaId}`,

        // settings
        getSiteSettings: `${SERVER_URL}/wp/v2/settings`,
        setSiteSettings: `${SERVER_URL}/wp/v2/settings`,

        // posts
        getAllPosts: `${SERVER_URL}/wp/v2/posts`,
        getSinglePost: (postId: string) => `${SERVER_URL}/wp/v2/posts/${postId}`,
        createPost: `${SERVER_URL}/wp/v2/posts`,
        createCustomPost: (postType: string) => `${SERVER_URL}/wp/v2/${postType}`,
        updatePost: (postId: string) => `${SERVER_URL}/wp/v2/posts/${postId}`,
        deletePost: (postId: string) => `${SERVER_URL}/wp/v2/posts/${postId}`,
    },
};
