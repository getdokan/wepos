import React, { useEffect } from 'react';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { POSCartData, POSGateway, POSCartItem } from '../types';

interface PaymentModalProps {
  show: boolean;
  cartData: POSCartData;
  availableGateways: POSGateway[];
  selectedGateway: string;
  cashAmount: string;
  ableToProcess: boolean;
  onGatewayChange: (gateway: string) => void;
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
  useEffect(() => {
    if (show && selectedGateway === 'wepos_cash' && cashAmountRef.current) {
      setTimeout(() => {
        cashAmountRef.current?.focus();
      }, 300);
    }
  }, [show, selectedGateway, cashAmountRef]);

  if (!show) return null;

  return (
    <Modal
      title={__('Process Payment', 'wepos')}
      onRequestClose={onBackToSale}
      className="wepos-payment-modal"
      shouldCloseOnClickOutside={false}
      shouldCloseOnEsc={true}
      size="large"
    >
      <div className="wepos-checkout-wrapper">
        <div className="wepos-checkout-content">
          <div className="wepos-checkout-left">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {__('Payment Methods', 'wepos')}
              </h3>

              <div className="space-y-3">
                {availableGateways.map((gateway) => (
                  <label
                    key={gateway.id}
                    className="wepos-payment-gateway"
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={gateway.id}
                      checked={selectedGateway === gateway.id}
                      onChange={(e) => onGatewayChange(e.target.value)}
                    />
                    <span className="font-medium text-gray-700">{gateway.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedGateway === 'wepos_cash' && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {__('Cash Payment', 'wepos')}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {__('Amount Received', 'wepos')}
                    </label>
                    <input
                      ref={cashAmountRef}
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashAmount}
                      onChange={(e) => onCashAmountChange(e.target.value)}
                      className="wepos-input text-xl font-bold"
                      placeholder={formatPrice(getTotal())}
                    />
                  </div>

                  {changeAmount > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-green-700 font-medium">
                          {__('Change Due:', 'wepos')}
                        </span>
                        <span className="text-green-800 font-bold text-xl">
                          {formatPrice(changeAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="wepos-checkout-right">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {__('Order Summary', 'wepos')}
              </h3>

              <div className="space-y-3">
                {cartData.line_items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        {__('Qty:', 'wepos')} {item.quantity}
                      </div>
                    </div>
                    <div className="font-semibold text-gray-800">
                      {item.on_sale ?
                        formatPrice(item.quantity * item.sale_price) :
                        formatPrice(item.quantity * item.regular_price)
                      }
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-300 mt-4 pt-4">
                <div className="flex justify-between items-center text-xl font-bold text-gray-800">
                  <span>{__('Total:', 'wepos')}</span>
                  <span className="text-wepos-primary">{formatPrice(getTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="wepos-checkout-footer">
          <button
            className="wepos-button wepos-btn-back"
            onClick={onBackToSale}
            type="button"
          >
            {__('← Back to Sale', 'wepos')}
          </button>
          <button
            className="wepos-button wepos-btn-process"
            onClick={onProcessPayment}
            disabled={!ableToProcess}
            type="button"
          >
            {__('Process Payment', 'wepos')} • {formatPrice(getTotal())}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
