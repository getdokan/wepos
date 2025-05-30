import { POSCartItem, POSDiscountLine, POSFeeLine } from '../../types';

// Cart state interface
export interface CartState {
  line_items: POSCartItem[];
  coupon_lines: POSDiscountLine[];
  fee_lines: POSFeeLine[];
  customer_note: string;
}

// Action types
export type CartAction =
  | { type: 'ADD_TO_CART'; item: POSCartItem }
  | { type: 'REMOVE_FROM_CART'; index: number }
  | { type: 'UPDATE_CART_ITEM'; index: number; updates: Partial<POSCartItem> }
  | { type: 'CLEAR_CART' }
  | {
      type: 'ADD_DISCOUNT';
      value: number;
      discountType: 'percent' | 'fixed_cart';
    }
  | { type: 'ADD_FEE'; value: number; feeType: 'percent' | 'fixed' }
  | { type: 'REMOVE_DISCOUNT'; index: number }
  | { type: 'REMOVE_FEE'; index: number }
  | { type: 'ADD_CUSTOMER_NOTE'; note: string }
  | { type: 'REMOVE_CUSTOMER_NOTE' };
