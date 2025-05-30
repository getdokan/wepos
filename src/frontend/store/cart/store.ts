import { createReduxStore, register } from '@wordpress/data';
import { reducer, initialState } from './reducer';
import { actions } from './actions';
import { selectors } from './selectors';

export const CART_STORE_NAME = 'wepos/cart';

// Create the store
const store = createReduxStore(CART_STORE_NAME, {
  reducer,
  actions,
  selectors,
  initialState,
});

// Register the store
register(store);

export default store;
