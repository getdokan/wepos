import { POSProduct, POSCategory, POSGateway, POSSettings } from '../../types';

export const actions = {
  setProducts(products: POSProduct[]) {
    return {
      type: 'SET_PRODUCTS' as const,
      products,
    };
  },

  setCategories(categories: POSCategory[]) {
    return {
      type: 'SET_CATEGORIES' as const,
      categories,
    };
  },

  setGateways(gateways: POSGateway[]) {
    return {
      type: 'SET_GATEWAYS' as const,
      gateways,
    };
  },

  setSettings(settings: POSSettings) {
    return {
      type: 'SET_SETTINGS' as const,
      settings,
    };
  },

  setProductsLoading(loading: boolean) {
    return {
      type: 'SET_PRODUCTS_LOADING' as const,
      loading,
    };
  },

  setCategoriesLoading(loading: boolean) {
    return {
      type: 'SET_CATEGORIES_LOADING' as const,
      loading,
    };
  },

  setGatewaysLoading(loading: boolean) {
    return {
      type: 'SET_GATEWAYS_LOADING' as const,
      loading,
    };
  },

  setSettingsLoading(loading: boolean) {
    return {
      type: 'SET_SETTINGS_LOADING' as const,
      loading,
    };
  },
};
