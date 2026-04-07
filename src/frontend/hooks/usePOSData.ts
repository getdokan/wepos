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
  const { products, availableGateways, settings, categories, tags, brands, productLoading } =
    useSelect((select) => {
      const store = select(PRODUCTS_STORE_NAME) as any;
      return {
        products: store.getProducts(),
        availableGateways: store.getGateways(),
        settings: store.getSettings(),
        categories: store.getCategories(),
        tags: store.getTags(),
        brands: store.getBrands(),
        productLoading: store.getProductsLoading(),
      };
    }, []);

  // Dispatch actions for products store
  const {
    setProducts,
    appendProducts,
    setGateways,
    setSettings,
    setCategories,
    setTags,
    setBrands,
    setProductsLoading,
    setGatewaysLoading,
    setSettingsLoading,
    setCategoriesLoading,
    setTagsLoading,
    setBrandsLoading,
  } = useDispatch(PRODUCTS_STORE_NAME) as any;

  // ===== STORED DATA STATE (for local storage data not in stores) =====
  const [cartData, setCartData] = useState<POSCartData>(() => {
    const defaultCartData: POSCartData = {
      line_items: [],
      fee_lines: [],
      coupon_lines: [],
      shipping_lines: [],
      meta_data: [],
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
    // Clear existing products before loading fresh
    setProducts([]);
    let isFirstPage = true;
    try {
      await posAPI.products.fetchProductsPageByPage((pageProducts) => {
        appendProducts(pageProducts);
        // Hide loading spinner after first page arrives (matches Vue behavior)
        if (isFirstPage) {
          setProductsLoading(false);
          isFirstPage = false;
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, [productLoading, setProductsLoading, setProducts, appendProducts]);

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
      // Pass outlet_id if available (set by wepos-pro after cashier login)
      const outlet = getFromLocalStorage('wepos_outlet', null);
      const outletId = outlet?.id || 0;
      const settings = await posAPI.settings.getSettings(outletId || undefined);
      setSettings(settings);

      // Sync window.wepos currency format values from outlet-specific settings
      // so formatPrice() uses the correct outlet currency by default
      if (settings?.woo_general && (window as any).wepos) {
        const wg = settings.woo_general;
        const w = (window as any).wepos;
        if (wg.currency) {
          w.currency = wg.currency;
        }
        if (wg.currency_symbol) {
          w.currency_format_symbol = wg.currency_symbol;
        }
        if (wg.price_num_decimals !== undefined) {
          w.currency_format_num_decimals = wg.price_num_decimals;
        }
        if (wg.price_decimal_sep !== undefined) {
          w.currency_format_decimal_sep = wg.price_decimal_sep;
        }
        if (wg.price_thousand_sep !== undefined) {
          w.currency_format_thousand_sep = wg.price_thousand_sep;
        }
        if (wg.thousands_group_style) {
          w.currency_format_thousands_group_style = wg.thousands_group_style;
        }
        if (wg.currency_pos) {
          const formatMap: Record<string, string> = {
            left: '%s%v',
            right: '%v%s',
            left_space: '%s %v',
            right_space: '%v %s',
          };
          w.currency_format = formatMap[wg.currency_pos] || w.currency_format;
        }
      }
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

  const fetchTags = useCallback(async () => {
    setTagsLoading(true);
    try {
      const tags = await posAPI.products.getTags();
      setTags(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setTagsLoading(false);
    }
  }, [setTagsLoading, setTags]);

  const fetchBrands = useCallback(async () => {
    setBrandsLoading(true);
    try {
      const brands = await posAPI.products.getBrands();
      setBrands(brands);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrandsLoading(false);
    }
  }, [setBrandsLoading, setBrands]);

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
        fetchTags(),
        fetchBrands(),
      ]);
      console.log('✅ POS data initialization complete');
    } catch (error) {
      console.error('❌ Error during POS data initialization:', error);
      initializeRef.current = false;
    } finally {
      isInitializing.current = false;
    }
  }, [fetchSettings, fetchProducts, fetchGateways, fetchCategories, fetchTags, fetchBrands]);

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
    tags,
    brands,
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
