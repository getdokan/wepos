import React from 'react';
import { __ } from '@wordpress/i18n';
import { POSCartData, POSOrderData, POSSettings, POSCartItem } from '../types';

interface CartProps {
  cartData: POSCartData;
  orderData: POSOrderData;
  settings: POSSettings;
  showQuickMenu: boolean;
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
            <div className="flex items-center gap-3 mb-4">
              <div className="wepos-customer-search">
                <input
                  type="text"
                  id="customer-search"
                  placeholder={__('Walk-in Customer', 'wepos')}
                  className="wepos-input pr-10"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-wepos-primary cursor-pointer hover:text-wepos-primary-hover transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </div>

              <div className="relative">
                <div className="more-options">
                  <button
                    className="wepos-button bg-gray-100 hover:bg-gray-200 p-2 rounded-lg"
                    onClick={() => onShowQuickMenuToggle(!showQuickMenu)}
                    type="button"
                    title={__('More options', 'wepos')}
                  >
                    <span className="text-gray-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </span>
                  </button>
                  {showQuickMenu && (
                    <div className="wepos-dropdown-menu">
                      <ul>
                        <li><a href="#" onClick={onEmptyCart}>{__('Empty Cart', 'wepos')}</a></li>
                        <li><a href="#" onClick={onShowHelp}>{__('Help', 'wepos')}</a></li>
                        <li className="border-t border-gray-200 my-1"></li>
                        <li>
                          <a href="#" onClick={() => window.location.href = (window as any).wepos?.logout_url}>
                            {__('Logout', 'wepos')}
                          </a>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 font-medium">
              {__('New Order', 'wepos')}
            </div>
          </div>

          {/* Cart Content - Scrollable */}
          <div className="wepos-cart-content">
            <table className="wepos-cart-table">
              <thead>
                <tr>
                  <th className="wepos-cart-th" style={{ width: '50%' }}>{__('Product', 'wepos')}</th>
                  <th className="wepos-cart-th" style={{ width: '15%' }}>{__('Qty', 'wepos')}</th>
                  <th className="wepos-cart-th" style={{ width: '25%' }}>{__('Price', 'wepos')}</th>
                  <th className="wepos-cart-th" style={{ width: '5%' }}></th>
                  <th className="wepos-cart-th" style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {cartData.line_items.length > 0 ? (
                  cartData.line_items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="wepos-cart-td cursor-pointer" onClick={() => toggleEditQuantity(item, index)}>
                          <div className="font-medium text-gray-800">{item.name}</div>
                          {item.attribute && item.attribute.length > 0 && item.type === 'variable' && (
                            <div className="mt-1 text-xs text-gray-600">
                              {item.attribute.map((attr, attrIndex) => (
                                <span key={attrIndex} className="inline-block mr-2">
                                  <span className="font-medium text-gray-500">{attr.name}:</span>
                                  <span className="ml-1">{attr.option}</span>
                                  {attrIndex < item.attribute.length - 1 && <span className="mx-1">•</span>}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="wepos-cart-td cursor-pointer" onClick={() => toggleEditQuantity(item, index)}>
                          <span className="bg-gray-100 px-2 py-1 rounded text-center min-w-8 inline-block font-medium">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="wepos-cart-td cursor-pointer" onClick={() => toggleEditQuantity(item, index)}>
                          {item.on_sale ? (
                            <div className="space-y-1">
                              <div className="text-red-600 font-semibold">{formatPrice(item.quantity * item.sale_price)}</div>
                              <div className="text-gray-400 line-through text-xs">{formatPrice(item.quantity * item.regular_price)}</div>
                            </div>
                          ) : (
                            <span className="font-semibold text-gray-800">{formatPrice(item.quantity * item.regular_price)}</span>
                          )}
                        </td>
                        <td className="wepos-cart-td">
                          <button
                            className={`p-1 transition-transform duration-200 ${item.editQuantity ? 'rotate-90' : ''}`}
                            onClick={() => toggleEditQuantity(item, index)}
                            type="button"
                            title={__('Edit quantity', 'wepos')}
                          >
                            <svg className="w-4 h-4 text-wepos-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                        <td className="wepos-cart-td">
                          <button
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            onClick={() => onRemoveItem(index)}
                            type="button"
                            title={__('Remove item', 'wepos')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      {item.editQuantity && (
                        <tr className="bg-gray-50">
                          <td colSpan={5} className="wepos-cart-td">
                            <div className="flex items-center gap-3 py-2">
                              <span className="text-sm font-medium">{__('Quantity:', 'wepos')}</span>
                              <div className="wepos-update-quantity-wrap">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    onUpdateCartItem(index, { quantity: parseInt(e.target.value) || 1 });
                                  }}
                                />
                              </div>
                              <div className="wepos-qty-action">
                                <a href="#" className="add" onClick={(e) => { e.preventDefault(); addQuantity(item, index); }}>+</a>
                                <a href="#" className="minus" onClick={(e) => { e.preventDefault(); removeQuantity(item, index); }}>-</a>
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
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                        </svg>
                        <p className="text-gray-500">{__('Empty Cart', 'wepos')}</p>
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
                      <div className="text-gray-700 font-medium">
                        {__('Subtotal', 'wepos')}
                        {settings.woo_tax?.wc_tax_display_cart === 'incl' && getTotalTax() > 0 && (
                          <span className="text-xs text-gray-500 block font-normal">{__('Including Tax', 'wepos')}</span>
                        )}
                      </div>
                    </td>
                    <td className="wepos-calculation-td text-right font-bold text-gray-800">
                      {formatPrice(getSubtotal())}
                    </td>
                  </tr>

                  {getTotalTax() > 0 && (
                    <tr>
                      <td className="wepos-calculation-td text-gray-700 font-medium">
                        {settings.woo_tax?.wc_tax_display_cart === 'incl' ? __('Fee Tax', 'wepos') : __('Tax', 'wepos')}
                      </td>
                      <td className="wepos-calculation-td text-right font-bold text-gray-800">
                        {formatPrice(getTotalTax())}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="wepos-calculation-td">
                      <div className="text-lg font-bold text-gray-800">{__('Total', 'wepos')}</div>
                    </td>
                    <td className="wepos-calculation-td text-right text-xl font-bold text-wepos-primary">
                      {formatPrice(getTotal())}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              className="wepos-pay-now"
              onClick={onInitPayment}
            >
              {__('Checkout', 'wepos')} • {formatPrice(getTotal())}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
