import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { posAPI } from '../api';
import { POSCartData, POSOrderData } from '../types';
import { getFromLocalStorage, setToLocalStorage } from '../utils/helpers';
import { PRODUCTS_STORE_NAME } from '../store/products';

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

  // Get data from products store
  const { products, availableGateways, settings, categories, productLoading } =
    useSelect((select) => {
      const store = select(PRODUCTS_STORE_NAME) as any;
      return {
        products: store.getProducts(),
        availableGateways: store.getGateways(),
        settings: store.getSettings(),
        categories: store.getCategories(),
        productLoading: store.getProductsLoading(),
      };
    }, []);

  // Dispatch actions for products store
  const {
    setProducts,
    setGateways,
    setSettings,
    setCategories,
    setProductsLoading,
    setGatewaysLoading,
    setSettingsLoading,
    setCategoriesLoading,
  } = useDispatch(PRODUCTS_STORE_NAME) as any;

  // ===== STORED DATA STATE (for local storage data not in stores) =====
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
    setProductsLoading(true);
    try {
      const products = await posAPI.products.getAllPOSProducts();
      setProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductsLoading(false);
    }
  }, [productLoading, setProductsLoading, setProducts]);

  const fetchGateways = useCallback(async () => {
    setGatewaysLoading(true);
    try {
      const gateways = await posAPI.payment.getPaymentGateways();
      setGateways(gateways);
    } catch (error) {
      console.error('Error fetching gateways:', error);
      setGatewaysLoading(false);
    }
  }, [setGatewaysLoading, setGateways]);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const settings = await posAPI.settings.getSettings();
      setSettings(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettingsLoading(false);
    }
  }, [setSettingsLoading, setSettings]);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const categories = await posAPI.products.getCategories();
      setCategories(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoriesLoading(false);
    }
  }, [setCategoriesLoading, setCategories]);

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
    // API Data (from stores)
    products,
    availableGateways,
    settings,
    categories,
    productLoading,

    // Stored Data (local storage)
    cartData,
    orderData,

    // Setters for local storage data
    setCartData,
    setOrderData,

    // Functions
    initializeData,
    fetchProducts,
  };
};
