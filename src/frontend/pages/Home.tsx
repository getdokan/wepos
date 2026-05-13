import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from '@wedevs/plugin-ui';
import { posAPI } from '../api';
import { applyFilters } from '../hooks/useExtensions';
import { useCartSettings } from '../hooks/useCartSettings';
import { usePOSData } from '../hooks/usePOSData';
import { CART_STORE_NAME } from '../store/cart';
import { PRODUCTS_STORE_NAME } from '../store/products';
import {
  Customer,
  Order,
  POSCartItem,
  POSBrand,
  POSCategory,
  POSGateway,
  POSPrintData,
  POSProduct,
  POSTag,
  ProductViewType,
} from '../types';
import {
  formatPrice,
  getFromLocalStorage,
  getProductImage,
  hasStock,
  parseCurrencyAmount,
  pickDisplayPrice,
  toFiniteNumber,
  truncateTitle,
} from '../utils/helpers';

// Import components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
} from '@wedevs/plugin-ui';
import { Slot } from '@wordpress/components';
import { PluginArea } from '@wordpress/plugins';
import { ChevronDown, CircleHelp, LayoutGrid, LogOut, ShoppingCart, ExternalLink, Trash2 } from 'lucide-react';
import Cart, { CartHandle } from '../components/Cart';
import CategoryFilter from '../components/CategoryFilter';
import StockStatusFilter, { StockStatus } from '../components/StockStatusFilter';
import TaxonomyFilter from '../components/TaxonomyFilter';
import ToggleFilter from '../components/ToggleFilter';
import HelpModal from '../components/HelpModal';
import Layout from '../components/Layout';
import PaymentModal from '../components/PaymentModal';
import ProductGrid from '../components/ProductGrid';
import ProductViewToggle from '../components/ProductViewToggle';
import ReceiptModal from '../components/ReceiptModal';
import SearchBar from '../components/SearchBar';
import { useResizablePanel } from '../hooks/useResizablePanel';
import { RawHTML } from '@wordpress/element';
import { CartState } from '../store/cart';

const INTERNAL_ORDER_META_KEYS = new Set([
  '_wepos_is_pos_order',
  '_wepos_tax_based_on',
  '_wepos_cash_tendered_amount',
  '_wepos_cash_change_amount',
  '_wepos_cashier_id',
  '_wepos_counter_id',
  '_wepos_outlet_id',
]);

const getOrderMetaValue = (order: Order, key: string): string => {
  const meta = order.meta_data?.find((item) => item.key === key);
  return meta?.value === undefined || meta?.value === null
    ? ''
    : String(meta.value);
};

const scoreRestorableOrder = (
  order: Order,
  cashierId: string,
  outletId: string,
  counterId: string,
): number | null => {
  const orderCashierId = getOrderMetaValue(order, '_wepos_cashier_id');
  const orderOutletId = getOrderMetaValue(order, '_wepos_outlet_id');
  const orderCounterId = getOrderMetaValue(order, '_wepos_counter_id');

  if (orderCashierId && cashierId && orderCashierId !== cashierId) {
    return null;
  }

  if (orderOutletId && outletId && orderOutletId !== outletId) {
    return null;
  }

  if (orderCounterId && counterId && orderCounterId !== counterId) {
    return null;
  }

  let score = 0;

  if (orderCashierId && cashierId && orderCashierId === cashierId) {
    score += 8;
  }

  if (orderOutletId && outletId && orderOutletId === outletId) {
    score += 4;
  }

  if (orderCounterId && counterId && orderCounterId === counterId) {
    score += 2;
  }

  return score;
};

const getCurrencySymbolForOrder = (order: Order, settings: any): string => {
  if (order.currency && settings?.currencies?.[order.currency]?.symbol) {
    return settings.currencies[order.currency].symbol;
  }

  return window.wepos?.currency_format_symbol || '';
};

const normalizeCustomerForOrder = (customer: Customer | null): Customer | null => {
  if (!customer) {
    return null;
  }

  const normalizedCustomer: Customer = {
    ...customer,
    billing: {
      ...(customer.billing || {}),
    },
    shipping: {
      ...(customer.shipping || {}),
    },
  };

  if (normalizedCustomer.email && !normalizedCustomer.billing.email) {
    normalizedCustomer.billing.email = normalizedCustomer.email;
  }

  return normalizedCustomer;
};

const getCustomerDisplayName = (customer: Customer): string => {
  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
  return fullName || customer.username || customer.email || String(customer.id);
};

// Detect "invalid order id" errors from WC/WP REST (stale serverOrder pointing to a deleted/trashed order).
const isInvalidOrderIdError = (err: any): boolean => {
  if (!err) return false;
  const code = err.code || err?.data?.code || '';
  const status = err?.data?.status ?? err?.status;
  return (
    code === 'woocommerce_rest_invalid_order_id'
    || code === 'woocommerce_rest_shop_order_invalid_id'
    || code === 'rest_order_invalid_id'
    || code === 'rest_post_invalid_id'
    || status === 404
  );
};

