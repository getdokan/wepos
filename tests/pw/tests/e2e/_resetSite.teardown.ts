import { test as teardown, request } from '@playwright/test';
import { ApiUtils } from '@utils/apiUtils';
import { payloads } from '@utils/payloads';

const { WEPOS_PRO } = process.env;

teardown.describe('Environment reset', () => {
    let apiUtils: ApiUtils;

    teardown.beforeAll(async () => {
        apiUtils = new ApiUtils(await request.newContext());
    });

    teardown.afterAll(async () => {
        await apiUtils.dispose();
    });

    teardown('delete all media items', async () => {
        await apiUtils.deleteAllMediaItems(payloads.adminAuth);
    });

    teardown('delete all products', async () => {
        await apiUtils.deleteAllProducts(payloads.adminAuth);
    });

    teardown('delete all customers', async () => {
        await apiUtils.deleteAllCustomers(payloads.adminAuth);
    });

    teardown('delete all outlets', async () => {
        teardown.skip(!WEPOS_PRO, 'skip on lite');
        await apiUtils.deleteAllOutlets(payloads.adminAuth);
    });

    teardown('delete all cashiers', async () => {
        teardown.skip(!WEPOS_PRO, 'skip on lite');
        await apiUtils.deleteAllUsers('cashier', payloads.adminAuth);
    });
});
