import { POSProduct } from '../types';

/**
 * Format a price amount for display
 */
export const formatPrice = (
    price: number | string = '',
    currencySymbol = '',
    precision = null,
    thousand = '',
    decimal = '',
    format = ''
): string | number => {
    if ( ! window.accounting ) {
        console.warn( 'Woocommerce Accounting Library Not Found' );
        return price;
    }
    if ( ! currencySymbol ) {
        currencySymbol = window?.wepos?.currency_format_symbol
    }

    if ( ! precision ) {
        precision = window?.wepos?.currency_format_num_decimals
    }

    if ( ! thousand ) {
        thousand = window?.wepos?.currency_format_thousand_sep
    }

    if ( ! decimal ) {
        decimal = window?.wepos?.currency_format_decimal_sep
    }

    if ( ! format ) {
        format = window?.wepos?.currency_format
    }

    return window.accounting.formatMoney(
        price,
        currencySymbol,
        precision,
        thousand,
        decimal,
        format
    );
};

/**
 * Check if a product has stock available
 * Matches the Vue.js implementation logic
 */
export const hasStock = (product: POSProduct, productCartQty: number = 0): boolean => {
  if (!product) return false;

  if (!product.manage_stock) {
    return product.stock_status !== 'outofstock';
  }

  if (product.backorders_allowed) {
    return true;
  }

  return (product.stock_quantity || 0) > productCartQty;
};

/**
 * Get the primary image URL for a product
 */
export const getProductImage = (product: POSProduct): string => {
  if (!product || !product.images || product.images.length === 0) {
    return (window as any).wepos?.placeholder_image || '';
  }

  return product.images[0].woocommerce_thumbnail || (window as any).wepos?.placeholder_image || '';
};

/**
 * Truncate text to a specified length with ellipsis
 */
export const truncateTitle = (text: string | undefined | null, length: number): string => {
  if (!text) return '';
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
