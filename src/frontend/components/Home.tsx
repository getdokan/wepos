import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiFetch from '@wordpress/api-fetch';

interface Product {
  id: number;
  name: string;
  type: string;
  images: Array<{ woocommerce_thumbnail: string; name: string }>;
  categories: Array<{ id: number; name: string }>;
  sku?: string;
  price_html: string;
  on_sale: boolean;
  sale_price: number;
  regular_price: number;
  stock_quantity: number;
  manage_stock: boolean;
  stock_status: string;
  attributes?: Array<{
    name: string;
    options: string[];
    variation: boolean;
  }>;
  variations?: any[];
}

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  type: string;
  on_sale: boolean;
  sale_price: number;
  regular_price: number;
  editQuantity?: boolean;
  attribute: Array<{
    name: string;
    option: string;
  }>;
  total_tax?: number;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
}

interface Gateway {
  id: string;
  title: string;
}

interface Settings {
  wepos_general: any;
  woo_tax: {
    wc_tax_display_cart: string;
  };
}

interface OrderData {
  customer_id: number;
  customer_note: string;
  payment_method: string;
  payment_method_title: string;
  billing: any;
  shipping: any;
}

interface CartData {
  line_items: CartItem[];
  fee_lines: any[];
  coupon_lines: any[];
}

