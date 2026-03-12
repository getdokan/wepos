import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { posAPI } from '../api';
import { applyFilters } from '../hooks/useExtensions';
import { useCartSettings } from '../hooks/useCartSettings';
import { usePOSData } from '../hooks/usePOSData';
import { CART_STORE_NAME } from '../store/cart';
import { PRODUCTS_STORE_NAME } from '../store/products';
import {
  Customer,
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
  getProductImage,
  hasStock,
  parseCurrencyAmount,
  truncateTitle,
} from '../utils/helpers';

// Import components
import {
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
import { ChevronDown, LayoutGrid, ShoppingCart } from 'lucide-react';
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

  const { cartItems, total, subtotal, selectedCustomer, feeLines, discountLines } = useSelect((select) => {
    const cartStore = select(CART_STORE_NAME) as any;
    return {
      cartItems: cartStore.getCartItems(),
      total: cartStore.getTotal(),
      subtotal: cartStore.getSubtotal(),
      selectedCustomer: cartStore.getCustomer(),
      feeLines: cartStore.getFeeLines(),
      discountLines: cartStore.getDiscountLines(),
    };
  }, []);

  const { addToCart, clearCart, setCustomer } = useDispatch(CART_STORE_NAME) as any;

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

  // Order Data State (still needed for payment processing)
  const [orderData, setOrderData] = useState({
    customer_id: 0,
    customer_note: '',
    payment_method: '',
    payment_method_title: '',
    billing: {},
    shipping: {},
  });

  // Refs
  const itemsWrapperRef = useRef<HTMLDivElement>(null);
  const cashAmountRef = useRef<HTMLInputElement>(null);
  const cartRef = useRef<CartHandle>(null);

  // Cart functions for ProductGrid
  const handleAddToCart = useCallback(
    (product: POSProduct) => {
      if (!hasStock(product)) {
        alert('Product is out of stock!');
        return;
      }

      const cartItem: POSCartItem = {
        id: Date.now(),
        product_id: product.id,
        variation_id: 0,
        name: product.name,
        sku: product.sku || '',
        quantity: 1,
        regular_price:
          typeof product.regular_price === 'string'
            ? parseFloat(product.regular_price)
            : product.regular_price,
        sale_price:
          typeof product.sale_price === 'string'
            ? parseFloat(product.sale_price)
            : product.sale_price,
        on_sale: product.on_sale,
        type: product.type,
        attribute: [],
        editQuantity: false,
      };

      addToCart(cartItem);
    },
    [addToCart],
  );

  const handleAddToCartItem = useCallback(
    (cartItem: POSCartItem) => {
      addToCart(cartItem);
    },
    [addToCart],
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

  const createNewSale = useCallback(() => {
    clearCart();
    setOrderData({
      customer_id: 0,
      customer_note: '',
      payment_method: '',
      payment_method_title: '',
      billing: {},
      shipping: {},
    });
    setShowPaymentReceipt(false);
    setCashAmount('');
    window.history.pushState({}, '', window.location.pathname);
  }, [clearCart]);

  // Customer selection handler
  const handleCustomerSelected = useCallback((customer: Customer | null) => {
    setCustomer(customer);
    if (customer) {
      setOrderData((prev) => ({
        ...prev,
        customer_id: customer.id,
        billing: customer.billing,
        shipping: customer.shipping,
      }));
    } else {
      setOrderData((prev) => ({
        ...prev,
        customer_id: 0,
        billing: {},
        shipping: {},
      }));
    }
  }, [setCustomer]);

  const initPayment = useCallback(() => {
    if (cartItems.length <= 0) {
      return;
    }
    setShowModal(true);
    if (availableGateways.length > 0) {
      setSelectedGateway(availableGateways[0].id);
      setOrderData((prev) => ({
        ...prev,
        payment_method: availableGateways[0].id,
        payment_method_title: availableGateways[0].title,
      }));
    }
  }, [cartItems.length, availableGateways]);

  const backToSale = useCallback(() => {
    setShowModal(false);
    setShowHelp(false);
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

      // Prepare order payload
      let orderPayload: any = {
        billing: orderData.billing,
        shipping: orderData.shipping,
        line_items: cartItems.map((item: POSCartItem) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        fee_lines: feeLines.map((fee: any) => ({
          name: fee.name,
          total: String(fee.total),
          tax_status: fee.tax_status,
          tax_class: fee.tax_class,
        })),
        coupon_lines: discountLines.map((discount: any) => ({
          code: discount.code,
        })),
        customer_id: orderData.customer_id,
        customer_note: orderData.customer_note,
        payment_method: selectedGateway,
        payment_method_title:
          availableGateways.find((g: POSGateway) => g.id === selectedGateway)
            ?.title || '',
        meta_data: [
          { key: '_wepos_is_pos_order', value: true },
          { key: '_wepos_cash_tendered_amount', value: cashAmount.toString() },
          {
            key: '_wepos_cash_change_amount',
            value: changeAmount().toString(),
          },
        ],
      };

      // Allow pro to add cashier/outlet/counter/card metadata
      orderPayload = applyFilters('wepos_react_order_form_data', orderPayload, orderData);

      // Create order
      const orderResponse = await posAPI.orders.createOrder(orderPayload);

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
          subtotal: subtotal,
          taxtotal: 0,
          ordertotal: total,
          gateway: {
            id: orderResponse.payment_method,
            title: orderResponse.payment_method_title,
          },
          order_id: orderResponse.number,
          order_date: orderResponse.date_created,
          cashamount: cashAmount.toString(),
          changeamount: changeAmount().toString(),
          customer: selectedCustomer || undefined,
        };

        // Allow pro to enrich print data with cashier/outlet/counter info
        const enrichedPrintData = applyFilters('wepos_react_print_data', printDataToSet, orderResponse);

        setPrintdata(enrichedPrintData);
        setShowModal(false);

        const autoShow = cartSettings.autoShowReceipt;
        const autoPrint = cartSettings.autoPrintReceipt;

        if (autoShow || autoPrint) {
          // Show receipt modal (needed for auto-print even if auto-show is off conceptually,
          // since the hidden receipt content must be in the DOM to clone for printing)
          setShowPaymentReceipt(true);
        } else {
          // Neither auto-show nor auto-print: go straight to new sale
          clearCart();
          setCashAmount('');
        }
      }

      setPaymentProcessing(false);
    } catch (error: any) {
      setPaymentProcessing(false);
      alert(error?.message || 'Payment processing failed');
      console.error('Payment processing error:', error);
    }
  };

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
            clearCart();
          } else {
            createNewSale();
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

  // Initialize data only once
  useEffect(() => {
    initializeData();
  }, [initializeData]);

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
                <h1 className="min-w-0 truncate text-lg font-semibold md:text-xl">
                  {(window as any).wepos?.outlet_name || __('POS', 'wepos')}
                </h1>

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
                        {__('Help', 'wepos')}
                      </DropdownMenuItem>
                      <Slot name="WeposUserMenuAfterHelp" fillProps={{ DropdownMenuItem }}>
                        {(fills: React.ReactNode) => <>{fills}</>}
                      </Slot>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() =>
                          (window.location.href = (window as any).wepos?.logout_url)
                        }
                      >
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
        <div className="md:hidden shrink-0 border-t border-border bg-white">
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
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                mobileActiveTab === 'cart'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setMobileActiveTab('cart')}
            >
              <ShoppingCart className="h-5 w-5" />
              {__('Cart', 'wepos')}
              {cartItems.length > 0 && (
                <span className="absolute top-1 right-1/4 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

      </div>

      <HelpModal show={showHelp} onClose={() => setShowHelp(false)} />

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
        formatPrice={formatPrice}
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
