import { POSCartItem, POSDiscountLine, POSFeeLine, POSShippingLine, POSOrderMetaItem, Customer } from '../../types';

// Shape of a tax record returned from /wepos/v1/taxes (WC_REST_Taxes_V2_Controller).
// Mirrors the legacy Vue `availableTax` records.
export interface TaxRate {
  id: number;
  class: string;
  rate: string;
  name?: string;
  compound?: boolean;
  shipping?: boolean;
  priority?: number;
  order?: number;
  country?: string;
  state?: string;
  postcode?: string;
  city?: string;
  percentage_rate?: string;
}

// Server-synced order data (populated after saveToServer)
export interface ServerOrderData {
  order_id: number;
  order_number: string;
  total: string;
  total_tax: string;
  // Per line-item taxes from WC response
  line_items: Array<{
    id: number;
    product_id: number;
    variation_id: number;
    total: string;
    total_tax: string;
    subtotal: string;
    subtotal_tax: string;
    taxes: Array<{ id: number; total: string; subtotal: string }>;
  }>;
  fee_lines: Array<{
    id: number;
    total: string;
    total_tax: string;
    taxes: Array<{ id: number; total: string; subtotal: string }>;
  }>;
  shipping_lines: Array<{
    id: number;
    total: string;
    total_tax: string;
    taxes: Array<{ id: number; total: string; subtotal: string }>;
  }>;
  tax_lines: Array<{
    id: number;
    rate_code: string;
    rate_id: number;
    label: string;
    compound: boolean;
    tax_total: string;
    shipping_tax_total: string;
  }>;
}

// Cart state interface
export interface CartState {
  line_items: POSCartItem[];
  coupon_lines: POSDiscountLine[];
  fee_lines: POSFeeLine[];
  shipping_lines: POSShippingLine[];
  meta_data: POSOrderMetaItem[];
  customer_note: string;
  customer: Customer | null;
  server_order: ServerOrderData | null;
  server_order_dirty: boolean;
  currency: string;
  currency_symbol: string;
  // Mirrors WC's `woocommerce_tax_display_cart` so the selector can match the
  // legacy Vue logic that zeros line-item tax when display is inclusive.
  tax_display_cart?: 'incl' | 'excl';
  // Tax rates indexed by class. Powers local fee tax and coupon tax adjustment
  // (legacy Cart.module.js `availableTax`).
  available_tax: TaxRate[];
}

// Action types
export type CartAction =
  | { type: 'ADD_TO_CART'; item: POSCartItem }
  | { type: 'REMOVE_FROM_CART'; index: number }
  | { type: 'UPDATE_CART_ITEM'; index: number; updates: Partial<POSCartItem> }
  | { type: 'HYDRATE_CART'; state: CartState }
  | { type: 'CLEAR_CART' }
  | {
      type: 'ADD_DISCOUNT';
      value: number;
      discountType: 'percent' | 'fixed_cart';
    }
  | { type: 'ADD_FEE'; value: number; feeType: 'percent' | 'fixed' }
  | { type: 'ADD_FEE_LINE'; fee: POSFeeLine }
  | { type: 'REMOVE_DISCOUNT'; index: number }
  | { type: 'REMOVE_FEE'; index: number }
  | { type: 'ADD_CUSTOMER_NOTE'; note: string }
  | { type: 'REMOVE_CUSTOMER_NOTE' }
  | { type: 'SET_CUSTOMER'; customer: Customer | null }
  | { type: 'ADD_SHIPPING_LINE'; shipping: POSShippingLine }
  | { type: 'REMOVE_SHIPPING_LINE'; index: number }
  | { type: 'SET_META_DATA'; meta_data: POSOrderMetaItem[] }
  | { type: 'SET_ORDER_CURRENCY'; currency: string; currency_symbol: string }
  | { type: 'SET_SERVER_ORDER'; server_order: ServerOrderData }
  | { type: 'CLEAR_SERVER_ORDER' }
  | { type: 'SET_TAX_DISPLAY_MODE'; mode: 'incl' | 'excl' }
  | { type: 'SET_AVAILABLE_TAX'; rates: TaxRate[] };
