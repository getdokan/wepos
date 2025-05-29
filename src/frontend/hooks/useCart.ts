import { useCallback } from 'react';
import { POSProduct, POSCartData, POSCartItem, POSSettings } from '../types';
import { hasStock } from '../utils/helpers';

interface UseCartProps {
  cartData: POSCartData;
  setCartData: React.Dispatch<React.SetStateAction<POSCartData>>;
  settings: POSSettings;
}

export const useCart = ({ cartData, setCartData, settings }: UseCartProps) => {
  // Cart calculations
  const getSubtotal = useCallback((): number => {
    return cartData.line_items.reduce((total, item) => {
      const price = item.on_sale ? (item.sale_price || 0) : (item.regular_price || 0);
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  }, [cartData.line_items]);

  const getTotalTax = useCallback((): number => {
    return cartData.line_items.reduce((total, item) => {
      return total + (item.total_tax || 0);
    }, 0);
  }, [cartData.line_items]);

  const getTotal = useCallback((): number => {
    let subtotal = getSubtotal() || 0;

    // Add fee lines
    subtotal += cartData.fee_lines.reduce((total, fee) => total + (fee.total || 0), 0);

    // Subtract coupon discounts
    subtotal -= cartData.coupon_lines.reduce((total, coupon) => {
      if (coupon.type === 'discount') {
        return total + Math.abs(coupon.total || 0);
      }
      return total;
    }, 0);

    // Add tax if not included
    if (settings.woo_tax?.wc_tax_display_cart !== 'incl') {
      subtotal += getTotalTax();
    }

    return subtotal;
  }, [cartData, settings, getSubtotal, getTotalTax]);

  // Cart actions
  const addToCart = useCallback((product: POSProduct) => {
    if (!hasStock(product)) {
      alert('Product is out of stock!');
      return;
    }

    const existingItemIndex = cartData.line_items.findIndex(
      item => item.product_id === product.id
    );

    if (existingItemIndex !== -1) {
      const updatedItems = [...cartData.line_items];
      updatedItems[existingItemIndex].quantity += 1;
      setCartData(prev => ({ ...prev, line_items: updatedItems }));
    } else {
      const cartItem: POSCartItem = {
        id: Date.now(),
        product_id: product.id,
        name: product.name,
        quantity: 1,
        type: product.type,
        on_sale: product.on_sale,
        sale_price: product.sale_price,
        regular_price: product.regular_price,
        attribute: []
      };

      setCartData(prev => ({
        ...prev,
        line_items: [...prev.line_items, cartItem]
      }));
    }
  }, [cartData.line_items, setCartData]);

  const updateCartItem = useCallback((index: number, updatedItem: Partial<POSCartItem>) => {
    const updatedItems = [...cartData.line_items];
    updatedItems[index] = { ...updatedItems[index], ...updatedItem };
    setCartData(prev => ({ ...prev, line_items: updatedItems }));
  }, [cartData.line_items, setCartData]);

  const removeItem = useCallback((index: number) => {
    const updatedItems = cartData.line_items.filter((_, i) => i !== index);
    setCartData(prev => ({ ...prev, line_items: updatedItems }));
  }, [cartData.line_items, setCartData]);

  const emptyCart = useCallback(() => {
    setCartData({
      line_items: [],
      fee_lines: [],
      coupon_lines: []
    });
  }, [setCartData]);

  return {
    // Calculations
    getSubtotal,
    getTotalTax,
    getTotal,

    // Actions
    addToCart,
    updateCartItem,
    removeItem,
    emptyCart,
  };
};
