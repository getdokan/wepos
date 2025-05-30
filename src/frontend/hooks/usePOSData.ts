import { useState, useEffect, useCallback, useRef } from 'react';
import { posAPI } from '../api';
import {
  POSProduct,
  POSGateway,
  POSSettings,
  POSCategory,
  POSCartData,
  POSOrderData,
} from '../types';
import { getFromLocalStorage, setToLocalStorage } from '../utils/helpers';

// Helper function to sanitize cart data
const sanitizeCartData = (storedCartData: POSCartData): POSCartData => {
  if (storedCartData.line_items && storedCartData.line_items.length > 0) {
    storedCartData.line_items = storedCartData.line_items.map((item: any) => ({
      ...item,
      sale_price:
        typeof item.sale_price === 'string'
          ? parseFloat(item.sale_price) || 0
          : item.sale_price || 0,
      regular_price:
        typeof item.regular_price === 'string'
          ? parseFloat(item.regular_price) || 0
          : item.regular_price || 0,
      total_tax:
        typeof item.total_tax === 'string'
          ? parseFloat(item.total_tax) || 0
          : item.total_tax || 0,
    }));
  }
  return storedCartData;
};

export const usePOSData = () => {
  // Initialization tracking
  const initializeRef = useRef(false);
  const isInitializing = useRef(false);

  // ===== API DATA STATE =====
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [availableGateways, setAvailableGateways] = useState<POSGateway[]>([]);
  const [settings, setSettings] = useState<POSSettings>({} as POSSettings);
  const [categories, setCategories] = useState<POSCategory[]>([]);
  const [productLoading, setProductLoading] = useState(false);

  // ===== STORED DATA STATE =====
  const [cartData, setCartData] = useState<POSCartData>(() => {
    const defaultCartData: POSCartData = {
      line_items: [],
      fee_lines: [],
      coupon_lines: [],
    };
    const storedCartData = getFromLocalStorage('cartdata', defaultCartData);
    return sanitizeCartData(storedCartData);
  });

  const [orderData, setOrderData] = useState<POSOrderData>(() =>
    getFromLocalStorage('orderdata', {
      customer_id: 0,
      customer_note: '',
      payment_method: '',
      payment_method_title: '',
      billing: {},
      shipping: {},
    }),
  );

  // ===== API FUNCTIONS =====
  const fetchProducts = useCallback(async () => {
    if (productLoading) return;
    setProductLoading(true);
    try {
      const products = await posAPI.products.getAllPOSProducts();
      setProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductLoading(false);
    }
  }, [productLoading]);

  const fetchGateways = useCallback(async () => {
    try {
      const gateways = await posAPI.payment.getPaymentGateways();
      setAvailableGateways(gateways);
    } catch (error) {
      console.error('Error fetching gateways:', error);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const settings = await posAPI.settings.getSettings();
      setSettings(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const categories = await posAPI.products.getCategories();
      setCategories(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // ===== INITIALIZATION =====
  const initializeData = useCallback(async () => {
    if (initializeRef.current || isInitializing.current) {
      console.log('🔄 Data already initialized or initializing, skipping...');
      return;
    }

    console.log('🚀 Initializing POS data...');
    initializeRef.current = true;
    isInitializing.current = true;

    try {
      await Promise.all([
        fetchSettings(),
        fetchProducts(),
        fetchGateways(),
        fetchCategories(),
      ]);
      console.log('✅ POS data initialization complete');
    } catch (error) {
      console.error('❌ Error during POS data initialization:', error);
      initializeRef.current = false;
    } finally {
      isInitializing.current = false;
    }
  }, [fetchSettings, fetchProducts, fetchGateways, fetchCategories]);

  // ===== LOCALSTORAGE PERSISTENCE =====
  useEffect(() => {
    setToLocalStorage('cartdata', cartData);
  }, [cartData]);

  useEffect(() => {
    setToLocalStorage('orderdata', orderData);
  }, [orderData]);

  return {
    // API Data
    products,
    availableGateways,
    settings,
    categories,
    productLoading,

    // Stored Data
    cartData,
    orderData,

    // Setters
    setProducts,
    setCartData,
    setOrderData,

    // Functions
    initializeData,
    fetchProducts,
  };
};
