import { POSProduct, POSCategory, POSGateway, POSSettings } from '../../types';

// Products state interface
export interface ProductsState {
  products: POSProduct[];
  categories: POSCategory[];
  gateways: POSGateway[];
  settings: POSSettings;
  loading: {
    products: boolean;
    categories: boolean;
    gateways: boolean;
    settings: boolean;
  };
}

// Action types
export type ProductsAction =
  | { type: 'SET_PRODUCTS'; products: POSProduct[] }
  | { type: 'APPEND_PRODUCTS'; products: POSProduct[] }
  | { type: 'SET_CATEGORIES'; categories: POSCategory[] }
  | { type: 'SET_GATEWAYS'; gateways: POSGateway[] }
  | { type: 'SET_SETTINGS'; settings: POSSettings }
  | { type: 'SET_PRODUCTS_LOADING'; loading: boolean }
  | { type: 'SET_CATEGORIES_LOADING'; loading: boolean }
  | { type: 'SET_GATEWAYS_LOADING'; loading: boolean }
  | { type: 'SET_SETTINGS_LOADING'; loading: boolean };
