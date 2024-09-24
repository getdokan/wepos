import { test, Page } from '@playwright/test';
import { SettingsPage } from '@pages/settingsPage';
import { data } from '@utils/testData';

test.describe('Settings test', () => {
    let admin: SettingsPage;
    let aPage: Page;

    test.beforeAll(async ({ browser }) => {
        const adminContext = await browser.newContext(data.auth.adminAuth);
        aPage = await adminContext.newPage();
        admin = new SettingsPage(aPage);
    });

    test.afterAll(async () => {
        await aPage.close();
    });

    test('admin can view settings menu page', { tag: ['@lite', '@exploratory'] }, async () => {
        await admin.weposSettingsRenderProperly();
    });

    test('admin can set Wepos general settings', { tag: ['@lite'] }, async () => {
        await admin.setWeposGeneralSettings(data.weposSettings.general);
    });

    test('admin can set Wepos receipts settings', { tag: ['@liteOnly'] }, async () => {
        await admin.setWeposReceiptsSettings(data.weposSettings.receipts);
    });
});
