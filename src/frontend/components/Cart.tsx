import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
  Plus,
  X,
  ShoppingCart,
  Minus,
  UserPlus,
  SlidersHorizontal,
  Truck,
  Loader2,
} from 'lucide-react';
import {
  Button,
  ScrollArea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@wedevs/plugin-ui';
import { POSCartItem, POSFeeLine, POSShippingLine, POSOrderMetaItem } from '../types';
import FeeKeypad, { FeeKeypadHandle } from './FeeKeypad';
import CustomerNote, { CustomerNoteHandle } from './CustomerNote';
import AddMiscProductModal from './AddMiscProductModal';
import AddShippingModal from './AddShippingModal';
import AddFeeModal from './AddFeeModal';
import OrderMetaModal from './OrderMetaModal';
import { Slot } from '@wordpress/components';
import { PluginArea } from '@wordpress/plugins';
import { formatPrice } from '../utils/helpers';
import { CART_STORE_NAME } from '../store/cart';
import { PRODUCTS_STORE_NAME } from '../store/products';
import CustomerSearch, { CustomerSearchHandle } from '../components/CustomerSearch';
import CartSettingsModal from './CartSettingsModal';
import { useCartSettings } from '../hooks/useCartSettings';

interface CartProps {
  onInitPayment: () => void;
  onSaveToServer?: () => void;
  onVoidCart?: () => void;
  savingToServer?: boolean;
  voiding?: boolean;
  [name: string]: any;
}

export interface CartHandle {
  openDiscount: () => void;
  openFee: () => void;
  openNote: () => void;
  focusCustomerSearch: () => void;
  openNewCustomer: () => void;
}

const Cart = forwardRef<CartHandle, CartProps>(({
  onInitPayment,
  onSaveToServer,
  onVoidCart,
  savingToServer,
  voiding,
  selectedCustomer,
  handleCustomerSelected,
}, ref) => {
  // Cart settings
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const {
    settings: cartSettings,
    updateSettings: updateCartSettings,
    toggleColumn,
    toggleSubOption,
    restoreDefaults,
    isColumnEnabled,
    isSubOptionEnabled,
  } = useCartSettings();

  // Modal states
  const [showMiscProductModal, setShowMiscProductModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showOrderMetaModal, setShowOrderMetaModal] = useState(false);

  // Refs for child components
  const discountRef = useRef<FeeKeypadHandle>(null);
  const noteRef = useRef<CustomerNoteHandle>(null);
  const customerSearchRef = useRef<CustomerSearchHandle>(null);

  useImperativeHandle(ref, () => ({
    openDiscount: () => discountRef.current?.open(),
    openFee: () => setShowFeeModal(true),
    openNote: () => noteRef.current?.open(),
    focusCustomerSearch: () => customerSearchRef.current?.focus(),
    openNewCustomer: () => customerSearchRef.current?.openNewCustomer(),
  }));

  // Use WordPress data hooks for cart data
  const {
    cartItems,
    discountLines,
    feeLines,
    shippingLines,
    metaData,
    orderCurrency,
    orderCurrencySymbol,
    customerNote,
    subtotal,
    totalDiscount,
    totalFee,
    totalShipping,
    totalTax,
    total,
    serverOrder,
    isServerOrderDirty,
  } = useSelect((select) => {
    const store = select(CART_STORE_NAME) as any;
    return {
      cartItems: store.getCartItems(),
      discountLines: store.getDiscountLines(),
      feeLines: store.getFeeLines(),
      shippingLines: store.getShippingLines(),
      metaData: store.getMetaData(),
      orderCurrency: store.getOrderCurrency(),
      orderCurrencySymbol: store.getOrderCurrencySymbol(),
      customerNote: store.getCustomerNote(),
      subtotal: store.getSubtotal(),
      totalDiscount: store.getTotalDiscount(),
      totalFee: store.getTotalFee(),
      totalShipping: store.getTotalShipping(),
      totalTax: store.getTotalTax(),
      total: store.getTotal(),
      serverOrder: store.getServerOrder(),
      isServerOrderDirty: store.isServerOrderDirty(),
    };
  }, []);

  // Get settings from products store
  const { settings } = useSelect((select) => {
    const store = select(PRODUCTS_STORE_NAME) as any;
    return {
      settings: store.getSettings(),
    };
  }, []);

  const {
    updateCartItem,
    removeFromCart,
    clearCart,
    addToCart,
    addDiscount,
    addFeeLine,
    removeDiscount,
    removeFee,
    addCustomerNote,
    removeCustomerNote,
    addShippingLine,
    removeShippingLine,
    setMetaData,
    setOrderCurrency,
  } = useDispatch(CART_STORE_NAME) as any;

  const addQuantity = (item: POSCartItem, index: number) => {
    updateCartItem(index, { quantity: item.quantity + 1 });
  };

  const removeQuantity = (item: POSCartItem, index: number) => {
    if (item.quantity > 1) {
      updateCartItem(index, { quantity: item.quantity - 1 });
    }
  };

  const handleRemoveItem = (index: number) => {
    removeFromCart(index);
  };

  const handleDiscountInput = (value: number, type: 'percent' | 'fixed') => {
    addDiscount(value, type === 'percent' ? 'percent' : 'fixed_cart');
  };

  const handleAddNote = (note: string) => {
    addCustomerNote(note);
  };

  const handleAddMiscProduct = (product: {
    name: string;
    sku: string;
    price: number;
    tax_class: string;
    tax_status: 'taxable' | 'none';
  }) => {
    const cartItem: POSCartItem = {
      id: Date.now(),
      product_id: 0,
      variation_id: 0,
      name: product.name,
      sku: product.sku,
      quantity: 1,
      regular_price: product.price,
      sale_price: product.price,
      on_sale: false,
      type: 'simple',
      attribute: [],
      tax_amount: 0,
    };
    addToCart(cartItem);
  };

  const handleAddShipping = (shipping: POSShippingLine) => {
    addShippingLine(shipping);
  };

  const handleAddFee = (fee: POSFeeLine) => {
    addFeeLine(fee);
  };

  const handleSaveOrderMeta = (meta: POSOrderMetaItem[], currency?: string, currencySymbol?: string) => {
    setMetaData(meta);
    if (currency) {
      setOrderCurrency(currency, currencySymbol || '');
    }
  };

  const getDiscountAmount = (discount: any) => {
    if (discount.discount_type === 'percent') {
      return (subtotal * discount.value) / 100;
    } else {
      return discount.value;
    }
  };

  const getFeeAmount = (fee: any) => {
    if (fee.fee_type === 'percent') {
      return (subtotal * parseFloat(fee.value)) / 100;
    } else {
      return parseFloat(fee.value);
    }
  };

  // Use cart-specific currency symbol for formatting when a custom currency is set
  const cartFormatPrice = (price: number | string): string | number =>
    formatPrice(price, orderCurrencySymbol || '');

  const isTaxInclusive = settings?.woo_tax?.wc_tax_display_cart === 'incl';

  // Count visible columns for colSpan
  const visibleColumnCount = cartSettings.columns.filter((c) => c.enabled).length || 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {settings.wepos_general && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Cart Header - Fixed Top */}
          <div className="border-b border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                {__('Customer:', 'wepos')}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => customerSearchRef.current?.openNewCustomer()}
                  title={__('Add New Customer', 'wepos')}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => setShowSettingsModal(true)}
                  title={__('Cart Settings', 'wepos')}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CustomerSearch
              ref={customerSearchRef}
              selectedCustomer={selectedCustomer}
              onCustomerSelected={handleCustomerSelected}
              className="w-full"
            />
          </div>

          {/* Cart Content - Scrollable Middle */}
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-0">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-background">
                  <tr>
                    {isColumnEnabled('qty') && (
                      <th className="border-b border-border bg-muted p-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {__('Qty', 'wepos')}
                      </th>
                    )}
                    {isColumnEnabled('name') && (
                      <th className="border-b border-border bg-muted p-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {__('Name', 'wepos')}
                      </th>
                    )}
                    {isColumnEnabled('sku') && (
                      <th className="border-b border-border bg-muted p-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {__('SKU', 'wepos')}
                      </th>
                    )}
                    {isColumnEnabled('price') && (
                      <th className="border-b border-border bg-muted p-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {__('Price', 'wepos')}
                      </th>
                    )}
                    {isColumnEnabled('regular_price') && (
                      <th className="border-b border-border bg-muted p-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {__('Regular Price', 'wepos')}
                      </th>
                    )}
                    {isColumnEnabled('subtotal') && (
                      <th className="border-b border-border bg-muted p-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {__('Subtotal', 'wepos')}
                      </th>
                    )}
                    {isColumnEnabled('total') && (
                      <th className="border-b border-border bg-muted p-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {__('Total', 'wepos')}
                      </th>
                    )}
                    {isColumnEnabled('actions') && (
                      <th className="border-b border-border bg-muted p-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"></th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {cartItems.length > 0 ? (
                    cartItems.map((item: POSCartItem, index: number) => {
                      const itemTotal = item.quantity * (item.on_sale ? item.sale_price : item.regular_price);
                      const itemSubtotal = item.quantity * item.regular_price;

                      // Get server-calculated tax for this line item if available and not stale
                      const serverLineItem = serverOrder && !isServerOrderDirty
                        ? serverOrder.line_items?.find(
                            (li: any) => li.product_id === item.product_id && li.variation_id === (item.variation_id || 0)
                          )
                        : null;
                      const lineItemTax = serverLineItem ? parseFloat(serverLineItem.total_tax) || 0 : 0;

                      return (
                        <React.Fragment key={item.id}>
                          <tr className="border-b border-border transition-colors hover:bg-muted/50">
                            {/* QTY Column */}
                            {isColumnEnabled('qty') && (
                              <td className="p-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon-sm"
                                    className="h-5 w-5 rounded border-none bg-muted text-muted-foreground hover:bg-accent"
                                    onClick={() => removeQuantity(item, index)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-sm">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon-sm"
                                    className="h-5 w-5 rounded border-none bg-muted text-muted-foreground hover:bg-accent"
                                    onClick={() => addQuantity(item, index)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            )}

                            {/* NAME Column */}
                            {isColumnEnabled('name') && (
                              <td className="p-3 text-sm">
                                <div className="font-sm text-foreground">
                                  {item.name}
                                  {item.product_id === 0 && (
                                    <span className="ml-1 text-xs text-muted-foreground">
                                      ({__('Misc', 'wepos')})
                                    </span>
                                  )}
                                </div>
                                {/* Show SKU under name if sub-option enabled */}
                                {isSubOptionEnabled('name', 'sku') && item.sku && (
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    {item.sku}
                                  </div>
                                )}
                                {item.attribute &&
                                  item.attribute.length > 0 &&
                                  item.type === 'variable' && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      {item.attribute.map(
                                        (attr: any, attrIndex: number) => (
                                          <span
                                            key={attrIndex}
                                            className="mr-2 inline-block"
                                          >
                                            <span className="font-medium">
                                              {attr.name}:
                                            </span>
                                            <span className="ml-1">
                                              {attr.option}
                                            </span>
                                            {attrIndex <
                                              item.attribute.length - 1 && (
                                              <span className="mx-1">•</span>
                                            )}
                                          </span>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </td>
                            )}

                            {/* SKU Column (standalone) */}
                            {isColumnEnabled('sku') && (
                              <td className="p-3 text-sm text-muted-foreground">
                                {item.sku || '—'}
                              </td>
                            )}

                            {/* PRICE Column */}
                            {isColumnEnabled('price') && (
                              <td className="p-3 text-sm text-muted-foreground">
                                {item.on_sale && isSubOptionEnabled('price', 'on_sale') ? (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground line-through">
                                      {cartFormatPrice(item.regular_price)}
                                    </span>
                                    <span className="font-medium text-destructive">
                                      {cartFormatPrice(item.sale_price)}
                                    </span>
                                  </div>
                                ) : (
                                  <span>{cartFormatPrice(item.regular_price)}</span>
                                )}
                              </td>
                            )}

                            {/* REGULAR PRICE Column */}
                            {isColumnEnabled('regular_price') && (
                              <td className="p-3 text-sm text-muted-foreground">
                                {cartFormatPrice(item.regular_price)}
                              </td>
                            )}

                            {/* SUBTOTAL Column */}
                            {isColumnEnabled('subtotal') && (
                              <td className="p-3 text-sm">
                                <div>{cartFormatPrice(itemSubtotal)}</div>
                                {isSubOptionEnabled('subtotal', 'tax') && (
                                  <div className="text-xs text-muted-foreground">
                                    {isTaxInclusive
                                      ? __('incl. tax', 'wepos')
                                      : __('excl. tax', 'wepos')}
                                  </div>
                                )}
                              </td>
                            )}

                            {/* TOTAL Column */}
                            {isColumnEnabled('total') && (
                              <td className="p-3 text-sm">
                                <div>{cartFormatPrice(itemTotal)}</div>
                                {isSubOptionEnabled('total', 'tax') && (
                                  <div className="text-xs text-muted-foreground">
                                    {lineItemTax > 0
                                      ? `${isTaxInclusive ? __('incl.', 'wepos') : '+'} ${__('tax', 'wepos')} ${cartFormatPrice(lineItemTax)}`
                                      : isTaxInclusive
                                        ? __('incl. tax', 'wepos')
                                        : __('excl. tax', 'wepos')}
                                  </div>
                                )}
                                {item.on_sale && isSubOptionEnabled('total', 'on_sale') && (
                                  <div className="mt-0.5 text-xs text-muted-foreground line-through">
                                    {cartFormatPrice(itemSubtotal)}
                                  </div>
                                )}
                              </td>
                            )}

                            {/* Actions Column */}
                            {isColumnEnabled('actions') && (
                              <td className="p-3 text-right text-sm">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="flex h-6 w-6 items-center justify-center rounded-full border-none bg-destructive p-0 text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground"
                                  onClick={() => handleRemoveItem(index)}
                                  title={__('Remove item', 'wepos')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={visibleColumnCount}
                        className="px-5 py-16 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center">
                          <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            {__('Empty Cart', 'wepos')}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>

          {/* Cart Footer - Fixed Bottom */}
          <div className="shrink-0 border-t border-border">
            <div className="bg-muted/50">
              {/* Subtotal */}
              <div className="flex items-center justify-between border-b border-border p-[9px_12px]">
                <div className="flex-1 text-sm">
                  {__('Subtotal', 'wepos')}
                  {isTaxInclusive && totalTax > 0 && (
                    <span className="block text-xs font-normal text-muted-foreground">
                      {__('Including Tax', 'wepos')}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  {cartFormatPrice(subtotal)}
                </div>
                <div className="ml-2 h-4 w-4">
                  &nbsp;
                </div>
              </div>

              {/* Discount Lines */}
              {discountLines.map((discount: any, index: number) => (
                <div
                  key={`discount-${index}`}
                  className="flex items-center border-b border-border p-[9px_12px]"
                >
                  <div className="flex-1 text-sm">
                    {__('Discount', 'wepos')}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {discount.discount_type === 'percent'
                        ? `${discount.value}%`
                        : cartFormatPrice(discount.value)}
                    </span>
                  </div>
                  <div className="text-sm">
                    −{cartFormatPrice(getDiscountAmount(discount))}
                  </div>
                  <div className="ml-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeDiscount(index)}
                      title={__('Remove discount', 'wepos')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Fee Lines */}
              {feeLines.map((fee: any, index: number) => (
                <div
                  key={`fee-${index}`}
                  className="flex items-center border-b border-border p-[9px_12px]"
                >
                  <div className="flex-1 text-sm text-foreground">
                    {fee.name || __('Fee', 'wepos')}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {fee.fee_type === 'percent'
                        ? `${fee.value}%`
                        : cartFormatPrice(fee.value)}
                    </span>
                    {fee.tax_status === 'taxable' && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({__('taxable', 'wepos')})
                      </span>
                    )}
                  </div>
                  <div className="text-sm">
                    {cartFormatPrice(getFeeAmount(fee))}
                  </div>
                  <div className="ml-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeFee(index)}
                      title={__('Remove fee', 'wepos')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Shipping Lines */}
              {shippingLines.map((shipping: POSShippingLine, index: number) => (
                <div
                  key={`shipping-${index}`}
                  className="flex items-center border-b border-border p-[9px_12px]"
                >
                  <div className="flex-1 text-sm text-foreground">
                    <Truck className="mr-1 inline h-3.5 w-3.5" />
                    {shipping.method_title}
                    {shipping.tax_status === 'taxable' && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({__('taxable', 'wepos')})
                      </span>
                    )}
                  </div>
                  <div className="text-sm">
                    {cartFormatPrice(shipping.total)}
                  </div>
                  <div className="ml-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeShippingLine(index)}
                      title={__('Remove shipping', 'wepos')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Tax Lines (from server, only when not stale) */}
              {serverOrder && !isServerOrderDirty && serverOrder.tax_lines.length > 0 && (
                <>
                  {serverOrder.tax_lines.map((taxLine: any) => (
                    <div
                      key={`tax-${taxLine.id}`}
                      className="flex items-center justify-between border-b border-border p-[9px_12px]"
                    >
                      <div className="flex-1 text-sm text-foreground">
                        {taxLine.label}
                        {parseFloat(taxLine.shipping_tax_total) > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({__('incl. shipping tax', 'wepos')} {cartFormatPrice(taxLine.shipping_tax_total)})
                          </span>
                        )}
                      </div>
                      <div className="text-sm">
                        {cartFormatPrice(parseFloat(taxLine.tax_total) + parseFloat(taxLine.shipping_tax_total))}
                      </div>
                      <div className="ml-2 h-4 w-4">
                        &nbsp;
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Total Tax (fallback when no detailed tax lines) */}
              {totalTax > 0 && (!serverOrder || isServerOrderDirty || serverOrder.tax_lines.length === 0) && (
                <div className="flex items-center justify-between border-b border-border p-[9px_12px]">
                  <div className="text-sm font-medium text-foreground">
                    {isTaxInclusive
                      ? __('Fee Tax', 'wepos')
                      : __('Tax', 'wepos')}
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {cartFormatPrice(totalTax)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-b border-border p-2">
                <div className="flex flex-wrap gap-2">
                  <FeeKeypad
                    ref={discountRef}
                    name={__('Discount', 'wepos')}
                    onInputFee={handleDiscountInput}
                    isDiscount={true}
                  />
                  {!customerNote && (
                    <CustomerNote ref={noteRef} onAddNote={handleAddNote} />
                  )}

                  {/* New action buttons */}
                  <Button
                    variant="outline"
                    className="border-border bg-muted text-muted-foreground hover:bg-accent"
                    onClick={() => setShowMiscProductModal(true)}
                  >
                    {__('Misc Product', 'wepos')}
                  </Button>

                  <Button
                    variant="outline"
                    className="border-border bg-muted text-muted-foreground hover:bg-accent"
                    onClick={() => setShowFeeModal(true)}
                  >
                    {__('Add Fee', 'wepos')}
                  </Button>

                  <Button
                    variant="outline"
                    className="border-border bg-muted text-muted-foreground hover:bg-accent"
                    onClick={() => setShowShippingModal(true)}
                  >
                    {__('Shipping', 'wepos')}
                  </Button>

                  <Button
                    variant="outline"
                    className="border-border bg-muted text-muted-foreground hover:bg-accent"
                    onClick={() => setShowOrderMetaModal(true)}
                  >
                    {__('Order Meta', 'wepos')}
                  </Button>

                  {onSaveToServer && (
                    <Button
                      variant="outline"
                      className="border-border bg-muted text-muted-foreground hover:bg-accent"
                      onClick={onSaveToServer}
                      disabled={cartItems.length === 0 || savingToServer}
                    >
                      {savingToServer && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                      {serverOrder
                        ? __('Update to Server', 'wepos')
                        : __('Save to Server', 'wepos')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Customer Note */}
              {customerNote && (
                <div className="flex items-center border-b border-border p-[9px_12px]">
                  <div className="flex-1 text-sm text-muted-foreground">
                    <span className="font-medium">
                      {__('Note:', 'wepos')}{' '}
                    </span>
                    {customerNote}
                  </div>
                  <div className="ml-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={removeCustomerNote}
                      title={__('Remove note', 'wepos')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}


            </div>

            <div className="flex gap-2 p-2 w-full">
              <Button
                variant="destructive"
                className="h-14 w-[30%] text-lg font-bold"
                onClick={onVoidCart || clearCart}
                disabled={voiding}
              >
                {voiding && <Loader2 className="mr-1 h-5 w-5 animate-spin" />}
                {__('Void', 'wepos')}
              </Button>
              <Button
                className="h-14 w-[70%] text-lg font-bold"
                variant="success"
                onClick={onInitPayment}
              >
                {__('Checkout', 'wepos')} {cartFormatPrice(total)}
              </Button>
            </div>

          </div>
        </div>
      )}

      <CartSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={cartSettings}
        onToggleColumn={toggleColumn}
        onToggleSubOption={toggleSubOption}
        onUpdateSettings={updateCartSettings}
        onRestoreDefaults={restoreDefaults}
      />

      {/* Modal Components */}
      <AddMiscProductModal
        isOpen={showMiscProductModal}
        onClose={() => setShowMiscProductModal(false)}
        onAddProduct={handleAddMiscProduct}
      />

      <AddShippingModal
        isOpen={showShippingModal}
        onClose={() => setShowShippingModal(false)}
        onAddShipping={handleAddShipping}
      />

      <AddFeeModal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        onAddFee={handleAddFee}
        defaultTaxStatus={settings?.wepos_general?.enable_fee_tax === 'no' ? 'none' : 'taxable'}
      />

      <OrderMetaModal
        isOpen={showOrderMetaModal}
        onClose={() => setShowOrderMetaModal(false)}
        onSave={handleSaveOrderMeta}
        initialMetaData={metaData}
        initialCurrency={orderCurrency}
      />
    </div>
  );
});

export default Cart;
