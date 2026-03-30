import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'wepos_panel_width';
const DEFAULT_CART_WIDTH_PERCENT = 35;
const MIN_CART_WIDTH_PX = 320;
const MIN_PRODUCT_WIDTH_PX = 400;

function loadWidth(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const val = parseFloat(stored);
      if (val >= 10 && val <= 70) return val;
    }
  } catch {
    // ignore
  }
  return DEFAULT_CART_WIDTH_PERCENT;
}

export function useResizablePanel() {
  const [cartWidthPercent, setCartWidthPercent] = useState(loadWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Save to localStorage when width changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(cartWidthPercent));
    } catch {
      // ignore
    }
  }, [cartWidthPercent]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = moveEvent.clientX - containerRect.left;

      // Cart width = container width - mouse position (cart is on the right)
      const cartWidth = containerWidth - mouseX;
      let newPercent = (cartWidth / containerWidth) * 100;

      // Enforce minimum widths
      const productWidth = containerWidth - cartWidth;
      if (productWidth < MIN_PRODUCT_WIDTH_PX) {
        newPercent = ((containerWidth - MIN_PRODUCT_WIDTH_PX) / containerWidth) * 100;
      }
      if (cartWidth < MIN_CART_WIDTH_PX) {
        newPercent = (MIN_CART_WIDTH_PX / containerWidth) * 100;
      }

      // Clamp between 15% and 60%
      newPercent = Math.max(15, Math.min(60, newPercent));
      setCartWidthPercent(Math.round(newPercent * 10) / 10);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return {
    containerRef,
    cartWidthPercent,
    handleMouseDown,
  };
}
