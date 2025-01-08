import { test as setup, expect, request } from '@playwright/test';
import { LoginPage } from '@pages/loginPage';
import { ApiUtils } from '@utils/apiUtils';
import { dbUtils } from '@utils/dbUtils';
import { payloads } from '@utils/payloads';
import { data } from '@utils/testData';
import { dbData } from '@utils/dbData';
import { helpers } from '@utils/helpers';

const { CI, LOCAL, WEPOS_PRO } = process.env;

setup.describe('Environment setup', () => {
    let apiUtils: ApiUtils;

    setup.beforeAll(async () => {
        apiUtils = new ApiUtils(await request.newContext());
    });

    setup.afterAll(async () => {
        await apiUtils.dispose();
    });

    setup('authenticate admin', { tag: ['@lite'] }, async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.adminLogin(data.admin, data.auth.adminAuthFile);
    });

    setup('add a product', { tag: ['@lite'] }, async () => {
        // delete all products
        await apiUtils.deleteAllProducts(payloads.adminAuth);

        const [, productId] = await apiUtils.createProduct({ ...payloads.createProduct(), name: data.predefined.simpleProduct.product1.name }, payloads.adminAuth);
        helpers.createEnvVar('PRODUCT_ID', productId);
    });

    setup('add customer', { tag: ['@lite'] }, async () => {
        const [, customerId] = await apiUtils.createCustomer(payloads.createCustomer1, payloads.adminAuth);
        helpers.createEnvVar('CUSTOMER_ID', customerId);
    });

    setup('add cashier', { tag: ['@pro'] }, async () => {
        const [, cashierId] = await apiUtils.createCashierUser(payloads.cashier, payloads.adminAuth);
        helpers.createEnvVar('CASHIER_ID', cashierId);
    });

    setup('authenticate cashier', { tag: ['@pro'] }, async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.adminLogin(data.cashierUser, data.auth.cashierAuthFile);
    });

    setup('wepos pro enabled or not', { tag: ['@lite'] }, async () => {
        setup.skip(LOCAL, 'Skip on Local testing');
        let res = await apiUtils.checkPluginsExistence(data.plugin.weposPro, payloads.adminAuth);
        if (res) {
            res = await apiUtils.pluginsActiveOrNot(data.plugin.weposPro, payloads.adminAuth);
        }
        WEPOS_PRO ? expect(res).toBeTruthy() : expect(res).toBeFalsy();
    });

    setup('check active plugins', { tag: ['@lite'] }, async () => {
        setup.skip(!CI, 'skip plugin check on local');
        const activePlugins = (await apiUtils.getAllPlugins({ status: 'active' }, payloads.adminAuth)).map((a: { plugin: string }) => a.plugin.split('/')[1]);
        WEPOS_PRO ? expect(activePlugins).toEqual(expect.arrayContaining(data.plugin.plugins)) : expect(activePlugins).toEqual(expect.arrayContaining(data.plugin.pluginsLite));
    });

    setup('set wepos license', { tag: ['@pro'] }, async () => {
        setup.skip(!WEPOS_PRO, 'skip on lite');
        await dbUtils.setWeposSettings(dbData.wepos.optionName.weposProLicense, dbData.wepos.license);
    });

    setup('set tax rate', { tag: ['@lite'] }, async () => {
        await apiUtils.setUpTaxRate(payloads.enableTaxRate, payloads.createTaxRate, payloads.adminAuth);
    });

    setup('add categories and tags', { tag: ['@pro'] }, async () => {
        setup.skip(!WEPOS_PRO, 'skip on lite');
        // delete previous categories and tags
        await apiUtils.updateBatchCategories('delete', [], payloads.adminAuth);
        await apiUtils.updateBatchTags('delete', [], payloads.adminAuth);

        await apiUtils.createCategory(payloads.createCategory(), payloads.adminAuth);
        await apiUtils.createTag(payloads.createTag(), payloads.adminAuth);
    });

    setup('get test environment info', { tag: ['@lite'] }, async () => {
        const [, systemInfo] = await apiUtils.getSystemStatus(payloads.adminAuth);
        helpers.writeFile(data.systemInfo, JSON.stringify(systemInfo));
    });
});
