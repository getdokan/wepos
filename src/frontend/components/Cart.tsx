import React from 'react';
import { __ } from '@wordpress/i18n';
import {
  Plus,
  MoreVertical,
  ChevronRight,
  X,
  ShoppingCart,
} from 'lucide-react';
import {
  POSCartData,
  POSOrderData,
  POSSettings,
  POSCartItem,
  Customer,
} from '../types';
import CustomerSearch from './CustomerSearch';

interface CartProps {
  cartData: POSCartData;
  orderData: POSOrderData;
  settings: POSSettings;
  showQuickMenu: boolean;
  selectedCustomer?: Customer | null;
  onCustomerSelected: (customer: Customer | null) => void;
  onShowQuickMenuToggle: (show: boolean) => void;
  onUpdateCartItem: (index: number, updatedItem: Partial<POSCartItem>) => void;
  onRemoveItem: (index: number) => void;
  onEmptyCart: () => void;
  onShowHelp: () => void;
  onInitPayment: () => void;
  formatPrice: (amount: number | string | undefined | null) => string;
  getSubtotal: () => number;
  getTotalTax: () => number;
  getTotal: () => number;
}

const Cart: React.FC<CartProps> = ({
  cartData,
  orderData,
  settings,
  showQuickMenu,
  selectedCustomer,
  onCustomerSelected,
  onShowQuickMenuToggle,
  onUpdateCartItem,
  onRemoveItem,
  onEmptyCart,
  onShowHelp,
  onInitPayment,
  formatPrice,
  getSubtotal,
  getTotalTax,
  getTotal,
}) => {
  const toggleEditQuantity = (item: POSCartItem, index: number) => {
    onUpdateCartItem(index, { editQuantity: !item.editQuantity });
  };

  const addQuantity = (item: POSCartItem, index: number) => {
    onUpdateCartItem(index, { quantity: item.quantity + 1 });
  };

  const removeQuantity = (item: POSCartItem, index: number) => {
    if (item.quantity > 1) {
      onUpdateCartItem(index, { quantity: item.quantity - 1 });
    }
  };

  return (
    <div className="wepos-content-cart">
      {settings.wepos_general && (
        <div className="wepos-cart-panel">
          {/* Cart Header */}
          <div className="wepos-cart-header">
            <div className="flex items-start gap-3">
              <CustomerSearch
                selectedCustomer={selectedCustomer}
                onCustomerSelected={onCustomerSelected}
              />

              <div className="relative flex-shrink-0">
                <button
                  className="wepos-button rounded-lg bg-gray-100 p-2 hover:bg-gray-200"
                  onClick={() => onShowQuickMenuToggle(!showQuickMenu)}
                  type="button"
                  title={__('More options', 'wepos')}
                >
                  <span className="text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </span>
                </button>
                {showQuickMenu && (
                  <div className="wepos-dropdown-menu">
                    <ul>
                      <li>
                        <a href="#" onClick={onEmptyCart}>
                          {__('Empty Cart', 'wepos')}
                        </a>
                      </li>
                      <li>
                        <a href="#" onClick={onShowHelp}>
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

          {/* Cart Content - Scrollable */}
          <div className="wepos-cart-content">
            <table className="wepos-cart-table">
              <thead>
                <tr>
                  <th className="wepos-cart-th" style={{ width: '50%' }}>
                    {__('Product', 'wepos')}
                  </th>
                  <th className="wepos-cart-th" style={{ width: '15%' }}>
                    {__('Qty', 'wepos')}
                  </th>
                  <th className="wepos-cart-th" style={{ width: '25%' }}>
                    {__('Price', 'wepos')}
                  </th>
                  <th className="wepos-cart-th" style={{ width: '5%' }}></th>
                  <th className="wepos-cart-th" style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {cartData.line_items.length > 0 ? (
                  cartData.line_items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <tr className="transition-colors hover:bg-gray-50">
                        <td
                          className="wepos-cart-td cursor-pointer"
                          onClick={() => toggleEditQuantity(item, index)}
                        >
                          <div className="font-medium text-gray-800">
                            {item.name}
                          </div>
                          {item.attribute &&
                            item.attribute.length > 0 &&
                            item.type === 'variable' && (
                              <div className="mt-1 text-xs text-gray-600">
                                {item.attribute.map((attr, attrIndex) => (
                                  <span
                                    key={attrIndex}
                                    className="mr-2 inline-block"
                                  >
                                    <span className="font-medium text-gray-500">
                                      {attr.name}:
                                    </span>
                                    <span className="ml-1">{attr.option}</span>
                                    {attrIndex < item.attribute.length - 1 && (
                                      <span className="mx-1">•</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                        </td>
                        <td
                          className="wepos-cart-td cursor-pointer"
                          onClick={() => toggleEditQuantity(item, index)}
                        >
                          <span className="inline-block min-w-8 rounded bg-gray-100 px-2 py-1 text-center font-medium">
                            {item.quantity}
                          </span>
                        </td>
                        <td
                          className="wepos-cart-td cursor-pointer"
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
                              {formatPrice(item.quantity * item.regular_price)}
                            </span>
                          )}
                        </td>
                        <td className="wepos-cart-td">
                          <button
                            className={`p-1 transition-transform duration-200 ${item.editQuantity ? 'rotate-90' : ''}`}
                            onClick={() => toggleEditQuantity(item, index)}
                            type="button"
                            title={__('Edit quantity', 'wepos')}
                          >
                            <ChevronRight className="text-wepos-primary h-4 w-4" />
                          </button>
                        </td>
                        <td className="wepos-cart-td">
                          <button
                            className="p-1 text-red-500 transition-colors hover:text-red-700"
                            onClick={() => onRemoveItem(index)}
                            type="button"
                            title={__('Remove item', 'wepos')}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                      {item.editQuantity && (
                        <tr className="bg-gray-50">
                          <td colSpan={5} className="wepos-cart-td">
                            <div className="flex items-center gap-3 py-2">
                              <span className="text-sm font-medium">
                                {__('Quantity:', 'wepos')}
                              </span>
                              <div className="wepos-update-quantity-wrap">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    onUpdateCartItem(index, {
                                      quantity: parseInt(e.target.value) || 1,
                                    });
                                  }}
                                />
                              </div>
                              <div className="wepos-qty-action">
                                <a
                                  href="#"
                                  className="add"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    addQuantity(item, index);
                                  }}
                                >
                                  +
                                </a>
                                <a
                                  href="#"
                                  className="minus"
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
                    <td colSpan={5} className="wepos-no-item">
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

          {/* Cart Footer - Fixed Bottom */}
          <div className="wepos-cart-footer">
            <div className="wepos-cart-calculation">
              <table className="wepos-calculation-table">
                <tbody>
                  <tr>
                    <td className="wepos-calculation-td">
                      <div className="font-medium text-gray-700">
                        {__('Subtotal', 'wepos')}
                        {settings.woo_tax?.wc_tax_display_cart === 'incl' &&
                          getTotalTax() > 0 && (
                            <span className="block text-xs font-normal text-gray-500">
                              {__('Including Tax', 'wepos')}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="wepos-calculation-td text-right font-bold text-gray-800">
                      {formatPrice(getSubtotal())}
                    </td>
                  </tr>

                  {getTotalTax() > 0 && (
                    <tr>
                      <td className="wepos-calculation-td font-medium text-gray-700">
                        {settings.woo_tax?.wc_tax_display_cart === 'incl'
                          ? __('Fee Tax', 'wepos')
                          : __('Tax', 'wepos')}
                      </td>
                      <td className="wepos-calculation-td text-right font-bold text-gray-800">
                        {formatPrice(getTotalTax())}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="wepos-calculation-td">
                      <div className="text-lg font-bold text-gray-800">
                        {__('Total', 'wepos')}
                      </div>
                    </td>
                    <td className="wepos-calculation-td text-wepos-primary text-right text-xl font-bold">
                      {formatPrice(getTotal())}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="wepos-pay-now" onClick={onInitPayment}>
              {__('Checkout', 'wepos')} • {formatPrice(getTotal())}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
