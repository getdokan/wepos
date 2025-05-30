import React from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
  Plus,
  MoreVertical,
  ChevronRight,
  X,
  ShoppingCart,
} from 'lucide-react';
import { POSCartItem, Customer } from '../types';
import CustomerSearch from './CustomerSearch';
import FeeKeypad from './FeeKeypad';
import CustomerNote from './CustomerNote';
import { formatPrice } from '../utils/helpers';
import { CART_STORE_NAME } from '../store/cart';
import { PRODUCTS_STORE_NAME } from '../store/products';

interface CartProps {
  showQuickMenu: boolean;
  selectedCustomer?: Customer | null;
  onCustomerSelected: (customer: Customer | null) => void;
  onShowQuickMenuToggle: (show: boolean) => void;
  onEmptyCart: () => void;
  onShowHelp: () => void;
  onInitPayment: () => void;
}

const Cart: React.FC<CartProps> = ({
  showQuickMenu,
  selectedCustomer,
  onCustomerSelected,
  onShowQuickMenuToggle,
  onEmptyCart,
  onShowHelp,
  onInitPayment,
}) => {
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

  const toggleEditQuantity = (item: POSCartItem, index: number) => {
    updateCartItem(index, { editQuantity: !item.editQuantity });
  };

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

  const handleEmptyCart = () => {
    clearCart();
    onEmptyCart();
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
    <div className="shadow-wepos flex w-full flex-col bg-white md:h-screen md:w-96">
      {settings.wepos_general && (
        <div className="flex h-full flex-col">
          {/* Cart Header - Fixed Top */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <CustomerSearch
                selectedCustomer={selectedCustomer}
                onCustomerSelected={onCustomerSelected}
              />

              <div className="relative flex-shrink-0">
                <button
                  className="rounded-lg border border-transparent bg-gray-100 px-4 py-2 font-medium transition-all duration-200 hover:bg-gray-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                  onClick={() => onShowQuickMenuToggle(!showQuickMenu)}
                  type="button"
                  title={__('More options', 'wepos')}
                >
                  <span className="text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </span>
                </button>
                {showQuickMenu && (
                  <div className="absolute top-full right-0 z-20 mt-2 min-w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    <ul className="list-none">
                      <li>
                        <a
                          href="#"
                          onClick={handleEmptyCart}
                          className="block cursor-pointer px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          {__('Empty Cart', 'wepos')}
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          onClick={onShowHelp}
                          className="block cursor-pointer px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          {__('Help', 'wepos')}
                        </a>
                      </li>
                      <li className="my-1 border-t border-gray-200"></li>
                      <li>
                        <a
                          href="#"
                          onClick={() =>
                            (window.location.href = (
                              window as any
                            ).wepos?.logout_url)
                          }
                          className="block cursor-pointer px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          {__('Logout', 'wepos')}
                        </a>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart Content - Scrollable Middle */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th
                      className="border-b border-gray-200 bg-gray-50 p-3 text-left text-sm font-semibold text-gray-700"
                      style={{ width: '50%' }}
                    >
                      {__('Product', 'wepos')}
                    </th>
                    <th
                      className="border-b border-gray-200 bg-gray-50 p-3 text-left text-sm font-semibold text-gray-700"
                      style={{ width: '15%' }}
                    >
                      {__('Qty', 'wepos')}
                    </th>
                    <th
                      className="border-b border-gray-200 bg-gray-50 p-3 text-left text-sm font-semibold text-gray-700"
                      style={{ width: '25%' }}
                    >
                      {__('Price', 'wepos')}
                    </th>
                    <th
                      className="border-b border-gray-200 bg-gray-50 p-3 text-left text-sm font-semibold text-gray-700"
                      style={{ width: '5%' }}
                    ></th>
                    <th
                      className="border-b border-gray-200 bg-gray-50 p-3 text-left text-sm font-semibold text-gray-700"
                      style={{ width: '5%' }}
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.length > 0 ? (
                    cartItems.map((item: POSCartItem, index: number) => (
                      <React.Fragment key={item.id}>
                        <tr className="transition-colors hover:bg-gray-50">
                          <td
                            className="cursor-pointer border-b border-gray-100 p-3 text-sm"
                            onClick={() => toggleEditQuantity(item, index)}
                          >
                            <div className="font-medium text-gray-800">
                              {item.name}
                            </div>
                            {item.attribute &&
                              item.attribute.length > 0 &&
                              item.type === 'variable' && (
                                <div className="mt-1 text-xs text-gray-600">
                                  {item.attribute.map(
                                    (attr: any, attrIndex: number) => (
                                      <span
                                        key={attrIndex}
                                        className="mr-2 inline-block"
                                      >
                                        <span className="font-medium text-gray-500">
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
                          <td
                            className="cursor-pointer border-b border-gray-100 p-3 text-sm"
                            onClick={() => toggleEditQuantity(item, index)}
                          >
                            <span className="inline-block min-w-8 rounded bg-gray-100 px-2 py-1 text-center font-medium">
                              {item.quantity}
                            </span>
                          </td>
                          <td
                            className="cursor-pointer border-b border-gray-100 p-3 text-sm"
                            onClick={() => toggleEditQuantity(item, index)}
                          >
                            {item.on_sale ? (
                              <div className="space-y-1">
                                <div className="font-semibold text-red-600">
                                  {formatPrice(item.quantity * item.sale_price)}
                                </div>
                                <div className="text-xs text-gray-400 line-through">
                                  {formatPrice(
                                    item.quantity * item.regular_price,
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="font-semibold text-gray-800">
                                {formatPrice(
                                  item.quantity * item.regular_price,
                                )}
                              </span>
                            )}
                          </td>
                          <td className="border-b border-gray-100 p-3 text-sm">
                            <button
                              className={`p-1 transition-transform duration-200 ${item.editQuantity ? 'rotate-90' : ''}`}
                              onClick={() => toggleEditQuantity(item, index)}
                              type="button"
                              title={__('Edit quantity', 'wepos')}
                            >
                              <ChevronRight className="text-wepos-primary h-4 w-4" />
                            </button>
                          </td>
                          <td className="border-b border-gray-100 p-3 text-sm">
                            <button
                              className="p-1 text-red-500 transition-colors hover:text-red-700"
                              onClick={() => handleRemoveItem(index)}
                              type="button"
                              title={__('Remove item', 'wepos')}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                        {item.editQuantity && (
                          <tr className="bg-gray-50">
                            <td
                              colSpan={5}
                              className="border-b border-gray-100 p-3 text-sm"
                            >
                              <div className="flex items-center gap-3 py-2">
                                <span className="text-sm font-medium">
                                  {__('Quantity:', 'wepos')}
                                </span>
                                <div>
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      updateCartItem(index, {
                                        quantity: parseInt(e.target.value) || 1,
                                      });
                                    }}
                                    className="focus:ring-wepos-primary/20 focus:border-wepos-primary w-16 rounded border border-gray-300 px-2 py-1 text-center focus:ring-2"
                                  />
                                </div>
                                <div className="flex gap-1">
                                  <a
                                    href="#"
                                    className="bg-wepos-primary hover:bg-wepos-primary-hover border-wepos-primary h-8 w-8 cursor-pointer rounded text-center leading-8 text-white transition-colors select-none"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      addQuantity(item, index);
                                    }}
                                  >
                                    +
                                  </a>
                                  <a
                                    href="#"
                                    className="h-8 w-8 cursor-pointer rounded border border-gray-300 bg-gray-100 text-center leading-8 text-gray-600 transition-colors select-none hover:bg-gray-200"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      removeQuantity(item, index);
                                    }}
                                  >
                                    -
                                  </a>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
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
          </div>

          {/* Cart Footer - Fixed Bottom */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="bg-gray-50/50">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border-b border-gray-100 p-4 last:border-b-0">
                      <div className="font-medium text-gray-700">
                        {__('Subtotal', 'wepos')}
                        {settings.woo_tax?.wc_tax_display_cart === 'incl' &&
                          totalTax > 0 && (
                            <span className="block text-xs font-normal text-gray-500">
                              {__('Including Tax', 'wepos')}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="border-b border-gray-100 p-4 text-right font-bold text-gray-800 last:border-b-0">
                      {formatPrice(subtotal)}
                    </td>
                  </tr>

                  {/* Discount Lines */}
                  {discountLines.map((discount: any, index: number) => (
                    <tr key={`discount-${index}`}>
                      <td className="border-b border-gray-100 p-4 font-medium text-gray-700 last:border-b-0">
                        {__('Discount', 'wepos')}
                        <span className="ml-2 text-xs text-gray-500">
                          {discount.discount_type === 'percent'
                            ? `${discount.value}%`
                            : formatPrice(discount.value)}
                        </span>
                      </td>
                      <td className="border-b border-gray-100 p-4 text-right font-bold text-green-600 last:border-b-0">
                        −{formatPrice(getDiscountAmount(discount))}
                      </td>
                      <td className="border-b border-gray-100 p-2 last:border-b-0">
                        <button
                          className="p-1 text-red-500 transition-colors hover:text-red-700"
                          onClick={() => removeDiscount(index)}
                          type="button"
                          title={__('Remove discount', 'wepos')}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Fee Lines */}
                  {feeLines.map((fee: any, index: number) => (
                    <tr key={`fee-${index}`}>
                      <td className="border-b border-gray-100 p-4 font-medium text-gray-700 last:border-b-0">
                        {__('Fee', 'wepos')}
                        <span className="ml-2 text-xs text-gray-500">
                          {fee.fee_type === 'percent'
                            ? `${fee.value}%`
                            : formatPrice(fee.value)}
                        </span>
                      </td>
                      <td className="border-b border-gray-100 p-4 text-right font-bold text-gray-800 last:border-b-0">
                        {formatPrice(getFeeAmount(fee))}
                      </td>
                      <td className="border-b border-gray-100 p-2 last:border-b-0">
                        <button
                          className="p-1 text-red-500 transition-colors hover:text-red-700"
                          onClick={() => removeFee(index)}
                          type="button"
                          title={__('Remove fee', 'wepos')}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {totalTax > 0 && (
                    <tr>
                      <td className="border-b border-gray-100 p-4 font-medium text-gray-700 last:border-b-0">
                        {settings.woo_tax?.wc_tax_display_cart === 'incl'
                          ? __('Fee Tax', 'wepos')
                          : __('Tax', 'wepos')}
                      </td>
                      <td className="border-b border-gray-100 p-4 text-right font-bold text-gray-800 last:border-b-0">
                        {formatPrice(totalTax)}
                      </td>
                      <td className="border-b border-gray-100 p-2 last:border-b-0"></td>
                    </tr>
                  )}

                  {/* Action Buttons Row */}
                  <tr>
                    <td
                      colSpan={3}
                      className="border-b border-gray-100 p-4 last:border-b-0"
                    >
                      <div className="flex flex-wrap gap-2">
                        <FeeKeypad
                          name={__('Discount', 'wepos')}
                          onInputFee={handleDiscountInput}
                          isDiscount={true}
                        />
                        <FeeKeypad
                          name={__('Fee', 'wepos')}
                          onInputFee={handleFeeInput}
                          isDiscount={false}
                        />
                        {!customerNote && (
                          <CustomerNote onAddNote={handleAddNote} />
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Customer Note Row */}
                  {customerNote && (
                    <tr>
                      <td
                        colSpan={2}
                        className="border-b border-gray-100 p-4 text-sm text-gray-600 last:border-b-0"
                      >
                        <span className="font-medium">
                          {__('Note:', 'wepos')}{' '}
                        </span>
                        {customerNote}
                      </td>
                      <td className="border-b border-gray-100 p-2 last:border-b-0">
                        <button
                          className="p-1 text-red-500 transition-colors hover:text-red-700"
                          onClick={removeCustomerNote}
                          type="button"
                          title={__('Remove note', 'wepos')}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="border-b border-gray-100 p-4 last:border-b-0">
                      <div className="text-lg font-bold text-gray-800">
                        {__('Total', 'wepos')}
                      </div>
                    </td>
                    <td className="text-wepos-primary border-b border-gray-100 p-4 text-right text-xl font-bold last:border-b-0">
                      {formatPrice(total)}
                    </td>
                    <td className="border-b border-gray-100 last:border-b-0"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              className="bg-wepos-primary hover:bg-wepos-primary-hover cursor-pointer px-6 py-4 text-center text-lg font-bold text-white transition-colors duration-200"
              onClick={onInitPayment}
            >
              {__('Checkout', 'wepos')} • {formatPrice(total)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
