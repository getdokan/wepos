import { ProductsState } from './types';

export const selectors = {
  getProducts: (state: ProductsState) => state.products,
  getCategories: (state: ProductsState) => state.categories,
  getTags: (state: ProductsState) => state.tags,
  getBrands: (state: ProductsState) => state.brands,
  getGateways: (state: ProductsState) => state.gateways,
  getSettings: (state: ProductsState) => state.settings,
  getProductsLoading: (state: ProductsState) => state.loading.products,
  getCategoriesLoading: (state: ProductsState) => state.loading.categories,
  getTagsLoading: (state: ProductsState) => state.loading.tags,
  getBrandsLoading: (state: ProductsState) => state.loading.brands,
  getGatewaysLoading: (state: ProductsState) => state.loading.gateways,
  getSettingsLoading: (state: ProductsState) => state.loading.settings,

  getProductsByCategory: (state: ProductsState, categoryId?: number) => {
    if (!categoryId || categoryId === 0) {
      return state.products;
    }
    return state.products.filter((product) =>
      product.categories.some((cat) => cat.id === categoryId),
    );
  },

  getProductById: (state: ProductsState, productId: number) => {
    return state.products.find((product) => product.id === productId);
  },

  getInStockProducts: (state: ProductsState) => {
    return state.products.filter(
      (product) =>
        product.stock_status === 'instock' ||
        (product.manage_stock &&
          product.stock_quantity &&
          product.stock_quantity > 0),
    );
  },
};
