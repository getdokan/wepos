import React from 'react';
import { POSCartData, POSOrderData, POSSettings, POSCartItem } from '../../types';

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
    <div className="content-cart">
      <div className="top-panel">
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
              onClick={() => onShowQuickMenuToggle(!showQuickMenu)}
            >
              <span className="more-icon flaticon-more"></span>
            </button>
            {showQuickMenu && (
              <div className="wepos-dropdown-menu">
                <ul>
                  <li><a href="#" onClick={onEmptyCart}>Empty Cart</a></li>
                  <li><a href="#" onClick={onShowHelp}>Help</a></li>
                  <li className="divider"></li>
                  <li>
                    <a href="#" onClick={() => window.location.href = (window as any).wepos?.logout_url}>
                      Logout
                    </a>
                  </li>
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
                            onClick={() => onRemoveItem(index)}
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
                                  onUpdateCartItem(index, { quantity: parseInt(e.target.value) || 1 });
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

                <tr className="pay-now" onClick={onInitPayment}>
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
  );
};

export default Cart;
