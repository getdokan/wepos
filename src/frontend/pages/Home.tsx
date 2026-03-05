import { useDispatch, useSelect } from '@wordpress/data';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { posAPI } from '../api';
import { applyFilters } from '../hooks/useExtensions';
import { usePOSData } from '../hooks/usePOSData';
import { CART_STORE_NAME } from '../store/cart';
import { PRODUCTS_STORE_NAME } from '../store/products';
import {
  Customer,
  POSCartItem,
  POSCategory,
  POSGateway,
  POSPrintData,
  POSProduct,
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
  Separator,
} from '@wedevs/plugin-ui';
import Cart, { CartHandle } from '../components/Cart';
import CategoryFilter from '../components/CategoryFilter';
import HelpModal from '../components/HelpModal';
import Layout from '../components/Layout';
import PaymentModal from '../components/PaymentModal';
import ProductGrid from '../components/ProductGrid';
import ProductViewToggle from '../components/ProductViewToggle';
import ReceiptModal from '../components/ReceiptModal';
import SearchBar from '../components/SearchBar';

const HomePage: React.FC = () => {
  // Initialize data using the hook
  const { initializeData } = usePOSData();

  // Get data from stores
  const { products, categories, availableGateways, productLoading, settings } = useSelect(
    (select) => {
      const productsStore = select(PRODUCTS_STORE_NAME) as any;
      return {
        products: productsStore.getProducts(),
        categories: productsStore.getCategories(),
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
  const [selectedGateway, setSelectedGateway] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [printdata, setPrintdata] = useState<POSPrintData>({
    gateway: { id: '', title: '' },
  });

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
  }, [products, selectedCategory]);

  // UI Actions
  const toggleProductView = useCallback(() => {
    setProductView((prev) => (prev === 'grid' ? 'list' : 'grid'));
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
        setShowPaymentReceipt(true);
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


  return (
    <Layout>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {/* Main Content + Cart Area */}
        <div className="flex h-full min-h-0 flex-1 flex-row overflow-hidden">
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidde">

         <div className="flex flex-row items-center gap-3 overflow-visible mb-2">
            <div className="w-[56%]">
              <SearchBar products={products} settings={settings} onProductAdded={handleAddToCart} />
            </div>
            <div className="w-[26%]">
              <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            </div>
            <div className='w-[14%]'>
              <ProductViewToggle
                productView={productView}
                onToggle={toggleProductView}
              />
            </div>
         </div>
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
          </div>

          <Separator orientation="vertical" className="h-full" />

          <div className="flex h-full w-[35%] min-h-0 flex-col">
            <Cart
              ref={cartRef}
              onInitPayment={initPayment}
              selectedCustomer={selectedCustomer}
              handleCustomerSelected={handleCustomerSelected}
              setShowHelp={setShowHelp}
            />

            {/* Extension slot: SaveCarts tab bar injected by pro (bottom of cart) */}
            {applyFilters<React.ReactNode[]>('wepos_react_after_cart_panel', []).map(
              (Component: any, i: number) => <Component key={i} />
            )}
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
      />

      {/* Extension slot: pro components like ReceiptContent */}
      {applyFilters<React.ReactNode[]>('wepos_react_after_main_content', []).map(
        (Component: any, i: number) => <Component key={i} printdata={printdata} />
      )}
    </Layout>
  );
};

export default HomePage;
