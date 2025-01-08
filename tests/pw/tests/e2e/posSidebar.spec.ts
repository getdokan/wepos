import { test, Page, request } from '@playwright/test';
import { Pos } from '@pages/posPage';
import { ApiUtils } from '@utils/apiUtils';
import { dbUtils } from '@utils/dbUtils';
import { data } from '@utils/testData';
import { payloads } from '@utils/payloads';
import { responseBody } from '@utils/interfaces';

const { WEPOS_PRO, PRODUCT_ID, CUSTOMER_ID, CASHIER_ID } = process.env;

test.describe('Pos test', () => {
    let cashier: Pos;
    let cPage: Page;
    let apiUtils: ApiUtils;
    let responseBodyCounter: responseBody;
    let outletId: string;
    let outletName: string;
    let counterId: string;
    let counterName: string;
    let orderId: string;

    test.beforeAll(async ({ browser }) => {
        const adminContext = await browser.newContext(data.auth.cashierAuth);
        cPage = await adminContext.newPage();

        apiUtils = new ApiUtils(await request.newContext());

        if (!WEPOS_PRO) {
            cashier = new Pos(cPage);
        } else {
            await dbUtils.deleteLoginData('wepos_login', CASHIER_ID);

            [, outletId, outletName] = await apiUtils.createOutlet(payloads.createOutlet(), payloads.adminAuth);
            [responseBodyCounter, counterId, counterName] = await apiUtils.createCounter(outletId, payloads.createCounter(), payloads.adminAuth);
            await apiUtils.assignCashier(outletId, [CASHIER_ID], payloads.adminAuth);

            cashier = new Pos(cPage, outletName, `${counterName} - ${responseBodyCounter.number}`);
            [, , orderId] = await apiUtils.createOrder(PRODUCT_ID, { ...payloads.createOrder, customer_id: CUSTOMER_ID }, payloads.adminAuth);
        }
    });

    test.afterAll(async () => {
        if (WEPOS_PRO) {
            await apiUtils.logoutCashier(CASHIER_ID, outletId, counterId, payloads.adminAuth);
        }
        await apiUtils.dispose();
        await cPage.close();
    });

    test('cashier can view products', { tag: ['@pro'] }, async () => {
        await cashier.viewProducts();
    });

    test('cashier can search products', { tag: ['@pro'] }, async () => {
        await cashier.searchProductOnProductPage(data.predefined.simpleProduct.product1.name);
    });

    test('cashier can edit product', { tag: ['@pro'] }, async () => {
        const [, , productName] = await apiUtils.createProduct(payloads.createProduct(), payloads.adminAuth);
        await cashier.editProduct(productName, { ...data.productDetails(), category: data.predefined.category, tag: data.predefined.tag });
    });

    test('cashier can delete product', { tag: ['@pro'] }, async () => {
        const [, , productName] = await apiUtils.createProduct(payloads.createProduct(), payloads.adminAuth);
        await cashier.deleteProduct(productName);
    });

    test('cashier can perform bulk action on products', { tag: ['@pro'] }, async () => {
        const [, , productName] = await apiUtils.createProduct(payloads.createProduct(), payloads.adminAuth);
        await cashier.bulkActionOnProducts(productName, 'delete');
    });

    test('cashier can view orders', { tag: ['@pro'] }, async () => {
        await cashier.viewOrders();
    });

    test('cashier can search orders', { tag: ['@pro'] }, async () => {
        test.skip(true, 'feature does not work');
        await cashier.searchOrder(orderId);
    });

    test('cashier can filter orders by customer', { tag: ['@pro'] }, async () => {
        await cashier.filterOrders(data.predefined.customerInfo.username, 'by-customer');
    });

    test('cashier can filter orders by status', { tag: ['@pro'] }, async () => {
        await cashier.filterOrders('Completed', 'by-status');
    });

    test('cashier can view order details', { tag: ['@pro'] }, async () => {
        await cashier.viewOrderDetails(orderId);
    });

    test('cashier can add order note', { tag: ['@pro'] }, async () => {
        await cashier.addOrderNote(orderId, 'test order note');
    });

    test('cashier can delete order note', { tag: ['@pro'] }, async () => {
        const orderNote = payloads.createOrderNote;
        const [, orderId] = await apiUtils.createOrderNote(PRODUCT_ID, payloads.createOrder, orderNote, payloads.adminAuth);
        await cashier.deleteOrderNote(orderId, orderNote.note);
    });

    test('cashier can perform bulk action on orders', { tag: ['@pro'] }, async () => {
        test.skip(true, 'feature does not work');
    });

    test('cashier can refund order', { tag: ['@pro'] }, async () => {
        test.skip(true, 'feature does not work');
    });

    test('cashier can view customers', { tag: ['@pro'] }, async () => {
        await cashier.viewCustomers();
    });

    test('cashier can search customers', { tag: ['@pro'] }, async () => {
        await cashier.searchCustomerOnCustomerPage(data.predefined.customerInfo.email);
    });

    test('cashier can add new customer on customer page', { tag: ['@pro'] }, async () => {
        await cashier.addCustomerOnCustomerPage(data.customerDetails());
    });

    test('cashier can edit customer', { tag: ['@pro'] }, async () => {
        const [, , customerEmail] = await apiUtils.createCustomer(payloads.createCustomer(), payloads.adminAuth);
        await cashier.editCustomer(customerEmail, { ...data.customerDetails(), country: 'Canada', state: 'Alberta' });
    });

    test('cashier can delete customer', { tag: ['@pro'] }, async () => {
        const [, , customerEmail] = await apiUtils.createCustomer(payloads.createCustomer(), payloads.adminAuth);
        await cashier.deleteCustomer(customerEmail);
    });

    test('cashier can perform bulk action on customers', { tag: ['@pro'] }, async () => {
        const [, , customerEmail] = await apiUtils.createCustomer(payloads.createCustomer(), payloads.adminAuth);
        await cashier.bulkActionOnCustomers(customerEmail, 'delete');
    });

    test('cashier can update cashier profile', { tag: ['@pro'] }, async () => {
        await cashier.updateCashierProfile(data.cashierProfileDetails);
    });
});
