// Import and register all stores
import './cart';
import './products';

// Export store names and types for use in components
export { CART_STORE_NAME } from './cart';
export { PRODUCTS_STORE_NAME } from './products';
export type { CartState, CartAction } from './cart';
export type { ProductsState, ProductsAction } from './products';
