import store from './store';

export { default as store } from './store';
export { CART_STORE_NAME } from './store';
export * from './types';
export * from './actions';
export * from './selectors';

// Auto-register the store
export default store;
