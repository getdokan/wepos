import React from 'react';
import { POSCartData, POSGateway, POSCartItem } from '../../types';

interface PaymentModalProps {
  show: boolean;
  cartData: POSCartData;
  availableGateways: POSGateway[];
  selectedGateway: string;
  cashAmount: string;
  ableToProcess: boolean;
  onGatewayChange: (gatewayId: string) => void;
  onCashAmountChange: (amount: string) => void;
  onBackToSale: () => void;
  onProcessPayment: () => void;
  formatPrice: (amount: number | string | undefined | null) => string;
  getTotal: () => number;
  changeAmount: number;
  cashAmountRef: React.RefObject<HTMLInputElement>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  cartData,
  availableGateways,
  selectedGateway,
  cashAmount,
  ableToProcess,
  onGatewayChange,
  onCashAmountChange,
  onBackToSale,
  onProcessPayment,
  formatPrice,
  getTotal,
  changeAmount,
  cashAmountRef,
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onBackToSale}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="wepos-checkout-wrapper">
          <div className="left-content">
            <div className="header">Sale Summary</div>
            <div className="content">
              <table className="sale-summary-cart">
                <tbody>
                  {cartData.line_items.map((item: POSCartItem) => (
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
                        onChange={(e) => onGatewayChange(e.target.value)}
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
                            onChange={(e) => onCashAmountChange(e.target.value)}
                            ref={cashAmountRef}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="change-money">
                      <p>Change money: {formatPrice(changeAmount)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="footer">
              <a href="#" className="back-btn" onClick={(e) => { e.preventDefault(); onBackToSale(); }}>
                Back to Sale
              </a>
              <button
                className={`process-checkout-btn ${!ableToProcess ? 'disabled' : ''}`}
                onClick={onProcessPayment}
                disabled={!ableToProcess}
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
