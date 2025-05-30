import { POSCartItem } from '../../types';

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
};
