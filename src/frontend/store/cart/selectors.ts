import { CartState } from './types';
import { POSCartItem, POSDiscountLine, POSFeeLine } from '../../types';

export const selectors = {
  getCartItems: (state: CartState): POSCartItem[] => state.line_items,
  getDiscountLines: (state: CartState): POSDiscountLine[] => state.coupon_lines,
  getFeeLines: (state: CartState): POSFeeLine[] => state.fee_lines,
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

  getTotalTax: (state: CartState): number => {
    // Tax calculation logic would go here
    // For now, returning 0 as placeholder
    return 0;
  },

  getTotal: (state: CartState): number => {
    const subtotal = selectors.getSubtotal(state);
    const totalDiscount = selectors.getTotalDiscount(state);
    const totalFee = selectors.getTotalFee(state);
    const totalTax = selectors.getTotalTax(state);

    return Math.max(0, subtotal - totalDiscount + totalFee + totalTax);
  },

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
