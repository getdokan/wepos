//COVERAGE_TAG: GET /wepos/v1/products
//COVERAGE_TAG: PUT /wepos/v1/products/(?P<id>[\d]+)
//COVERAGE_TAG: POST /wepos/v1/products/(?P<id>[\d]+)

import { test, expect, request } from '@playwright/test';
import { ApiUtils } from '@utils/apiUtils';
import { endPoints } from '@utils/apiEndPoints';
import { payloads } from '@utils/payloads';
import { schemas } from '@utils/schemas';

test.describe('products api test', () => {
    let apiUtils: ApiUtils;
    let productId: string;

    test.beforeAll(async () => {
        apiUtils = new ApiUtils(await request.newContext());
        [, productId] = await apiUtils.createProduct(payloads.createProduct());
    });

    test.afterAll(async () => {
        await apiUtils.dispose();
    });

    test('get all products', { tag: ['@lite'] }, async () => {
        const [response, responseBody] = await apiUtils.get(endPoints.getAllProducts);
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.productsSchema.productsSchema);
    });

    test('update a product [put]', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.put(endPoints.updateProduct(productId), { data: payloads.updateProduct() });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.productsSchema.productSchema);
    });

    test('update a product [post]', { tag: ['@pro'] }, async () => {
        const [response, responseBody] = await apiUtils.post(endPoints.updateProduct(productId), { data: payloads.updateProduct() });
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
        expect(responseBody).toMatchSchema(schemas.productsSchema.productSchema);
    });
});
