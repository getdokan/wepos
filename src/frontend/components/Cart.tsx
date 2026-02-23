import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
  Plus,
  X,
  ShoppingCart,
  Minus, MoreVertical,
} from 'lucide-react';
import {
  Button,
  ScrollArea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@wedevs/plugin-ui';
import { POSCartItem } from '../types';
import FeeKeypad, { FeeKeypadHandle } from './FeeKeypad';
import CustomerNote, { CustomerNoteHandle } from './CustomerNote';
import { formatPrice } from '../utils/helpers';
import { CART_STORE_NAME } from '../store/cart';
import { PRODUCTS_STORE_NAME } from '../store/products';
import CustomerSearch, { CustomerSearchHandle } from '../components/CustomerSearch';

interface CartProps {
  onInitPayment: () => void;
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
  selectedCustomer,
  handleCustomerSelected,
  setShowHelp,
}, ref) => {
  // Refs for child components
  const discountRef = useRef<FeeKeypadHandle>(null);
  const feeRef = useRef<FeeKeypadHandle>(null);
  const noteRef = useRef<CustomerNoteHandle>(null);
  const customerSearchRef = useRef<CustomerSearchHandle>(null);

  useImperativeHandle(ref, () => ({
    openDiscount: () => discountRef.current?.open(),
    openFee: () => feeRef.current?.open(),
    openNote: () => noteRef.current?.open(),
    focusCustomerSearch: () => customerSearchRef.current?.focus(),
    openNewCustomer: () => customerSearchRef.current?.openNewCustomer(),
  }));

  // Use WordPress data hooks for cart data
  const {
    cartItems,
    discountLines,
    feeLines,
    customerNote,
    subtotal,
    totalDiscount,
    totalFee,
    totalTax,
    total,
  } = useSelect((select) => {
    const store = select(CART_STORE_NAME) as any;
    return {
      cartItems: store.getCartItems(),
      discountLines: store.getDiscountLines(),
      feeLines: store.getFeeLines(),
      customerNote: store.getCustomerNote(),
      subtotal: store.getSubtotal(),
      totalDiscount: store.getTotalDiscount(),
      totalFee: store.getTotalFee(),
      totalTax: store.getTotalTax(),
      total: store.getTotal(),
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
    addDiscount,
    addFee,
    removeDiscount,
    removeFee,
    addCustomerNote,
    removeCustomerNote,
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

  const handleFeeInput = (value: number, type: 'percent' | 'fixed') => {
    addFee(value, type);
  };

  const handleAddNote = (note: string) => {
    addCustomerNote(note);
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

  return (
    <div className="flex h-full w-[35%] flex-none flex-col bg-white">
      {settings.wepos_general && (
        <div className="flex h-full flex-col">
          {/* Cart Header - Fixed Top */}
          <div className="flex flex-row justify-between gap-2.5 p-2 pt-0">
            <CustomerSearch
              ref={customerSearchRef}
              selectedCustomer={selectedCustomer}
              onCustomerSelected={handleCustomerSelected}
              className="w-full"
            />
            <DropdownMenu>
              <DropdownMenuTrigger className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center justify-center rounded-md p-2 transition-colors outline-none">
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={clearCart}>
                  {__('Empty Cart', 'wepos')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowHelp(true)}>
                  {__('Help', 'wepos')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() =>
                    (window.location.href = (window as any).wepos?.logout_url)
                  }
                >
                  {__('Logout', 'wepos')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Cart Content - Scrollable Middle */}
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-0">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th
                      className="border-b border-gray-200 bg-gray-50 p-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
                      style={{ width: '20%' }}
                    >
                      {__('Qty', 'wepos')}
                    </th>
                    <th
                      className="border-b border-gray-200 bg-gray-50 p-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
                      style={{ width: '40%' }}
                    >
                      {__('Name', 'wepos')}
                    </th>
                    <th
                      className="border-b border-gray-200 bg-gray-50 p-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
                      style={{ width: '15%' }}
                    >
                      {__('Price', 'wepos')}
                    </th>
                    <th
                      className="border-b border-gray-200 bg-gray-50 p-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
                      style={{ width: '15%' }}
                    >
                      {__('Total', 'wepos')}
                    </th>
                    <th
                      className="border-b border-gray-200 bg-gray-50 p-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
                      style={{ width: '10%' }}
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.length > 0 ? (
                    cartItems.map((item: POSCartItem, index: number) => (
                      <React.Fragment key={item.id}>
                        <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                          {/* QTY Column */}
                          <td className="p-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="h-8 w-8 rounded border-none bg-gray-100 text-gray-600 hover:bg-gray-200"
                                onClick={() => removeQuantity(item, index)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="h-8 w-8 rounded border-none bg-gray-100 text-gray-600 hover:bg-gray-200"
                                onClick={() => addQuantity(item, index)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>

                          {/* NAME Column */}
                          <td className="p-3 text-sm">
                            <div className="font-medium text-gray-800">
                              {item.name}
                            </div>
                            {item.attribute &&
                              item.attribute.length > 0 &&
                              item.type === 'variable' && (
                                <div className="mt-1 text-xs text-gray-500">
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

                          {/* PRICE Column */}
                          <td className="p-3 text-sm text-gray-600">
                            {item.on_sale ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-red-600">
                                  {formatPrice(item.sale_price)}
                                </span>
                                <span className="text-xs text-gray-400 line-through">
                                  {formatPrice(item.regular_price)}
                                </span>
                              </div>
                            ) : (
                              <span>{formatPrice(item.regular_price)}</span>
                            )}
                          </td>

                          {/* TOTAL Column */}
                          <td className="p-3 text-sm font-bold text-gray-800">
                            {formatPrice(
                              item.quantity *
                                (item.on_sale
                                  ? item.sale_price
                                  : item.regular_price),
                            )}
                          </td>

                          {/* Delete Column */}
                          <td className="p-3 text-right text-sm">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="flex h-8 w-8 items-center justify-center rounded-full border-none bg-red-500 p-0 text-white hover:bg-red-600"
                              onClick={() => handleRemoveItem(index)}
                              title={__('Remove item', 'wepos')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-16 text-center text-gray-400"
                      >
                        <div className="flex flex-col items-center">
                          <ShoppingCart className="mb-4 h-16 w-16 text-gray-300" />
                          <p className="text-gray-500">
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
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="bg-gray-50/50">
              {/* Subtotal */}
              <div className="flex items-center justify-between border-b border-gray-100 p-4">
                <div className="font-medium text-gray-700">
                  {__('Subtotal', 'wepos')}
                  {settings.woo_tax?.wc_tax_display_cart === 'incl' &&
                    totalTax > 0 && (
                      <span className="block text-xs font-normal text-gray-500">
                        {__('Including Tax', 'wepos')}
                      </span>
                    )}
                </div>
                <div className="font-bold text-gray-800">
                  {formatPrice(subtotal)}
                </div>
              </div>

              {/* Discount Lines */}
              {discountLines.map((discount: any, index: number) => (
                <div
                  key={`discount-${index}`}
                  className="flex items-center border-b border-gray-100 p-4"
                >
                  <div className="flex-1 font-medium text-gray-700">
                    {__('Discount', 'wepos')}
                    <span className="ml-2 text-xs text-gray-500">
                      {discount.discount_type === 'percent'
                        ? `${discount.value}%`
                        : formatPrice(discount.value)}
                    </span>
                  </div>
                  <div className="font-bold text-green-600">
                    −{formatPrice(getDiscountAmount(discount))}
                  </div>
                  <div className="ml-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
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
                  className="flex items-center border-b border-gray-100 p-4"
                >
                  <div className="flex-1 font-medium text-gray-700">
                    {__('Fee', 'wepos')}
                    <span className="ml-2 text-xs text-gray-500">
                      {fee.fee_type === 'percent'
                        ? `${fee.value}%`
                        : formatPrice(fee.value)}
                    </span>
                  </div>
                  <div className="font-bold text-gray-800">
                    {formatPrice(getFeeAmount(fee))}
                  </div>
                  <div className="ml-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      onClick={() => removeFee(index)}
                      title={__('Remove fee', 'wepos')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Tax */}
              {totalTax > 0 && (
                <div className="flex items-center justify-between border-b border-gray-100 p-4">
                  <div className="font-medium text-gray-700">
                    {settings.woo_tax?.wc_tax_display_cart === 'incl'
                      ? __('Fee Tax', 'wepos')
                      : __('Tax', 'wepos')}
                  </div>
                  <div className="font-bold text-gray-800">
                    {formatPrice(totalTax)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-b border-gray-100 p-4">
                <div className="flex flex-wrap gap-2">
                  <FeeKeypad
                    ref={discountRef}
                    name={__('Discount', 'wepos')}
                    onInputFee={handleDiscountInput}
                    isDiscount={true}
                  />
                  <FeeKeypad
                    ref={feeRef}
                    name={__('Fee', 'wepos')}
                    onInputFee={handleFeeInput}
                    isDiscount={false}
                  />
                  {!customerNote && (
                    <CustomerNote ref={noteRef} onAddNote={handleAddNote} />
                  )}
                </div>
              </div>

              {/* Customer Note */}
              {customerNote && (
                <div className="flex items-center border-b border-gray-100 p-4">
                  <div className="flex-1 text-sm text-gray-600">
                    <span className="font-medium">
                      {__('Note:', 'wepos')}{' '}
                    </span>
                    {customerNote}
                  </div>
                  <div className="ml-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      onClick={removeCustomerNote}
                      title={__('Remove note', 'wepos')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between p-4">
                <div className="text-lg font-bold text-gray-800">
                  {__('Total', 'wepos')}
                </div>
                <div className="text-primary text-xl font-bold">
                  {formatPrice(total)}
                </div>
              </div>
            </div>

            <Button
              className="h-14 w-full rounded-none text-lg font-bold"
              onClick={onInitPayment}
            >
              {__('Checkout', 'wepos')} • {formatPrice(total)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export default Cart;
