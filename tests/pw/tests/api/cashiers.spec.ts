//COVERAGE_TAG: GET /wepos/v1/cashiers/(?P<id>[\d]+)
//COVERAGE_TAG: POST /wepos/v1/outlets/(?P<outlet_id>[\d]+)/cashiers
//COVERAGE_TAG: POST /wepos/v1/outlets/(?P<outlet_id>[\d]+)/cashiers/create
//COVERAGE_TAG: DELETE /wepos/v1/outlets/(?P<outlet_id>[\d]+)/cashiers/(?P<user_id>[\d]+)
//COVERAGE_TAG: GET /wepos/v1/profile/(?P<cashier_id>[\d]+)
//COVERAGE_TAG: POST /wepos/v1/profile/(?P<cashier_id>[\d]+)
//COVERAGE_TAG: PUT /wepos/v1/profile/(?P<cashier_id>[\d]+)
//COVERAGE_TAG: GET /wepos/v1/cashiers/(?P<id>[\d]+)/login
//COVERAGE_TAG: POST /wepos/v1/cashiers/(?P<id>[\d]+)/login
//COVERAGE_TAG: DELETE /wepos/v1/cashiers/(?P<id>[\d]+)/login

import { test, expect, request } from '@playwright/test';
import { ApiUtils } from '@utils/apiUtils';
import { endPoints } from '@utils/apiEndPoints';
import { payloads } from '@utils/payloads';
import { schemas } from '@utils/schemas';

test.describe('Cashiers api test', () => {
    let apiUtils: ApiUtils;
    let outletId: string;
    let counterId: string;
    let cashierId: string;
    let cashierUserId: string;
    let cashierUserName: string;

    test.beforeAll(async () => {
        apiUtils = new ApiUtils(await request.newContext());
        [, outletId] = await apiUtils.createOutlet(payloads.createOutlet(), payloads.adminAuth);
        [, counterId] = await apiUtils.createCounter(outletId, payloads.createCounter(), payloads.adminAuth);
        [, cashierId] = await apiUtils.createCashier(outletId, payloads.createCashier(), payloads.adminAuth);
        const [cashierResponseBody, userId] = await apiUtils.createUser({ ...payloads.createUser(), roles: 'cashier' }, payloads.adminAuth);
        cashierUserId = userId;
        cashierUserName = cashierResponseBody.username;
    });

    test.afterAll(async () => {
        await apiUtils.dispose();
    });

    test('get single cashier', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.get(endPoints.getSingleCashier(cashierId));
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.cashierSchema);
    });

    test('create cashier', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.post(endPoints.createCashier(outletId), { data: payloads.createCashier() });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.cashierSchema);
    });

    test('assign cashier', { tag: ['@pro'] }, async () => {
        const [, cashierId] = await apiUtils.createUser({ ...payloads.createUser(), roles: 'cashier' }, payloads.adminAuth);
        const [response, responseBody] = await apiUtils.post(endPoints.assignCashier(outletId), { data: { user_ids: [cashierId] } });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.assignCashierSchema);
    });

    test('remove cashier', { tag: ['@pro'] }, async () => {
        const [, cashierId] = await apiUtils.createCashier(outletId, payloads.createCashier(), payloads.adminAuth);
        const [response, responseBody] = await apiUtils.delete(endPoints.deleteCashier(outletId, cashierId));
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.cashierSchema);
    });

    // cashier profile

    test('get cashier profile', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.get(endPoints.getCashierProfile(cashierUserId), { headers: payloads.userAuth(cashierUserName) });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.cashierSchema);
    });

    test('update cashier profile [put]', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.put(endPoints.updateCashierProfile(cashierUserId), { data: payloads.adminProfile, headers: payloads.userAuth(cashierUserName) });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.updateCahierSchema);
    });

    test('update cashier profile [post]', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.post(endPoints.updateCashierProfile(cashierUserId), { data: payloads.adminProfile, headers: payloads.userAuth(cashierUserName) });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.updateCahierSchema);
    });

    test('get cashier login status', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.get(endPoints.getLoginStatus(cashierId));
        expect(response.ok()).toBeTruthy();
        responseBody ? expect(responseBody).toBeTruthy() : responseBody == false;
        expect(responseBody).toMatchSchema(schemas.cashierLoginSchema);
    });

    test('login cashier', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.post(endPoints.loginCashier(cashierId), { data: { outlet_id: outletId, counter_id: counterId } });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.loginLogoutCashier);
    });

    test('logout cashier', { tag: ['@pro'] }, async () => {
        await apiUtils.loginCashier(cashierId, outletId, counterId, payloads.adminAuth);
        const [response, responseBody] = await apiUtils.delete(endPoints.logoutCashier(cashierId), { data: { outlet_id: outletId, counter_id: counterId } });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.loginLogoutCashier);
    });
});
