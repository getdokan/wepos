import React from 'react';
import { POSCartData, POSGateway, POSCartItem } from '../types';

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
    <div className="wepos-modal-overlay" onClick={onBackToSale}>
      <div className="wepos-modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="wepos-checkout-wrapper">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
            <button
              onClick={onBackToSale}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="wepos-checkout-content">
            <div className="wepos-checkout-left">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
                <div className="space-y-3">
                  {cartData.line_items.map((item: POSCartItem) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{item.name}</div>
                        <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        {item.on_sale ? (
                          <div>
                            <div className="text-red-600 font-medium">{formatPrice(item.quantity * item.sale_price)}</div>
                            <div className="text-gray-400 line-through text-xs">{formatPrice(item.quantity * item.regular_price)}</div>
                          </div>
                        ) : (
                          <div className="font-medium">{formatPrice(item.quantity * item.regular_price)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 mt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-wepos-primary">{formatPrice(getTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Payment Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableGateways.length > 0 ? (
                    availableGateways.map((gateway) => (
                      <label key={gateway.id} className="wepos-payment-gateway">
                        <input
                          type="radio"
                          name="gateway"
                          value={gateway.id}
                          checked={selectedGateway === gateway.id}
                          onChange={(e) => onGatewayChange(e.target.value)}
                        />
                        <span className="font-medium">
                          {gateway.title}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-2 text-center py-4">No payment methods available</p>
                  )}
                </div>
              </div>

              {selectedGateway === 'wepos_cash' && (
                <div>
                  <h4 className="text-md font-semibold mb-3 text-gray-800">Cash Payment</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount Received
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">$</span>
                        <input
                          id="input-cash-amount"
                          type="text"
                          value={cashAmount}
                          onChange={(e) => onCashAmountChange(e.target.value)}
                          ref={cashAmountRef}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wepos-primary focus:border-transparent text-lg"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded border">
                      <span className="font-medium text-gray-700">Change Due:</span>
                      <span className={`font-bold text-lg ${changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPrice(changeAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="wepos-checkout-footer">
            <button
              className="wepos-button wepos-btn-back"
              onClick={onBackToSale}
              type="button"
            >
              Back to Sale
            </button>
            <button
              className={`wepos-button wepos-btn-process ${!ableToProcess ? 'disabled' : ''}`}
              onClick={onProcessPayment}
              disabled={!ableToProcess}
              type="button"
            >
              Process Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
