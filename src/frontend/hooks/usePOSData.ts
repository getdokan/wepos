import { useState, useEffect, useCallback } from 'react';
import apiFetch from '@wordpress/api-fetch';
import {
  POSProduct,
  POSGateway,
  POSSettings,
  POSCategory,
  POSCartData,
  POSOrderData
} from '../types';
import { getFromLocalStorage, setToLocalStorage } from '../utils/helpers';

export const usePOSData = () => {
  // Data State
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [availableGateways, setAvailableGateways] = useState<POSGateway[]>([]);
  const [settings, setSettings] = useState<POSSettings>({} as POSSettings);
  const [categories, setCategories] = useState<POSCategory[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [productLoading, setProductLoading] = useState(false);

  // Cart and Order data with localStorage persistence
  const [cartData, setCartData] = useState<POSCartData>(() => {
    const defaultCartData: POSCartData = {
      line_items: [],
      fee_lines: [],
      coupon_lines: []
    };

    const storedCartData = getFromLocalStorage('cartdata', defaultCartData);

    // Sanitize cart data to ensure prices are numbers
    if (storedCartData.line_items && storedCartData.line_items.length > 0) {
      storedCartData.line_items = storedCartData.line_items.map((item: any) => ({
        ...item,
        sale_price: typeof item.sale_price === 'string' ? parseFloat(item.sale_price) || 0 : (item.sale_price || 0),
        regular_price: typeof item.regular_price === 'string' ? parseFloat(item.regular_price) || 0 : (item.regular_price || 0),
        total_tax: typeof item.total_tax === 'string' ? parseFloat(item.total_tax) || 0 : (item.total_tax || 0)
      }));
    }

    return storedCartData;
  });

  const [orderData, setOrderData] = useState<POSOrderData>(() =>
    getFromLocalStorage('orderdata', {
      customer_id: 0,
      customer_note: '',
      payment_method: '',
      payment_method_title: '',
      billing: {},
      shipping: {}
    })
  );

  // Helper function to check if all variations are disabled (exact Vue.js implementation)
  const isAllVariationsDisabled = (product: POSProduct): boolean => {
    let isDisabled = true;

    if (product.attributes) {
      product.attributes.forEach(attribute => {
        if (true === attribute.variation) {
          isDisabled = false;
        }
      });
    }

    return isDisabled;
  };

  // Append products with filtering (exact Vue.js implementation)
  const appendProducts = useCallback((products: POSProduct[]) => {
      products.forEach(product => {
      if ("variable" === product.type && isAllVariationsDisabled(product)) {
        return;
      }

      setProducts(prev => [...prev, product]);
    });
  }, []);

  // API functions
  const fetchProducts = useCallback(async () => {
    if (page === 1) {
      setProductLoading(true);
    }

    if (totalPages >= page) {
      try {
        // Use apiFetch with parse: false to access headers
        const response = await apiFetch({
          path: `/${window.wepos.rest.posversion}/products?status=publish&per_page=30&page=${page}`,
          parse: false,
        }) as Response;

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const products = await response.json() as POSProduct[];

        // Get total pages from header (matching Vue.js implementation)
        const totalPagesHeader = response.headers.get('X-WP-TotalPages');
        if (totalPagesHeader) {
          setTotalPages(parseInt(totalPagesHeader));
        }

        // Use appendProducts exactly like Vue.js
        appendProducts(products);
        setPage(prev => prev + 1);
        setProductLoading(false);

        // Only continue if we got a full page of products (like Vue.js logic)
        if (products.length === 30) {
          setTimeout(fetchProducts, 10);
        }
      } catch (error) {
        setProductLoading(false);
      }
    } else {
      setProductLoading(false);
    }
  }, [page, totalPages, appendProducts]);

  const fetchGateways = useCallback(async () => {
    try {
      const response = await apiFetch({
        path: `/${window.wepos.rest.posversion}/payment/gateways`
      }) as POSGateway[];
      setAvailableGateways(response);
    } catch (error) {
      console.error('Error fetching gateways:', error);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await apiFetch({
        path: `/${window.wepos.rest.posversion}/settings`
      }) as POSSettings;
      setSettings(response);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiFetch({
        path: `/${window.wepos.rest.wcversion}/products/categories?hide_empty=true&_fields=id,name,parent_id&per_page=100`
      }) as POSCategory[];

      response.sort((a: POSCategory, b: POSCategory) => a.name.localeCompare(b.name));

      const createTree = (categories: POSCategory[], parentId: number | null = null, level = 0): POSCategory[] => {
        return categories
          .filter(cat => cat.parent_id === parentId)
          .map(cat => {
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
        parent_id: null
      };

      setCategories([allCategoriesOption, ...sortedCategories]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Initialize data
  const initializeData = useCallback(() => {
    fetchSettings();
    fetchProducts();
    fetchGateways();
    fetchCategories();
  }, [fetchSettings, fetchProducts, fetchGateways, fetchCategories]);

  // Save to localStorage whenever cart or order data changes
  useEffect(() => {
    setToLocalStorage('cartdata', cartData);
  }, [cartData]);

  useEffect(() => {
    setToLocalStorage('orderdata', orderData);
  }, [orderData]);

  return {
    // Data
    products,
    availableGateways,
    settings,
    categories,
    cartData,
    orderData,
    productLoading,

    // Setters
    setProducts,
    setCartData,
    setOrderData,

    // Functions
    initializeData,
    fetchProducts,
  };
};
