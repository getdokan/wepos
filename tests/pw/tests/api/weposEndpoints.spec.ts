//COVERAGE_TAG: GET /wepos/v1

import { test, expect, request } from '@playwright/test';
import { ApiUtils } from '@utils/apiUtils';
import { endPoints } from '@utils/apiEndPoints';

test.describe('wepos api endpoints test', () => {
    let apiUtils: ApiUtils;

    test.beforeAll(async () => {
        apiUtils = new ApiUtils(await request.newContext());
    });

    test.afterAll(async () => {
        await apiUtils.dispose();
    });

    test('get all wepos v1 endpoints', { tag: ['@lite'] }, async () => {
        const [response, responseBody] = await apiUtils.get(endPoints.getAllWeposEndpointsV1);
        expect(response.ok()).toBeTruthy();
        expect(responseBody).toBeTruthy();
    });
});
