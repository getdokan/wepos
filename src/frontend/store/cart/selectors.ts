import { CartState, ServerOrderData } from './types';
import { POSCartItem, POSDiscountLine, POSFeeLine, POSShippingLine, POSOrderMetaItem, Customer } from '../../types';
import { toFiniteNumber } from '../../utils/helpers';
import { applyFilters } from '../../hooks/useExtensions';

export const selectors = {
  getCartItems: (state: CartState): POSCartItem[] => state.line_items,
  getCustomer: (state: CartState): Customer | null => state.customer,
  getDiscountLines: (state: CartState): POSDiscountLine[] => state.coupon_lines,
  getFeeLines: (state: CartState): POSFeeLine[] => state.fee_lines,
  getShippingLines: (state: CartState): POSShippingLine[] => state.shipping_lines,
  getMetaData: (state: CartState): POSOrderMetaItem[] => state.meta_data,
  getCustomerNote: (state: CartState): string => state.customer_note,

  getSubtotal: (state: CartState): number => {
    return state.line_items.reduce((total: number, item: POSCartItem) => {
      const price = item.on_sale ? item.sale_price : item.regular_price;
      return total + price * item.quantity;
    }, 0);
  },

  getTotalDiscount: (state: CartState): number => {
    const subtotal = selectors.getSubtotal(state);
    return state.coupon_lines.reduce(
      (total: number, discount: POSDiscountLine) => {
        if (discount.discount_type === 'percent') {
          return total + (subtotal * discount.value) / 100;
        } else {
          return total + discount.value;
        }
      },
      0,
    );
  },

  getTotalFee: (state: CartState): number => {
    const subtotal = selectors.getSubtotal(state);
    return state.fee_lines.reduce((total: number, fee: POSFeeLine) => {
      if (fee.fee_type === 'percent') {
        return total + (subtotal * parseFloat(fee.value)) / 100;
      } else {
        return total + parseFloat(fee.value);
      }
    }, 0);
  },

  getTotalShipping: (state: CartState): number => {
    return state.shipping_lines.reduce((total: number, shipping: POSShippingLine) => {
      return total + parseFloat(shipping.total || '0');
    }, 0);
  },

  // Raw line-item tax — NOT zeroed in `incl` mode. Drives the "Including Tax" UI hint.
  getTotalLineTax: (state: CartState): number => {
    return state.line_items.reduce((total: number, item: POSCartItem) => {
      const perUnitTax = toFiniteNumber(item.tax_amount);
      return total + Math.abs(perUnitTax * item.quantity);
    }, 0);
  },

  getTotalTax: (state: CartState): number => {
    if (state.server_order && !state.server_order_dirty) {
      return toFiniteNumber(state.server_order.total_tax);
    }

    // `incl` mode: line price already includes tax; fees and coupons still apply.
    const lineTax = state.tax_display_cart === 'incl' ? 0 : selectors.getTotalLineTax(state);
    const subtotal = selectors.getSubtotal(state);

    // Empty tax class maps to WC's 'standard'; returns 0 when no class matches.
    const findRate = (taxClass: string): number => {
      const slug = taxClass === '' ? 'standard' : taxClass;
      const match = state.available_tax.find((r) => r.class === slug);
      return match ? toFiniteNumber(match.rate) : 0;
    };

    const feeTax = state.fee_lines.reduce((sum: number, fee: POSFeeLine) => {
      if (fee.tax_status !== 'taxable') return sum;
      const rate = findRate(fee.tax_class);
      if (!rate) return sum;
      const feeAmount = fee.fee_type === 'percent'
        ? (subtotal * parseFloat(fee.value)) / 100
        : parseFloat(fee.value);
      return sum + (Math.abs(feeAmount) * Math.abs(rate)) / 100;
    }, 0);

    // Sign flips vs. legacy Vue (stored coupon.total negative); here discountAmount is positive.
    const couponTaxReduction = state.coupon_lines.reduce((sum: number, coupon: POSDiscountLine) => {
      if (coupon.tax_status !== 'taxable' || !subtotal) return sum;
      const rate = findRate(coupon.tax_class);
      if (!rate) return sum;
      const discountAmount = coupon.discount_type === 'percent'
        ? (subtotal * coupon.value) / 100
        : coupon.value;
      return sum + (discountAmount / subtotal) * lineTax;
    }, 0);

    return applyFilters<number>(
      'wepos_cart_total_tax',
      lineTax + feeTax - couponTaxReduction,
      state,
      lineTax,
      feeTax,
      findRate,
      couponTaxReduction
    );
  },

  getTotal: (state: CartState): number => {
    if (state.server_order && !state.server_order_dirty) {
      return toFiniteNumber(state.server_order.total);
    }

    const subtotal = selectors.getSubtotal(state);
    const totalDiscount = selectors.getTotalDiscount(state);
    const totalFee = selectors.getTotalFee(state);
    const totalShipping = selectors.getTotalShipping(state);
    const totalTax = selectors.getTotalTax(state);

    return Math.max(0, subtotal - totalDiscount + totalFee + totalShipping + totalTax);
  },

  getOrderCurrency: (state: CartState): string => state.currency,
  getOrderCurrencySymbol: (state: CartState): string => state.currency_symbol,

  getServerOrder: (state: CartState): ServerOrderData | null => state.server_order,
  isServerOrderDirty: (state: CartState): boolean => state.server_order_dirty,

  getDiscountAmount: (state: CartState, discount: POSDiscountLine): number => {
    const subtotal = selectors.getSubtotal(state);
    if (discount.discount_type === 'percent') {
      return (subtotal * discount.value) / 100;
    } else {
      return discount.value;
    }
  },

  getFeeAmount: (state: CartState, fee: POSFeeLine): number => {
    const subtotal = selectors.getSubtotal(state);
    if (fee.fee_type === 'percent') {
      return (subtotal * parseFloat(fee.value)) / 100;
    } else {
      return parseFloat(fee.value);
    }
  },
};
