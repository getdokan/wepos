import React, { useEffect } from 'react';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { POSGateway } from '../types';
import { formatPrice } from '../utils/helpers';
import { CART_STORE_NAME } from '../store/cart';
import { PRODUCTS_STORE_NAME } from '../store/products';

interface PaymentModalProps {
  show: boolean;
  selectedGateway: string;
  cashAmount: string;
  ableToProcess: boolean;
  onGatewayChange: (gateway: string) => void;
  onCashAmountChange: (amount: string) => void;
  onBackToSale: () => void;
  onProcessPayment: () => void;
  changeAmount: number;
  cashAmountRef: React.RefObject<HTMLInputElement>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  selectedGateway,
  cashAmount,
  ableToProcess,
  onGatewayChange,
  onCashAmountChange,
  onBackToSale,
  onProcessPayment,
  changeAmount,
  cashAmountRef,
}) => {
  // Get cart data from cart store
  const { total } = useSelect((select) => {
    const store = select(CART_STORE_NAME) as any;
    return {
      total: store.getTotal(),
    };
  }, []);

  // Get gateways from products store
  const { availableGateways } = useSelect((select) => {
    const store = select(PRODUCTS_STORE_NAME) as any;
    return {
      availableGateways: store.getGateways(),
    };
  }, []);

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
      <div className="p-6">
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                {__('Payment Methods', 'wepos')}
              </h3>

              <div className="space-y-3">
                {availableGateways.map((gateway: POSGateway) => (
                  <label
                    key={gateway.id}
                    className="hover:border-primary/50 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10 flex cursor-pointer items-center rounded-lg border border-gray-200 p-4 transition-all duration-200"
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={gateway.id}
                      checked={selectedGateway === gateway.id}
                      onChange={(e) => onGatewayChange(e.target.value)}
                      className="accent-primary mr-3"
                    />
                    <span className="font-medium text-gray-700">
                      {gateway.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {selectedGateway === 'wepos_cash' && (
              <div className="mb-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  {__('Cash Payment', 'wepos')}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {__('Amount Received', 'wepos')}
                    </label>
                    <input
                      ref={cashAmountRef}
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashAmount}
                      onChange={(e) => onCashAmountChange(e.target.value)}
                      className="focus:ring-primary/20 focus:border-primary h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-xl font-bold transition-colors focus:ring-2"
                      placeholder={formatPrice(total)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {__('Quick Amount', 'wepos')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(() => {
                        const quickAmounts: number[] = [];

                        // Add exact amount
                        quickAmounts.push(total);

                        // Add rounded up amounts
                        const rounded5 = Math.ceil(total / 5) * 5;
                        const rounded10 = Math.ceil(total / 10) * 10;

                        if (rounded5 > total) quickAmounts.push(rounded5);
                        if (rounded10 > total && rounded10 !== rounded5)
                          quickAmounts.push(rounded10);

                        // Add common bill denominations
                        const bills = [20, 50, 100, 200, 500];
                        bills.forEach((bill) => {
                          if (bill > total && !quickAmounts.includes(bill)) {
                            quickAmounts.push(bill);
                          }
                        });

                        // Take first 6 amounts and sort
                        return quickAmounts.slice(0, 6).sort((a, b) => a - b);
                      })().map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          className="text-primary border-primary hover:bg-primary/5 focus:ring-primary/20 rounded-lg border border-transparent bg-white px-4 py-2 text-sm font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                          onClick={() => onCashAmountChange(amount.toString())}
                        >
                          {formatPrice(amount)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {changeAmount > 0 && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-700">
                          {__('Change Due:', 'wepos')}
                        </span>
                        <span className="text-xl font-bold text-green-800">
                          {formatPrice(changeAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                {__('Order Summary', 'wepos')}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">
                    {__('Subtotal:', 'wepos')}
                  </span>
                  <span className="font-medium text-gray-800">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-300 pt-4">
                <div className="flex items-center justify-between text-xl font-bold text-gray-800">
                  <span>{__('Total:', 'wepos')}</span>
                  <span className="text-primary">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-4">
          <button
            className="rounded-lg border border-gray-200 border-transparent bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500/20 focus:ring-offset-2 focus:outline-none"
            onClick={onBackToSale}
            type="button"
          >
            {__('← Back to Sale', 'wepos')}
          </button>
          <button
            className="bg-primary hover:bg-primary-hover focus:ring-primary/20 disabled:hover:bg-primary rounded-lg border border-transparent px-4 py-2 font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onProcessPayment}
            disabled={!ableToProcess}
            type="button"
          >
            {__('Process Payment', 'wepos')} • {formatPrice(total)}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
