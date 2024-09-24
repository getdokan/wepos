import { expect, Request, APIRequestContext, APIResponse } from '@playwright/test';
import { endPoints } from '@utils/apiEndPoints';
import { payloads } from '@utils/payloads';
import { helpers } from '@utils/helpers';
import fs from 'fs';
import { auth, user_api, taxRate, reqOptions, coupon_api, params, headers, storageState, responseBody } from '@utils/interfaces';

export class ApiUtils {
    readonly request: APIRequestContext;

    constructor(request: APIRequestContext) {
        this.request = request;
    }

    /**
     * Authentication methods
     */

    // get basic auth
    getBasicAuth(user: user_api): string {
        const basicAuth = 'Basic ' + Buffer.from(user.username + ':' + user.password).toString('base64');
        return basicAuth;
    }

    /**
     * request methods
     */

    // get request
    async get(url: string, options?: reqOptions | undefined, ...args: any[]): Promise<[APIResponse, responseBody]> {
        const assert = args.length ? Boolean(args[0]) : true;
        const response = await this.request.get(url, options);
        const responseBody = await this.getResponseBody(response, assert);
        return [response, responseBody];
    }

    // post request
    async post(url: string, options?: reqOptions | undefined, ...args: any[]): Promise<[APIResponse, responseBody]> {
        const assert = args.length ? Boolean(args[0]) : true;
        const response = await this.request.post(url, options);
        const responseBody = await this.getResponseBody(response, assert);
        return [response, responseBody];
    }

    // put request
    async put(url: string, options?: reqOptions | undefined, ...args: any[]): Promise<[APIResponse, responseBody]> {
        const assert = args.length ? Boolean(args[0]) : true;
        const response = await this.request.put(url, options);
        const responseBody = await this.getResponseBody(response, assert);
        return [response, responseBody];
    }

    // patch request
    async patch(url: string, options?: reqOptions | undefined, ...args: any[]): Promise<[APIResponse, responseBody]> {
        const assert = args.length ? Boolean(args[0]) : true;
        const response = await this.request.patch(url, options);
        const responseBody = await this.getResponseBody(response, assert);
        return [response, responseBody];
    }

    // delete request
    async delete(url: string, options?: reqOptions | undefined, ...args: any[]): Promise<[APIResponse, responseBody]> {
        const assert = args.length ? Boolean(args[0]) : true;
        const response = await this.request.delete(url, options);
        const responseBody = await this.getResponseBody(response, assert);
        return [response, responseBody];
    }

    // fetch request
    async fetch(urlOrRequest: string | Request, options?: reqOptions | undefined, ...args: any[]): Promise<[APIResponse, responseBody]> {
        const assert = args.length ? Boolean(args[0]) : true;
        const response = await this.request.fetch(urlOrRequest, options);
        const responseBody = await this.getResponseBody(response, assert);
        return [response, responseBody];
    }

    // head request
    async head(url: string, options?: reqOptions | undefined): Promise<APIResponse> {
        const response = await this.request.head(url, options);
        return response;
    }

    // dispose api request context
    async dispose(): Promise<void> {
        await this.request.dispose();
    }

    // get storageState
    async storageState(path?: string | undefined): Promise<storageState> {
        return await this.request.storageState({ path: path });
    }

    // get responseBody
    async getResponseBody(response: APIResponse, assert = true): Promise<responseBody> {
        try {
            assert && expect(response.ok()).toBeTruthy();
            const responseBody = response.status() !== 204 && (await response.json()); // 204 is for No Content

            // console log responseBody if response code is not between 200-299
            // String(response.status())[0] != '2' && console.log('ResponseBody: ', responseBody);
            return responseBody;
        } catch (err: any) {
            console.log('End-point: ', response.url());
            console.log('Status Code: ', response.status());
            console.log('Response text: ', await response.text());
            console.log('Error: ', err.message);
            // console.log('header:', response.headers());
            // console.log('header:', response.headersArray());
        }
    }

    // get site headers
    async getSiteHeaders(url: string): Promise<headers> {
        const response = await this.head(url);
        const headers = response.headers();
        return headers;
    }

    /**
     * wepos api methods
     */

