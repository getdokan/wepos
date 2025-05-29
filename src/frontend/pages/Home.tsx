import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiFetch from '@wordpress/api-fetch';
import {
  POSPrintData,
  POSCategory,
  ProductViewType
} from '../types';
import {
  formatPrice,
  hasStock,
  getProductImage,
  truncateTitle,
  parseCurrencyAmount
} from '../utils/helpers';
import { usePOSData } from '../hooks/usePOSData';
import { useCart } from '../hooks/useCart';

// Import components (we'll create these next)
import ProductGrid from '../components/ProductGrid';
import Cart from '../components/Cart';
import PaymentModal from '../components/PaymentModal';
import ReceiptModal from '../components/ReceiptModal';
import HelpModal from '../components/HelpModal';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import ProductViewToggle from '../components/ProductViewToggle';

const HomePage: React.FC = () => {
  // Custom hooks for data and cart management
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
    initializeData
  } = usePOSData();

  const {
    getSubtotal,
    getTotalTax,
    getTotal,
    addToCart,
    updateCartItem,
    removeItem,
    emptyCart
  } = useCart({ cartData, setCartData, settings });

  // UI State
  const [showHelp, setShowHelp] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [productView, setProductView] = useState<ProductViewType>('grid');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<POSCategory | null>(null);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [printdata, setPrintdata] = useState<POSPrintData>({
    gateway: { id: '', title: '' }
  });
  const [createprintreceipt, setCreateprintreceipt] = useState(false);

  // Refs
  const itemsWrapperRef = useRef<HTMLDivElement>(null);
  const cashAmountRef = useRef<HTMLInputElement>(null);

  // Helper functions
  const getFilteredProduct = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');

    if (categoryParam !== null) {
      return products.filter((product) => {
        const foundCat = product.categories.find(cat => cat.id === parseInt(categoryParam));
        return foundCat !== undefined;
      });
    }
    return products;
  }, [products]);

  // UI Actions
  const toggleProductView = () => {
    setProductView(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const createNewSale = () => {
    emptyCart();
    setOrderData({
      customer_id: 0,
      customer_note: '',
      payment_method: '',
      payment_method_title: '',
      billing: {},
      shipping: {}
    });
    setShowPaymentReceipt(false);
    setCashAmount('');
    setShowQuickMenu(false);
    window.history.pushState({}, '', window.location.pathname);
  };

  const initPayment = () => {
    if (cartData.line_items.length <= 0) {
      return;
    }
    setShowModal(true);
    if (availableGateways.length > 0) {
      setSelectedGateway(availableGateways[0].id);
      setOrderData(prev => ({
        ...prev,
        payment_method: availableGateways[0].id,
        payment_method_title: availableGateways[0].title
      }));
    }
  };

  const backToSale = () => {
    setShowModal(false);
    setShowHelp(false);
  };

  const processPayment = async () => {
    if (!ableToProcess()) return;

    try {
      // Show loading state
      const contentWrap = document.querySelector('.wepos-checkout-wrapper') as HTMLElement;
      if (contentWrap) {
        contentWrap.style.opacity = '0.6';
        contentWrap.style.pointerEvents = 'none';
      }

      // Prepare order payload
      const orderPayload = {
        billing: orderData.billing,
        shipping: orderData.shipping,
        line_items: cartData.line_items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        fee_lines: cartData.fee_lines,
        coupon_lines: cartData.coupon_lines,
        customer_id: orderData.customer_id,
        customer_note: orderData.customer_note,
        payment_method: selectedGateway,
        payment_method_title: availableGateways.find(g => g.id === selectedGateway)?.title || '',
        meta_data: [
          { key: '_wepos_is_pos_order', value: true },
          { key: '_wepos_cash_tendered_amount', value: cashAmount.toString() },
          { key: '_wepos_cash_change_amount', value: changeAmount().toString() }
        ]
      };

      // Create order
      const orderResponse = await apiFetch({
        path: `/${window.wepos.rest.wcversion}/orders`,
        method: 'POST',
        data: orderPayload
      }) as any;

      // Update cart items with tax data
      const totalTaxes: Record<number, number> = {};
      orderResponse.line_items.forEach((item: any) => {
        totalTaxes[item.product_id] = item.total_tax;
      });

      const updatedCartItems = cartData.line_items.map(item => ({
        ...item,
        total_tax: totalTaxes[item.product_id] || 0
      }));
      setCartData(prev => ({ ...prev, line_items: updatedCartItems }));

      // Process payment
      const paymentResponse = await apiFetch({
        path: `/${window.wepos.rest.posversion}/payment/process`,
        method: 'POST',
        data: orderResponse
      }) as any;

      if (paymentResponse.result === 'success') {
        setPrintdata({
          line_items: cartData.line_items,
          fee_lines: cartData.fee_lines,
          coupon_lines: cartData.coupon_lines,
          subtotal: getSubtotal(),
          taxtotal: getTotalTax(),
          ordertotal: getTotal(),
          gateway: {
            id: orderResponse.payment_method,
            title: orderResponse.payment_method_title
          },
          order_id: orderResponse.number,
          order_date: orderResponse.date_created,
          cashamount: cashAmount.toString(),
          changeamount: changeAmount().toString()
        });

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
      const contentWrap = document.querySelector('.wepos-checkout-wrapper') as HTMLElement;
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
            setShowHelp(prev => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [emptyCart]);

  // Initialize data and set default category
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Auto-trigger print dialog when receipt is shown
  useEffect(() => {
    if (showPaymentReceipt && createprintreceipt) {
      setTimeout(() => {
        if (window.confirm('Order successful! Would you like to print the receipt?')) {
          window.print();
        }
      }, 500);
      setCreateprintreceipt(false);
    }
  }, [showPaymentReceipt, createprintreceipt]);

  return (
    <div id="wepos-main">
      <div className="content-product">
        <div className="top-panel wepos-clearfix">
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
          products={getFilteredProduct()}
          productView={productView}
          productLoading={productLoading}
          onAddToCart={addToCart}
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

      <HelpModal
        show={showHelp}
        onClose={() => setShowHelp(false)}
      />

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
    </div>
  );
};

export default HomePage;
