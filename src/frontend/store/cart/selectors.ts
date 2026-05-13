import { CartState, ServerOrderData } from './types';
import { POSCartItem, POSDiscountLine, POSFeeLine, POSShippingLine, POSOrderMetaItem, Customer } from '../../types';
import { toFiniteNumber } from '../../utils/helpers';

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

  // Raw line-item tax that is NOT zeroed in `incl` mode. Used by the UI to
  // show the "Including Tax" hint (legacy Cart.module.js:42-51, Home.vue:259).
  getTotalLineTax: (state: CartState): number => {
    return state.line_items.reduce((total: number, item: POSCartItem) => {
      const perUnitTax = toFiniteNumber(item.tax_amount);
      return total + Math.abs(perUnitTax * item.quantity);
    }, 0);
  },

  getTotalTax: (state: CartState): number => {
    // Use server-calculated tax only if available and cart hasn't been modified locally
    if (state.server_order && !state.server_order_dirty) {
      return parseFloat(state.server_order.total_tax) || 0;
    }

    // Mirrors legacy Cart.module.js:52-102.
    // Inclusive display zeros line tax because the line price already
    // includes it (legacy :63-65) — fee/coupon tax still apply on top.
    const taxLineTotal = state.tax_display_cart === 'incl' ? 0 : selectors.getTotalLineTax(state);

    const subtotal = selectors.getSubtotal(state);

    const findRate = (taxClass: string): number => {
      const slug = taxClass === '' ? 'standard' : taxClass;
      const match = state.available_tax.find((r) => r.class === slug);
      return match ? toFiniteNumber(match.rate) : 0;
    };

    // Fee tax (legacy :67-80).
    const taxFeeTotal = state.fee_lines.reduce((total: number, fee: POSFeeLine) => {
      if (fee.tax_status !== 'taxable') return total;
      const rate = findRate(fee.tax_class);
      if (!rate) return total;
      const feeAmount = fee.fee_type === 'percent'
        ? (subtotal * parseFloat(fee.value)) / 100
        : parseFloat(fee.value);
      return total + (Math.abs(feeAmount) * Math.abs(rate)) / 100;
    }, 0);

    // Coupon tax adjustment (legacy :82-99). Subtracted (not added) because
    // legacy stored `coupon.total` as negative; here `discountAmount` is positive.
    const couponTaxDiscount = state.coupon_lines.reduce((total: number, coupon: POSDiscountLine) => {
      if (coupon.tax_status !== 'taxable') return total;
      const rate = findRate(coupon.tax_class);
      if (!rate || !subtotal) return total;
      const discountAmount = coupon.discount_type === 'percent'
        ? (subtotal * coupon.value) / 100
        : coupon.value;
      const discountPct = (discountAmount / subtotal) * 100;
      return total - (discountPct / 100) * taxLineTotal;
    }, 0);

    return taxLineTotal + couponTaxDiscount + taxFeeTotal;
  },

  getTotal: (state: CartState): number => {
    // Use server-calculated total only if available and cart hasn't been modified locally
    if (state.server_order && !state.server_order_dirty) {
      return parseFloat(state.server_order.total) || 0;
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
