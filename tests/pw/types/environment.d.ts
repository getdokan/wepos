export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            [key: string]: string;
            ADMIN: string;
            ADMIN_PASSWORD: string;
            CUSTOMER: string;
            CASHIER: string;
            USER_PASSWORD: string;
            ADMIN_ID: string;
            CUSTOMER_ID: string;
            CASHIER_ID: string;
            PRODUCT_ID: string;
            LOCAL: boolean;
            CI: string;
            LICENSE_KEY: string;
            WEPOS_PRO: boolean;
            SITE_PATH: string;
            BASE_URL: string;
            HEADLESS: string;
            SLOWMO: string;
            DEVTOOLS: string;
            RETRY_TIMES: string;
            TIME_OUT: string;
            NO_SETUP: string;
            SERVER_URL: string;
            ADMIN_AUTH: string;
            CUSTOMER_AUTH: string;
            DB_HOST_NAME: string;
            DB_USER_NAME: string;
            DB_USER_PASSWORD: string;
            DATABASE: string;
            DB_PORT: number;
            DB_PREFIX: string;
            API_TEST_RESULT: string;
            E2E_TEST_RESULT: string;
            API_COVERAGE: string;
            E2E_COVERAGE: string;
        }
    }
}
