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
  const [cartData, setCartData] = useState<POSCartData>(() =>
    getFromLocalStorage('cartdata', {
      line_items: [],
      fee_lines: [],
      coupon_lines: []
    })
  );

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

  // API functions
  const fetchProducts = useCallback(async () => {
    if (page === 1) {
      setProductLoading(true);
    }

    if (totalPages >= page) {
      try {
        const response = await apiFetch({
          path: `/${window.wepos.rest.posversion}/products?status=publish&per_page=30&page=${page}`
        }) as POSProduct[];

        const validProducts = response.filter(product => {
          if (product.type === 'variable' && !product.attributes?.some(attr => attr.variation === true)) {
            return false;
          }
          return true;
        });

        setProducts(prev => [...prev, ...validProducts]);
        setPage(prev => prev + 1);
        setProductLoading(false);

        if (response.length === 30) {
          setTimeout(fetchProducts, 100);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProductLoading(false);
      }
    } else {
      setProductLoading(false);
    }
  }, [page, totalPages]);

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