const buildRestoredCartState = (
  order: Order,
  settings: any,
  existingCustomer: Customer | null = null,
): CartState => {
  const feeLines = (order.fee_lines || [])
    .filter((line) => parseFloat(line.total || '0') >= 0)
    .map((line) => ({
      id: line.id,
      name: line.name,
      type: 'fee' as const,
      value: Math.abs(parseFloat(line.total || '0')).toFixed(2),
      fee_type: 'fixed' as const,
      tax_status: line.tax_status || 'none',
      tax_class: line.tax_class || '',
      total: Math.abs(parseFloat(line.total || '0')),
    }));

  const restoredDiscountFeeLines = (order.fee_lines || [])
    .filter((line) => parseFloat(line.total || '0') < 0)
    .map((line) => {
      const value = Math.abs(parseFloat(line.total || '0'));
      return {
        id: line.id,
        name: line.name || __('Discount', 'wepos'),
        type: 'discount' as const,
        value,
        discount_type: 'fixed_cart' as const,
        tax_status: line.tax_status || 'none',
        tax_class: line.tax_class || '',
        total: value,
        code: `restored_discount_${line.id}`,
      };
    });

  const restoredCouponLines = (order.coupon_lines || []).map((line) => ({
    id: line.id,
    name: line.code || __('Discount', 'wepos'),
    type: 'discount' as const,
    value: Math.abs(parseFloat(line.discount || '0')),
    discount_type: 'fixed_cart' as const,
    tax_status: 'none' as const,
    tax_class: '',
    total: Math.abs(parseFloat(line.discount || '0')),
    code: line.code || `restored_coupon_${line.id}`,
  }));

  return {
    line_items: (order.line_items || []).map((line) => {
      const price = Number(
        line.price
          || (line.quantity
            ? parseFloat(line.subtotal || line.total || '0') / line.quantity
            : 0),
      );
      return {
        id: line.id,
        product_id: line.product_id,
        variation_id: line.variation_id || 0,
        name: line.name,
        sku: line.sku || '',
        quantity: line.quantity,
        type: line.product_id === 0 ? 'custom' : 'simple',
        on_sale: false,
        sale_price: price,
        regular_price: price,
        editQuantity: false,
        attribute: [],
        total_tax: parseFloat(line.total_tax || '0'),
      };
    }),
    coupon_lines: [...restoredDiscountFeeLines, ...restoredCouponLines],
    fee_lines: feeLines,
    shipping_lines: (order.shipping_lines || []).map((line) => ({
      id: line.id,
      method_title: line.method_title,
      method_id: line.method_id || 'flat_rate',
      total: line.total,
      tax_status: parseFloat(line.total_tax || '0') > 0 ? 'taxable' : 'none',
      tax_class: '',
      amount_includes_tax: false,
    })),
    meta_data: (order.meta_data || [])
      .filter((meta) => !INTERNAL_ORDER_META_KEYS.has(meta.key))
      .map((meta) => ({
        id: meta.id,
        key: meta.key,
        value:
          typeof meta.value === 'string' ? meta.value : JSON.stringify(meta.value),
      })),
    customer_note: order.customer_note || '',
    customer: existingCustomer,
    server_order: {
      order_id: order.id,
      order_number: order.number,
      total: order.total,
      total_tax: order.total_tax,
      line_items: (order.line_items || []).map((li) => ({
        id: li.id,
        product_id: li.product_id,
        variation_id: li.variation_id,
        total: li.total,
        total_tax: li.total_tax,
        subtotal: li.subtotal,
        subtotal_tax: li.subtotal_tax,
        taxes: li.taxes || [],
      })),
      fee_lines: (order.fee_lines || []).map((fl) => ({
        id: fl.id,
        total: fl.total,
        total_tax: fl.total_tax,
        taxes: fl.taxes || [],
      })),
      shipping_lines: (order.shipping_lines || []).map((sl) => ({
        id: sl.id,
        total: sl.total,
        total_tax: sl.total_tax,
        taxes: sl.taxes || [],
      })),
      tax_lines: (order.tax_lines || []).map((tl) => ({
        id: tl.id,
        rate_code: tl.rate_code,
        rate_id: tl.rate_id,
        label: tl.label,
        compound: tl.compound,
        tax_total: tl.tax_total,
        shipping_tax_total: tl.shipping_tax_total,
      })),
    },
    server_order_dirty: false,
    currency: order.currency || '',
    currency_symbol: getCurrencySymbolForOrder(order, settings),
  };
};

