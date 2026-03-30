import { POSProduct, POSCategory, POSTag, POSBrand, POSGateway, POSSettings } from '../../types';

export const actions = {
  setProducts(products: POSProduct[]) {
    return {
      type: 'SET_PRODUCTS' as const,
      products,
    };
  },

  appendProducts(products: POSProduct[]) {
    return {
      type: 'APPEND_PRODUCTS' as const,
      products,
    };
  },

  setCategories(categories: POSCategory[]) {
    return {
      type: 'SET_CATEGORIES' as const,
      categories,
    };
  },

  setTags(tags: POSTag[]) {
    return {
      type: 'SET_TAGS' as const,
      tags,
    };
  },

  setBrands(brands: POSBrand[]) {
    return {
      type: 'SET_BRANDS' as const,
      brands,
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

  setTagsLoading(loading: boolean) {
    return {
      type: 'SET_TAGS_LOADING' as const,
      loading,
    };
  },

  setBrandsLoading(loading: boolean) {
    return {
      type: 'SET_BRANDS_LOADING' as const,
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
