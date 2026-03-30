import { POSCartItem, POSFeeLine, POSShippingLine, POSOrderMetaItem, Customer } from '../../types';
import { ServerOrderData } from './types';

export const actions = {
  addToCart(item: POSCartItem) {
    return {
      type: 'ADD_TO_CART' as const,
      item,
    };
  },

  removeFromCart(index: number) {
    return {
      type: 'REMOVE_FROM_CART' as const,
      index,
    };
  },

  updateCartItem(index: number, updates: Partial<POSCartItem>) {
    return {
      type: 'UPDATE_CART_ITEM' as const,
      index,
      updates,
    };
  },

  clearCart() {
    return {
      type: 'CLEAR_CART' as const,
    };
  },

  addDiscount(value: number, type: 'percent' | 'fixed_cart') {
    return {
      type: 'ADD_DISCOUNT' as const,
      value,
      discountType: type,
    };
  },

  addFee(value: number, type: 'percent' | 'fixed') {
    return {
      type: 'ADD_FEE' as const,
      value,
      feeType: type,
    };
  },

  addFeeLine(fee: POSFeeLine) {
    return {
      type: 'ADD_FEE_LINE' as const,
      fee,
    };
  },

  removeDiscount(index: number) {
    return {
      type: 'REMOVE_DISCOUNT' as const,
      index,
    };
  },

  removeFee(index: number) {
    return {
      type: 'REMOVE_FEE' as const,
      index,
    };
  },

  addCustomerNote(note: string) {
    return {
      type: 'ADD_CUSTOMER_NOTE' as const,
      note,
    };
  },

  removeCustomerNote() {
    return {
      type: 'REMOVE_CUSTOMER_NOTE' as const,
    };
  },

  setCustomer(customer: Customer | null) {
    return {
      type: 'SET_CUSTOMER' as const,
      customer,
    };
  },

  addShippingLine(shipping: POSShippingLine) {
    return {
      type: 'ADD_SHIPPING_LINE' as const,
      shipping,
    };
  },

  removeShippingLine(index: number) {
    return {
      type: 'REMOVE_SHIPPING_LINE' as const,
      index,
    };
  },

  setMetaData(meta_data: POSOrderMetaItem[]) {
    return {
      type: 'SET_META_DATA' as const,
      meta_data,
    };
  },

  setOrderCurrency(currency: string, currency_symbol: string) {
    return {
      type: 'SET_ORDER_CURRENCY' as const,
      currency,
      currency_symbol,
    };
  },

  setServerOrder(server_order: ServerOrderData) {
    return {
      type: 'SET_SERVER_ORDER' as const,
      server_order,
    };
  },

  clearServerOrder() {
    return {
      type: 'CLEAR_SERVER_ORDER' as const,
    };
  },
};
