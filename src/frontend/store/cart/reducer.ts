import { CartState, CartAction } from './types';
import { POSDiscountLine, POSFeeLine } from '../../types';

// Initial state
export const initialState: CartState = {
  line_items: [],
  coupon_lines: [],
  fee_lines: [],
  shipping_lines: [],
  meta_data: [],
  customer_note: '',
  customer: null,
  server_order: null,
  server_order_dirty: false,
  currency: '',
  currency_symbol: '',
  available_tax: [],
};

// Factory to create a reducer with a custom initial state (for localStorage persistence)
export const createReducer = (preloadedState: CartState = initialState) => (
  state = preloadedState,
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
        return { ...state, line_items: updatedItems, server_order_dirty: true };
      } else {
        return {
          ...state,
          line_items: [...state.line_items, action.item],
          server_order_dirty: true,
        };
      }
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        line_items: state.line_items.filter(
          (_, index) => index !== action.index,
        ),
        server_order_dirty: true,
      };

    case 'UPDATE_CART_ITEM': {
      const updatedItems = [...state.line_items];
      updatedItems[action.index] = {
        ...updatedItems[action.index],
        ...action.updates,
      };
      return { ...state, line_items: updatedItems, server_order_dirty: true };
    }

    case 'HYDRATE_CART':
      return {
        ...action.state,
      };

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
        server_order_dirty: true,
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
        server_order_dirty: true,
      };
    }

    case 'ADD_FEE_LINE': {
      return {
        ...state,
        fee_lines: [...state.fee_lines, { ...action.fee, id: Date.now() }],
        server_order_dirty: true,
      };
    }

    case 'REMOVE_DISCOUNT':
      return {
        ...state,
        coupon_lines: state.coupon_lines.filter(
          (_, index) => index !== action.index,
        ),
        server_order_dirty: true,
      };

    case 'REMOVE_FEE':
      return {
        ...state,
        fee_lines: state.fee_lines.filter((_, index) => index !== action.index),
        server_order_dirty: true,
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
        server_order_dirty: true,
      };

    case 'ADD_SHIPPING_LINE':
      return {
        ...state,
        shipping_lines: [...state.shipping_lines, { ...action.shipping, id: Date.now() }],
        server_order_dirty: true,
      };

    case 'REMOVE_SHIPPING_LINE':
      return {
        ...state,
        shipping_lines: state.shipping_lines.filter((_, index) => index !== action.index),
        server_order_dirty: true,
      };

    case 'SET_META_DATA':
      return {
        ...state,
        meta_data: action.meta_data,
      };

    case 'SET_ORDER_CURRENCY':
      return {
        ...state,
        currency: action.currency,
        currency_symbol: action.currency_symbol,
      };

    case 'SET_SERVER_ORDER':
      return {
        ...state,
        server_order: action.server_order,
        server_order_dirty: false,
      };

    case 'CLEAR_SERVER_ORDER':
      return {
        ...state,
        server_order: null,
        server_order_dirty: false,
      };

    case 'SET_TAX_DISPLAY_MODE':
      // Tax-display mode reflects a WC store setting and never affects what
      // the server calculates for a saved order, so do NOT mark the order dirty.
      if (state.tax_display_cart === action.mode) return state;
      return {
        ...state,
        tax_display_cart: action.mode,
      };

    case 'SET_AVAILABLE_TAX':
      // Same reasoning as SET_TAX_DISPLAY_MODE: reference data, not cart edit.
      if (state.available_tax === action.rates) return state;
      return {
        ...state,
        available_tax: action.rates,
      };

    default:
      return state;
  }
};

// Default reducer (uses initialState)
export const reducer = createReducer();
