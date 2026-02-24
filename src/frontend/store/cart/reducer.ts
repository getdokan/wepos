import { CartState, CartAction } from './types';
import { POSDiscountLine, POSFeeLine } from '../../types';

// Initial state
export const initialState: CartState = {
  line_items: [],
  coupon_lines: [],
  fee_lines: [],
  customer_note: '',
  customer: null,
};

// Reducer
export const reducer = (
  state = initialState,
  action: CartAction,
): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItemIndex = state.line_items.findIndex(
        (item) =>
          item.product_id === action.item.product_id &&
          item.variation_id === action.item.variation_id,
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...state.line_items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity:
            updatedItems[existingItemIndex].quantity + action.item.quantity,
        };
        return { ...state, line_items: updatedItems };
      } else {
        return {
          ...state,
          line_items: [...state.line_items, action.item],
        };
      }
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        line_items: state.line_items.filter(
          (_, index) => index !== action.index,
        ),
      };

    case 'UPDATE_CART_ITEM': {
      const updatedItems = [...state.line_items];
      updatedItems[action.index] = {
        ...updatedItems[action.index],
        ...action.updates,
      };
      return { ...state, line_items: updatedItems };
    }

    case 'CLEAR_CART':
      return initialState;

    case 'ADD_DISCOUNT': {
      const discountId = Date.now();
      const discount: POSDiscountLine = {
        id: discountId,
        name: 'Discount',
        type: 'discount',
        value: action.value,
        discount_type: action.discountType,
        tax_status: 'none',
        tax_class: '',
        total: 0,
        code: `discount_${discountId}`,
      };
      return {
        ...state,
        coupon_lines: [...state.coupon_lines, discount],
      };
    }

    case 'ADD_FEE': {
      const feeId = Date.now();
      const fee: POSFeeLine = {
        id: feeId,
        name: 'Fee',
        type: 'fee',
        value: action.value.toString(),
        fee_type: action.feeType,
        tax_status: 'none',
        tax_class: '',
        total: 0,
      };
      return {
        ...state,
        fee_lines: [...state.fee_lines, fee],
      };
    }

    case 'REMOVE_DISCOUNT':
      return {
        ...state,
        coupon_lines: state.coupon_lines.filter(
          (_, index) => index !== action.index,
        ),
      };

    case 'REMOVE_FEE':
      return {
        ...state,
        fee_lines: state.fee_lines.filter((_, index) => index !== action.index),
      };

    case 'ADD_CUSTOMER_NOTE':
      return {
        ...state,
        customer_note: action.note,
      };

    case 'REMOVE_CUSTOMER_NOTE':
      return {
        ...state,
        customer_note: '',
      };

    case 'SET_CUSTOMER':
      return {
        ...state,
        customer: action.customer,
      };

    default:
      return state;
  }
};
