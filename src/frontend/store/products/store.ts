import { createReduxStore, register } from '@wordpress/data';
import { reducer, initialState } from './reducer';
import { actions } from './actions';
import { selectors } from './selectors';

export const PRODUCTS_STORE_NAME = 'wepos/products';

const store = createReduxStore(PRODUCTS_STORE_NAME, {
  reducer,
  actions,
  selectors,
  initialState,
});

// Register the store
register(store);

export { store };
