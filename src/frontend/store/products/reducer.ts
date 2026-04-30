import { ProductsState, ProductsAction } from './types';

// Initial state
export const initialState: ProductsState = {
  products: [],
  categories: [],
  tags: [],
  brands: [],
  gateways: [],
  settings: {} as any,
  loading: {
    products: false,
    categories: false,
    tags: false,
    brands: false,
    gateways: false,
    settings: false,
  },
};

// Reducer
export const reducer = (
  state = initialState,
  action: ProductsAction,
): ProductsState => {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return {
        ...state,
        products: action.products,
        loading: { ...state.loading, products: false },
      };

    case 'APPEND_PRODUCTS':
      return {
        ...state,
        products: [...state.products, ...action.products],
      };

    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.categories,
        loading: { ...state.loading, categories: false },
      };

    case 'SET_TAGS':
      return {
        ...state,
        tags: action.tags,
        loading: { ...state.loading, tags: false },
      };

    case 'SET_BRANDS':
      return {
        ...state,
        brands: action.brands,
        loading: { ...state.loading, brands: false },
      };

    case 'SET_GATEWAYS':
      return {
        ...state,
        gateways: action.gateways,
        loading: { ...state.loading, gateways: false },
      };

    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.settings,
        loading: { ...state.loading, settings: false },
      };

    case 'SET_PRODUCTS_LOADING':
      return {
        ...state,
        loading: { ...state.loading, products: action.loading },
      };

    case 'SET_CATEGORIES_LOADING':
      return {
        ...state,
        loading: { ...state.loading, categories: action.loading },
      };

    case 'SET_TAGS_LOADING':
      return {
        ...state,
        loading: { ...state.loading, tags: action.loading },
      };

    case 'SET_BRANDS_LOADING':
      return {
        ...state,
        loading: { ...state.loading, brands: action.loading },
      };

    case 'SET_GATEWAYS_LOADING':
      return {
        ...state,
        loading: { ...state.loading, gateways: action.loading },
      };

    case 'SET_SETTINGS_LOADING':
      return {
        ...state,
        loading: { ...state.loading, settings: action.loading },
      };

    default:
      return state;
  }
};