    // get all outlets
    async getAllOutlets(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.getAllOutlets, { params: { per_page: 100 }, headers: auth });
        return responseBody;
    }

    // create outlet
    async createOutlet(payload: object, auth?: auth): Promise<[responseBody, string, string]> {
        const [, responseBody] = await this.post(endPoints.createOutlet, { data: payload, headers: auth });
        const outletId = String(responseBody?.id);
        const outletName = String(responseBody?.name);
        return [responseBody, outletId, outletName];
    }

    // delete outlet
    async deleteOutlet(outletId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.delete(endPoints.deleteOutlet(outletId), { headers: auth });
        return responseBody;
    }

    // delete all outlets
    async deleteAllOutlets(auth?: auth) {
        const allOutlets = await this.getAllOutlets(auth);
        if (!allOutlets?.length) {
            console.log('No outlet exists');
            return;
        }

        const allOutletIds = allOutlets.map((o: { id: unknown }) => o.id);
        for (const outletId of allOutletIds) {
            await this.deleteOutlet(outletId, auth);
        }
    }

    // create counter
    async createCounter(outletId: string, payload: object, auth?: auth): Promise<[responseBody, string, string]> {
        const [, responseBody] = await this.post(endPoints.createCounter(outletId), { data: payload, headers: auth });
        const counterId = String(responseBody?.id);
        const counterName = String(responseBody?.name);
        return [responseBody, counterId, counterName];
    }

    // create cashier [belongs to outlet]
    async createCashier(outletId: string, payload: object, auth?: auth): Promise<[responseBody, string, string]> {
        const [, responseBody] = await this.post(endPoints.createCashier(outletId), { data: payload, headers: auth });
        const cashierId = String(responseBody?.id);
        const cashierName = String(responseBody?.display_name);
        return [responseBody, cashierId, cashierName];
    }

    async createCashierUser(payload: any, auth?: auth): Promise<[responseBody, string, string]> {
        const [response, responseBody] = await this.post(endPoints.wp.createUser, { data: payload, headers: auth }, false);
        let userId, fullName;
        if (responseBody.code) {
            expect(response.status()).toBe(500);

            // get cashier id if already exists
            userId = await this.getUserId(payload.full_name, auth);
            fullName = payload.full_name;
        } else {
            userId = String(responseBody?.id);
            fullName = String(responseBody?.name);
        }
        return [responseBody, userId, fullName];
    }

    // assign cashier
    async assignCashier(outletId: string, cashierIds: string[], auth?: auth): Promise<[responseBody]> {
        const [, responseBody] = await this.post(endPoints.assignCashier(outletId), { data: { user_ids: cashierIds }, headers: auth });
        return [responseBody];
    }

    // login cashier
    async loginCashier(cashierId: string, outletId: string, counterId: string, auth?: auth): Promise<[responseBody]> {
        const [, responseBody] = await this.post(endPoints.loginCashier(cashierId), { data: { outlet_id: outletId, counter_id: counterId }, headers: auth }, false);
        if (responseBody.code === 'already-loggedin') {
            console.log('Cashier already logged in');
        }
        return [responseBody];
    }

    // logout cashier
    async logoutCashier(cashierId: string, outletId: string, counterId: string, auth?: auth): Promise<[responseBody]> {
        const [, responseBody] = await this.delete(endPoints.logoutCashier(cashierId), { data: { outlet_id: outletId, counter_id: counterId }, headers: auth }, false);
        if (responseBody.code === 'already-loggedin') {
            console.log('Cashier already logged out');
        }
        return [responseBody];
    }

    /**
     * coupon api methods
     */

    // get all coupons
    async getAllCoupons(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.getAllCoupons, { params: { per_page: 100 }, headers: auth });
        return responseBody;
    }

    // get couponId
    async getCouponId(couponCode?: string, auth?: auth): Promise<string> {
        if (arguments.length === 1 && typeof couponCode === 'object') {
            auth = couponCode as auth;
            couponCode = undefined;
        }

        const allCoupons = await this.getAllCoupons(auth);
        const couponId = couponCode ? allCoupons.find((o: { code: string }) => o.code.toLowerCase() === couponCode!.toLowerCase())?.id : allCoupons[0]?.id;
        return couponId;
    }

    // create coupon
    async createCoupon(productIds: (string | undefined)[], coupon: coupon_api, auth?: auth): Promise<[responseBody, string, string]> {
        // create product if invalid productId exists
        if (productIds.includes(undefined)) {
            const [, productId] = await this.createProduct(payloads.createProduct(), auth);
            productIds = [productId];
        }
        const [response, responseBody] = await this.post(endPoints.createCoupon, { data: { ...coupon, product_ids: productIds }, headers: auth }, false);
        let couponId: string;
        let couponCode: string;
        if (responseBody.code === 'woocommerce_rest_coupon_code_already_exists') {
            expect(response.status()).toBe(400);

            // get coupon id if already exists
            couponId = await this.getCouponId(coupon.code, auth);
            couponCode = coupon.code;

            // update coupon if already exists
            await this.updateCoupon(couponId, { ...coupon, product_ids: productIds }, auth);
        } else {
            expect(response.ok()).toBeTruthy();
            couponId = String(responseBody?.id);
            couponCode = String(responseBody?.code);
        }
        return [responseBody, couponId, couponCode];
    }

    // update coupon
    async updateCoupon(couponId: string, payload: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.put(endPoints.updateCoupon(couponId), { data: payload, headers: auth });
        return responseBody;
    }

    /**
     * order api methods
     */

    // get all orders [of a vendor]
    async getAllOrders(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.getAllOrders, { params: { per_page: 100 }, headers: auth });
        return responseBody;
    }

    // get single order
    async getSingleOrder(orderId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.getSingleOrder(orderId), { headers: auth });
        return responseBody;
    }

    // get orderId
    async getOrderId(auth?: auth): Promise<string> {
        const allOrders = await this.getAllOrders(auth);
        const orderId = allOrders[0]?.id;
        return orderId;
    }

    /**
     * woocommerce  api methods
     */

    /**
     * product api methods
     */

    // get all products
    async getAllProducts(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getAllProducts, { params: { per_page: 100 }, headers: auth });
        return responseBody;
    }

    // get single product
    async getSingleProduct(productId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getSingleProduct(productId), { headers: auth });
        return responseBody;
    }

    // get productId
    async getProductId(productName?: string, auth?: auth): Promise<string> {
        if (arguments.length === 1 && typeof productName === 'object') {
            auth = productName as auth;
            productName = undefined;
        }

        const allProducts = await this.getAllProducts(auth);
        const productId = productName ? allProducts.find((o: { name: string }) => o.name.toLowerCase() === productName!.toLowerCase())?.id : allProducts[0]?.id;
        return productId;
    }

    // create product
    async createProduct(payload: object, auth?: auth): Promise<[responseBody, string, string]> {
        const [, responseBody] = await this.post(endPoints.wc.createProduct, { data: payload, headers: auth });
        const productId = String(responseBody?.id);
        const productName = String(responseBody?.name);
        return [responseBody, productId, productName];
    }

    // delete product
    async deleteProduct(productId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.delete(endPoints.wc.deleteProduct(productId), { headers: auth });
        return responseBody;
    }

    // delete all products
    async deleteAllProducts(productName?: any, auth?: auth): Promise<responseBody> {
        if (arguments.length === 1 && typeof productName === 'object') {
            auth = productName as auth;
            productName = undefined;
        }
        const allProducts = await this.getAllProducts(auth);
        if (!allProducts?.length) {
            console.log('No product exists');
            return;
        }

        let allProductIds: string[];
        if (productName) {
            // get all product ids with same name
            allProductIds = allProducts.filter((o: { name: unknown }) => o.name === productName).map((o: { id: unknown }) => o.id);
        } else {
            // get all product ids
            allProductIds = allProducts.map((o: { id: unknown }) => o.id);
        }
        const [, responseBody] = await this.put(endPoints.wc.updateBatchProducts, { data: { delete: allProductIds }, headers: payloads.adminAuth });
        return responseBody;
    }

    // get product exists or not
    async checkProductExistence(productName: string, auth?: auth): Promise<string | boolean> {
        const allProducts = await this.getAllProducts(auth);
        const res = allProducts.find((o: { name: string }) => o.name.toLowerCase() === productName.toLowerCase())?.id ?? false;
        return res;
    }

    /**
     * order api methods
     */

    // update order status
    async updateOrderStatus(orderId: string, orderStatus: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.put(endPoints.wc.updateOrder(orderId), { data: { status: orderStatus }, headers: auth });
        return responseBody;
    }

    // get order key
    async getOrderKey(orderId: string): Promise<string> {
        const [, responseBody] = await this.getSingleOrder(orderId, payloads.adminAuth);
        const orderKey = responseBody?.order_key;
        return orderKey;
    }

    /**
     * order notes api methods
     */

    // create order note
    async createOrderNote(product: string | object, order: object | string, orderNote: object, auth?: auth): Promise<[responseBody, string, string]> {
        let orderId: string;
        typeof order === 'object' ? ([, , orderId] = await this.createOrder(product, order, auth)) : (orderId = order);
        const [, responseBody] = await this.post(endPoints.createOrderNote(orderId), { data: orderNote, headers: auth });
        const orderNoteId = String(responseBody?.id);
        return [responseBody, orderId, orderNoteId];
    }

    /**
     * customers api methods
     */

    // get all customers
    async getAllCustomers(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getAllCustomers, { params: { per_page: 100 }, headers: auth });
        return responseBody;
    }

    // get single customer
    async getSingleCustomer(customerId: string, auth?: auth): Promise<[responseBody, string]> {
        const [, responseBody] = await this.get(endPoints.wc.getSingleCustomer(customerId), { headers: auth });
        const customerEmail = responseBody?.email;
        return [responseBody, customerEmail];
    }

    // get customerId
    async getCustomerId(username?: string, auth?: auth): Promise<string> {
        if (arguments.length === 1 && typeof username === 'object') {
            auth = username as auth;
            username = undefined;
        }

        const allCustomers = await this.getAllCustomers(auth);
        const customerId = username ? allCustomers.find((o: { username: string }) => o.username.toLowerCase() === username!.toLowerCase())?.id : allCustomers[0]?.id;
        return customerId;
    }

    // create customer
    async createCustomer(payload: any, auth?: auth): Promise<[responseBody, string, string]> {
        const [response, responseBody] = await this.post(endPoints.wc.createCustomer, { data: payload, headers: auth }, false);
        let customerId: string;
        let customerEmail: string;
        if (responseBody.code) {
            expect(response.status()).toBe(400);

            // get customer id if already exists
            customerId = await this.getCustomerId(payload.username, auth);
            [, customerEmail] = await this.getSingleCustomer(customerId, auth);

            // update customer if already exists
            await this.updateCustomer(customerId, payload, auth);
        } else {
            expect(response.ok()).toBeTruthy();
            customerId = String(responseBody?.id);
            customerEmail = String(responseBody?.email);
        }
        return [responseBody, customerId, customerEmail];
    }

    // update customer
    async updateCustomer(customerId: string, payload: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.put(endPoints.wc.updateCustomer(customerId), { data: payload, headers: auth });
        return responseBody;
    }

    // delete customer
    async deleteCustomer(userId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.delete(endPoints.wc.deleteCustomer(userId), { headers: auth });
        return responseBody;
    }

    // delete all customers
    async deleteAllCustomers(auth?: auth): Promise<responseBody> {
        const allCustomers = await this.getAllCustomers(auth);
        if (!allCustomers?.length) {
            console.log('No customer exists');
            return;
        }
        const allCustomersIds = allCustomers.map((o: { id: unknown }) => o.id);
        const [, responseBody] = await this.put(endPoints.wc.updateBatchCustomers, { data: { delete: allCustomersIds }, headers: payloads.adminAuth });
        return responseBody;
    }

    // settings

    // get all woocommerce setting options
    async getAllWcSettings(groupId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getAllSettingOptions(groupId), { headers: auth });
        return responseBody;
    }

    // get single woocommerce setting options
    async getSingleWcSettingOptions(groupId: string, optionId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getSingleSettingOption(groupId, optionId), { headers: auth });
        return responseBody;
    }

    // update single woocommerce setting options
    async updateSingleWcSettingOptions(groupId: string, optionId: string, payload: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.post(endPoints.wc.updateSingleSettingOption(groupId, optionId), { data: payload, headers: auth });
        return responseBody;
    }

    // update batch woocommerce settings options
    async updateBatchWcSettingsOptions(groupId: string, payload: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.post(endPoints.wc.updateBatchSettingOptions(groupId), { data: payload, headers: auth });
        return responseBody;
    }

    // categories

    // get all categories
    async getAllCategories(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getAllCategories, { params: { per_page: 100 }, headers: auth });
        return responseBody;
    }

    // get single category
    async getSingleCategory(categoryId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getSingleCategory(categoryId), { headers: auth });
        return responseBody;
    }

    // get categoryId
    async getCategoryId(categoryName: string, auth?: auth): Promise<string> {
        const allCategories = await this.getAllCategories(auth);
        const categoryId = categoryName ? allCategories.find((o: { name: string }) => o.name === categoryName.toLowerCase())?.id : allCategories[0]?.id;
        return categoryId;
    }

    // create category
    async createCategory(payload: object, auth?: auth): Promise<[responseBody, string, string]> {
        const [, responseBody] = await this.post(endPoints.wc.createCategory, { data: payload, headers: auth });
        const categoryId = String(responseBody?.id);
        const categoryName = String(responseBody?.name);
        return [responseBody, categoryId, categoryName];
    }

    // update category
    async updateCategory(categoryId: string, payload: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.put(endPoints.wc.updateCategory(categoryId), { data: payload, headers: auth });
        return responseBody;
    }

    // delete category
    async deleteCategory(categoryId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.delete(endPoints.wc.deleteCategory(categoryId), { headers: auth });
        return responseBody;
    }

    // update batch categories
    async updateBatchCategories(action: string, allIds: string[], auth?: auth): Promise<[APIResponse, responseBody]> {
        if (!allIds?.length) {
            allIds = (await this.getAllCategories(auth)).map((a: { id: unknown }) => a.id);
        }
        const [response, responseBody] = await this.post(endPoints.wc.updateBatchCategories, { data: { [action]: allIds }, headers: auth });
        return [response, responseBody];
    }

    // tags

    // get all tags
    async getAllTags(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getAllTags, { params: { per_page: 100 }, headers: auth });
        return responseBody;
    }

    // create tag
    async createTag(payload: object, auth?: auth): Promise<[responseBody, string, string]> {
        const [, responseBody] = await this.post(endPoints.wc.createTag, { data: payload, headers: auth });
        const tagId = String(responseBody?.id);
        const tagName = String(responseBody?.name);
        return [responseBody, tagId, tagName];
    }

    // update batch tags
    async updateBatchTags(action: string, allIds: string[], auth?: auth): Promise<[APIResponse, responseBody]> {
        if (!allIds?.length) {
            allIds = (await this.getAllTags(auth)).map((a: { id: unknown }) => a.id);
        }
        const [response, responseBody] = await this.post(endPoints.wc.updateBatchTags, { data: { [action]: allIds }, headers: auth });
        return [response, responseBody];
    }

    // order

    // get all site orders
    async getAllOrdersSite(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getAllOrders, { params: { per_page: 100 }, headers: auth });
        return responseBody;
    }

    // create order
    async createOrder(product: string | object, orderPayload: any, auth?: auth): Promise<[APIResponse, responseBody, string, string]> {
        let productId: string;
        if (!product) {
            [, productId] = await this.createProduct(payloads.createProduct(), auth);
        } else {
            if (typeof product === 'object') {
                [, productId] = await this.createProduct(product, auth);
            } else {
                const responseBody = await this.getSingleProduct(product, payloads.adminAuth);
                if (responseBody.code === 'woocommerce_rest_product_invalid_id') {
                    [, productId] = await this.createProduct(payloads.createProduct(), auth);
                } else {
                    productId = product;
                }
            }
        }
        // Set the product ID in the order payload
        const payload = orderPayload;
        payload.line_items[0].product_id = productId;

        // Post the order and return the results
        const [response, responseBody] = await this.post(endPoints.wc.createOrder, { data: payload, headers: payloads.adminAuth }, false);
        const orderId = String(responseBody?.id);
        return [response, responseBody, orderId, productId];
    }

    // create order with status
    async createOrderWithStatus(product: string | object, order: any, status: string, auth?: auth): Promise<[APIResponse, responseBody, string, string]> {
        const [response, responseBody, orderId, productId] = await this.createOrder(product, order, auth);
        await this.updateOrderStatus(orderId, status, auth);
        return [response, responseBody, orderId, productId];
    }

    // tax

    // get all tax rate
    async getAllTaxRates(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getAllTaxRates, { headers: auth });
        return responseBody;
    }

    // create tax rate
    async createTaxRate(payload: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.post(endPoints.wc.createTaxRate, { data: payload, headers: auth });
        return responseBody;
    }

    // update batch tax rates
    async updateBatchTaxRates(action: string, allIds: string[], auth?: auth): Promise<responseBody> {
        if (!allIds?.length) {
            allIds = (await this.getAllTaxRates(auth)).map((a: { id: unknown }) => a.id);
        }
        const [, responseBody] = await this.put(endPoints.wc.updateBatchTaxRates, { data: { [action]: allIds }, headers: auth });
        return responseBody;
    }

    // setup tax
    async setUpTaxRate(enableTaxPayload: object, taxPayload: taxRate, auth?: auth): Promise<number> {
        // enable tax rate
        await this.updateBatchWcSettingsOptions('general', enableTaxPayload, auth);

        // delete previous tax rates
        const allTaxRateIds = (await this.getAllTaxRates(auth)).map((o: { id: unknown }) => o.id);
        if (allTaxRateIds.length) {
            await this.updateBatchTaxRates('delete', allTaxRateIds, auth);
        }

        // create tax rate
        const taxRateResponse = await this.createTaxRate(taxPayload, auth);
        expect(parseInt(taxRateResponse.rate)).toBe(parseInt(taxPayload.rate));
        return Number(taxPayload.rate);
    }

    // shipping

    // get all shipping zones
    async getAllShippingZones(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getAllShippingZones, { headers: auth });
        return responseBody;
    }

    // get zoneId
    async getZoneId(zoneName: string, auth?: auth): Promise<string> {
        const allZones = await this.getAllShippingZones(auth);
        const zoneId = allZones.find((o: { name: string }) => o.name.toLowerCase() === zoneName.toLowerCase())?.id;
        return zoneId;
    }

    // create shipping zone
    async createShippingZone(payload: object, auth?: auth): Promise<[responseBody, string]> {
        const [, responseBody] = await this.post(endPoints.wc.createShippingZone, { data: payload, headers: auth });
        const shippingZoneId = String(responseBody?.id);
        return [responseBody, shippingZoneId];
    }

    // delete shipping zone
    async deleteShippingZone(zoneId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.delete(endPoints.wc.deleteShippingZone(zoneId), { params: { force: true }, headers: auth });
        return responseBody;
    }

    // get all shipping zone locations
    async getAllShippingZoneLocations(zoneId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getAllShippingZoneLocations(zoneId), { headers: auth });
        return responseBody;
    }

    // add shipping zone location
    async addShippingZoneLocation(zoneId: string, zoneLocation: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.put(endPoints.wc.addShippingZoneLocation(zoneId), { data: zoneLocation, headers: auth });
        return responseBody;
    }

    // get all shipping zone methods
    async getAllShippingZoneMethods(zoneId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getAllShippingZoneMethods(zoneId), { headers: auth });
        return responseBody;
    }

    // add shipping zone method
    async addShippingZoneMethod(zoneId: string, zoneMethod: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.post(endPoints.wc.addShippingZoneMethod(zoneId), { data: zoneMethod, headers: auth });
        return responseBody;
    }

    // payment

    // get all payment gateway
    async getAllPaymentGateways(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getAllPaymentGateways, { headers: auth });
        return responseBody;
    }

    // get single payment gateway
    async getSinglePaymentGateway(paymentGatewayId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wc.getSinglePaymentGateway(paymentGatewayId), { headers: auth });
        return responseBody;
    }

    // update payment gateway
    async updatePaymentGateway(paymentGatewayId: string, payload: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.put(endPoints.wc.updatePaymentGateway(paymentGatewayId), { data: payload, headers: auth });
        return responseBody;
    }

    // get system status
    async getSystemStatus(auth?: auth): Promise<[responseBody, object]> {
        const [, responseBody] = await this.get(endPoints.wc.getAllSystemStatus, { headers: auth });
        const activePlugins = responseBody.active_plugins.map((a: { plugin: string; version: string }) => a.plugin.split('/')[0] + ' v' + a.version);
        activePlugins.sort();
        const compactInfo = {
            wpVersion: 'WordPress Version: ' + responseBody?.environment.wp_version,
            phpVersion: 'PHP Version: ' + responseBody?.environment.php_version,
            mysqlVersion: 'MySql Version: ' + responseBody?.environment.mysql_version,
            theme: 'Theme: ' + responseBody?.theme.name + ' v' + responseBody?.theme.version,
            wpDebugMode: 'Debug Mode: ' + responseBody?.environment.wp_debug_mode,
            activePlugins: activePlugins,
        };
        return [responseBody, compactInfo];
    }

    /**
     * wp api methods
     */

    // settings

    // get site settings
    async getSiteSettings(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wp.getSiteSettings, { headers: auth });
        return responseBody;
    }

    // set site settings
    async setSiteSettings(payload: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.post(endPoints.wp.setSiteSettings, { data: payload, headers: auth });
        return responseBody;
    }

    // wp users

    // get all users
    async getAllUsers(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wp.getAllUsers, { params: { per_page: 100 }, headers: auth });
        return responseBody;
    }

    // get user by roles [ for multiple roles use comma separated string]
    async getAllUsersByRoles(roles: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wp.getAllUsers, { params: { per_page: 100, roles: roles }, headers: auth });
        return responseBody;
    }

    // get current user
    async getCurrentUser(auth?: auth): Promise<[responseBody, string]> {
        const [, responseBody] = await this.get(endPoints.wp.getCurrentUser, { headers: auth });
        const userId = String(responseBody?.id);
        return [responseBody, userId];
    }

    // get user by-id
    async getUserById(userId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wp.getUserById(userId), { headers: auth });
        return responseBody;
    }

    // get user id
    async getUserId(fullName: string, auth?: auth): Promise<responseBody> {
        const allUsers = await this.getAllUsers(auth);
        const userId = allUsers.find((o: { name: string }) => o.name.toLowerCase() === fullName!.toLowerCase())?.id;
        return userId;
    }

    // create user [administrator,  customer, seller]
    async createUser(payload: object, auth?: auth): Promise<[responseBody, string, string]> {
        const [, responseBody] = await this.post(endPoints.wp.createUser, { data: payload, headers: auth });
        const userId = String(responseBody?.id);
        const fullName = String(responseBody?.name);
        return [responseBody, userId, fullName];
    }

    // update user
    async updateUser(userId: string, payload: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.put(endPoints.wp.updateUser(userId), { data: payload, headers: auth });
        return responseBody;
    }

    // delete user
    async deleteUser(userId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.delete(endPoints.wp.deleteUser(userId), { params: { ...payloads.paramsForceDelete, reassign: '' }, headers: auth });
        return responseBody;
    }

    // delete all users
    async deleteAllUsers(role?: string, auth?: auth): Promise<responseBody> {
        if (arguments.length === 1 && typeof role === 'object') {
            auth = role as auth;
            role = undefined;
        }
        const allUsers = role ? await this.getAllUsersByRoles(role, auth) : await this.getAllUsers(auth);
        if (!allUsers?.length) {
            console.log('No user exists');
            return;
        }
        const allUserIds = allUsers.map((o: { id: unknown }) => o.id);
        for (const userId of allUserIds) {
            await this.deleteUser(userId, auth);
        }
    }

    // plugins

    // get all plugins
    async getAllPlugins(params = {}, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wp.getAllPlugins, { params: { ...params, per_page: 100 }, headers: auth });
        return responseBody;
    }

    // get single plugin
    async getSinglePlugin(plugin: string, auth?: auth): Promise<[responseBody, string, string]> {
        const [response, responseBody] = await this.get(endPoints.wp.getSinglePlugin(plugin), { headers: auth }, false);
        if (responseBody.code) {
            expect(response.status()).toBe(404);
            return [responseBody, plugin, 'not exists'];
        }
        const name = String(responseBody.name);
        const status = String(responseBody.status);
        return [responseBody, name, status];
    }

    // update plugin
    async updatePlugin(plugin: string, payload: object, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.put(endPoints.wp.updatePlugin(plugin), { data: payload, headers: auth });
        return responseBody;
    }

    // delete plugin
    async deletePlugin(plugin: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.delete(endPoints.wp.deletePlugin(plugin), { headers: auth });
        return responseBody;
    }

    // get plugin active or not
    async checkPluginsExistence(plugins: string[], auth?: auth): Promise<boolean> {
        const existingPlugins = (await this.getAllPlugins({}, auth)).map((a: { plugin: string }) => a.plugin.split('/')[1]);
        return helpers.isSubArray(existingPlugins, plugins);
    }

    // get plugin active or not
    async pluginsActiveOrNot(plugins: string[], auth?: auth): Promise<boolean> {
        const activePlugins = (await this.getAllPlugins({ status: 'active' }, auth)).map((a: { plugin: string }) => a.plugin.split('/')[1]);
        return helpers.isSubArray(activePlugins, plugins);
    }

    // media

    // upload media
    async uploadMedia(filePath: string, mimeType: string, auth: auth): Promise<[responseBody, string]> {
        const payload = {
            headers: {
                Accept: '*/*',
                ContentType: 'multipart/form-data',
                Authorization: auth.Authorization,
            },
            multipart: {
                file: {
                    name: String(filePath.split('/').pop()),
                    mimeType: mimeType,
                    buffer: fs.readFileSync(filePath),
                },
            },
        };
        const [, responseBody] = await this.post(endPoints.wp.createMediaItem, payload);
        const mediaId = String(responseBody?.id);
        return [responseBody, mediaId];
    }

    // upload file
    async uploadFile(filePath: string, auth: auth): Promise<[responseBody, string]> {
        const payload = fs.readFileSync(filePath);
        const headers = {
            'content-disposition': `attachment; filename=${String(filePath.split('/').pop())}`,
            Authorization: auth.Authorization,
        };
        const [, responseBody] = await this.post(endPoints.wp.createMediaItem, { data: payload, headers: headers });
        const mediaId = String(responseBody?.id);
        return [responseBody, mediaId];
    }

    // get all mediaItems
    async getAllMediaItems(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wp.getAllMediaItems, { params: { per_page: 100 }, headers: auth });
        return responseBody;
    }

    // get mediaItemId
    async getMediaItemId(auth?: auth): Promise<string> {
        const getAllMediaItems = await this.getAllMediaItems(auth);
        const mediaId = getAllMediaItems[0]?.id;
        return mediaId;
    }

    // delete all media items
    async deleteAllMediaItems(auth?: auth) {
        const allMediaItems = await this.getAllMediaItems(auth);
        if (!allMediaItems?.length) {
            console.log('No media item exists');
            return;
        }
        const allMediaItemIds = allMediaItems.map((o: { id: unknown }) => o.id);
        for (const mediaId of allMediaItemIds) {
            await this.delete(endPoints.wp.deleteMediaItem(mediaId), { params: payloads.paramsForceDelete, headers: auth });
        }
    }

    // create post
    async createPost(payload: object, auth?: auth): Promise<[responseBody, string]> {
        const [, responseBody] = await this.post(endPoints.wp.createPost, { data: payload, headers: auth });
        const postId = String(responseBody?.id);
        return [responseBody, postId];
    }

    // get all pages
    async getAllPages(auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wp.getAllPages, { params: { per_page: 100 }, headers: auth });
        return responseBody;
    }

    // get single page
    async getSinglePage(pageId: string, auth?: auth): Promise<responseBody> {
        const [, responseBody] = await this.get(endPoints.wp.getSinglePage(pageId), { headers: auth });
        return responseBody;
    }

    // get pageId
    async getPageId(pageSlug: string, auth?: auth): Promise<string> {
        const allPages = await this.getAllPages(auth);
        const pageId = allPages.find((o: { slug: string }) => o.slug.toLowerCase() === pageSlug.toLowerCase())?.id;
        return pageId;
    }
}
