import { test, Page } from '@playwright/test';
import { SettingsPage } from '@pages/settingsPage';
import { data } from '@utils/testData';

// FIXME: written against the legacy PHP settings screen (nav-tabs, TinyMCE
// iframes); the admin settings are now a React plugin-ui app under
// page=wepos-dashboard#/settings. Un-skip while rebuilding the selectors.
test.describe.fixme('Settings test', () => {
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
