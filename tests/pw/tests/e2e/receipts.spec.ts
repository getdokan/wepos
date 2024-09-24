import { test, Page, request } from '@playwright/test';
import { Receipts } from '@pages/receiptsPage';
import { ApiUtils } from '@utils/apiUtils';
import { payloads } from '@utils/payloads';
import { data } from '@utils/testData';

test.describe('Receipts test', () => {
    let admin: Receipts;
    let aPage: Page;
    let apiUtils: ApiUtils;

    test.beforeAll(async ({ browser }) => {
        const adminContext = await browser.newContext(data.auth.adminAuth);
        aPage = await adminContext.newPage();
        admin = new Receipts(aPage);

        apiUtils = new ApiUtils(await request.newContext());
        await apiUtils.uploadMedia(data.receipt.logoDetails.logo, payloads.mimeTypes.png, payloads.adminAuth);
    });

    test.afterAll(async () => {
        await aPage.close();
    });

    test('admin can view receipts', { tag: ['@pro'] }, async () => {
        await admin.receiptsRenderProperly();
    });

    test('admin can set receipt logo', { tag: ['@pro'] }, async () => {
        await admin.setReceiptLogo(data.receipt.logoDetails);
    });

    test('admin can set receipt style', { tag: ['@pro'] }, async () => {
        await admin.setReceiptStyle(data.receipt.styleDetails);
    });

    test('admin can set receipt header details', { tag: ['@pro'] }, async () => {
        await admin.setReceiptHeaderDetails(data.receipt.headersDetails);
    });

    test('admin can set receipt item details', { tag: ['@pro'] }, async () => {
        await admin.setReceiptItemDetails(data.receipt.itemDetails);
    });

    test('admin can set receipt footer details', { tag: ['@pro'] }, async () => {
        await admin.setReceiptFooterDetails(data.receipt.footerDetails.footerText);
    });
});
