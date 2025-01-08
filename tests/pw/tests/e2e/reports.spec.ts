import { test, Page, request } from '@playwright/test';
import { ApiUtils } from '@utils/apiUtils';
import { Reports } from '@pages/reportsPage';
import { payloads } from '@utils/payloads';
import { data } from '@utils/testData';

test.describe('Reports test', () => {
    let apiUtils: ApiUtils;
    let admin: Reports;
    let aPage: Page;
    let outletId: string;
    let outletName: string;
    let cashierName: string;

    test.beforeAll(async ({ browser }) => {
        const adminContext = await browser.newContext(data.auth.adminAuth);
        aPage = await adminContext.newPage();
        admin = new Reports(aPage);

        apiUtils = new ApiUtils(await request.newContext());
        [, outletId, outletName] = await apiUtils.createOutlet(payloads.createOutlet(), payloads.adminAuth);
        [, , cashierName] = await apiUtils.createUser({ ...payloads.createUser(), roles: 'cashier' }, payloads.adminAuth);
    });

    test.afterAll(async () => {
        await apiUtils.dispose();
        await aPage.close();
    });

    test('admin can view report', { tag: ['@pro'] }, async () => {
        await admin.reportsRenderProperly();
    });

    test('admin can filter report by payment method', { tag: ['@pro'] }, async () => {
        await admin.filterReports('Cash', 'by-paymentMethod');
    });

    test('admin can filter report by customer', { tag: ['@pro'] }, async () => {
        await admin.filterReports('customer1', 'by-customer');
    });

    test('admin can filter report by outlet', { tag: ['@pro'] }, async () => {
        await admin.filterReports(outletName, 'by-outlet');
    });

    test('admin can filter report by cashier', { tag: ['@pro'] }, async () => {
        await admin.filterReports(cashierName, 'by-cashier');
    });

    test('admin can clear filter', { tag: ['@pro'] }, async () => {
        await admin.filterReports('Cash', 'by-paymentMethod', false);
        await admin.clearFilter();
    });

    test('admin can export sales report', { tag: ['@pro'] }, async () => {
        await admin.exportReport();
    });
});
