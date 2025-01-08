//COVERAGE_TAG: POST /wepos/v1/outlets/(?P<outlet_id>[\d]+)/counters
//COVERAGE_TAG: POST /wepos/v1/outlets/(?P<outlet_id>[\d]+)/counters/(?P<id>[\d]+)
//COVERAGE_TAG: PUT /wepos/v1/outlets/(?P<outlet_id>[\d]+)/counters/(?P<id>[\d]+)
//COVERAGE_TAG: DELETE /wepos/v1/outlets/(?P<outlet_id>[\d]+)/counters/(?P<id>[\d]+)

import { test, expect, request } from '@playwright/test';
import { ApiUtils } from '@utils/apiUtils';
import { endPoints } from '@utils/apiEndPoints';
import { payloads } from '@utils/payloads';
import { schemas } from '@utils/schemas';

test.describe('Counters api test', () => {
    let apiUtils: ApiUtils;
    let outletId: string;
    let counterId: string;

    test.beforeAll(async () => {
        apiUtils = new ApiUtils(await request.newContext());
        [, outletId] = await apiUtils.createOutlet(payloads.createOutlet(), payloads.adminAuth);
        [, counterId] = await apiUtils.createCounter(outletId, payloads.createCounter(), payloads.adminAuth);
    });

    test.afterAll(async () => {
        await apiUtils.dispose();
    });

    test('create counter', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.post(endPoints.createCounter(outletId), { data: payloads.createCounter() });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.counterSchema);
    });

    test('update counter [put]', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.post(endPoints.updateCounter(outletId, counterId), { data: payloads.createCounter() });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.counterSchema);
    });

    test('update counter [post]', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.post(endPoints.updateCounter(outletId, counterId), { data: payloads.createCounter() });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.counterSchema);
    });

    test('delete counter', { tag: ['@pro'] }, async () => {
        const [, counterId] = await apiUtils.createCounter(outletId, payloads.createCounter(), payloads.adminAuth);
        const [response, responseBody] = await apiUtils.delete(endPoints.deleteCounter(outletId, counterId));
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.counterSchema);
    });
});
