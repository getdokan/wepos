import React, { useEffect, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { LoaderCircle } from 'lucide-react';
import { POSGateway, POSCartItem, POSDiscountLine, POSFeeLine } from '../types';
import { formatPrice } from '../utils/helpers';
import { CART_STORE_NAME } from '../store/cart';
import { PRODUCTS_STORE_NAME } from '../store/products';
import {
  Modal,
  Button,
  Separator,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@wedevs/plugin-ui';

interface PaymentModalProps {
  show: boolean;
  selectedGateway: string;
  cashAmount: string;
  ableToProcess: boolean;
  processing: boolean;
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
  processing,
  onGatewayChange,
  onCashAmountChange,
  onBackToSale,
  onProcessPayment,
  changeAmount,
  cashAmountRef,
}) => {
  // Get cart data from cart store
  const { cartItems, subtotal, total, discountLines, feeLines, totalTax } =
    useSelect((select) => {
      const store = select(CART_STORE_NAME) as any;
      return {
        cartItems: store.getCartItems(),
        subtotal: store.getSubtotal(),
        total: store.getTotal(),
        discountLines: store.getDiscountLines(),
        feeLines: store.getFeeLines(),
        totalTax: store.getTotalTax(),
      };
    }, []);

  // Get gateways from products store
  const { availableGateways } = useSelect((select) => {
    const store = select(PRODUCTS_STORE_NAME) as any;
    return {
      availableGateways: store.getGateways(),
    };
  }, []);

  // Currency symbol from WordPress/WooCommerce settings
  const currencySymbol =
    (window as any).wepos?.currency_format_symbol || '$';

  // Focus cash input when modal opens
  useEffect(() => {
    if (show && selectedGateway === 'wepos_cash' && cashAmountRef.current) {
      setTimeout(() => {
        cashAmountRef.current?.focus();
      }, 300);
    }
  }, [show, selectedGateway, cashAmountRef]);

  // Handle Enter key to process payment
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onProcessPayment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onProcessPayment]);

  // Calculate empty gateway divs to fill grid to 4 columns
  const emptyGatewayCount = useMemo(() => {
    if (availableGateways.length === 0) return 0;
    return (4 - (availableGateways.length % 4)) % 4;
  }, [availableGateways.length]);

  // Get discount display text (e.g. "-10.00৳" or "-5%")
  const getDiscountDisplay = (discount: POSDiscountLine): string => {
    if (discount.discount_type === 'percent') {
      return `-${discount.value}%`;
    }
    return `-${formatPrice(discount.value)}`;
  };

  // Compute actual discount amount
  const getDiscountAmount = (discount: POSDiscountLine): number => {
    if (discount.discount_type === 'percent') {
      return (subtotal * discount.value) / 100;
    }
    return discount.value;
  };

  // Compute actual fee amount
  const getFeeAmount = (fee: POSFeeLine): number => {
    if (fee.fee_type === 'percent') {
      return (subtotal * parseFloat(fee.value)) / 100;
    }
    return parseFloat(fee.value);
  };

  // Get item price
  const getItemPrice = (item: POSCartItem): number => {
    return item.on_sale ? item.sale_price : item.regular_price;
  };

  if (!show) return null;

  return (
    <Modal
      open={show}
      onClose={onBackToSale}
      showCloseButton={true}
      closeOnOverlayClick={false}
      closeOnEscape={true}
      className="wepos-payment-modal !p-0"
      size="full"
    >
      <div className="relative flex h-[calc(100vh-2rem)]">
        {/* Processing Overlay */}
        {processing && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60">
            <LoaderCircle className="h-12 w-12 animate-spin text-gray-500" />
          </div>
        )}

        {/* Left Panel - Sale Summary */}
        <div
          className="flex flex-col bg-[#FBFCFE]"
          style={{ flex: 3 }}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-bold text-gray-900">
              {__('Sale Summary', 'wepos')}
            </h2>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto px-6 py-2">
            {cartItems.map((item: POSCartItem, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between py-3"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-gray-900">
                    {item.name}
                  </span>
                  {item.attribute && item.attribute.length > 0 && (
                    <div className="text-sm text-gray-500">
                      {item.attribute
                        .map((attr) => `${attr.name}: ${attr.option}`)
                        .join(', ')}
                    </div>
                  )}
                </div>
                <span className="mx-6 text-gray-600">{item.quantity}</span>
                <span className="whitespace-nowrap text-gray-900">
                  {formatPrice(getItemPrice(item) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            {/* Subtotal */}
            <div className="flex justify-between py-1.5">
              <span className="font-bold text-gray-900">
                {__('Subtotal', 'wepos')}
              </span>
              <span className="font-bold text-gray-900">
                {formatPrice(subtotal)}
              </span>
            </div>

            {/* Discount Lines */}
            {discountLines.map(
              (discount: POSDiscountLine, index: number) => (
                <div
                  key={`discount-${index}`}
                  className="flex justify-between py-1.5"
                >
                  <span className="text-gray-700">
                    {__('Discount', 'wepos')}{' '}
                    <span className="text-sm text-gray-500">
                      {discount.name} {getDiscountDisplay(discount)}
                    </span>
                  </span>
                  <span className="text-gray-900">
                    -{formatPrice(getDiscountAmount(discount))}
                  </span>
                </div>
              ),
            )}

            {/* Fee Lines */}
            {feeLines.map((fee: POSFeeLine, index: number) => (
              <div
                key={`fee-${index}`}
                className="flex justify-between py-1.5"
              >
                <span className="text-gray-700">
                  {__('Fee', 'wepos')}{' '}
                  <span className="text-sm text-gray-500">
                    {fee.name} {formatPrice(parseFloat(fee.value))}
                  </span>
                </span>
                <span className="text-gray-900">
                  {formatPrice(getFeeAmount(fee))}
                </span>
              </div>
            ))}

            {/* Tax */}
            {totalTax > 0 && (
              <div className="flex justify-between py-1.5">
                <span className="text-gray-700">
                  {__('Tax', 'wepos')}
                </span>
                <span className="text-gray-900">
                  {formatPrice(totalTax)}
                </span>
              </div>
            )}

            {/* Order Total */}
            <div className="mt-1 flex justify-between border-t border-gray-200 pt-2">
              <span className="font-bold text-gray-900">
                {__('Order Total', 'wepos')}
              </span>
              <span className="font-bold text-gray-900">
                {formatPrice(total)}
              </span>
            </div>

            {/* Pay */}
            <div className="flex justify-between py-1.5">
              <span className="font-bold text-gray-900">
                {__('Pay', 'wepos')}
              </span>
              <span className="font-bold text-gray-900">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>

        <Separator orientation="vertical" className="h-full" />

        {/* Right Panel - Payment */}
        <div className="flex flex-1 flex-col" style={{ flex: 6 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-12 py-8 pb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {__('Pay', 'wepos')}
            </h2>
            <span className="rounded-md border border-teal-300 bg-teal-50 px-5 py-2 text-lg font-semibold text-teal-600">
              {formatPrice(total)}
            </span>
          </div>

          {/* Payment Gateways */}
          <div className="flex flex-wrap gap-4 px-12">
            {availableGateways.map((gateway: POSGateway) => (
              <label
                key={gateway.id}
                className={`flex h-[100px] cursor-pointer items-center justify-center rounded border transition-all ${
                  selectedGateway === gateway.id
                    ? 'border-[rgba(26,188,156,0.7)] bg-[rgba(26,188,156,0.1)]'
                    : 'border-[rgba(26,188,156,0.1)] bg-[rgba(26,188,156,0.1)] hover:border-[rgba(26,188,156,0.4)]'
                }`}
                style={{ flex: '1 0 21%' }}
              >
                <input
                  type="radio"
                  name="gateway"
                  value={gateway.id}
                  checked={selectedGateway === gateway.id}
                  onChange={(e) => onGatewayChange(e.target.value)}
                  className="hidden"
                />
                <span className="text-base font-medium text-[#16a085]">
                  {gateway.title}
                </span>
              </label>
            ))}
            {/* Empty gateway placeholders to fill 4 columns */}
            {Array.from({ length: emptyGatewayCount }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex h-[100px] items-center justify-center rounded border border-gray-100"
                style={{ flex: '1 0 21%' }}
              />
            ))}
          </div>

          {/* Cash Payment Section */}
          {selectedGateway === 'wepos_cash' && (
            <div className="mx-12 mt-6 flex flex-col overflow-hidden rounded border border-[#EAEDF0]">
              {/* Input Area */}
              <div className="flex flex-1 flex-col items-center justify-center bg-[#FBFCFE] py-10">
                <p className="mb-4 text-base font-medium text-gray-700">
                  {__('Cash', 'wepos')}
                </p>
                <InputGroup className="h-[50px] w-[350px] rounded-[3px] border-[#EAEDF0]">
                  <InputGroupAddon className="w-[50px] justify-center border-r border-[#EAEDF0] text-base text-gray-600">
                    {currencySymbol}
                  </InputGroupAddon>
                  <InputGroupInput
                    ref={cashAmountRef}
                    id="input-cash-amount"
                    type="text"
                    value={cashAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onCashAmountChange(e.target.value)
                    }
                    className="h-full text-base"
                  />
                </InputGroup>
              </div>

              {/* Change Money */}
              <div className="flex items-center justify-center border-t border-[#EAEDF0] bg-white py-6">
                <p className="text-[15px] font-medium text-[#9013FE]">
                  {__('Change money', 'wepos')}: {formatPrice(changeAmount)}
                </p>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="flex items-center justify-between px-12 py-6">
            <Button
              variant="outline"
              onClick={onBackToSale}
              className="rounded-[3px] px-6 py-3"
            >
              {__('Back to Sale', 'wepos')}
            </Button>
            <Button
              onClick={onProcessPayment}
              disabled={!ableToProcess}
              className="bg-[#3B80F4] text-white hover:bg-[#2d6ad4] disabled:cursor-not-allowed disabled:bg-[#76A2ED] disabled:opacity-100"
            >
              {__('Process Payment', 'wepos')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
