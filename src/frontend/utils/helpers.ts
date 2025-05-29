import { POSProduct } from '../types';

/**
 * Format a price amount for display
 */
export const formatPrice = (amount: number | string | undefined | null): string => {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(numericAmount)) {
    return '$0.00';
  }
  return `$${numericAmount.toFixed(2)}`;
};

/**
 * Check if a product has stock available
 */
export const hasStock = (product: POSProduct): boolean => {
  if (!product.manage_stock) return true;
  return product.stock_status === 'instock' && product.stock_quantity > 0;
};

/**
 * Get the primary image URL for a product
 */
export const getProductImage = (product: POSProduct): string => {
  return product.images.length > 0
    ? product.images[0].woocommerce_thumbnail
    : (window as any).wepos?.placeholder_image || '';
};

/**
 * Truncate text to a specified length with ellipsis
 */
export const truncateTitle = (text: string, length: number): string => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};

/**
 * Parse a currency string to number
 */
export const parseCurrencyAmount = (amount: string): number => {
  return parseFloat(amount.replace(/[^\d.-]/g, '')) || 0;
};

/**
 * Create a delay for async operations
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Safe localStorage getter with error handling
 */
export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof localStorage === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage for key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safe localStorage setter with error handling
 */
export const setToLocalStorage = <T>(key: string, value: T): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Error saving to localStorage for key "${key}":`, error);
  }
};
