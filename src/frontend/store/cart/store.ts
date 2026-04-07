import { createReduxStore, register, subscribe, select } from '@wordpress/data';
import { createReducer, initialState } from './reducer';
import { actions } from './actions';
import { selectors } from './selectors';
import { getFromLocalStorage, setToLocalStorage, getSessionScopedKey } from '../../utils/helpers';
import { CartState } from './types';

export const CART_STORE_NAME = 'wepos/cart';

// Load persisted cart state from localStorage (matching Vue's beforeunload/created behavior)
const loadPersistedState = (): CartState => {
  const stored = getFromLocalStorage<Partial<CartState>>(getSessionScopedKey('cartdata'), {});

  const state: CartState = {
    ...initialState,
    ...stored,
  };

  // Sanitize numeric fields that may have been stored as strings
  if (state.line_items && state.line_items.length > 0) {
    state.line_items = state.line_items.map((item: any) => ({
      ...item,
      sale_price:
        typeof item.sale_price === 'string'
          ? parseFloat(item.sale_price) || 0
          : item.sale_price || 0,
      regular_price:
        typeof item.regular_price === 'string'
          ? parseFloat(item.regular_price) || 0
          : item.regular_price || 0,
      total_tax:
        typeof item.total_tax === 'string'
          ? parseFloat(item.total_tax) || 0
          : item.total_tax || 0,
    }));
  }

  return state;
};

// Create the store with persisted initial state baked into the reducer's default
const persistedState = loadPersistedState();
const store = createReduxStore(CART_STORE_NAME, {
  reducer: createReducer(persistedState),
  actions,
  selectors,
});

// Register the store
register(store);

// Persist cart state to localStorage on every change
let lastSerializedState: string | null = null;
subscribe(() => {
  const storeSelect = select(CART_STORE_NAME) as any;
  const currentState = {
    line_items: storeSelect.getCartItems(),
    coupon_lines: storeSelect.getDiscountLines(),
    fee_lines: storeSelect.getFeeLines(),
    shipping_lines: storeSelect.getShippingLines(),
    meta_data: storeSelect.getMetaData(),
    customer_note: storeSelect.getCustomerNote(),
    customer: storeSelect.getCustomer(),
    server_order: storeSelect.getServerOrder(),
    server_order_dirty: storeSelect.isServerOrderDirty(),
  };

  const serialized = JSON.stringify(currentState);
  if (serialized !== lastSerializedState) {
    lastSerializedState = serialized;
    setToLocalStorage(getSessionScopedKey('cartdata'), currentState);
  }
});

export default store;
