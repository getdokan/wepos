// WordPress and WooCommerce global types
declare global {
  interface Window {
    wepos: {
      rest: {
        root: string;
        nonce: string;
        wcversion: string;
        posversion: string;
      };
      ajaxurl: string;
      nonce: string;
      currency_format_symbol: string;
      currency_format_decimal_sep: string;
      currency_format_thousand_sep: string;
      currency_format: string;
      currency_format_num_decimals: number;
      admin_url: string;
      assets_url: string;
      placeholder_image: string;
      ajax_loader: string;
      logout_url: string;
      categories: ProductCategory[];
      countries: Record<string, string>;
      states: Record<string, Record<string, string>>;
      current_user_id: number;
      current_user: {
        name: string;
        email: string;
        avatar_url: string;
        role: string;
      };
      home_url: string;
      wp_date_format: string;
      wp_time_format: string;
      // Dokan vendor context (present when Dokan is active)
      is_dokan_active?: boolean;
      is_vendor?: boolean;
      vendor_id?: number;
      is_vendor_staff?: boolean;
    };
  }
}

// Product Types
export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: 'simple' | 'grouped' | 'external' | 'variable';
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured: boolean;
  catalog_visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  price_html: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: Download[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: 'taxable' | 'shipping' | 'none';
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: 'no' | 'notify' | 'yes';
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: ProductDimensions;
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: ProductCategory[];
  tags: ProductTag[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  default_attributes: ProductDefaultAttribute[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: MetaData[];
  date_created: string;
  date_modified: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: 'default' | 'products' | 'subcategories' | 'both';
  image: ProductImage | null;
  menu_order: number;
  count: number;
}

export interface ProductTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface ProductImage {
  id: number;
  date_created: string;
  date_modified: string;
  src: string;
  name: string;
  alt: string;
}

export interface ProductDimensions {
  length: string;
  width: string;
  height: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface ProductDefaultAttribute {
  id: number;
  name: string;
  option: string;
}

export interface Download {
  id: string;
  name: string;
  file: string;
}

export interface MetaData {
  id: number;
  key: string;
  value: string | number | boolean | object;
}

// Cart Types
export interface POSCartItem {
  id: number;
  product_id: number;
  variation_id?: number;
  name: string;
  sku?: string;
  quantity: number;
  type: string;
  on_sale: boolean;
  sale_price: number;
  regular_price: number;
  editQuantity?: boolean;
  attribute: Array<{
    id?: number;
    name: string;
    option: string;
  }>;
  tax_amount?: number;
  manage_stock?: boolean;
  stock_status?: string;
  backorders_allowed?: boolean;
  stock_quantity?: number;
  total_tax?: number;
}

// POS-specific cart line items for discounts and fees
export interface POSDiscountLine {
  id?: number;
  name: string;
  type: 'discount';
  isEdit?: boolean;
  value: number;
  discount_type: 'percent' | 'fixed_cart';
  tax_status: 'taxable' | 'none';
  tax_class: string;
  total: number;
  code: string;
}

export interface POSFeeLine {
  id?: number;
  name: string;
  type: 'fee';
  value: string;
  isEdit?: boolean;
  fee_type: 'percent' | 'fixed';
  tax_status: 'taxable' | 'none';
  tax_class: string;
  total: number;
}

export interface POSShippingLine {
  id?: number;
  method_title: string;
  method_id: string;
  total: string;
  tax_status: 'taxable' | 'none';
  tax_class: string;
  amount_includes_tax: boolean;
}

export interface POSOrderMetaItem {
  id?: number;
  key: string;
  value: string;
}

// Enhanced cart data structure for POS
export interface POSCartData {
  line_items: POSCartItem[];
  fee_lines: POSFeeLine[];
  coupon_lines: POSDiscountLine[];
  shipping_lines: POSShippingLine[];
  meta_data: POSOrderMetaItem[];
  customer_note?: string;
}

// Alias for cleaner imports
export type CartItem = POSCartItem;

export interface ProductVariation {
  id: number;
  date_created: string;
  date_modified: string;
  description: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  on_sale: boolean;
  status: 'draft' | 'pending' | 'private' | 'publish';
  purchasable: boolean;
  virtual: boolean;
  downloadable: boolean;
  downloads: Download[];
  download_limit: number;
  download_expiry: number;
  tax_status: 'taxable' | 'shipping' | 'none';
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: 'no' | 'notify' | 'yes';
  backorders_allowed: boolean;
  backordered: boolean;
  weight: string;
  dimensions: ProductDimensions;
  shipping_class: string;
  shipping_class_id: number;
  image: ProductImage;
  attributes: ProductVariationAttribute[];
  menu_order: number;
  meta_data: MetaData[];
}

export interface ProductVariationAttribute {
  id: number;
  name: string;
  option: string;
}

// Order Types
export interface Order {
  id: number;
  parent_id: number;
  status: OrderStatus;
  currency: string;
  version: string;
  prices_include_tax: boolean;
  date_created: string;
  date_modified: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  customer_id: number;
  order_key: string;
  billing: BillingAddress;
  shipping: ShippingAddress;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  customer_ip_address: string;
  customer_user_agent: string;
  created_via: string;
  customer_note: string;
  date_completed: string | null;
  date_paid: string | null;
  cart_hash: string;
  number: string;
  meta_data: MetaData[];
  line_items: OrderLineItem[];
  tax_lines: OrderTaxLine[];
  shipping_lines: OrderShippingLine[];
  fee_lines: OrderFeeLine[];
  coupon_lines: OrderCouponLine[];
  refunds: OrderRefund[];
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'
  | 'checkout-draft'
  | 'pos-open';

export interface BillingAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface OrderLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  taxes: OrderTax[];
  meta_data: MetaData[];
  sku: string;
  price: number;
}

export interface OrderTax {
  id: number;
  rate_code: string;
  rate_id: number;
  label: string;
  compound: boolean;
  tax_total: string;
  shipping_tax_total: string;
  rate_percent: number;
  meta_data: MetaData[];
}

export interface OrderTaxLine {
  id: number;
  rate_code: string;
  rate_id: number;
  label: string;
  compound: boolean;
  tax_total: string;
  shipping_tax_total: string;
  meta_data: MetaData[];
}

export interface OrderShippingLine {
  id: number;
  method_title: string;
  method_id: string;
  instance_id: string;
  total: string;
  total_tax: string;
  taxes: OrderTax[];
  meta_data: MetaData[];
}

export interface OrderFeeLine {
  id: number;
  name: string;
  tax_class: string;
  tax_status: 'taxable' | 'none';
  total: string;
  total_tax: string;
  taxes: OrderTax[];
  meta_data: MetaData[];
}

export interface OrderCouponLine {
  id: number;
  code: string;
  discount: string;
  discount_tax: string;
  meta_data: MetaData[];
}

export interface OrderRefund {
  id: number;
  date_created: string;
  amount: string;
  reason: string;
  refunded_by: number;
  refunded_payment: boolean;
  meta_data: MetaData[];
  line_items: OrderLineItem[];
}

// Customer Types
export interface Customer {
  id: number;
  date_created: string;
  date_modified: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: BillingAddress;
  shipping: ShippingAddress;
  is_paying_customer: boolean;
  avatar_url: string;
  meta_data: MetaData[];
}

// POS Specific Types
export interface POSSettings {
  barcode_scanner: boolean;
  receipt_printer: boolean;
  cash_drawer: boolean;
  default_customer: number | null;
  tax_calculation: 'automatic' | 'manual';
  discount_permission: boolean;
}

export interface Receipt {
  order_id: number;
  items: CartItem[];
  total: number;
  tax: number;
  discount: number;
  payment_method: string;
  customer: Customer | null;
  cashier: {
    id: number;
    name: string;
  };
  date: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Payment Gateway Types
export interface PaymentGateway {
  id: string;
  title: string;
  description: string;
  order: number;
  enabled: boolean;
  method_title: string;
  method_description: string;
  settings: Record<string, any>;
}

// Hook Types for WordPress Data
export interface UseProductsOptions {
  search?: string;
  category?: number;
  per_page?: number;
  page?: number;
  status?: string;
  orderby?: string;
  order?: 'asc' | 'desc';
}

export interface UseOrdersOptions {
  status?: OrderStatus[];
  customer?: number;
  per_page?: number;
  page?: number;
  after?: string;
  before?: string;
  orderby?: string;
  order?: 'asc' | 'desc';
}

// POS-specific Cart and Order Types
export interface POSOrderData {
  customer_id: number;
  customer_note: string;
  payment_method: string;
  payment_method_title: string;
  billing: any;
  shipping: any;
}

export interface POSGateway {
  id: string;
  title: string;
}

export interface POSSettings {
  wepos_general: any;
  wepos_receipts?: {
    receipt_header: string;
    receipt_footer: string;
  };
  woo_tax: {
    wc_tax_display_cart: string;
    wc_tax_based_on?: string;
  };
  currencies?: Record<string, { name: string; symbol: string }>;
}

export interface POSPrintData {
  line_items?: POSCartItem[];
  fee_lines?: any[];
  coupon_lines?: any[];
  shipping_lines?: POSShippingLine[];
  subtotal?: number;
  taxtotal?: number;
  shippingtotal?: number;
  shippingtaxtotal?: number;
  ordertotal?: number;
  gateway: {
    id: string;
    title: string;
  };
  order_id?: string;
  order_date?: string;
  cashamount?: string;
  changeamount?: string;
  currency_symbol?: string;
}

export interface POSCategory {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
}

export interface POSTag {
  id: number;
  name: string;
}

export interface POSBrand {
  id: number;
  name: string;
}

// UI State Types
export type ProductViewType = 'grid' | 'list';

export interface POSProduct {
  id: number;
  name: string;
  type: string;
  images: Array<{ woocommerce_thumbnail: string; name: string }>;
  categories: Array<{ id: number; name: string }>;
  tags: Array<{ id: number; name: string }>;
  brands: Array<{ id: number; name: string }>;
  sku?: string;
  price_html: string;
  featured: boolean;
  on_sale: boolean;
  sale_price: number | string;
  regular_price: number | string;
  stock_quantity: number;
  manage_stock: boolean;
  stock_status: string;
  purchasable?: boolean;
  backorders_allowed?: boolean;
  attributes?: Array<{
    name: string;
    options: string[];
    variation: boolean;
  }>;
  variations?: any[];
}
