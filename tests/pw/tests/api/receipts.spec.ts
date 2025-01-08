//COVERAGE_TAG: GET /wepos/v1/receipts
//COVERAGE_TAG: POST /wepos/v1/receipts

import { test, expect, request } from '@playwright/test';
import { ApiUtils } from '@utils/apiUtils';
import { endPoints } from '@utils/apiEndPoints';
import { payloads } from '@utils/payloads';
import { schemas } from '@utils/schemas';

test.describe('receipts api test', () => {
    let apiUtils: ApiUtils;

    test.beforeAll(async () => {
        apiUtils = new ApiUtils(await request.newContext());
    });

    test.afterAll(async () => {
        // reset receipt
        await apiUtils.post(endPoints.updateReceipt, { data: payloads.createReceipt });
        await apiUtils.dispose();
    });

    test('get receipt', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.get(endPoints.getReceipt);
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.receiptSchema);
    });

    test('update receipt', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.post(endPoints.updateReceipt, { data: payloads.updateReceipt });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.receiptSchema);
    });
});
