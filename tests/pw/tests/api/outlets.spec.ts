//COVERAGE_TAG: GET /wepos/v1/outlets
//COVERAGE_TAG: POST /wepos/v1/outlets
//COVERAGE_TAG: POST /wepos/v1/outlets/(?P<id>[\d]+)
//COVERAGE_TAG: PUT /wepos/v1/outlets/(?P<id>[\d]+)
//COVERAGE_TAG: DELETE /wepos/v1/outlets/(?P<id>[\d]+)

import { test, expect, request } from '@playwright/test';
import { ApiUtils } from '@utils/apiUtils';
import { endPoints } from '@utils/apiEndPoints';
import { payloads } from '@utils/payloads';
import { schemas } from '@utils/schemas';

test.describe('Outlets api test', () => {
    let apiUtils: ApiUtils;
    let outletId: string;

    test.beforeAll(async () => {
        apiUtils = new ApiUtils(await request.newContext());
        [, outletId] = await apiUtils.createOutlet(payloads.createOutlet(), payloads.adminAuth);
    });

    test.afterAll(async () => {
        await apiUtils.dispose();
    });

    test('get all outlets', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.get(endPoints.getAllOutlets);
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.outletsSchema.outletsSchema);
    });

    test('create outlet', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.post(endPoints.createOutlet, { data: payloads.createOutlet() });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.outletsSchema.outletSchema);
    });

    test('update outlet [put]', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.put(endPoints.updateOutlet(outletId), { data: payloads.createOutlet() });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.outletsSchema.outletSchema);
    });

    test('update outlet [post]', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.post(endPoints.updateOutlet(outletId), { data: payloads.createOutlet() });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.outletsSchema.outletSchema);
    });

    test('delete outlet', { tag: ['@pro'] }, async () => {
        const [, outletId] = await apiUtils.createOutlet(payloads.createOutlet(), payloads.adminAuth);
        const [response, responseBody] = await apiUtils.delete(endPoints.deleteOutlet(outletId));
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.outletsSchema.deleteSchema);
    });
});
