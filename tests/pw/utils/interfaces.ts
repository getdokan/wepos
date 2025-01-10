import fs from 'fs';
// api interfaces
export interface auth {
    [key: string]: string;
    Authorization: string;
}

export interface user_api {
    username: string;
    password: string;
}

export interface taxRate {
    // [key: string]: string | number | boolean | string [];
    country: string;
    state: string;
    postcode: string;
    city: string;
    rate: string;
    name: string;
    priority: number;
    compound: boolean;
    shipping: boolean;
    order: number;
    class: string;
    postcodes: string[];
    cities: string[];
}

export interface coupon_api {
    code: string;
    amount: string;
    discount_type: string;
    product_ids: number[];
    individual_use?: boolean;
    meta_data?: { key: string; value: string }[];
}

export interface reqOptions {
    data?: any;
    failOnStatusCode?: boolean | undefined;
    form?: Record<string, string | number | boolean> | undefined;
    headers?: Record<string, string> | undefined;
    ignoreHTTPSErrors?: boolean | undefined;
    maxRedirects?: number | undefined;
    multipart?: Record<string, string | number | boolean | fs.ReadStream | { name: string; mimeType: string; buffer: Buffer }> | undefined;
    params?: Record<string, string | number | boolean> | undefined;
    timeout?: number | undefined;
}

export type params = Record<string, string | number | boolean> | undefined;

export type headers = Record<string, string>;

export interface storageState {
    cookies: {
        name: string;
        value: string;
        domain: string;
        path: string;
        expires: number;
        httpOnly: boolean;
        secure: boolean;
        sameSite: 'Strict' | 'Lax' | 'None';
    }[];
    origins: {
        origin: string;
        localStorage: {
            name: string;
            value: string;
        }[];
    }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type responseBody = any;

// product details
export interface productDetails {
    title: string;
    category: string;
    tag: string;
    sku: string;
    price: string;
    weight: string;
    visibility: string;
    stockQuantity: string;
    allowBackOrders: string;
}

// customer details
export interface customerDetails {
    firstName: string;
    lastName: string;
    email: string;
    address1: string;
    address2: string;
    country: string;
    state: string;
    city: string;
    zipCode: string;
    phone: string;
}
export interface paymentGateway {
    name: string;
    card: {
        customer: {
            customerEmail: string;
            customerFullName: string;
        };
        last4Digit: string;
        cardType: string;
        invoiceNumber: string;
    };
}

// wepos settings
export interface weposSettings {
    general: {
        calculateTaxForFee: string;
        barcodeScannerField: string;
        saveSuccessMessage: string;
    };
    receipts: {
        orderReceiptHeader: string;
        orderReceiptFooter: string;
        saveSuccessMessage: string;
    };
}

export interface outlet {
    outletName: string;

    address1: string;
    address2: string;
    country: string;
    state: string;
    city: string;
    zipCode: string;

    email: string;
    phone: string;
    fax: string;
    website: string;
}
export interface outlet {
    outletName: string;

    address1: string;
    address2: string;
    country: string;
    state: string;
    city: string;
    zipCode: string;

    email: string;
    phone: string;
    fax: string;
    website: string;
}
export interface counter {
    name: string;
    number: string;
}

export interface cashier {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    website: string;
}

export interface cashierProfileDetails {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
}

export interface receipt {
    //  logo settings
    logoDetails: {
        logo: string;
        height: string;
        width: string;
    };

    // style settings
    styleDetails: {
        paddingTop: string;
        paddingRight: string;
        paddingBottom: string;
        paddingLeft: string;
        headerFontSize: string;
        paragraphFontSize: string;
    };

    // header details
    headersDetails: {
        phoneLabel: string;
        emailLabel: string;
        cashierNameLabel: string;
        counterNameLabel: string;
        invoiceIdLabel: string;
        customerNameLabel: string;
        counterIdLabel: string;
        taxLabel: string;
        taxNumber: string;
    };

    // item details
    itemDetails: {
        productColumnLabel: string;
        unitCostColumnLabel: string;
        quantityColumnLabel: string;
        totalColumnLabel: string;
    };
}
