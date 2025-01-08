import { test, Page, request } from '@playwright/test';
import { Pos } from '@pages/posPage';
import { LoginPage } from '@pages/loginPage';
import { ApiUtils } from '@utils/apiUtils';
import { dbUtils } from '@utils/dbUtils';
import { data } from '@utils/testData';
import { payloads } from '@utils/payloads';
import { responseBody } from '@utils/interfaces';

const { WEPOS_PRO, USER_PASSWORD } = process.env;

test.describe('Pos test', () => {
    let cashier: Pos;
    let cPage: Page;
    let apiUtils: ApiUtils;
    let responseBodyCounter: responseBody;
    let outletId: string;
    let outletName: string;
    let counterId: string;
    let counterName: string;

    test.beforeAll(async ({ browser }) => {
        const adminContext = await browser.newContext(data.auth.adminAuth);
        cPage = await adminContext.newPage();

        apiUtils = new ApiUtils(await request.newContext());

        if (!WEPOS_PRO) {
            cashier = new Pos(cPage);
        } else {
            await dbUtils.deleteLoginData('wepos_login', '1');

            [, outletId, outletName] = await apiUtils.createOutlet(payloads.createOutlet(), payloads.adminAuth);
            [responseBodyCounter, counterId, counterName] = await apiUtils.createCounter(outletId, payloads.createCounter(), payloads.adminAuth);
            await apiUtils.assignCashier(outletId, ['1'], payloads.adminAuth);

            cashier = new Pos(cPage, outletName, `${counterName} - ${responseBodyCounter.number}`);
        }
    });

    test.afterAll(async () => {
        if (WEPOS_PRO) {
            await apiUtils.logoutCashier('1', outletId, counterId, payloads.adminAuth);
        }
        await apiUtils.dispose();
        await cPage.close();
    });

    test('cashier can view pos', { tag: ['@lite'] }, async () => {
        await cashier.posRenderProperly();
    });

    test('cashier can search product', { tag: ['@lite'] }, async () => {
        await cashier.searchProduct(data.predefined.simpleProduct.product1.name);
    });

    test('cashier can filter product', { tag: ['@lite'] }, async () => {
        await cashier.filterProducts('Uncategorized');
    });

    test('cashier can toggle product view layout', { tag: ['@lite'] }, async () => {
        await cashier.toggleLayout('list');
    });

    test('cashier can search customer', { tag: ['@lite'] }, async () => {
        await cashier.searchCustomer(data.predefined.customerInfo.email);
    });

    test('cashier can add new customer', { tag: ['@lite'] }, async () => {
        await cashier.addCustomer(data.customerDetails());
    });

    test('cashier can empty cart', { tag: ['@lite'] }, async () => {
        await cashier.emptyCart();
    });

    test('cashier can view keyboard shortcuts', { tag: ['@lite'] }, async () => {
        await cashier.viewKeyboardShortcut();
    });

    test('cashier can logout', { tag: ['@lite'] }, async ({ page }) => {
        const loginPage = new LoginPage(page);
        let cashier: Pos;
        const [responseBody, cashierId] = await apiUtils.createUser({ ...payloads.createUser(), roles: 'administrator' }, payloads.adminAuth);
        if (!WEPOS_PRO) {
            cashier = new Pos(page);
        } else {
            const [, outletId, outletName] = await apiUtils.createOutlet(payloads.createOutlet(), payloads.adminAuth);
            const [responseBodyCounter, , counterName] = await apiUtils.createCounter(outletId, payloads.createCounter(), payloads.adminAuth);

            cashier = new Pos(page, outletName, `${counterName} - ${responseBodyCounter.number}`);
            await apiUtils.assignCashier(outletId, [cashierId], payloads.adminAuth);
        }

        await loginPage.adminLogin({ username: responseBody.username, password: USER_PASSWORD });
        await cashier.logout();
    });

    test('cashier can add product to cart', { tag: ['@lite'] }, async () => {
        await cashier.addToCart(data.predefined.simpleProduct.product1.name);
    });

    test('cashier can add customer to cart', { tag: ['@lite'] }, async () => {
        await cashier.addCustomerToCart(data.predefined.customerInfo.email, data.predefined.customerInfo.billingName);
    });

    test('cashier can edit product quantity', { tag: ['@lite'] }, async () => {
        await cashier.editCartProductQuantity(data.predefined.simpleProduct.product1.name, '5');
    });

    test('cashier can remove product from cart', { tag: ['@lite'] }, async () => {
        await cashier.removeCartProduct(data.predefined.simpleProduct.product1.name);
    });

    test('cashier can add discount', { tag: ['@lite'] }, async () => {
        await cashier.addDiscount(data.predefined.simpleProduct.product1.name, 'percent', '10');
    });

    test('cashier can add fee', { tag: ['@lite'] }, async () => {
        await cashier.addFee(data.predefined.simpleProduct.product1.name, 'percent', '10');
    });

    test('cashier can add note', { tag: ['@lite'] }, async () => {
        await cashier.addNote(data.predefined.simpleProduct.product1.name, 'This is a test note');
    });

    test('cashier can complete sale by cash', { tag: ['@lite'] }, async () => {
        await cashier.completeSale(data.predefined.simpleProduct.product1.name, data.paymentGateway);
    });

    test('cashier can complete sale by card', { tag: ['@pro'] }, async () => {
        await cashier.completeSale(data.predefined.simpleProduct.product1.name, { ...data.paymentGateway, name: 'card' });
    });

    test('cashier can complete sale with print receipt', { tag: ['@lite'] }, async () => {
        await cashier.completeSaleWithPrintReceipt(data.predefined.simpleProduct.product1.name, data.paymentGateway);
    });

    test('cashier can switch counter', { tag: ['@pro'] }, async () => {
        const [responseBodyCounter, counterId, counterName] = await apiUtils.createCounter(outletId, payloads.createCounter(), payloads.adminAuth);
        await cashier.switchCounter(outletName, `${counterName} - ${responseBodyCounter.number}`);

        // reset: logout cashier from the counter
        await apiUtils.logoutCashier('1', outletId, counterId, payloads.adminAuth);
    });
});
