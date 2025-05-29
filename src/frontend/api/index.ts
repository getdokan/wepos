import apiFetch from '@wordpress/api-fetch';
import {
  Product,
  Order,
  Customer,
  CartItem,
  APIResponse,
  PaginatedResponse,
  UseProductsOptions,
  UseOrdersOptions
} from '@/types';

// Configure api-fetch with WePOS endpoints
apiFetch.use(apiFetch.createNonceMiddleware(window.wepos.rest.nonce));
apiFetch.use(apiFetch.createRootURLMiddleware(window.wepos.rest.root));

// Base API configuration
const API_BASE = {
  WC: `${window.wepos.rest.wcversion}`,
  WEPOS: `${window.wepos.rest.posversion}`,
};

// Products API
export const productsAPI = {
  getProducts: async (options: UseProductsOptions = {}): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();

    if (options.search) params.append('search', options.search);
    if (options.category) params.append('category', options.category.toString());
    if (options.per_page) params.append('per_page', options.per_page.toString());
    if (options.page) params.append('page', options.page.toString());
    if (options.status) params.append('status', options.status);
    if (options.orderby) params.append('orderby', options.orderby);
    if (options.order) params.append('order', options.order);

    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/products?${params.toString()}`,
      method: 'GET',
    });

    return response as PaginatedResponse<Product>;
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await apiFetch({
      path: `${API_BASE.WC}/products/${id}`,
      method: 'GET',
    });

    return response as Product;
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/products/search?s=${encodeURIComponent(query)}`,
      method: 'GET',
    });

    return response as Product[];
  },

  getProductByBarcode: async (barcode: string): Promise<Product | null> => {
    try {
      const response = await apiFetch({
        path: `${API_BASE.WEPOS}/products/barcode/${encodeURIComponent(barcode)}`,
        method: 'GET',
      });

      return response as Product;
    } catch (error) {
      return null;
    }
  },
};

// Orders API
export const ordersAPI = {
  getOrders: async (options: UseOrdersOptions = {}): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams();

    if (options.status?.length) params.append('status', options.status.join(','));
    if (options.customer) params.append('customer', options.customer.toString());
    if (options.per_page) params.append('per_page', options.per_page.toString());
    if (options.page) params.append('page', options.page.toString());
    if (options.after) params.append('after', options.after);
    if (options.before) params.append('before', options.before);
    if (options.orderby) params.append('orderby', options.orderby);
    if (options.order) params.append('order', options.order);

    const response = await apiFetch({
      path: `${API_BASE.WC}/orders?${params.toString()}`,
      method: 'GET',
    });

    return response as PaginatedResponse<Order>;
  },

  getOrder: async (id: number): Promise<Order> => {
    const response = await apiFetch({
      path: `${API_BASE.WC}/orders/${id}`,
      method: 'GET',
    });

    return response as Order;
  },

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/orders`,
      method: 'POST',
      data: orderData,
    });

    return response as Order;
  },

  updateOrder: async (id: number, orderData: Partial<Order>): Promise<Order> => {
    const response = await apiFetch({
      path: `${API_BASE.WC}/orders/${id}`,
      method: 'PUT',
      data: orderData,
    });

    return response as Order;
  },
};

// Cart API
export const cartAPI = {
  getCart: async (): Promise<CartItem[]> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/cart`,
      method: 'GET',
    });

    return response as CartItem[];
  },

  addToCart: async (productId: number, quantity: number = 1, variationId?: number): Promise<APIResponse<CartItem>> => {
    const data: any = {
      product_id: productId,
      quantity,
    };

    if (variationId) {
      data.variation_id = variationId;
    }

    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/cart/add`,
      method: 'POST',
      data,
    });

    return response as APIResponse<CartItem>;
  },

  updateCartItem: async (key: string, quantity: number): Promise<APIResponse<CartItem>> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/cart/update`,
      method: 'POST',
      data: {
        key,
        quantity,
      },
    });

    return response as APIResponse<CartItem>;
  },

  removeFromCart: async (key: string): Promise<APIResponse<boolean>> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/cart/remove`,
      method: 'POST',
      data: {
        key,
      },
    });

    return response as APIResponse<boolean>;
  },

  clearCart: async (): Promise<APIResponse<boolean>> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/cart/clear`,
      method: 'POST',
    });

    return response as APIResponse<boolean>;
  },

  applyCoupon: async (code: string): Promise<APIResponse<any>> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/cart/coupon`,
      method: 'POST',
      data: {
        code,
      },
    });

    return response as APIResponse<any>;
  },

  removeCoupon: async (code: string): Promise<APIResponse<boolean>> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/cart/coupon`,
      method: 'DELETE',
      data: {
        code,
      },
    });

    return response as APIResponse<boolean>;
  },
};

// Customers API
export const customersAPI = {
  getCustomers: async (search?: string): Promise<Customer[]> => {
    const params = new URLSearchParams();

    if (search) params.append('search', search);

    const response = await apiFetch({
      path: `${API_BASE.WC}/customers?${params.toString()}`,
      method: 'GET',
    });

    return response as Customer[];
  },

  getCustomer: async (id: number): Promise<Customer> => {
    const response = await apiFetch({
      path: `${API_BASE.WC}/customers/${id}`,
      method: 'GET',
    });

    return response as Customer;
  },

  createCustomer: async (customerData: Partial<Customer>): Promise<Customer> => {
    const response = await apiFetch({
      path: `${API_BASE.WC}/customers`,
      method: 'POST',
      data: customerData,
    });

    return response as Customer;
  },

  updateCustomer: async (id: number, customerData: Partial<Customer>): Promise<Customer> => {
    const response = await apiFetch({
      path: `${API_BASE.WC}/customers/${id}`,
      method: 'PUT',
      data: customerData,
    });

    return response as Customer;
  },
};

// Payment API
export const paymentAPI = {
  processPayment: async (orderData: any, paymentMethod: string): Promise<APIResponse<Order>> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/payment/process`,
      method: 'POST',
      data: {
        ...orderData,
        payment_method: paymentMethod,
      },
    });

    return response as APIResponse<Order>;
  },

  getPaymentGateways: async (): Promise<any[]> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/payment/gateways`,
      method: 'GET',
    });

    return response as any[];
  },
};

// Settings API
export const settingsAPI = {
  getSettings: async (): Promise<any> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/settings`,
      method: 'GET',
    });

    return response;
  },

  updateSettings: async (settings: any): Promise<APIResponse<any>> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/settings`,
      method: 'POST',
      data: settings,
    });

    return response as APIResponse<any>;
  },
};

// Reports API
export const reportsAPI = {
  getSalesReport: async (period: string = 'today'): Promise<any> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/reports/sales?period=${period}`,
      method: 'GET',
    });

    return response;
  },

  getTopProducts: async (period: string = 'today'): Promise<any> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/reports/top-products?period=${period}`,
      method: 'GET',
    });

    return response;
  },
};

// Export all APIs
export default {
  products: productsAPI,
  orders: ordersAPI,
  cart: cartAPI,
  customers: customersAPI,
  payment: paymentAPI,
  settings: settingsAPI,
  reports: reportsAPI,
};
