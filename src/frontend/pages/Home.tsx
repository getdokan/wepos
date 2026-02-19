import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { posAPI } from '../api';
import {
  POSPrintData,
  POSCategory,
  ProductViewType,
  Customer,
  POSCartItem,
  POSProduct,
  POSGateway,
} from '../types';
import {
  formatPrice,
  hasStock,
  getProductImage,
  truncateTitle,
  parseCurrencyAmount,
} from '../utils/helpers';
import { usePOSData } from '../hooks/usePOSData';
import { CART_STORE_NAME } from '../store/cart';
import { PRODUCTS_STORE_NAME } from '../store/products';

// Import components
import { LayoutHeader } from '@wedevs/plugin-ui';
import Layout from '../components/Layout';
import ProductGrid from '../components/ProductGrid';
import Cart from '../components/Cart';
import PaymentModal from '../components/PaymentModal';
import ReceiptModal from '../components/ReceiptModal';
import HelpModal from '../components/HelpModal';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import ProductViewToggle from '../components/ProductViewToggle';
import CustomerSearch from '../components/CustomerSearch';

const HomePage: React.FC = () => {
  // Initialize data using the hook
  const { initializeData } = usePOSData();

  // Get data from stores
  const { products, categories, availableGateways, productLoading } = useSelect(
    (select) => {
      const productsStore = select(PRODUCTS_STORE_NAME) as any;
      return {
        products: productsStore.getProducts(),
        categories: productsStore.getCategories(),
        availableGateways: productsStore.getGateways(),
        productLoading: productsStore.getProductsLoading(),
      };
    },
    [],
  );

  const { cartItems, total } = useSelect((select) => {
    const cartStore = select(CART_STORE_NAME) as any;
    return {
      cartItems: cartStore.getCartItems(),
      total: cartStore.getTotal(),
    };
  }, []);

  const { addToCart, clearCart } = useDispatch(CART_STORE_NAME) as any;

  // UI State
  const [showHelp, setShowHelp] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
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
  const [createprintreceipt, setCreateprintreceipt] = useState(false);

  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

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
      filteredProducts = products.filter((product: POSProduct) =>
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
    setSelectedCustomer(null);
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
    setShowQuickMenu(false);
    window.history.pushState({}, '', window.location.pathname);
  }, [clearCart]);

  // Customer selection handler
  const handleCustomerSelected = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
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
  }, []);

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

  const processPayment = async () => {
    if (!ableToProcess()) return;

    try {
      // Show loading state
      const contentWrap = document.querySelector(
        '.wepos-checkout-wrapper',
      ) as HTMLElement;
      if (contentWrap) {
        contentWrap.style.opacity = '0.6';
        contentWrap.style.pointerEvents = 'none';
      }

      // Prepare order payload
      const orderPayload = {
        billing: orderData.billing,
        shipping: orderData.shipping,
        line_items: cartItems.map((item: POSCartItem) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        fee_lines: [],
        coupon_lines: [],
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
          fee_lines: [],
          coupon_lines: [],
          subtotal: total,
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
        };

        setPrintdata(printDataToSet);
        setShowModal(false);
        setShowPaymentReceipt(true);
        setCreateprintreceipt(true);
      }

      // Remove loading state
      if (contentWrap) {
        contentWrap.style.opacity = '1';
        contentWrap.style.pointerEvents = 'auto';
      }
    } catch (error: any) {
      // Handle error and remove loading state
      const contentWrap = document.querySelector(
        '.wepos-checkout-wrapper',
      ) as HTMLElement;
      if (contentWrap) {
        contentWrap.style.opacity = '1';
        contentWrap.style.pointerEvents = 'auto';
      }
      alert(error?.message || 'Payment processing failed');
      console.error('Payment processing error:', error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'F3':
          e.preventDefault();
          toggleProductView();
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleProductView, clearCart, createNewSale, initPayment, backToSale]);

  // Initialize data only once
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Auto-trigger print dialog when receipt is shown
  useEffect(() => {
    if (showPaymentReceipt && createprintreceipt) {
      setTimeout(() => {
        if (
          window.confirm(
            'Order successful! Would you like to print the receipt?',
          )
        ) {
          window.print();
        }
      }, 500);
      setCreateprintreceipt(false);
    }
  }, [showPaymentReceipt, createprintreceipt]);

  return (
    <Layout
      headerContent={
        <div className="flex flex-1 items-center gap-4">
          <div className="flex items-center gap-2">
            <SearchBar />
            <div className="h-6 w-px bg-gray-200 mx-1 hidden lg:block"></div>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          <div className="flex items-center gap-2">
            <ProductViewToggle
              productView={productView}
              onToggle={toggleProductView}
            />
          </div>

          <div className="ml-auto w-full max-w-sm">
            <CustomerSearch
              selectedCustomer={selectedCustomer}
              onCustomerSelected={handleCustomerSelected}
            />
          </div>
        </div>
      }
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Main Content + Cart Area */}
        <div className="flex flex-1 overflow-hidden md:flex-row">
          <div className="flex flex-1 flex-col overflow-hidden bg-gray-50/30 p-6">
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

          <Cart
            showQuickMenu={showQuickMenu}
            selectedCustomer={selectedCustomer}
            onCustomerSelected={handleCustomerSelected}
            onShowQuickMenuToggle={setShowQuickMenu}
            onEmptyCart={clearCart}
            onShowHelp={() => setShowHelp(true)}
            onInitPayment={initPayment}
          />
        </div>
      </div>

      <HelpModal show={showHelp} onClose={() => setShowHelp(false)} />

      <PaymentModal
        show={showModal}
        selectedGateway={selectedGateway}
        cashAmount={cashAmount}
        ableToProcess={ableToProcess()}
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
        onClose={() => setShowPaymentReceipt(false)}
        onNewSale={createNewSale}
        formatPrice={formatPrice}
      />
    </Layout>
  );
};

export default HomePage;
