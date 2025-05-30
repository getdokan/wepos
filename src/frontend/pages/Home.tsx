import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { posAPI } from '../api';
import { POSPrintData, POSCategory, ProductViewType, Customer } from '../types';
import {
  formatPrice,
  hasStock,
  getProductImage,
  truncateTitle,
  parseCurrencyAmount,
} from '../utils/helpers';
import { usePOSData } from '../hooks/usePOSData';
import { useCart } from '../hooks/useCart';

// Import components
import Layout from '../components/Layout';
import ProductGrid from '../components/ProductGrid';
import Cart from '../components/Cart';
import PaymentModal from '../components/PaymentModal';
import ReceiptModal from '../components/ReceiptModal';
import HelpModal from '../components/HelpModal';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import ProductViewToggle from '../components/ProductViewToggle';

const HomePage: React.FC = () => {
  // Simplified hook usage - same interface, cleaner implementation
  const {
    products,
    availableGateways,
    settings,
    categories,
    cartData,
    orderData,
    productLoading,
    setCartData,
    setOrderData,
    initializeData,
  } = usePOSData();

  const {
    getSubtotal,
    getTotalTax,
    getTotal,
    addToCart,
    addToCartItem,
    updateCartItem,
    removeItem,
    emptyCart,
  } = useCart({ cartData, setCartData, settings });

  // UI State
  const [showHelp, setShowHelp] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [productView, setProductView] = useState<ProductViewType>('grid');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
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

  // Refs
  const itemsWrapperRef = useRef<HTMLDivElement>(null);
  const cashAmountRef = useRef<HTMLInputElement>(null);

  // Memoized filtered products to prevent recalculation on every render
  const getFilteredProduct = useMemo(() => {
    let filteredProducts = products;

    // Filter by selected category (only if one is selected and it's not "All Categories")
    if (selectedCategory && selectedCategory.id > 0) {
      filteredProducts = products.filter((product) =>
        product.categories.some((cat) => cat.id === selectedCategory.id),
      );
    }

    // Additional URL parameter filtering
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');

    if (categoryParam !== null) {
      filteredProducts = filteredProducts.filter((product) => {
        const foundCat = product.categories.find(
          (cat) => cat.id === parseInt(categoryParam),
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
    emptyCart();
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
  }, [emptyCart, setOrderData]);

  // Customer selection handler
  const handleCustomerSelected = useCallback(
    (customer: Customer | null) => {
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
    },
    [setOrderData],
  );

  const initPayment = useCallback(() => {
    if (cartData.line_items.length <= 0) {
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
  }, [cartData.line_items.length, availableGateways, setOrderData]);

  const backToSale = useCallback(() => {
    setShowModal(false);
    setShowHelp(false);
  }, []);

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
        line_items: cartData.line_items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        fee_lines: cartData.fee_lines,
        coupon_lines: cartData.coupon_lines,
        customer_id: orderData.customer_id,
        customer_note: orderData.customer_note,
        payment_method: selectedGateway,
        payment_method_title:
          availableGateways.find((g) => g.id === selectedGateway)?.title || '',
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

      console.log('WooCommerce order response:', orderResponse);
      console.log('Order response line items:', orderResponse.line_items);

      // Update cart items with tax data
      const totalTaxes: Record<number, number> = {};
      orderResponse.line_items.forEach((item: any) => {
        totalTaxes[item.product_id] = item.total_tax;
      });

      const updatedCartItems = cartData.line_items.map((item) => ({
        ...item,
        total_tax: totalTaxes[item.product_id] || 0,
      }));
      setCartData((prev) => ({ ...prev, line_items: updatedCartItems }));

      // Process payment
      const paymentResponse =
        await posAPI.payment.processPayment(orderResponse);

      if (paymentResponse.result === 'success') {
        // Debug print data before setting
        const printDataToSet = {
          line_items: orderResponse.line_items.map((orderItem: any) => {
            // Find the matching cart item to get display data
            const cartItem = cartData.line_items.find(
              (item) => item.product_id === orderItem.product_id,
            );
            return {
              ...cartItem,
              // Use the actual order values from WooCommerce
              sale_price: parseFloat(orderItem.price),
              regular_price: parseFloat(orderItem.price),
              quantity: orderItem.quantity,
              total_tax: parseFloat(orderItem.total_tax || 0),
            };
          }),
          fee_lines: cartData.fee_lines,
          coupon_lines: cartData.coupon_lines,
          subtotal:
            parseFloat(orderResponse.total) -
            parseFloat(orderResponse.total_tax || 0),
          taxtotal: parseFloat(orderResponse.total_tax || 0),
          ordertotal: parseFloat(orderResponse.total),
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

  // Computed values
  const changeAmount = useCallback(() => {
    const unformattedAmount = parseCurrencyAmount(cashAmount);
    const total = getTotal() || 0;
    const returnMoney = unformattedAmount - total;
    return returnMoney > 0 ? returnMoney : 0;
  }, [cashAmount, getTotal]);

  const ableToProcess = useCallback(() => {
    let canProcess = cartData.line_items.length > 0 && selectedGateway !== '';

    if (selectedGateway === 'wepos_cash') {
      const unformattedAmount = parseCurrencyAmount(cashAmount);
      const total = getTotal() || 0;
      canProcess = unformattedAmount >= total && canProcess;
    }

    return canProcess;
  }, [cartData.line_items, selectedGateway, cashAmount, getTotal]);

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
            emptyCart();
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
  }, [toggleProductView, emptyCart, createNewSale, initPayment, backToSale]);

  // Initialize data only once
  useEffect(() => {
    initializeData();
  }, []); // Empty dependency array to run only once

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
    <Layout>
      <div className="wepos-content-product">
        <div className="wepos-top-panel">
          <SearchBar />

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          <ProductViewToggle
            productView={productView}
            onToggle={toggleProductView}
          />
        </div>

        <ProductGrid
          products={getFilteredProduct}
          productView={productView}
          productLoading={productLoading}
          onAddToCart={addToCart}
          onAddToCartItem={addToCartItem}
          formatPrice={formatPrice}
          hasStock={hasStock}
          getProductImage={getProductImage}
          truncateTitle={truncateTitle}
          itemsWrapperRef={itemsWrapperRef}
        />
      </div>

      <Cart
        cartData={cartData}
        orderData={orderData}
        settings={settings}
        showQuickMenu={showQuickMenu}
        selectedCustomer={selectedCustomer}
        onCustomerSelected={handleCustomerSelected}
        onShowQuickMenuToggle={setShowQuickMenu}
        onUpdateCartItem={updateCartItem}
        onRemoveItem={removeItem}
        onEmptyCart={emptyCart}
        onShowHelp={() => setShowHelp(true)}
        onInitPayment={initPayment}
        formatPrice={formatPrice}
        getSubtotal={getSubtotal}
        getTotalTax={getTotalTax}
        getTotal={getTotal}
      />

      <HelpModal show={showHelp} onClose={() => setShowHelp(false)} />

      <PaymentModal
        show={showModal}
        cartData={cartData}
        availableGateways={availableGateways}
        selectedGateway={selectedGateway}
        cashAmount={cashAmount}
        ableToProcess={ableToProcess()}
        onGatewayChange={setSelectedGateway}
        onCashAmountChange={setCashAmount}
        onBackToSale={backToSale}
        onProcessPayment={processPayment}
        formatPrice={formatPrice}
        getTotal={getTotal}
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
