import { test, Page } from '@playwright/test';
import { LicensePage } from '@pages/licensePage';
import { data } from '@utils/testData';
import { dbUtils } from '@utils/dbUtils';
import { dbData } from '@utils/dbData';

test.describe('License test', () => {
    let admin: LicensePage;
    let aPage: Page;

    test.beforeAll(async ({ browser }) => {
        const adminContext = await browser.newContext(data.auth.adminAuth);
        aPage = await adminContext.newPage();
        admin = new LicensePage(aPage);
    });

    test.afterAll(async () => {
        await dbUtils.setWeposSettings(dbData.wepos.optionName.weposProLicense, dbData.wepos.license);
        await aPage.close();
    });

    // admin

    test('admin can view license menu page', { tag: ['@pro', '@exploratory'] }, async () => {
        await admin.adminLicenseRenderProperly();
    });

    test("admin can't activate license with incorrect key", { tag: ['@pro', '@negative'] }, async () => {
        await dbUtils.setWeposSettings(dbData.wepos.optionName.weposProLicense, dbData.wepos.deactivateLicense);
        await admin.activateLicense(data.weposLicense.incorrectKey, 'incorrect');
    });

    test('admin can activate license', { tag: ['@pro'] }, async () => {
        await dbUtils.setWeposSettings(dbData.wepos.optionName.weposProLicense, dbData.wepos.deactivateLicense);
        await admin.activateLicense(data.weposLicense.correctKey);
    });

    test('admin can refresh license', { tag: ['@pro'] }, async () => {
        await dbUtils.setWeposSettings(dbData.wepos.optionName.weposProLicense, dbData.wepos.license);
        await admin.refreshLicense();
    });

    test('admin can deactivate license', { tag: ['@pro'] }, async () => {
        await dbUtils.setWeposSettings(dbData.wepos.optionName.weposProLicense, dbData.wepos.license);
        await admin.deactivateLicense();
    });
});
