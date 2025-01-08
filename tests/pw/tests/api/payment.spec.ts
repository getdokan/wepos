//COVERAGE_TAG: GET /wepos/v1/payment/gateways
//COVERAGE_TAG: GET /wepos/v1/payment/summary
//COVERAGE_TAG: POST /wepos/v1/payment/process
//COVERAGE_TAG: GET /wepos/v1/payment/reports
//COVERAGE_TAG: GET /wepos/v1/payment/reports/export

import { test, expect, request } from '@playwright/test';
import { ApiUtils } from '@utils/apiUtils';
import { endPoints } from '@utils/apiEndPoints';
import { payloads } from '@utils/payloads';
import { schemas } from '@utils/schemas';

test.describe('payment api test', () => {
    let apiUtils: ApiUtils;

    test.beforeAll(async () => {
        apiUtils = new ApiUtils(await request.newContext());
    });

    test.afterAll(async () => {
        await apiUtils.dispose();
    });

    test('get all payment gateways', { tag: ['@lite'] }, async () => {
        const [response, responseBody] = await apiUtils.get(endPoints.getAllPaymentGateways);
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.paymentMethodsSchema);
    });

    test('get payment summary', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.get(endPoints.getPaymentSummary);
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.paymentSummarySchema);
    });

    test('process payment', { tag: ['@pro'] }, async () => {
        const [productResponseBody, productId] = await apiUtils.createProduct(payloads.createProduct());
        const [, , orderId] = await apiUtils.createOrder(productId, {
            ...payloads.createOrder,
            meta_data: payloads.createOrder.meta_data.map(meta => (meta.key === '_wepos_cash_tendered_amount' ? { ...meta, value: productResponseBody.price } : meta)),
        });
        const [response, responseBody] = await apiUtils.post(endPoints.processPayment, { data: { ...payloads.processPayment, id: orderId } });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.processPaymentSchema);
    });

    test('get payment reports', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.get(endPoints.getPaymentReports);
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.paymentReportSchema);
    });

    test('get exported payment report', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.get(endPoints.getExportedReport);
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.exportedReportSchema);
    });
});