const Home: React.FC = () => {
  // State management - converted from Vue.js data and computed
  const [showHelp, setShowHelp] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [productView, setProductView] = useState<'grid' | 'list'>('grid');
  const [productLoading, setProductLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedVariationProduct, setSelectedVariationProduct] = useState<Product>({} as Product);
  const [attributeDisabled, setAttributeDisabled] = useState(true);
  const [selectedAttribute, setSelectedAttribute] = useState<Record<string, string>>({});
  const [availableGateways, setAvailableGateways] = useState<Gateway[]>([]);
  const [emptyGatewayDiv, setEmptyGatewayDiv] = useState(0);
  const [cashAmount, setCashAmount] = useState('');
  const [availableTax, setAvailableTax] = useState<any[]>([]);
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [printdata, setPrintdata] = useState<any>({
    gateway: { id: '', title: '' }
  });
  const [feeData, setFeeData] = useState<any>({});
  const [createprintreceipt, setCreateprintreceipt] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [couponData, setCouponData] = useState<any>({});

  // Cart and Order data
  const [cartData, setCartData] = useState<CartData>({
    line_items: [],
    fee_lines: [],
    coupon_lines: []
  });

  const [orderData, setOrderData] = useState<OrderData>({
    customer_id: 0,
    customer_note: '',
    payment_method: '',
    payment_method_title: '',
    billing: {},
    shipping: {}
  });

  // Refs
  const itemsWrapperRef = useRef<HTMLDivElement>(null);
  const cashAmountRef = useRef<HTMLInputElement>(null);

  // Computed properties - converted from Vue.js computed
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

  const changeAmount = useCallback(() => {
    const unformattedAmount = parseFloat(cashAmount.replace(/[^\d.-]/g, '')) || 0;
    const total = getTotal() || 0;
    const returnMoney = unformattedAmount - total;
    return returnMoney > 0 ? returnMoney : 0;
  }, [cashAmount, cartData, settings]);

  const ableToProcess = useCallback(() => {
    let canProcess = cartData.line_items.length > 0 && selectedGateway !== '';

    if (selectedGateway === 'wepos_cash') {
      const unformattedAmount = parseFloat(cashAmount.replace(/[^\d.-]/g, '')) || 0;
      const total = getTotal() || 0;
      canProcess = unformattedAmount >= total && canProcess;
    }

    return canProcess;
  }, [cartData.line_items, selectedGateway, cashAmount, settings]);

  // Helper functions - converted from Vue.js methods
  const formatPrice = (amount: number | string | undefined | null): string => {
    // Convert to number and handle edge cases
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));

    // Check if result is a valid number
    if (isNaN(numericAmount)) {
      return '$0.00';
    }

    return `$${numericAmount.toFixed(2)}`;
  };

  const hasStock = (product: Product): boolean => {
    if (!product.manage_stock) return true;
    return product.stock_status === 'instock' && product.stock_quantity > 0;
  };

  const getSubtotal = (): number => {
    return cartData.line_items.reduce((total, item) => {
      const price = item.on_sale ? (item.sale_price || 0) : (item.regular_price || 0);
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

  const getTotalTax = (): number => {
    return cartData.line_items.reduce((total, item) => {
      return total + (item.total_tax || 0);
    }, 0);
  };

  const getTotal = (): number => {
    let subtotal = getSubtotal() || 0;

    // Add fee lines
    subtotal += cartData.fee_lines.reduce((total, fee) => total + (fee.total || 0), 0);

    // Subtract coupon discounts
    subtotal -= cartData.coupon_lines.reduce((total, coupon) => {
      if (coupon.type === 'discount') {
        return total + Math.abs(coupon.total || 0);
      }
      return total;
    }, 0);

    // Add tax if not included
    if (settings.woo_tax?.wc_tax_display_cart !== 'incl') {
      subtotal += getTotalTax();
    }

    return subtotal;
  };

  const getProductImage = (product: Product): string => {
    return product.images.length > 0
      ? product.images[0].woocommerce_thumbnail
      : (window as any).wepos?.placeholder_image || '';
  };

  const truncateTitle = (text: string, length: number): string => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  // API functions - converted from Vue.js methods using @wordpress/api-fetch
  const fetchProducts = async () => {
    if (page === 1) {
      setProductLoading(true);
    }

    if (totalPages >= page) {
      try {
        const response = await apiFetch({
          path: `/${window.wepos.rest.posversion}/products?status=publish&per_page=30&page=${page}`
        }) as Product[];

        // For apiFetch, we need to get total pages from the response headers differently
        // Since apiFetch doesn't expose headers directly, we'll handle pagination differently
        appendProducts(response);
        setPage(prev => prev + 1);
        setProductLoading(false);

        // Continue fetching if we got a full page of results (30 items)
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
  };

  const appendProducts = (newProducts: Product[]) => {
    const validProducts = newProducts.filter(product => {
      if (product.type === 'variable' && isAllVariationsDisabled(product)) {
        return false;
      }
      return true;
    });

    setProducts(prev => [...prev, ...validProducts]);
  };

  const isAllVariationsDisabled = (product: Product): boolean => {
    if (!product.attributes) return true;

    return !product.attributes.some(attribute => attribute.variation === true);
  };

  const fetchGateways = async () => {
    try {
      const response = await apiFetch({
        path: `/${window.wepos.rest.posversion}/payment/gateways`
      }) as Gateway[];
      setAvailableGateways(response);
      setEmptyGatewayDiv(4 - (response.length % 4));
    } catch (error) {
      console.error('Error fetching gateways:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await apiFetch({
        path: `/${window.wepos.rest.posversion}/settings`
      }) as Settings;
      setSettings(response);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiFetch({
        path: `/${window.wepos.rest.wcversion}/products/categories?hide_empty=true&_fields=id,name,parent_id&per_page=100`
      }) as Category[];

      // Sort categories alphabetically
      response.sort((a: Category, b: Category) => a.name.localeCompare(b.name));

      // Create category tree with levels
      const createTree = (categories: Category[], parentId: number | null = null, level = 0): Category[] => {
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

      const allCategoriesOption: Category = {
        id: -1,
        level: 0,
        name: 'All categories',
        parent_id: null
      };

      setCategories([allCategoriesOption, ...sortedCategories]);
      setSelectedCategory(allCategoriesOption);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Cart actions - converted from Vue.js methods
  const addToCart = (product: Product) => {
    if (!hasStock(product)) {
      alert('Product is out of stock!');
      return;
    }

    const existingItemIndex = cartData.line_items.findIndex(
      item => item.product_id === product.id
    );

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      const updatedItems = [...cartData.line_items];
      updatedItems[existingItemIndex].quantity += 1;
      setCartData(prev => ({ ...prev, line_items: updatedItems }));
    } else {
      // Add new item to cart
      const cartItem: CartItem = {
        id: Date.now(),
        product_id: product.id,
        name: product.name,
        quantity: 1,
        type: product.type,
        on_sale: product.on_sale,
        sale_price: product.sale_price,
        regular_price: product.regular_price,
        attribute: []
      };

      setCartData(prev => ({
        ...prev,
        line_items: [...prev.line_items, cartItem]
      }));
    }
  };

  const removeItem = (index: number) => {
    const updatedItems = cartData.line_items.filter((_, i) => i !== index);
    setCartData(prev => ({ ...prev, line_items: updatedItems }));
  };

  const toggleEditQuantity = (item: CartItem, index: number) => {
    const updatedItems = [...cartData.line_items];
    updatedItems[index].editQuantity = !updatedItems[index].editQuantity;
    setCartData(prev => ({ ...prev, line_items: updatedItems }));
  };

  const addQuantity = (item: CartItem, index: number) => {
    const updatedItems = [...cartData.line_items];
    updatedItems[index].quantity += 1;
    setCartData(prev => ({ ...prev, line_items: updatedItems }));
  };

  const removeQuantity = (item: CartItem, index: number) => {
    const updatedItems = [...cartData.line_items];
    if (updatedItems[index].quantity > 1) {
      updatedItems[index].quantity -= 1;
      setCartData(prev => ({ ...prev, line_items: updatedItems }));
    }
  };

  const emptyCart = () => {
    setCartData({
      line_items: [],
      fee_lines: [],
      coupon_lines: []
    });
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
  };

  const toggleProductView = () => {
    setProductView(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const createNewSale = () => {
    emptyCart();
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

  // Process payment function - converted from Vue.js
  const processPayment = async () => {
    if (!ableToProcess()) {
      return;
    }

    try {
      // Show loading state
      const contentWrap = document.querySelector('.wepos-checkout-wrapper') as HTMLElement;
      if (contentWrap) {
        contentWrap.style.opacity = '0.6';
        contentWrap.style.pointerEvents = 'none';
      }

      // Prepare order data - matching Vue.js structure exactly
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
          {
            key: '_wepos_is_pos_order',
            value: true
          },
          {
            key: '_wepos_cash_tendered_amount',
            value: cashAmount.toString()
          },
          {
            key: '_wepos_cash_change_amount',
            value: changeAmount().toString()
          }
        ]
      };

      console.log('Sending order payload:', orderPayload);

      // Step 1: Create WooCommerce order
      const orderResponse = await apiFetch({
        path: `/${window.wepos.rest.wcversion}/orders`,
        method: 'POST',
        data: orderPayload
      }) as any;

      // Step 2: Store tax data for cart items
      const totalTaxes: Record<number, number> = {};
      orderResponse.line_items.forEach((item: any) => {
        totalTaxes[item.product_id] = item.total_tax;
      });

      // Update cart items with tax data
      const updatedCartItems = cartData.line_items.map(item => ({
        ...item,
        total_tax: totalTaxes[item.product_id] || 0
      }));
      setCartData(prev => ({ ...prev, line_items: updatedCartItems }));

      // Step 3: Process payment via WePos API
      const paymentResponse = await apiFetch({
        path: `/${window.wepos.rest.posversion}/payment/process`,
        method: 'POST',
        data: orderResponse
      }) as any;

      if (paymentResponse.result === 'success') {
        // Set print data for receipt
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

        // Show success - close payment modal and show receipt
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
      // Remove loading state
      const contentWrap = document.querySelector('.wepos-checkout-wrapper') as HTMLElement;
      if (contentWrap) {
        contentWrap.style.opacity = '1';
        contentWrap.style.pointerEvents = 'auto';
      }

      // Show error message
      alert(error?.message || 'Payment processing failed');
      console.error('Payment processing error:', error);
    }
  };

  // Keyboard shortcuts - converted from Vue.js hotkeys
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
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    fetchSettings();
    fetchProducts();
    fetchGateways();
    fetchCategories();

    // Load from localStorage if available
    if (typeof localStorage !== 'undefined') {
      try {
        const savedCartData = localStorage.getItem('cartdata');
        const savedOrderData = localStorage.getItem('orderdata');

        if (savedCartData) {
          setCartData(JSON.parse(savedCartData));
        }

        if (savedOrderData) {
          setOrderData(JSON.parse(savedOrderData));
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    }

    // Save to localStorage on beforeunload
    const handleBeforeUnload = () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cartdata', JSON.stringify(cartData));
        localStorage.setItem('orderdata', JSON.stringify(orderData));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Auto-trigger print dialog when receipt is shown
  useEffect(() => {
    if (showPaymentReceipt && createprintreceipt) {
      // Small delay to let the modal render first
      setTimeout(() => {
        if (window.confirm('Order successful! Would you like to print the receipt?')) {
          window.print();
        }
      }, 500);
      setCreateprintreceipt(false);
    }
  }, [showPaymentReceipt, createprintreceipt]);

  // Save to localStorage whenever cart or order data changes
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cartdata', JSON.stringify(cartData));
    }
  }, [cartData]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('orderdata', JSON.stringify(orderData));
    }
  }, [orderData]);

  return (
    <div id="wepos-main">
      <div className="content-product">
        <div className="top-panel wepos-clearfix">
          <div className="search-bar">
            {/* Product search component will be implemented */}
            <div className="search-box">
              <input
                type="text"
                id="product-search"
                placeholder="Search Product By Name, Barcode, SKU..."
              />
              <span className="search-icon flaticon-search"></span>
            </div>
          </div>

          <div className="category">
            <select id="product-category">
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {'  '.repeat(category.level)}{category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="toggle-view">
            <div className="product-toggle">
              <span
                className={`toggle-icon list-view flaticon-menu-button-of-three-horizontal-lines ${productView === 'list' ? 'active' : ''}`}
                onClick={() => setProductView('list')}
              ></span>
              <span
                className={`toggle-icon grid-view flaticon-menu ${productView === 'grid' ? 'active' : ''}`}
                onClick={() => setProductView('grid')}
              ></span>
            </div>
          </div>
        </div>

        <div className={`items-wrapper ${productView}`} ref={itemsWrapperRef}>
          {!productLoading ? (
            <>
              {getFilteredProduct().length > 0 ? (
                getFilteredProduct().map((product) => (
                  <div key={product.id} className="item">
                    {product.type === 'simple' && (
                      <div
                        className={`item-wrap ${!hasStock(product) ? 'disabled' : ''}`}
                        onClick={() => addToCart(product)}
                      >
                        <div className="img">
                          <img src={getProductImage(product)} alt={product.name} />
                        </div>
                        <div className="title">
                          {productView === 'grid' ? (
                            truncateTitle(product.name, 20)
                          ) : (
                            <div>
                              <div className="product-name">{product.name}</div>
                              <ul className="meta">
                                {product.sku && (
                                  <li>
                                    <span className="label">SKU:</span>
                                    <span className="value">{product.sku}</span>
                                  </li>
                                )}
                                <li>
                                  <span className="label">Price:</span>
                                  <span className="value" dangerouslySetInnerHTML={{ __html: product.price_html }}></span>
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                        <span className={`add-product-icon flaticon-add ${productView}`}></span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-product-found">
                  <img src={`${(window as any).wepos?.assets_url}/images/no-product.png`} alt="" width="120px" />
                  <p>No Product Found</p>
                </div>
              )}
            </>
          ) : (
            <div className="product-loading">
              <div className="spinner spinner-loading"></div>
            </div>
          )}
        </div>
      </div>

      <div className="content-cart">
        <div className="top-panel">
          {/* Customer search component */}
          <div className="customer-search-box">
            <input
              type="text"
              id="customer-search"
              placeholder="Walk-in Customer"
            />
            <span className="add-new-customer flaticon-add"></span>
          </div>

          <div className="action">
            <div className="more-options">
              <button
                className="wepos-button"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
              >
                <span className="more-icon flaticon-more"></span>
              </button>
              {showQuickMenu && (
                <div className="wepos-dropdown-menu">
                  <ul>
                    <li><a href="#" onClick={emptyCart}>Empty Cart</a></li>
                    <li><a href="#" onClick={() => setShowHelp(true)}>Help</a></li>
                    <li className="divider"></li>
                    <li><a href="#" onClick={() => window.location.href = (window as any).wepos?.logout_url}>Logout</a></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {settings.wepos_general && (
          <div className="cart-panel">
            <div className="cart-content">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th style={{ width: '65%' }}>Product</th>
                    <th style={{ width: '15%' }}>Qty</th>
                    <th style={{ width: '30%' }}>Price</th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cartData.line_items.length > 0 ? (
                    cartData.line_items.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <tr>
                          <td className="name" onClick={() => toggleEditQuantity(item, index)}>
                            {item.name}
                          </td>
                          <td className="qty" onClick={() => toggleEditQuantity(item, index)}>
                            {item.quantity}
                          </td>
                          <td className="price" onClick={() => toggleEditQuantity(item, index)}>
                            {item.on_sale ? (
                              <>
                                <span className="sale-price">{formatPrice(item.quantity * item.sale_price)}</span>
                                <span className="regular-price">{formatPrice(item.quantity * item.regular_price)}</span>
                              </>
                            ) : (
                              <span className="sale-price">{formatPrice(item.quantity * item.regular_price)}</span>
                            )}
                          </td>
                          <td className="action">
                            <span
                              className={`flaticon-right-arrow ${item.editQuantity ? 'open' : ''}`}
                              onClick={() => toggleEditQuantity(item, index)}
                            ></span>
                          </td>
                          <td className="remove">
                            <span
                              className="flaticon-cancel-music"
                              onClick={() => removeItem(index)}
                            ></span>
                          </td>
                        </tr>
                        {item.editQuantity && (
                          <tr className="update-quantity-wrap">
                            <td colSpan={5}>
                              <span className="qty">Quantity</span>
                              <span className="qty-number">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const updatedItems = [...cartData.line_items];
                                    updatedItems[index].quantity = parseInt(e.target.value) || 1;
                                    setCartData(prev => ({ ...prev, line_items: updatedItems }));
                                  }}
                                />
                              </span>
                              <span className="qty-action">
                                <a href="#" className="add" onClick={(e) => { e.preventDefault(); addQuantity(item, index); }}>+</a>
                                <a href="#" className="minus" onClick={(e) => { e.preventDefault(); removeQuantity(item, index); }}>-</a>
                              </span>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr className="no-item">
                      <td colSpan={5}>
                        <img src={`${(window as any).wepos?.assets_url}/images/empty-cart.png`} alt="" width="120px" />
                        <p>Empty Cart</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cart-calculation">
              <table className="cart-total-table">
                <tbody>
                  <tr className="cart-meta-data">
                    <td className="label">
                      Subtotal
                      {settings.woo_tax?.wc_tax_display_cart === 'incl' && getTotalTax() > 0 && (
                        <span className="name">Including Tax</span>
                      )}
                    </td>
                    <td className="price">{formatPrice(getSubtotal())}</td>
                    <td className="action"></td>
                  </tr>

                  {getTotalTax() > 0 && (
                    <tr className="tax">
                      <td className="label">
                        {settings.woo_tax?.wc_tax_display_cart === 'incl' ? 'Fee Tax' : 'Tax'}
                      </td>
                      <td className="price">{formatPrice(getTotalTax())}</td>
                      <td className="action"></td>
                    </tr>
                  )}

                  <tr className="pay-now" onClick={initPayment}>
                    <td>Pay Now</td>
                    <td className="amount">{formatPrice(getTotal())}</td>
                    <td className="icon"><span className="flaticon-right-arrow"></span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wepos-help-wrapper">
              <h2>Shortcut Keys</h2>
              <ul>
                <li><span className="code"><code>f3</code></span><span className="title">Toggle Product View</span></li>
                <li><span className="code"><code>f8</code></span><span className="title">Create New Sale</span></li>
                <li><span className="code"><code>shift+f8</code></span><span className="title">Empty your cart</span></li>
                <li><span className="code"><code>f9</code></span><span className="title">Process Payment</span></li>
                <li><span className="code"><code>ctrl/cmd+?</code></span><span className="title">Show/Close Help</span></li>
                <li><span className="code"><code>esc</code></span><span className="title">Close anything</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={backToSale}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wepos-checkout-wrapper">
              <div className="left-content">
                <div className="header">Sale Summary</div>
                <div className="content">
                  <table className="sale-summary-cart">
                    <tbody>
                      {cartData.line_items.map((item) => (
                        <tr key={item.id}>
                          <td className="name">{item.name}</td>
                          <td className="quantity">{item.quantity}</td>
                          <td className="price">
                            {item.on_sale ? (
                              <>
                                <span className="sale-price">{formatPrice(item.quantity * item.sale_price)}</span>
                                <span className="regular-price">{formatPrice(item.quantity * item.regular_price)}</span>
                              </>
                            ) : (
                              <span className="sale-price">{formatPrice(item.quantity * item.regular_price)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="right-content">
                <div className="header">
                  <h2>Pay</h2>
                  <span className="pay-amount">{formatPrice(getTotal())}</span>
                </div>

                <div className="content">
                  <div className="payment-gateway">
                    {availableGateways.length > 0 ? (
                      availableGateways.map((gateway) => (
                        <label key={gateway.id}>
                          <input
                            type="radio"
                            name="gateway"
                            value={gateway.id}
                            checked={selectedGateway === gateway.id}
                            onChange={(e) => setSelectedGateway(e.target.value)}
                          />
                          <span className={`gateway gateway-${gateway.id}`}>
                            {gateway.title}
                          </span>
                        </label>
                      ))
                    ) : (
                      <p>No gateway found</p>
                    )}
                  </div>

                  {selectedGateway === 'wepos_cash' && (
                    <div className="payment-option">
                      <div className="payment-amount">
                        <div className="input-part">
                          <div className="input-wrap">
                            <p>Cash</p>
                            <div className="input-addon">
                              <span className="currency">$</span>
                              <input
                                id="input-cash-amount"
                                type="text"
                                value={cashAmount}
                                onChange={(e) => setCashAmount(e.target.value)}
                                ref={cashAmountRef}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="change-money">
                          <p>Change money: {formatPrice(changeAmount())}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="footer">
                  <a href="#" className="back-btn" onClick={(e) => { e.preventDefault(); backToSale(); }}>
                    Back to Sale
                  </a>
                  <button
                    className={`process-checkout-btn ${!ableToProcess() ? 'disabled' : ''}`}
                    onClick={processPayment}
                    disabled={!ableToProcess()}
                  >
                    Process Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {showPaymentReceipt && (
        <div className="modal-overlay" onClick={() => setShowPaymentReceipt(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wepos-receipt-wrapper">
              <div className="header">
                <h2>Payment Receipt</h2>
                <span className="close-btn" onClick={() => setShowPaymentReceipt(false)}>×</span>
              </div>
              <div className="content">
                <div className="receipt-info">
                  <p><strong>Order ID:</strong> {printdata.order_id}</p>
                  <p><strong>Date:</strong> {new Date(printdata.order_date).toLocaleDateString()}</p>
                  <p><strong>Payment Method:</strong> {printdata.gateway?.title}</p>
                </div>

                <div className="receipt-items">
                  <h3>Items</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printdata.line_items?.map((item: CartItem, index: number) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.quantity * (item.on_sale ? item.sale_price : item.regular_price))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="receipt-totals">
                  <div className="total-line">
                    <span>Subtotal:</span>
                    <span>{formatPrice(printdata.subtotal || 0)}</span>
                  </div>
                  {printdata.taxtotal > 0 && (
                    <div className="total-line">
                      <span>Tax:</span>
                      <span>{formatPrice(printdata.taxtotal || 0)}</span>
                    </div>
                  )}
                  <div className="total-line final-total">
                    <span>Total:</span>
                    <span>{formatPrice(printdata.ordertotal || 0)}</span>
                  </div>

                  {selectedGateway === 'wepos_cash' && (
                    <>
                      <div className="total-line">
                        <span>Cash Tendered:</span>
                        <span>{formatPrice(parseFloat(printdata.cashamount || '0'))}</span>
                      </div>
                      <div className="total-line">
                        <span>Change:</span>
                        <span>{formatPrice(parseFloat(printdata.changeamount || '0'))}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="footer">
                <button
                  className="print-btn"
                  onClick={() => {
                    window.print();
                  }}
                >
                  Print Receipt
                </button>
                <button
                  className="new-sale-btn"
                  onClick={() => {
                    setShowPaymentReceipt(false);
                    createNewSale();
                  }}
                >
                  New Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
