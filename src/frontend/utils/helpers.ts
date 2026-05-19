import { POSProduct } from '../types';

/**
 * Apply thousand-grouping to an integer string based on the chosen style.
 *
 * - thousand: 123,456,789  (groups of 3)
 * - lakh:     12,34,56,789 (last group of 3, then groups of 2)
 * - wan:      1,2345,6789  (groups of 4)
 */
const applyThousandGrouping = ( integerPart: string, sep: string, style: string ): string => {
    if ( ! sep ) {
        return integerPart;
    }

    switch ( style ) {
        case 'lakh': {
            if ( integerPart.length <= 3 ) return integerPart;
            const last3 = integerPart.slice( -3 );
            const rest = integerPart.slice( 0, -3 );
            return rest.replace( /\B(?=(\d{2})+(?!\d))/g, sep ) + sep + last3;
        }
        case 'wan':
            return integerPart.replace( /\B(?=(\d{4})+(?!\d))/g, sep );
        default:
            return integerPart.replace( /\B(?=(\d{3})+(?!\d))/g, sep );
    }
};

/**
 * Format a price amount for display.
 *
 * Uses nullish coalescing so that valid falsy values (0 precision,
 * empty separator) are respected instead of silently replaced.
 */
export const formatPrice = (
    price: number | string = '',
    currencySymbol = '',
    precision: number | string | null = null,
    thousand = '',
    decimal = '',
    format = '',
    isAdmin = false
): string | number => {
    const settings = isAdmin ? window?.weposAdmin || {} : window?.wepos || {};

    if ( ! currencySymbol ) {
        currencySymbol = settings?.currency_format_symbol ?? '$';
    }

    // Use explicit null/undefined check so that precision = 0 is respected.
    if ( precision === null || precision === undefined ) {
        precision = settings?.currency_format_num_decimals ?? 2;
    }

    if ( ! thousand ) {
        thousand = settings?.currency_format_thousand_sep ?? ',';
    }

    if ( ! decimal ) {
        decimal = settings?.currency_format_decimal_sep ?? '.';
    }

    if ( ! format ) {
        format = settings?.currency_format ?? '%s%v';
    }

    const groupStyle = settings?.currency_format_thousands_group_style ?? 'thousand';

    // For non-standard grouping styles (lakh, wan), bypass accounting.js
    // because it only supports groups of 3.
    if ( groupStyle !== 'thousand' ) {
        const num = typeof price === 'string' ? parseFloat( price ) : Number( price );
        if ( isNaN( num ) ) return price;

        const absNum = Math.abs( num );
        const prec = typeof precision === 'string' ? parseInt( precision, 10 ) : precision;
        const fixed = absNum.toFixed( prec || 0 );
        const parts = fixed.split( '.' );
        parts[ 0 ] = applyThousandGrouping( parts[ 0 ], thousand, groupStyle );
        const formatted = parts.join( decimal );
        const sign = num < 0 ? '-' : '';

        return format.replace( '%s', currencySymbol ).replace( '%v', sign + formatted );
    }

    // Standard grouping — use accounting.js if available.
    if ( window.accounting ) {
        return window.accounting.formatMoney(
            price,
            currencySymbol,
            precision,
            thousand,
            decimal,
            format
        );
    }

    // Fallback when accounting.js is not loaded.
    const num = typeof price === 'string' ? parseFloat( price ) : Number( price );
    if ( isNaN( num ) ) return price;
    const prec = typeof precision === 'string' ? parseInt( precision, 10 ) : precision;
    const absNum = Math.abs( num );
    const fixed = absNum.toFixed( prec || 0 );
    const parts = fixed.split( '.' );
    parts[ 0 ] = parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, thousand );
    const formatted = parts.join( decimal );
    const sign = num < 0 ? '-' : '';
    return format.replace( '%s', currencySymbol ).replace( '%v', sign + formatted );
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

// Strings via parseFloat (WC stores decimals as strings); everything else via Number. Returns null when non-finite.
const tryParseFinite = (value: unknown): number | null => {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isFinite(n) ? n : null;
};

// Coerce unknown to a finite number, with 0 as the fallback.
export const toFiniteNumber = (value: unknown): number => tryParseFinite(value) ?? 0;

// First present (not null/undefined/'') and parseable value in the chain; 0 counts as present. Returns null if none.
export const firstPresentNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    if (value == null || value === '') continue;
    const n = tryParseFinite(value);
    if (n !== null) return n;
  }
  return null;
};

interface PricedSource {
  regular_price?: string | number | null;
  sale_price?: string | number | null;
  regular_display_price?: string | number | null;
  sales_display_price?: string | number | null;
}

// Cart-display regular price: server-computed regular_display_price (respects wc_tax_display_cart) → raw regular_price.
export const pickRegularDisplayPrice = (source: PricedSource): number =>
  firstPresentNumber(source.regular_display_price, source.regular_price) ?? 0;

// Cart-display sale price: sales_display_price → sale_price → regular_price, so non-sale products still resolve.
export const pickSaleDisplayPrice = (source: PricedSource): number =>
  firstPresentNumber(source.sales_display_price, source.sale_price, source.regular_price) ?? 0;

/**
 * Create a delay for async operations
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Decode HTML entities in a string (e.g. &amp; → &, &lt; → <)
 * Uses a textarea element so all named and numeric entities are handled.
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
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

/**
 * Build a localStorage key scoped by the current user session.
 *
 * Base behavior: scopes by current_user_id only → `{baseKey}_c{userId}`.
 * Extensions (e.g., wepos-pro) can hook into `wepos_session_scoped_key`
 * via the global __weposReactHooks to add vendor/outlet scoping.
 *
 * - Non-pro (admin): baseKey_c{currentUserId}
 * - No user:         baseKey (unchanged)
 */
export const getSessionScopedKey = (baseKey: string): string => {
  try {
    const userId = Number((window as any).wepos?.current_user_id) || 0;
    if (!userId) return baseKey;

    // Default: scope by current user only
    let key = `${baseKey}_c${userId}`;

    // Allow pro/extensions to further scope (e.g., by vendor/outlet/cashier)
    const hooks = (window as any).__weposReactHooks;
    if (hooks?.applyFilters) {
      key = hooks.applyFilters('wepos_session_scoped_key', key, baseKey) as string;
    }

    return key;
  } catch {
    return baseKey;
  }
};
