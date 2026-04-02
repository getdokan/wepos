import apiFetch from '@wordpress/api-fetch';
import {
  Product,
  Order,
  Customer,
  CartItem,
  APIResponse,
  PaginatedResponse,
  UseProductsOptions,
  UseOrdersOptions,
  POSProduct,
  POSGateway,
  POSSettings,
  POSCategory,
  POSTag,
  POSBrand,
} from '../types';

// Configure api-fetch with WePOS endpoints
apiFetch.use(apiFetch.createNonceMiddleware(window.wepos.rest.nonce));
apiFetch.use(apiFetch.createRootURLMiddleware(window.wepos.rest.root));

// Base API configuration
const API_BASE = {
  WC: `${window.wepos.rest.wcversion}`,
  WEPOS: `${window.wepos.rest.posversion}`,
};

// Products API
const productsAPI = {
  getProducts: async (
    options: UseProductsOptions = {},
  ): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();

    if (options.search) params.append('search', options.search);
    if (options.category)
      params.append('category', options.category.toString());
    if (options.per_page)
      params.append('per_page', options.per_page.toString());
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

  // Filter out variable products with all variations disabled
  filterValidProducts: (products: POSProduct[]): POSProduct[] => {
    const isAllVariationsDisabled = (product: POSProduct): boolean => {
      let isDisabled = true;
      if (product.attributes) {
        product.attributes.forEach((attribute) => {
          if (true === attribute.variation) {
            isDisabled = false;
          }
        });
      }
      return isDisabled;
    };

    return products.filter((product) => {
      if ('variable' === product.type && isAllVariationsDisabled(product)) {
        return false;
      }
      return true;
    });
  },

  // Fetch products page by page sequentially, pushing each page to the store
  // via the onPageLoaded callback (matches the Vue loading pattern)
  fetchProductsPageByPage: async (
    onPageLoaded: (products: POSProduct[]) => void,
  ): Promise<void> => {
    let page = 1;
    let totalPages = 1;

    do {
      const response = (await apiFetch({
        path: `${API_BASE.WEPOS}/products?status=publish&per_page=30&page=${page}`,
        parse: false,
      })) as Response;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const products = (await response.json()) as POSProduct[];

      // Get total pages from header on each request
      const totalPagesHeader = response.headers.get('X-WP-TotalPages');
      totalPages = totalPagesHeader ? parseInt(totalPagesHeader) : 1;

      // Filter and push this page's products to the store immediately
      const validProducts = productsAPI.filterValidProducts(products);
      onPageLoaded(validProducts);

      page += 1;
    } while (page <= totalPages);
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

  // Get product categories for POS
  getCategories: async (): Promise<POSCategory[]> => {
    const response = (await apiFetch({
      path: `${API_BASE.WC}/products/categories?hide_empty=true&_fields=id,name,parent_id&per_page=100`,
    })) as POSCategory[];

    response.sort((a: POSCategory, b: POSCategory) =>
      a.name.localeCompare(b.name),
    );

    const createTree = (
      categories: POSCategory[],
      parentId: number | null = null,
      level = 0,
    ): POSCategory[] => {
      return categories
        .filter((cat) => cat.parent_id === parentId)
        .map((cat) => {
          const categoryWithLevel = { ...cat, level };
          const children = createTree(categories, cat.id, level + 1);
          return [categoryWithLevel, ...children];
        })
        .flat();
    };

    const sortedCategories = createTree(response);

    const allCategoriesOption: POSCategory = {
      id: -1,
      level: 0,
      name: 'All categories',
      parent_id: null,
    };

    return [allCategoriesOption, ...sortedCategories];
  },

  // Get product tags for POS
  getTags: async (): Promise<POSTag[]> => {
    const response = (await apiFetch({
      path: `${API_BASE.WC}/products/tags?hide_empty=true&_fields=id,name&per_page=100`,
    })) as POSTag[];

    response.sort((a: POSTag, b: POSTag) => a.name.localeCompare(b.name));

    return response;
  },

  // Get product brands for POS
  getBrands: async (): Promise<POSBrand[]> => {
    try {
      const response = (await apiFetch({
        path: `${API_BASE.WC}/products/brands?hide_empty=true&_fields=id,name&per_page=100`,
      })) as POSBrand[];

      response.sort((a: POSBrand, b: POSBrand) => a.name.localeCompare(b.name));

      return response;
    } catch {
      // Brands endpoint may not exist if WooCommerce Brands plugin is not active
      return [];
    }
  },
};

// Orders API
const ordersAPI = {
  getOrders: async (
    options: UseOrdersOptions = {},
  ): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams();

    if (options.status?.length)
      params.append('status', options.status.join(','));
    if (options.customer)
      params.append('customer', options.customer.toString());
    if (options.per_page)
      params.append('per_page', options.per_page.toString());
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

  // Create order using WooCommerce API (used in POS checkout)
  createOrder: async (orderData: any): Promise<any> => {
    const isProSaveCartsEnabled = Boolean((window as any).__weposProSaveCartsEnabled);
    const response = await apiFetch({
      path: isProSaveCartsEnabled ? `/wepos/v1/orders` : `/${API_BASE.WC}/orders`,
      method: 'POST',
      data: orderData,
    });

    return response;
  },

  updateOrder: async (
    id: number,
    orderData: Partial<Order>,
  ): Promise<Order> => {
    const isProSaveCartsEnabled = Boolean((window as any).__weposProSaveCartsEnabled);
    const response = await apiFetch({
      path: isProSaveCartsEnabled ? `/wepos/v1/orders/${id}` : `${API_BASE.WC}/orders/${id}`,
      method: 'PUT',
      data: orderData,
    });

    return response as Order;
  },

  deleteOrder: async (id: number, force: boolean = true): Promise<any> => {
    const isProSaveCartsEnabled = Boolean((window as any).__weposProSaveCartsEnabled);
    const response = await apiFetch({
      path: isProSaveCartsEnabled
        ? `/wepos/v1/orders/${id}?force=${force}`
        : `${API_BASE.WC}/orders/${id}?force=${force}`,
      method: 'DELETE',
    });

    return response;
  },
};

// Cart API
const cartAPI = {
  getCart: async (): Promise<CartItem[]> => {
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/cart`,
      method: 'GET',
    });

    return response as CartItem[];
  },

  addToCart: async (
    productId: number,
    quantity: number = 1,
    variationId?: number,
  ): Promise<APIResponse<CartItem>> => {
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

  updateCartItem: async (
    key: string,
    quantity: number,
  ): Promise<APIResponse<CartItem>> => {
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
const customersAPI = {
  getCustomers: async (search?: string): Promise<Customer[]> => {
    const params = new URLSearchParams();

    if (search) params.append('search', search);
    params.append('role', 'all');

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

  createCustomer: async (
    customerData: Partial<Customer>,
  ): Promise<Customer> => {
    const response = await apiFetch({
      path: `${API_BASE.WC}/customers`,
      method: 'POST',
      data: customerData,
    });

    return response as Customer;
  },

  updateCustomer: async (
    id: number,
    customerData: Partial<Customer>,
  ): Promise<Customer> => {
    const response = await apiFetch({
      path: `${API_BASE.WC}/customers/${id}`,
      method: 'PUT',
      data: customerData,
    });

    return response as Customer;
  },
};

// Payment API
const paymentAPI = {
  // Process payment for POS orders
  processPayment: async (orderData: any): Promise<any> => {
    const response = await apiFetch({
      path: `/${API_BASE.WEPOS}/payment/process`,
      method: 'POST',
      data: orderData,
    });

    return response;
  },

  // Get payment gateways
  getPaymentGateways: async (): Promise<POSGateway[]> => {
    const response = await apiFetch({
      path: `/${API_BASE.WEPOS}/payment/gateways`,
      method: 'GET',
    });

    return response as POSGateway[];
  },
};

// Settings API
const settingsAPI = {
  // Get POS settings (optionally for a specific outlet)
  getSettings: async (outletId?: number): Promise<POSSettings> => {
    const params = new URLSearchParams();
    if (outletId) {
      params.append('outlet_id', outletId.toString());
    }
    const query = params.toString();
    const response = await apiFetch({
      path: `/${API_BASE.WEPOS}/settings${query ? `?${query}` : ''}`,
      method: 'GET',
    });

    return response as POSSettings;
  },

  updateSettings: async (settings: any, outletId?: number): Promise<APIResponse<any>> => {
    const data = outletId ? { ...settings, _outlet_id: outletId } : settings;
    const response = await apiFetch({
      path: `${API_BASE.WEPOS}/settings`,
      method: 'POST',
      data,
    });

    return response as APIResponse<any>;
  },
};

// Reports API
const reportsAPI = {
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

// Main POS API - single export point
export const posAPI = {
  products: productsAPI,
  orders: ordersAPI,
  cart: cartAPI,
  customers: customersAPI,
  payment: paymentAPI,
  settings: settingsAPI,
  reports: reportsAPI,
};
