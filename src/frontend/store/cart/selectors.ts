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
        return total + (subtotal * toFiniteNumber(fee.value)) / 100;
      } else {
        return total + toFiniteNumber(fee.value);
      }
    }, 0);
  },

  getTotalShipping: (state: CartState): number => {
    return state.shipping_lines.reduce((total: number, shipping: POSShippingLine) => {
      return total + toFiniteNumber(shipping.total);
    }, 0);
  },

  getTaxDisplayMode: (state: CartState): 'incl' | 'excl' =>
    state.tax_display_cart === 'incl' ? 'incl' : 'excl',

  // Raw line-item tax — NOT zeroed in `incl` mode. Drives the "Including Tax" UI hint.
  // `tax_amount` is `wc_get_price_including_tax - wc_get_price_excluding_tax`, always
  // non-negative for positive prices, so no `Math.abs` is needed.
  getTotalLineTax: (state: CartState): number => {
    return state.line_items.reduce((total: number, item: POSCartItem) => {
      return total + toFiniteNumber(item.tax_amount) * item.quantity;
    }, 0);
  },

  getTotalTax: (state: CartState): number => {
    if (state.server_order && !state.server_order_dirty) {
      const serverTax = toFiniteNumber(state.server_order.total_tax);
      if (serverTax > 0) return serverTax;

      // Server explicitly reported zero tax. WC sometimes leaves `total_tax=0`
      // on pos-open orders when it can't resolve a tax rate from the order
      // location (e.g. guest with no billing address). The line totals already
      // bundle the tax in that case, so derive the tax from the gap between
      // `server.total` and the sum of non-tax components. Keeps the summary
      // self-consistent: Subtotal + Tax = Order Total.
      const subtotalForGap = selectors.getSubtotal(state);
      const discountForGap = selectors.getTotalDiscount(state);
      const feeForGap = selectors.getTotalFee(state);
      const shippingForGap = selectors.getTotalShipping(state);
      const serverTotal = toFiniteNumber(state.server_order.total);
      const gap = serverTotal - (subtotalForGap - discountForGap + feeForGap + shippingForGap);
      return gap > 0.01 ? gap : 0;
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
        ? (subtotal * toFiniteNumber(fee.value)) / 100
        : toFiniteNumber(fee.value);
      return sum + (feeAmount * rate) / 100;
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

    // Filter payload exposes derived totals only — never the live store state — so
    // a misbehaving extension cannot mutate cart internals from inside the filter.
    return applyFilters<number>(
      'wepos_cart_total_tax',
      lineTax + feeTax - couponTaxReduction,
      { lineTax, feeTax, couponTaxReduction }
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
      return (subtotal * toFiniteNumber(fee.value)) / 100;
    } else {
      return toFiniteNumber(fee.value);
    }
  },
};
