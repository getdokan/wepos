import { CartState, ServerOrderData } from './types';
import { POSCartItem, POSDiscountLine, POSFeeLine, POSShippingLine, POSOrderMetaItem, Customer } from '../../types';
import { toFiniteNumber, cartItemDisplayPrices, findTaxRate } from '../../utils/helpers';
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
    // Derive display prices from raw price + tax_amount so stored (possibly
    // stale) display prices can't drift from the current tax display settings.
    return state.line_items.reduce((total: number, item: POSCartItem) => {
      const { unit } = cartItemDisplayPrices(
        item,
        state.tax_display_cart === 'incl' ? 'incl' : 'excl',
        !!state.prices_include_tax,
      );
      return total + unit * item.quantity;
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

  getPricesIncludeTax: (state: CartState): boolean => !!state.prices_include_tax,

  getAvailableTax: (state: CartState) => state.available_tax,

  // Drives the "Including Tax" UI hint — never zeroed in incl mode.
  getTotalLineTax: (state: CartState): number => {
    return state.line_items.reduce((total: number, item: POSCartItem) => {
      return total + toFiniteNumber(item.tax_amount) * item.quantity;
    }, 0);
  },

  getTotalTax: (state: CartState): number => {
    // Resolution order: 1) WC's authoritative server tax  2) tax bundled into server.total (gap)  3) legacy local formula.
    if (state.server_order && !state.server_order_dirty) {
      const serverTax = toFiniteNumber(state.server_order.total_tax);
      if (serverTax > 0) return serverTax;

      // WC silently reports 0 when it cannot resolve a rate (e.g. guest order, no shop base country); recover bundled tax from total − non-tax.
      const nonTax = selectors.getSubtotal(state)
        - selectors.getTotalDiscount(state)
        + selectors.getTotalFee(state)
        + selectors.getTotalShipping(state);
      const gap = toFiniteNumber(state.server_order.total) - nonTax;
      if (gap > 0.01) return gap;

      // No bundled tax — fall through. Excl mode then recovers per-line tax_amount; incl mode returns just feeTax (lineTax is zeroed below to avoid double-counting).
    }

    // Legacy local formula (port of Cart.module.js#getTotalTax lines 52–102) — also acts as the post-save fall-through above.
    const lineTax = state.tax_display_cart === 'incl' ? 0 : selectors.getTotalLineTax(state);
    const subtotal = selectors.getSubtotal(state);

    const findRate = (taxClass: string): number => findTaxRate(state.available_tax, taxClass);

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

    // Filter payload exposes derived totals only — never the live store — so callbacks can't mutate cart state.
    return applyFilters<number>(
      'wepos_cart_total_tax',
      lineTax + feeTax - couponTaxReduction,
      { lineTax, feeTax, couponTaxReduction }
    );
  },

  getTotal: (state: CartState): number => {
    // Always derive `computed` so the cart's "subtotal + tax = total" invariant survives a WC-silent saved order.
    const computed = Math.max(
      0,
      selectors.getSubtotal(state)
        - selectors.getTotalDiscount(state)
        + selectors.getTotalFee(state)
        + selectors.getTotalShipping(state)
        + selectors.getTotalTax(state),
    );

    if (state.server_order && !state.server_order_dirty) {
      const serverTotal = toFiniteNumber(state.server_order.total);
      // serverTax > 0 ⇒ WC resolved the rate; its total is authoritative.
      if (toFiniteNumber(state.server_order.total_tax) > 0) return serverTotal;
      // Side-effect: when WC under-reported tax, returned total may exceed the DB-saved server_order.total — display-layer recovery only; accounting reports must still read server_order.total directly.
      return Math.max(serverTotal, computed);
    }

    return computed;
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
