import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { LoaderCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { POSGateway, POSCartItem, POSDiscountLine, POSFeeLine, POSShippingLine } from '../types';
import { cartItemDisplayPrices, formatPrice } from '../utils/helpers';
import { CART_STORE_NAME } from '../store/cart';
import { PRODUCTS_STORE_NAME } from '../store/products';
import { applyFilters } from '../hooks/useExtensions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  ScrollArea,
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
  const { cartItems, subtotal, total, discountLines, feeLines, shippingLines, totalTax, totalLineTax, taxDisplayMode, pricesIncludeTax, orderCurrencySymbol } =
    useSelect((select) => {
      const store = select(CART_STORE_NAME) as any;
      return {
        cartItems: store.getCartItems(),
        subtotal: store.getSubtotal(),
        total: store.getTotal(),
        discountLines: store.getDiscountLines(),
        feeLines: store.getFeeLines(),
        shippingLines: store.getShippingLines(),
        totalTax: store.getTotalTax(),
        totalLineTax: store.getTotalLineTax(),
        taxDisplayMode: store.getTaxDisplayMode(),
        pricesIncludeTax: store.getPricesIncludeTax(),
        orderCurrencySymbol: store.getOrderCurrencySymbol(),
      };
    }, []);

  // Inclusive display: line tax is part of the subtotal/total, not added on
  // top — shown as a WC-style "(Including Tax X)" note, never as a row.
  const isTaxInclusive = taxDisplayMode === 'incl';
  const includedTax = isTaxInclusive ? totalLineTax : 0;

  // Get gateways from products store
  const { availableGateways } = useSelect((select) => {
    const store = select(PRODUCTS_STORE_NAME) as any;
    return {
      availableGateways: store.getGateways(),
    };
  }, []);

  // Currency symbol priority: order meta > POS settings > WooCommerce default
  const currencySymbol =
    orderCurrencySymbol || (window as any).wepos?.currency_format_symbol || '$';

  // Format price using order-specific currency when set
  const paymentFormatPrice = (price: number | string): string | number =>
    formatPrice(price, orderCurrencySymbol || '');

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

  // Get discount display text (e.g. "-10.00৳" or "-5%")
  const getDiscountDisplay = (discount: POSDiscountLine): string => {
    if (discount.discount_type === 'percent') {
      return `-${discount.value}%`;
    }
    return `-${paymentFormatPrice(discount.value)}`;
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

  // Mode-aware display price — matches the cart rows and getSubtotal.
  const getItemPrice = (item: POSCartItem): number => {
    return cartItemDisplayPrices(item, taxDisplayMode, pricesIncludeTax).unit;
  };

  if (!show) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => { if (!open) onBackToSale(); }}>
      <DialogContent
        showCloseButton={false}
        className="wepos-payment-modal flex h-[85vh] w-[95vw] max-w-[1400px] flex-col overflow-hidden gap-0 p-0"
      >
      {/* Processing Overlay */}
      {processing && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {__('Processing payment...', 'wepos')}
            </span>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Left Panel - Sale Summary */}
        <div className="flex w-full shrink-0 flex-col border-b border-border bg-muted/30 md:w-[340px] md:border-b-0 md:border-r">
          <DialogHeader className="border-b border-border px-8 py-4">
            <DialogTitle>
              {__('Sale Summary', 'wepos')}
            </DialogTitle>
          </DialogHeader>

          {/* Cart Items - Scrollable */}
          <ScrollArea className="min-h-0 max-h-[200px] flex-1 md:max-h-none">
            <div className="px-5 py-2">
              {cartItems.map((item: POSCartItem, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border/50 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                    {item.attribute && item.attribute.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {item.attribute
                          .map((attr) => `${attr.name}: ${attr.option}`)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="mx-3 shrink-0 text-xs text-muted-foreground">
                    x{item.quantity}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-sm font-medium text-foreground">
                    {paymentFormatPrice(getItemPrice(item) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Summary Footer */}
          <div className="border-t border-border px-5 py-3">
            {/* Subtotal */}
            <div className="flex justify-between py-1">
              <span className="text-sm font-semibold text-foreground">
                {__('Subtotal', 'wepos')}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {paymentFormatPrice(subtotal)}
              </span>
            </div>

            {/* Discount Lines */}
            {discountLines.map(
              (discount: POSDiscountLine, index: number) => (
                <div
                  key={`discount-${index}`}
                  className="flex justify-between py-1"
                >
                  <span className="text-sm text-muted-foreground">
                    {__('Discount', 'wepos')}{' '}
                    <span className="text-xs">
                      {discount.name} {getDiscountDisplay(discount)}
                    </span>
                  </span>
                  <span className="text-sm text-destructive">
                    -{paymentFormatPrice(getDiscountAmount(discount))}
                  </span>
                </div>
              ),
            )}

            {/* Fee Lines */}
            {feeLines.map((fee: POSFeeLine, index: number) => (
              <div
                key={`fee-${index}`}
                className="flex justify-between py-1"
              >
                <span className="text-sm text-muted-foreground">
                  {fee.name || __('Fee', 'wepos')}{' '}
                  <span className="text-xs">
                    {paymentFormatPrice(parseFloat(fee.value))}
                  </span>
                </span>
                <span className="text-sm text-foreground">
                  {paymentFormatPrice(getFeeAmount(fee))}
                </span>
              </div>
            ))}

            {/* Shipping Lines */}
            {shippingLines.map((shipping: POSShippingLine, index: number) => (
              <div
                key={`shipping-${index}`}
                className="flex justify-between py-1"
              >
                <span className="text-sm text-muted-foreground">
                  {shipping.method_title || __('Shipping', 'wepos')}
                </span>
                <span className="text-sm text-foreground">
                  {paymentFormatPrice(shipping.total)}
                </span>
              </div>
            ))}

            {/* Tax — additive row only when prices exclude tax (WC cart behavior) */}
            {!isTaxInclusive && totalTax > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-sm text-muted-foreground">
                  {__('Tax', 'wepos')}
                </span>
                <span className="text-sm text-foreground">
                  {paymentFormatPrice(totalTax)}
                </span>
              </div>
            )}

            <Separator className="my-2" />

            {/* Order Total */}
            <div className="flex justify-between py-1">
              <span className="text-sm font-bold text-foreground">
                {__('Order Total', 'wepos')}
              </span>
              <span className="text-sm font-bold text-foreground">
                {paymentFormatPrice(total)}
              </span>
            </div>
            {/* WC-style note: "(includes Tax X)" under the total in inclusive display */}
            {includedTax > 0 && (
              <div className="flex justify-end pb-1 text-xs text-muted-foreground">
                ({__('Including Tax', 'wepos')} {paymentFormatPrice(includedTax)})
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Payment */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-5 md:p-8">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground md:text-2xl">
                  {__('Pay', 'wepos')}
                </h2>
                <span className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-1.5 text-base font-bold text-primary md:text-lg">
                  {paymentFormatPrice(total)}
                </span>
              </div>

              {/* Payment Gateways */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {availableGateways.map((gateway: POSGateway) => (
                  <label
                    key={gateway.id}
                    className={`flex h-20 cursor-pointer items-center justify-center rounded-lg border-2 transition-all md:h-24 ${
                      selectedGateway === gateway.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gateway"
                      value={gateway.id}
                      checked={selectedGateway === gateway.id}
                      onChange={(e) => onGatewayChange(e.target.value)}
                      className="hidden"
                    />
                    <span className={`text-sm font-medium md:text-base ${
                      selectedGateway === gateway.id
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}>
                      {gateway.title}
                    </span>
                  </label>
                ))}
              </div>

              {/* Cash Payment Section */}
              {selectedGateway === 'wepos_cash' && (
                <div className="mt-6 overflow-hidden rounded-lg border border-border">
                  {/* Input Area */}
                  <div className="flex flex-col items-center justify-center bg-muted/20 px-4 py-8">
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      {__('Cash', 'wepos')}
                    </p>
                    <InputGroup className="h-12 w-full max-w-xs rounded-lg border-border">
                      <InputGroupAddon className="w-12 justify-center border-r border-border text-base text-muted-foreground">
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
                  <div className="flex items-center justify-center border-t border-border bg-background px-4 py-4">
                    <p className="text-sm font-semibold text-primary">
                      {__('Change money', 'wepos')}: {paymentFormatPrice(changeAmount)}
                    </p>
                  </div>
                </div>
              )}

              {/* Extension slot: pro card gateway form */}
              {applyFilters<React.ReactNode[]>('wepos_react_gateway_content', [], {
                selectedGateway,
                availableGateways,
              }).map((Component: any, i: number) => (
                <Component key={i} selectedGateway={selectedGateway} availableGateways={availableGateways} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer */}
      <DialogFooter className="shrink-0 justify-between border-t border-border px-8 py-5">
        <Button
          variant="outline"
          onClick={onBackToSale}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {__('Back to Sale', 'wepos')}
        </Button>
        <Button
          onClick={onProcessPayment}
          disabled={!ableToProcess}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {__('Process Payment', 'wepos')}
        </Button>
      </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
