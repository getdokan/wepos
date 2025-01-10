import { test, request, Page } from '@playwright/test';
import { Outlets } from '@pages/outletsPage';
import { ApiUtils } from '@utils/apiUtils';
import { data } from '@utils/testData';
import { payloads } from '@utils/payloads';

test.describe('Outlets test', () => {
    let admin: Outlets;
    let aPage: Page;
    let apiUtils: ApiUtils;
    let outletId: string;
    let outletName: string;

    test.beforeAll(async ({ browser }) => {
        const adminContext = await browser.newContext(data.auth.adminAuth);
        aPage = await adminContext.newPage();
        admin = new Outlets(aPage);

        apiUtils = new ApiUtils(await request.newContext());
        [, outletId, outletName] = await apiUtils.createOutlet(payloads.createOutlet(), payloads.adminAuth);
    });

    test.afterAll(async () => {
        await apiUtils.dispose();
        await aPage.close();
    });

    test('admin can view outlets', { tag: ['@pro'] }, async () => {
        await admin.outletsRenderProperly();
    });

    test('admin can add outlet', { tag: ['@pro'] }, async () => {
        await admin.addOutlet(data.outlet());
    });

    test('admin can edit outlet', { tag: ['@pro'] }, async () => {
        const [, , outletName] = await apiUtils.createOutlet({ ...payloads.createOutlet() }, payloads.adminAuth);
        await admin.editOutlet(outletName, { ...data.outlet(), country: 'Canada', state: 'Alberta' });
    });

    test('admin can delete outlet', { tag: ['@pro'] }, async () => {
        const [, , outletName] = await apiUtils.createOutlet(payloads.createOutlet(), payloads.adminAuth);
        await admin.deleteOutlet(outletName);
    });

    test('admin can add counter', { tag: ['@pro'] }, async () => {
        await admin.addCounter(outletName, data.counter());
    });

    test('admin can edit counter', { tag: ['@pro'] }, async () => {
        const [, , counterName] = await apiUtils.createCounter(outletId, payloads.createCounter(), payloads.adminAuth);
        await admin.editCounter(counterName, data.counter());
    });

    test('admin can delete counter', { tag: ['@pro'] }, async () => {
        const [, , counterName] = await apiUtils.createCounter(outletId, payloads.createCounter(), payloads.adminAuth);
        await admin.deleteCounter(counterName);
    });

    test('admin can assign new cashier', { tag: ['@pro'] }, async () => {
        await admin.addCashier(outletName, data.cashier());
    });

    test('admin can assign existing cashier', { tag: ['@pro'] }, async () => {
        const [, , cashierName] = await apiUtils.createUser({ ...payloads.createUser(), roles: 'cashier' }, payloads.adminAuth);
        await admin.addCashier(outletName, cashierName, true);
    });

    test('admin can delete cashier', { tag: ['@pro'] }, async () => {
        const [, , cashierName] = await apiUtils.createCashier(outletId, payloads.createCashier(), payloads.adminAuth);
        await admin.deleteCashier(outletName, cashierName);
    });
});