const HomePage: React.FC = () => {

  // Initialize data using the hook
  const { initializeData } = usePOSData();

  // Cart settings (localStorage-based: auto show/print receipt, columns, etc.)
  const { settings: cartSettings } = useCartSettings();

  // Resizable panel
  const { containerRef, cartWidthPercent, handleMouseDown } = useResizablePanel();

  // Get data from stores
  const { products, categories, tags, brands, availableGateways, productLoading, settings } = useSelect(
    (select) => {
      const productsStore = select(PRODUCTS_STORE_NAME) as any;
      return {
        products: productsStore.getProducts(),
        categories: productsStore.getCategories(),
        tags: productsStore.getTags(),
        brands: productsStore.getBrands(),
        availableGateways: productsStore.getGateways(),
        productLoading: productsStore.getProductsLoading(),
        settings: productsStore.getSettings(),
      };
    },
    [],
  );

  const { cartItems, total, subtotal, selectedCustomer, feeLines, discountLines, shippingLines, metaData, customerNote, totalShipping, totalTax, serverOrder, orderCurrency, orderCurrencySymbol } = useSelect((select) => {
    const cartStore = select(CART_STORE_NAME) as any;
    return {
      cartItems: cartStore.getCartItems(),
      total: cartStore.getTotal(),
      subtotal: cartStore.getSubtotal(),
      selectedCustomer: cartStore.getCustomer(),
      feeLines: cartStore.getFeeLines(),
      discountLines: cartStore.getDiscountLines(),
      shippingLines: cartStore.getShippingLines(),
      metaData: cartStore.getMetaData(),
      customerNote: cartStore.getCustomerNote(),
      totalShipping: cartStore.getTotalShipping(),
      totalTax: cartStore.getTotalTax(),
      serverOrder: cartStore.getServerOrder(),
      orderCurrency: cartStore.getOrderCurrency(),
      orderCurrencySymbol: cartStore.getOrderCurrencySymbol(),
    };
  }, []);

  const {
    addToCart,
    clearCart,
    setCustomer,
    setServerOrder,
    clearServerOrder,
    hydrateCart,
    setTaxDisplayMode,
    setAvailableTax,
  } = useDispatch(CART_STORE_NAME) as any;

  // Mirror WC's `woocommerce_tax_display_cart` into the cart store so selectors
  // can match the legacy Vue behaviour for inclusive-tax stores.
  useEffect(() => {
    const mode = settings?.woo_tax?.wc_tax_display_cart === 'incl' ? 'incl' : 'excl';
    setTaxDisplayMode(mode);
  }, [settings?.woo_tax?.wc_tax_display_cart, setTaxDisplayMode]);

  // Mirror the legacy Vue `fetchTaxes()` so the selector can compute fee tax
  // and coupon tax adjustment locally (Cart.module.js:67-99).
  useEffect(() => {
    let cancelled = false;
    posAPI.taxes
      .getTaxes()
      .then((rates) => {
        if (!cancelled) {
          setAvailableTax(rates || []);
        }
      })
      .catch(() => {
        // Non-fatal: the server still calculates accurate tax on save.
      });
    return () => {
      cancelled = true;
    };
  }, [setAvailableTax]);

  // UI State
  const [showHelp, setShowHelp] = useState(false);
  const [productView, setProductView] = useState<ProductViewType>('grid');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<POSCategory | null>(
    null,
  );
  const [selectedStockStatus, setSelectedStockStatus] = useState<StockStatus | null>(null);
  const [selectedTag, setSelectedTag] = useState<POSTag | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<POSBrand | null>(null);
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [filterOnSale, setFilterOnSale] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [printdata, setPrintdata] = useState<POSPrintData>({
    gateway: { id: '', title: '' },
  });
  const [mobileActiveTab, setMobileActiveTab] = useState<'products' | 'cart'>('products');
  const [restoreAttempted, setRestoreAttempted] = useState(false);

  // Refs
  const itemsWrapperRef = useRef<HTMLDivElement>(null);
  const cashAmountRef = useRef<HTMLInputElement>(null);
  const cartRef = useRef<CartHandle>(null);

  // Cart functions for ProductGrid
  const handleAddToCart = useCallback(
    (product: POSProduct) => {
      if (!hasStock(product)) {
        toast.error(sprintf(__('%s is out of stock', 'wepos'), product.name));
        return;
      }

      const existing = cartItems.find(
        (ci: POSCartItem) =>
          ci.product_id === product.id && (ci.variation_id || 0) === 0,
      );
      const currentCartQty = existing?.quantity || 0;

      if (product.sold_individually && currentCartQty >= 1) {
        toast.error(
          sprintf(
            __('%s can only be purchased one at a time.', 'wepos'),
            product.name,
          ),
        );
        return;
      }

      if (!hasStock(product, currentCartQty)) {
        toast.error(
          sprintf(
            __('Not enough stock for %1$s. Only %2$s available.', 'wepos'),
            product.name,
            String(product.stock_quantity ?? 0),
          ),
        );
        return;
      }

      const cartItem: POSCartItem = {
        id: Date.now(),
        product_id: product.id,
        variation_id: 0,
        name: product.name,
        sku: product.sku || '',
        quantity: 1,
        regular_price: pickDisplayPrice(product, 'regular'),
        sale_price: pickDisplayPrice(product, 'sale'),
        on_sale: product.on_sale,
        type: product.type,
        attribute: [],
        editQuantity: false,
        manage_stock: product.manage_stock,
        stock_status: product.stock_status,
        backorders_allowed: product.backorders_allowed,
        stock_quantity: product.stock_quantity ?? undefined,
        sold_individually: product.sold_individually,
        tax_amount: toFiniteNumber(product.tax_amount),
      };

      addToCart(cartItem);
      toast.success(sprintf(__('%s added to cart', 'wepos'), product.name));
    },
    [addToCart, cartItems],
  );

  const handleAddToCartItem = useCallback(
    (cartItem: POSCartItem) => {
      const existing = cartItems.find(
        (ci: POSCartItem) =>
          ci.product_id === cartItem.product_id &&
          (ci.variation_id || 0) === (cartItem.variation_id || 0),
      );
      const currentCartQty = existing?.quantity || 0;
      const incomingQty = cartItem.quantity || 1;

      if (cartItem.sold_individually && currentCartQty + incomingQty > 1) {
        toast.error(
          sprintf(
            __('%s can only be purchased one at a time.', 'wepos'),
            cartItem.name,
          ),
        );
        return;
      }

      if (cartItem.manage_stock && !cartItem.backorders_allowed) {
        const available = cartItem.stock_quantity ?? 0;
        const requested = Math.round((currentCartQty + incomingQty) * 10000) / 10000;
        if (requested > Math.round(available * 10000) / 10000) {
          toast.error(
            sprintf(
              __('Not enough stock for %1$s. Only %2$s available.', 'wepos'),
              cartItem.name,
              String(available),
            ),
          );
          return;
        }
      } else if (cartItem.stock_status === 'outofstock') {
        toast.error(sprintf(__('%s is out of stock', 'wepos'), cartItem.name));
        return;
      }

      addToCart(cartItem);
      toast.success(sprintf(__('%s added to cart', 'wepos'), cartItem.name));
    },
    [addToCart, cartItems],
  );

  // Memoized filtered products to prevent recalculation on every render
  const getFilteredProduct = useMemo(() => {
    let filteredProducts = products;

    // Filter by selected category (only if one is selected and it's not "All Categories")
    if (selectedCategory && selectedCategory.id > 0) {
      filteredProducts = filteredProducts.filter((product: POSProduct) =>
        product.categories.some(
          (cat: { id: number; name: string }) => cat.id === selectedCategory.id,
        ),
      );
    }

    // Filter by stock status
    if (selectedStockStatus) {
      filteredProducts = filteredProducts.filter(
        (product: POSProduct) => product.stock_status === selectedStockStatus,
      );
    }

    // Filter by tag
    if (selectedTag) {
      filteredProducts = filteredProducts.filter((product: POSProduct) =>
        product.tags?.some((tag) => tag.id === selectedTag.id),
      );
    }

    // Filter by brand
    if (selectedBrand) {
      filteredProducts = filteredProducts.filter((product: POSProduct) =>
        product.brands?.some((brand) => brand.id === selectedBrand.id),
      );
    }

    // Filter by featured
    if (filterFeatured) {
      filteredProducts = filteredProducts.filter(
        (product: POSProduct) => product.featured,
      );
    }

    // Filter by on sale
    if (filterOnSale) {
      filteredProducts = filteredProducts.filter(
        (product: POSProduct) => product.on_sale,
      );
    }

    // Additional URL parameter filtering
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');

    if (categoryParam !== null) {
      filteredProducts = filteredProducts.filter((product: POSProduct) => {
        const foundCat = product.categories.find(
          (cat: { id: number; name: string }) =>
            cat.id === parseInt(categoryParam),
        );
        return foundCat !== undefined;
      });
    }

    return filteredProducts;
  }, [products, selectedCategory, selectedStockStatus, selectedTag, selectedBrand, filterFeatured, filterOnSale]);

  // UI Actions
  const toggleProductView = useCallback((view?: ProductViewType) => {
    if (view) {
      setProductView(view);
    } else {
      setProductView((prev) => (prev === 'grid' ? 'list' : 'grid'));
    }
  }, []);

  // Track whether we've loaded the default customer from settings
  const defaultCustomerLoadedRef = useRef(false);

  // Clear cart and, when needed, delete the corresponding pos-open order first.
  const [voiding, setVoiding] = useState(false);
  const discardCurrentCart = useCallback(async ({
    deletingMessage,
    successMessage,
    failureMessage,
  }: {
    deletingMessage?: string;
    successMessage: string;
    failureMessage: string;
  }): Promise<boolean> => {
    if (serverOrder?.order_id) {
      try {
        setVoiding(true);
        await posAPI.orders.deleteOrder(serverOrder.order_id, true);
        toast.success(deletingMessage || successMessage);
      } catch (error: any) {
        if (isInvalidOrderIdError(error)) {
          // Stale serverOrder — order already removed/trashed on the server. Proceed with local clear.
          console.warn('Stale server order id; clearing local cart anyway.', error);
          toast.success(successMessage);
        } else {
          toast.error(
            <RawHTML>{error?.message || failureMessage}</RawHTML>
          );
          console.error('Failed to delete server order:', error);
          return false;
        }
      } finally {
        setVoiding(false);
      }
    } else {
      toast.success(successMessage);
    }

    clearCart(); // clearCart resets entire state including server_order
    setShowPaymentReceipt(false);
    setCashAmount('');
    defaultCustomerLoadedRef.current = false; // Re-load default customer
    window.history.pushState({}, '', window.location.pathname);

    return true;
  }, [serverOrder, clearCart]);

  const voidCart = useCallback(async () => {
    await discardCurrentCart({
      deletingMessage: __('Order voided successfully', 'wepos'),
      successMessage: __('Cart voided', 'wepos'),
      failureMessage: __('Failed to void order', 'wepos'),
    });
  }, [discardCurrentCart]);

  const createNewSale = useCallback(async () => {
    await discardCurrentCart({
      successMessage: __('New sale started', 'wepos'),
      failureMessage: __('Failed to remove saved order', 'wepos'),
    });
  }, [discardCurrentCart]);

  // Customer selection handler
  const handleCustomerSelected = useCallback((customer: Customer | null) => {
    const normalizedCustomer = normalizeCustomerForOrder(customer);
    const hadCustomer = !!selectedCustomer;
    setCustomer(normalizedCustomer);
    if (normalizedCustomer) {
      toast.success(sprintf(__('Customer %s selected', 'wepos'), getCustomerDisplayName(normalizedCustomer)));
    } else {
      if (hadCustomer) {
        toast.success(__('Customer removed', 'wepos'));
      }
    }
  }, [setCustomer, selectedCustomer]);

  // Load default customer from settings when settings become available
  useEffect(() => {
    if (!settings?.woo_general || defaultCustomerLoadedRef.current || selectedCustomer) return;
    defaultCustomerLoadedRef.current = true;

    // The server now computes the effective default customer via the
    // Admin ← Vendor ← Outlet merge chain (`wepos_settings_for_user`
    // filter in wepos-pro/Dokan.php + merge_outlet_settings in wepos),
    // so we read directly from the merged settings response.
    const isCashier = settings.woo_general.default_customer_is_cashier;
    const defaultCustomerId = settings.woo_general.default_customer;

    if (isCashier === 'yes') {
      // Set the logged-in cashier as the default customer
      const currentUserId = window.wepos?.current_user_id;
      if (currentUserId) {
        posAPI.customers.getCustomer(currentUserId)
          .then((customer) => handleCustomerSelected(customer))
          .catch(() => {});
      }
    } else if (defaultCustomerId && Number(defaultCustomerId) > 0) {
      // Load the configured default customer
      posAPI.customers.getCustomer(Number(defaultCustomerId))
        .then((customer) => handleCustomerSelected(customer))
        .catch(() => {});
    }
    // If neither is set, customer remains guest (null)
  }, [settings, selectedCustomer, handleCustomerSelected]);

  const backToSale = useCallback(() => {
    setShowModal(false);
    setShowHelp(false);
  }, []);

  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);

  const confirmClearLocalData = useCallback(() => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear local data:', error);
    }
    window.location.reload();
  }, []);

  // Computed values
  const changeAmount = useCallback(() => {
    const unformattedAmount = parseCurrencyAmount(cashAmount);
    const returnMoney = unformattedAmount - total;
    return returnMoney > 0 ? returnMoney : 0;
  }, [cashAmount, total]);

  const ableToProcess = useCallback(() => {
    let canProcess = cartItems.length > 0 && selectedGateway !== '';

    if (selectedGateway === 'wepos_cash') {
      const unformattedAmount = parseCurrencyAmount(cashAmount);
      canProcess = unformattedAmount >= total && canProcess;
    }

    return canProcess;
  }, [cartItems.length, selectedGateway, cashAmount, total]);

  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const processPayment = async () => {
    if (!ableToProcess()) return;

    try {
      setPaymentProcessing(true);

      const paymentFields = {
        payment_method: selectedGateway,
        payment_method_title:
          availableGateways.find((g: POSGateway) => g.id === selectedGateway)
            ?.title || '',
        meta_data: [
          { key: '_wepos_is_pos_order', value: true },
          { key: '_wepos_tax_based_on', value: settings?.woo_tax?.wc_tax_based_on || 'base' },
          { key: '_wepos_cash_tendered_amount', value: cashAmount.toString() },
          {
            key: '_wepos_cash_change_amount',
            value: changeAmount().toString(),
          },
          ...getPosSessionMeta(),
          ...metaData.filter((m: any) => m.key.trim() !== '').map((m: any) => ({
            key: m.key,
            value: m.value,
          })),
        ],
      };

      let orderResponse: any;

      if (serverOrder?.order_id) {
        // Update the existing pos-open order with payment info
        try {
          const payload = buildOrderPayload(paymentFields);
          orderResponse = await posAPI.orders.updateOrder(serverOrder.order_id, payload);
        } catch (updateError: any) {
          if (!isInvalidOrderIdError(updateError)) {
            throw updateError;
          }
          // Stale server order id — create a new order with payment info instead.
          console.warn('Stale server order id during checkout; creating a new order.', updateError);
          clearServerOrder();
          const payload = buildOrderPayload(paymentFields, { forceCreate: true });
          orderResponse = await posAPI.orders.createOrder(payload);
        }
      } else {
        // Create a new order with payment info
        const payload = buildOrderPayload(paymentFields);
        orderResponse = await posAPI.orders.createOrder(payload);
      }

      // Process payment
      const paymentResponse =
        await posAPI.payment.processPayment(orderResponse);

      if (paymentResponse.result === 'success') {
        const printDataToSet = {
          line_items: cartItems.map((cartItem: POSCartItem) => ({
            ...cartItem,
            total_tax: 0,
          })),
          fee_lines: feeLines,
          coupon_lines: discountLines,
          shipping_lines: shippingLines,
          subtotal: subtotal,
          taxtotal: parseFloat(orderResponse.total_tax) || 0,
          shippingtotal: totalShipping,
          shippingtaxtotal: parseFloat(orderResponse.shipping_tax) || 0,
          ordertotal: parseFloat(orderResponse.total) || total,
          gateway: {
            id: orderResponse.payment_method,
            title: orderResponse.payment_method_title,
          },
          order_id: orderResponse.number,
          order_date: orderResponse.date_created,
          cashamount: cashAmount.toString(),
          changeamount: changeAmount().toString(),
          customer: selectedCustomer
            ? {
                id: selectedCustomer.id,
                first_name:
                  orderResponse.billing?.first_name ||
                  selectedCustomer.first_name ||
                  '',
                last_name:
                  orderResponse.billing?.last_name ||
                  selectedCustomer.last_name ||
                  '',
                email:
                  orderResponse.billing?.email ||
                  selectedCustomer.email ||
                  '',
                username: selectedCustomer.username || '',
                note: customerNote || '',
              }
            : undefined,
          currency_symbol: orderCurrencySymbol || '',
        };

        // Allow pro to enrich print data with cashier/outlet/counter info
        const enrichedPrintData = applyFilters('wepos_react_print_data', printDataToSet, orderResponse);

        setPrintdata(enrichedPrintData);
        setShowModal(false);

        const autoShow = cartSettings.autoShowReceipt;
        const autoPrint = cartSettings.autoPrintReceipt;

        // Always clear cart after successful payment — receipt uses order data (printdata), not cart
        clearCart();
        setCashAmount('');

        if (autoShow || autoPrint) {
          setShowPaymentReceipt(true);
        }
      }

      setPaymentProcessing(false);
    } catch (error: any) {
      setPaymentProcessing(false);
      alert(error?.message || 'Payment processing failed');
      console.error('Payment processing error:', error);
    }
  };

  // Helper to build the order payload from current cart state.
  // When updating an existing order (serverOrder exists), we must:
  //   - Include the server-side `id` on each line item so WC updates it in place
  //   - Mark removed server line items with `id` + `quantity: 0` so WC deletes them
  const buildOrderPayload = (
    extraFields: Record<string, any> = {},
    options: { forceCreate?: boolean } = {},
  ) => {
    const isUpdate = !options.forceCreate && !!serverOrder;
    const orderCustomer = normalizeCustomerForOrder(selectedCustomer);

    // --- line_items ---
    const buildLineItems = () => {
      const items: any[] = [];
      // Track which server line item ids we've matched
      const matchedServerIds = new Set<number>();

      cartItems.forEach((item: POSCartItem) => {
        const unitPrice = item.on_sale ? item.sale_price : item.regular_price;
        const lineItem: any = {
          quantity: item.quantity,
          subtotal: (unitPrice * item.quantity).toFixed(2),
          total: (unitPrice * item.quantity).toFixed(2),
        };
        if (item.product_id === 0) {
          // Misc/custom product: send name + price, no product_id
          lineItem.name = item.name;
          lineItem.price = item.regular_price;
          if (item.sku) {
            lineItem.sku = item.sku;
          }
        } else {
          lineItem.product_id = item.product_id;
          if (item.variation_id) {
            lineItem.variation_id = item.variation_id;
          }
        }
        // Match to existing server line item by product_id + variation_id
        if (isUpdate && serverOrder) {
          const match = serverOrder.line_items.find(
            (sl: any) => !matchedServerIds.has(sl.id) &&
              sl.product_id === item.product_id &&
              sl.variation_id === (item.variation_id || 0)
          );
          if (match) {
            lineItem.id = match.id;
            matchedServerIds.add(match.id);
          }
        }
        items.push(lineItem);
      });

      // Delete server line items that no longer exist in cart
      if (isUpdate && serverOrder) {
        serverOrder.line_items.forEach((sl: any) => {
          if (!matchedServerIds.has(sl.id)) {
            items.push({ id: sl.id, quantity: 0 });
          }
        });
      }

      return items;
    };

    // --- fee_lines (includes POS discounts as negative fees) ---
    const buildFeeLines = () => {
      const items: any[] = [];
      const matchedServerIds = new Set<number>();

      feeLines.forEach((fee: any, index: number) => {
        const feeItem: any = {
          name: fee.name,
          total: fee.fee_type === 'percent'
            ? ((subtotal * parseFloat(fee.value)) / 100).toFixed(2)
            : parseFloat(fee.value).toFixed(2),
          tax_status: fee.tax_status,
          tax_class: fee.tax_class,
        };
        // Match by index position to server fee lines
        if (isUpdate && serverOrder && serverOrder.fee_lines[index]) {
          feeItem.id = serverOrder.fee_lines[index].id;
          matchedServerIds.add(serverOrder.fee_lines[index].id);
        }
        items.push(feeItem);
      });

      // Add POS discounts as negative fee lines
      discountLines.forEach((discount: any) => {
        const discountTotal = discount.discount_type === 'percent'
          ? (subtotal * discount.value) / 100
          : discount.value;
        const feeItem: any = {
          name: discount.name || __('Discount', 'wepos'),
          total: (-Math.abs(discountTotal)).toFixed(2),
          tax_status: discount.tax_status || 'none',
          tax_class: discount.tax_class || '',
        };
        // Match discount fee lines on server by negative total and name
        if (isUpdate && serverOrder) {
          const match = serverOrder.fee_lines.find(
            (sf: any) => !matchedServerIds.has(sf.id) && parseFloat(sf.total) < 0
          );
          if (match) {
            feeItem.id = match.id;
            matchedServerIds.add(match.id);
          }
        }
        items.push(feeItem);
      });

      // Delete removed fee lines
      if (isUpdate && serverOrder) {
        serverOrder.fee_lines.forEach((sf: any) => {
          if (!matchedServerIds.has(sf.id)) {
            items.push({ id: sf.id, name: null });
          }
        });
      }

      return items;
    };

    // --- shipping_lines ---
    const buildShippingLines = () => {
      const items: any[] = [];
      const matchedServerIds = new Set<number>();

      shippingLines.forEach((shipping: any, index: number) => {
        const shipItem: any = {
          method_title: shipping.method_title,
          method_id: shipping.method_id || 'flat_rate',
          total: shipping.total,
          meta_data: [
            {
              key: '_wepos_pos_data',
              value: JSON.stringify({
                tax_status: shipping.tax_status || 'taxable',
                tax_class: shipping.tax_class || '',
                amount_includes_tax: !!shipping.amount_includes_tax,
              }),
            },
          ],
        };
        // Match by index position to server shipping lines
        if (isUpdate && serverOrder && serverOrder.shipping_lines[index]) {
          shipItem.id = serverOrder.shipping_lines[index].id;
          matchedServerIds.add(serverOrder.shipping_lines[index].id);
        }
        items.push(shipItem);
      });

      // Delete removed shipping lines
      if (isUpdate && serverOrder) {
        serverOrder.shipping_lines.forEach((ss: any) => {
          if (!matchedServerIds.has(ss.id)) {
            items.push({ id: ss.id, method_title: null });
          }
        });
      }

      return items;
    };

    // When no customer is selected, send explicit empty address fields
    // so WooCommerce clears the previous customer's address on the order.
    // Sending {} is treated as "no changes" by the WC REST API.
    const emptyAddress = {
      first_name: '',
      last_name: '',
      company: '',
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      postcode: '',
      country: '',
      phone: '',
    };

    let orderPayload: any = {
      billing: orderCustomer?.billing || emptyAddress,
      shipping: orderCustomer?.shipping || emptyAddress,
      line_items: buildLineItems(),
      fee_lines: buildFeeLines(),
      shipping_lines: buildShippingLines(),
      coupon_lines: [],
      customer_id: orderCustomer?.id || 0,
      customer_note: customerNote,
      meta_data: [
        { key: '_wepos_is_pos_order', value: true },
        { key: '_wepos_tax_based_on', value: settings?.woo_tax?.wc_tax_based_on || 'base' },
        ...getPosSessionMeta(),
        ...metaData.filter((m: any) => m.key.trim() !== '').map((m: any) => ({
          key: m.key,
          value: m.value,
        })),
      ],
      // Set order currency: cart override > outlet settings > WC default (omitted)
      ...(orderCurrency || settings?.woo_general?.currency
        ? { currency: orderCurrency || settings.woo_general.currency }
        : {}),
      ...extraFields,
    };

    orderPayload = applyFilters('wepos_react_order_form_data', orderPayload);
    return orderPayload;
  };

  // Extract server order data from WC API response
  const extractServerOrderData = (response: any) => ({
    order_id: response.id,
    order_number: response.number,
    total: response.total,
    total_tax: response.total_tax,
    line_items: (response.line_items || []).map((li: any) => ({
      id: li.id,
      product_id: li.product_id,
      variation_id: li.variation_id,
      total: li.total,
      total_tax: li.total_tax,
      subtotal: li.subtotal,
      subtotal_tax: li.subtotal_tax,
      taxes: li.taxes || [],
    })),
    fee_lines: (response.fee_lines || []).map((fl: any) => ({
      id: fl.id,
      total: fl.total,
      total_tax: fl.total_tax,
      taxes: fl.taxes || [],
    })),
    shipping_lines: (response.shipping_lines || []).map((sl: any) => ({
      id: sl.id,
      total: sl.total,
      total_tax: sl.total_tax,
      taxes: sl.taxes || [],
    })),
    tax_lines: (response.tax_lines || []).map((tl: any) => ({
      id: tl.id,
      rate_code: tl.rate_code,
      rate_id: tl.rate_id,
      label: tl.label,
      compound: tl.compound,
      tax_total: tl.tax_total,
      shipping_tax_total: tl.shipping_tax_total,
    })),
  });

  // Save to Server: creates/updates a pos-open order without processing payment.
  // The order stays in the cart so the cashier can continue editing or proceed to checkout.
  const [savingToServer, setSavingToServer] = useState(false);
  const saveToServer = async (): Promise<boolean> => {
    if (cartItems.length === 0) return false;

    try {
      setSavingToServer(true);

      let orderResponse: any;

      if (serverOrder?.order_id) {
        // Update the existing pos-open order
        try {
          const payload = buildOrderPayload({ status: 'pos-open' });
          orderResponse = await posAPI.orders.updateOrder(serverOrder.order_id, payload);
        } catch (updateError: any) {
          if (!isInvalidOrderIdError(updateError)) {
            throw updateError;
          }
          // Stale server order id (deleted/trashed). Drop the server reference and create anew.
          console.warn('Stale server order id on update; creating a new pos-open order.', updateError);
          clearServerOrder();
          const payload = buildOrderPayload({ status: 'pos-open' }, { forceCreate: true });
          orderResponse = await posAPI.orders.createOrder(payload);
        }
      } else {
        // Create a new pos-open order
        const payload = buildOrderPayload({ status: 'pos-open' });
        orderResponse = await posAPI.orders.createOrder(payload);
      }

      if (orderResponse?.id) {
        // Sync server-calculated data (taxes, totals) back to cart store
        setServerOrder(extractServerOrderData(orderResponse));
        toast.success(
          serverOrder?.order_id
            ? __('Order updated successfully', 'wepos')
            : __('Order saved to server', 'wepos')
        );
      }

      setSavingToServer(false);
      return true;
    } catch (error: any) {
      setSavingToServer(false);
      toast.error(
        <RawHTML>{error?.message || __('Failed to save order to server', 'wepos')}</RawHTML>
      );
      return false;
    }
  };

  // Save to server first, then open the sales summary / payment modal
  const initPayment = useCallback(async () => {
    if (cartItems.length <= 0) {
      return;
    }

    // Save/update the order on the server before showing checkout
    const saved = await saveToServer();
    if (!saved) return;

    setShowModal(true);
    if (availableGateways.length > 0) {
      setSelectedGateway(availableGateways[0].id);
    }
  }, [cartItems.length, availableGateways, saveToServer]);

  // Keep a ref to processPayment so the keyboard handler always has the latest version
  const processPaymentRef = useRef(processPayment);
  useEffect(() => {
    processPaymentRef.current = processPayment;
  });

  // Print receipt helper — clones receipt HTML to body-level container, then window.print()
  const printReceipt = useCallback(() => {
    const receiptEl = document.getElementById('wepos-print-receipt');
    if (!receiptEl) return;

    let container = document.getElementById('wepos-receipt-print-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'wepos-receipt-print-container';
      document.body.appendChild(container);
    }
    container.innerHTML = receiptEl.innerHTML;

    setTimeout(() => {
      window.print();
    }, 300);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // When payment modal is open, only handle payment-related shortcuts
      if (showModal) {
        if (e.key === 'F10') {
          e.preventDefault();
          processPaymentRef.current();
        }
        return;
      }

      // When receipt is showing, handle receipt shortcuts
      if (showPaymentReceipt) {
        if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          printReceipt();
        }
        return;
      }

      // Main sale view shortcuts
      switch (e.key) {
        case 'F1':
          e.preventDefault();
          document.getElementById('product-search')?.focus();
          break;
        case 'F2':
          e.preventDefault();
          document.getElementById('product-search')?.focus();
          break;
        case 'F3':
          e.preventDefault();
          toggleProductView();
          break;
        case 'F4':
          e.preventDefault();
          cartRef.current?.openFee();
          break;
        case 'F5':
          e.preventDefault();
          cartRef.current?.openDiscount();
          break;
        case 'F6':
          e.preventDefault();
          cartRef.current?.openNote();
          break;
        case 'F7':
          e.preventDefault();
          if (e.shiftKey) {
            cartRef.current?.openNewCustomer();
          } else {
            cartRef.current?.focusCustomerSearch();
          }
          break;
        case 'F8':
          e.preventDefault();
          if (e.shiftKey) {
            void voidCart();
          } else {
            void createNewSale();
          }
          break;
        case 'F9':
          e.preventDefault();
          initPayment();
          break;
        case 'F10':
          e.preventDefault();
          initPayment();
          break;
        case 'Escape':
          e.preventDefault();
          backToSale();
          break;
        case '/':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowHelp((prev) => !prev);
          }
          break;
        case 'p':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showPaymentReceipt, toggleProductView, clearCart, createNewSale, initPayment, backToSale, printReceipt]);

  const getPosSessionMeta = useCallback(() => {
    const outlet = getFromLocalStorage<any>('wepos_outlet', null);
    const counter = getFromLocalStorage<any>('wepos_counter', null);

    return [
      { key: '_wepos_cashier_id', value: String(window.wepos?.current_user_id || '') },
      { key: '_wepos_counter_id', value: String(counter?.id || '') },
      { key: '_wepos_outlet_id', value: String(outlet?.id || '') },
    ].filter((meta) => meta.value !== '');
  }, []);

  const restoreServerCart = useCallback(async () => {
    if ( ( window as any ).__weposProSaveCartsEnabled ) {
      return;
    }

    if (restoreAttempted || cartItems.length > 0 || serverOrder?.order_id) {
      return;
    }

    setRestoreAttempted(true);

    try {
      const orders = await posAPI.orders.getOrders({
        status: ['pos-open'],
        per_page: 100,
        orderby: 'date',
        order: 'desc',
      }) as unknown as Order[];

      const posOrders = (orders || []).filter(
        (order) => getOrderMetaValue(order, '_wepos_is_pos_order') === 'true'
          || getOrderMetaValue(order, '_wepos_is_pos_order') === '1'
      );

      if (posOrders.length === 0) {
        return;
      }

      const outlet = getFromLocalStorage<any>('wepos_outlet', null);
      const counter = getFromLocalStorage<any>('wepos_counter', null);
      const cashierId = String(window.wepos?.current_user_id || '');
      const outletId = String(outlet?.id || '');
      const counterId = String(counter?.id || '');

      const scoredOrders = posOrders
        .map((order) => ({
          order,
          score: scoreRestorableOrder(order, cashierId, outletId, counterId),
        }))
        .filter((entry): entry is { order: Order; score: number } => entry.score !== null);

      if (scoredOrders.length === 0) {
        return;
      }

      const bestScore = Math.max(...scoredOrders.map((entry) => entry.score));
      const bestMatches = scoredOrders.filter((entry) => entry.score === bestScore);

      if (bestScore === 0 && bestMatches.length !== 1) {
        return;
      }

      const orderToRestore = bestMatches[0].order;
      let restoredCustomer: Customer | null = null;

      if (orderToRestore.customer_id) {
        try {
          restoredCustomer = await posAPI.customers.getCustomer(orderToRestore.customer_id);
        } catch (error) {
          console.warn('Unable to restore customer for pos-open order', error);
        }
      }

      hydrateCart(buildRestoredCartState(orderToRestore, settings, restoredCustomer));
      defaultCustomerLoadedRef.current = true;

      if (orderToRestore.payment_method) {
        setSelectedGateway(orderToRestore.payment_method);
      }

      toast.success(__('Restored saved cart from server', 'wepos'));
    } catch (error) {
      console.error('Failed to restore pos-open order from server', error);
    }
  }, [restoreAttempted, cartItems.length, serverOrder, hydrateCart, settings]);

  // Initialize data only once
  useEffect(() => {
    let mounted = true;

    const initializeAndRestore = async () => {
      await initializeData();

      if (!mounted) {
        return;
      }

      await restoreServerCart();
    };

    void initializeAndRestore();

    return () => {
      mounted = false;
    };
  }, [initializeData, restoreServerCart]);

  const getTaxBasedOnLabel = () => {
    const taxBasedOn = settings?.woo_tax?.wc_tax_based_on;
    switch (taxBasedOn) {
      case 'billing':
        return __('Tax based on: Billing address', 'wepos');
      case 'shipping':
        return __('Tax based on: Shipping address', 'wepos');
      case 'base':
      default:
        return __('Tax based on: Shop base address', 'wepos');
    }
  };

  return (
    <Layout>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {/* Main Content + Cart Area */}
        <div ref={containerRef} className="flex h-full min-h-0 flex-1 flex-col md:flex-row overflow-hidden">
          {/* Product Area — always visible on desktop, toggled via tab on mobile */}
          <div className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden ${mobileActiveTab !== 'products' ? 'hidden md:flex' : ''}`} style={{ minWidth: 0 }}>
            <div className="flex flex-col px-3 py-2 md:px-5 md:py-3">
              {/* Header: Outlet Name + User Info */}
              <div className="flex items-center justify-between gap-2">
                {applyFilters<React.ReactNode>('wepos_pos_header_left', (
                  <h1 className="min-w-0 truncate text-lg font-semibold md:text-xl">
                    {__('POS', 'wepos')}
                  </h1>
                ))}

                {window.wepos?.current_user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer outline-none group">
                      <Avatar size="md">
                        <AvatarImage src={window.wepos.current_user.avatar_url} alt={window.wepos.current_user.name} />
                        <AvatarFallback>{window.wepos.current_user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:flex flex-col items-start leading-none group-hover:text-primary">
                        <span className="text-sm font-medium">{window.wepos.current_user.name}</span>
                      </div>
                      <ChevronDown className="size-4 text-muted-foreground group-hover:text-primary" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setShowHelp(true)}>
                        <CircleHelp className="mr-1 size-4" />
                        {__('Help', 'wepos')}
                      </DropdownMenuItem>
                      <Slot name="WeposUserMenuAfterHelp" fillProps={{ DropdownMenuItem }}>
                        {(fills: React.ReactNode) => <>{fills}</>}
                      </Slot>
                      {window.wepos?.current_user?.can_access_admin && (
                        <DropdownMenuItem
                          onClick={() =>
                            window.open((window as any).wepos?.admin_url, '_blank')
                          }
                        >
                          <ExternalLink className="mr-1 size-4" />
                          {__('WordPress Admin', 'wepos')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setShowClearDataConfirm(true)}
                      >
                        <Trash2 className="mr-1 size-4" />
                        {__('Clear All Local Data', 'wepos')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() =>
                          (window.location.href = (window as any).wepos?.logout_url)
                        }
                      >
                        <LogOut className="mr-1 size-4" />
                        {__('Logout', 'wepos')}
                      </DropdownMenuItem>
                      <Slot name="WeposUserMenuAfterLogout" fillProps={{ DropdownMenuItem }}>
                        {(fills: React.ReactNode) => <>{fills}</>}
                      </Slot>
                      <PluginArea scope="wepos-user-menu" />
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {/* Search / Filter / View Toggle Row */}
              <div className="flex flex-col gap-2 mt-3">
                <div className="flex flex-row items-center gap-2">
                  <SearchBar products={products} settings={settings} onProductAdded={handleAddToCart} />
                  <ProductViewToggle
                      productView={productView}
                      onToggle={toggleProductView}
                    />
                </div>
                <div className="flex flex-row items-center gap-2 overflow-x-auto md:flex-wrap">
                  <CategoryFilter
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                  />
                  <StockStatusFilter
                    selectedStatus={selectedStockStatus}
                    onStatusChange={setSelectedStockStatus}
                  />
                  <TaxonomyFilter
                    items={tags}
                    selectedItem={selectedTag}
                    onItemChange={setSelectedTag}
                    placeholder={__('Select a tag', 'wepos')}
                    allLabel={__('Tag', 'wepos')}
                    emptyLabel={__('No tag found.', 'wepos')}
                  />
                  <TaxonomyFilter
                    items={brands}
                    selectedItem={selectedBrand}
                    onItemChange={setSelectedBrand}
                    placeholder={__('Select a brand', 'wepos')}
                    allLabel={__('Brand', 'wepos')}
                    emptyLabel={__('No brand found.', 'wepos')}
                  />
                  <ToggleFilter
                    label={__('Featured', 'wepos')}
                    active={filterFeatured}
                    onToggle={() => setFilterFeatured((prev) => !prev)}
                  />
                  <ToggleFilter
                    label={__('On Sale', 'wepos')}
                    active={filterOnSale}
                    onToggle={() => setFilterOnSale((prev) => !prev)}
                  />
                </div>
              </div>
            </div>

            <Separator orientation="horizontal" className="hidden w-full md:block" />

            <ProductGrid
              products={getFilteredProduct}
              productView={productView}
              productLoading={productLoading}
              onAddToCart={handleAddToCart}
              onAddToCartItem={handleAddToCartItem}
              formatPrice={formatPrice}
              hasStock={hasStock}
              getProductImage={getProductImage}
              truncateTitle={truncateTitle}
              itemsWrapperRef={itemsWrapperRef}
            />

            {/* Tax Based On — bottom of product area, right-aligned */}
            {settings?.woo_tax?.wc_tax_based_on && (
              <div className="hidden md:flex shrink-0 items-center justify-end border-t border-border px-6 py-3 text-sm text-muted-foreground">
                {getTaxBasedOnLabel()}
              </div>
            )}
          </div>

          {/* Resizable Divider - desktop only, spans full height */}
          <div
            className="group relative hidden md:flex h-full w-px shrink-0 cursor-col-resize items-center justify-center bg-border"
            onMouseDown={handleMouseDown}
            title="Drag to resize"
          >
            {/* Invisible wide hit area for easy grabbing */}
            <div className="absolute inset-y-0 -left-1.5 -right-1.5 z-10" />
            {/* Hover highlight overlay */}
            <div className="absolute inset-y-0 -left-px -right-px bg-primary/30 opacity-0 group-hover:opacity-100 group-active:bg-primary/40 transition-opacity" />
          </div>

          {/* Cart Panel - desktop only */}
          <div
            className="hidden md:flex h-full min-h-0 flex-col border-l border-border"
            style={{ width: `${cartWidthPercent}%`, minWidth: 320 }}
          >
            <Cart
              ref={cartRef}
              onInitPayment={initPayment}
              onSaveToServer={saveToServer}
              onVoidCart={voidCart}
              savingToServer={savingToServer}
              voiding={voiding}
              selectedCustomer={selectedCustomer}
              handleCustomerSelected={handleCustomerSelected}
            />
            {/* Extension slot: SaveCarts tab bar */}
            <div className="shrink-0">
              {applyFilters<React.ReactNode[]>('wepos_react_after_cart_panel', []).map(
                (Component: any, i: number) => <Component key={i} />
              )}
            </div>
          </div>

          {/* Mobile Cart Panel — full-screen tab, hidden on desktop */}
          <div className={`flex h-full min-h-0 flex-1 flex-col md:hidden ${mobileActiveTab !== 'cart' ? 'hidden' : ''}`}>
            <Cart
              ref={cartRef}
              onInitPayment={initPayment}
              onSaveToServer={saveToServer}
              onVoidCart={voidCart}
              savingToServer={savingToServer}
              voiding={voiding}
              selectedCustomer={selectedCustomer}
              handleCustomerSelected={handleCustomerSelected}
            />
            {/* Extension slot: SaveCarts tab bar (mobile) */}
            <div className="shrink-0">
              {applyFilters<React.ReactNode[]>('wepos_react_after_cart_panel', []).map(
                (Component: any, i: number) => <Component key={i} />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Tax Based On — shown on products tab */}
        {settings?.woo_tax?.wc_tax_based_on && mobileActiveTab === 'products' && (
          <div className="md:hidden shrink-0 border-t border-border px-3 py-1.5 text-center text-xs text-muted-foreground">
            {getTaxBasedOnLabel()}
          </div>
        )}

        {/* Mobile Bottom Tab Bar */}
        <div className="md:hidden shrink-0 border-t border-border bg-background">
          <div className="flex">
            <button
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                mobileActiveTab === 'products'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setMobileActiveTab('products')}
            >
              <LayoutGrid className="h-5 w-5" />
              {__('Products', 'wepos')}
            </button>
            <button
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                mobileActiveTab === 'cart'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setMobileActiveTab('cart')}
            >
              <span className="relative inline-flex">
                <ShoppingCart className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                    {cartItems.length}
                  </span>
                )}
              </span>
              {__('Cart', 'wepos')}
            </button>
          </div>
        </div>

      </div>

      <HelpModal show={showHelp} onClose={() => setShowHelp(false)} />

      <AlertDialog open={showClearDataConfirm} onOpenChange={setShowClearDataConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{__('Clear All Local Data', 'wepos')}</AlertDialogTitle>
            <AlertDialogDescription>
              {__(
                'This will clear all locally stored POS data and reload the page. This action cannot be undone.',
                'wepos',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{__('Cancel', 'wepos')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmClearLocalData}>
              {__('Clear Data', 'wepos')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PaymentModal
        show={showModal}
        selectedGateway={selectedGateway}
        cashAmount={cashAmount}
        ableToProcess={ableToProcess()}
        processing={paymentProcessing}
        onGatewayChange={setSelectedGateway}
        onCashAmountChange={setCashAmount}
        onBackToSale={backToSale}
        onProcessPayment={processPayment}
        changeAmount={changeAmount()}
        cashAmountRef={cashAmountRef}
      />

      <ReceiptModal
        show={showPaymentReceipt}
        printdata={printdata}
        selectedGateway={selectedGateway}
        settings={settings}
        onClose={createNewSale}
        onNewSale={createNewSale}
        formatPrice={(amount) => String(formatPrice(amount ?? 0, printdata.currency_symbol || ''))}
        autoPrint={cartSettings.autoPrintReceipt}
        autoShow={cartSettings.autoShowReceipt}
      />

      {/* Extension slot: pro components like ReceiptContent */}
      {applyFilters<React.ReactNode[]>('wepos_react_after_main_content', []).map(
        (Component: any, i: number) => <Component key={i} printdata={printdata} />
      )}
    </Layout>
  );
};

export default HomePage;
