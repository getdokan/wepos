import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { Search, ScanBarcode, ArrowUpDown, CornerDownLeft } from 'lucide-react';
import {
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@wedevs/plugin-ui';
import { POSProduct } from '../types';
import { formatPrice, pickRegularDisplayPrice, pickSaleDisplayPrice } from '../utils/helpers';
import { useBarcodeSettings } from '../hooks/useBarcodeSettings';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

type SearchMode = 'product' | 'scan';

interface SearchBarProps {
  products: POSProduct[];
  settings: any;
  onProductAdded: (product: POSProduct) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ products, settings, onProductAdded }) => {
  const [mode, setMode] = useState<SearchMode>('product');
  const [searchInput, setSearchInput] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Variation modal state
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [selectedVariationProduct, setSelectedVariationProduct] = useState<POSProduct | null>(null);
  const [chosenAttribute, setChosenAttribute] = useState<Record<string, string>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resultItemsRef = useRef<(HTMLLIElement | null)[]>([]);

  // Barcode scanner auto-detection via keypress timing
  const { settings: barcodeSettings } = useBarcodeSettings();

  const placeholder = mode === 'scan'
    ? __('Scan your product', 'wepos')
    : __('Search product by typing', 'wepos');

  // Filter products based on search input (product mode only)
  const searchableProducts = useMemo(() => {
    if (!searchInput || mode !== 'product') return [];

    return products.filter((product) => {
      if (product.id.toString().indexOf(searchInput) !== -1) return true;
      if (product.name.toLowerCase().indexOf(searchInput.toLowerCase()) !== -1) return true;
      if (product.sku && product.sku.indexOf(searchInput) !== -1) return true;
      return false;
    });
  }, [products, searchInput, mode]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchableProducts.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultItemsRef.current[selectedIndex]) {
      resultItemsRef.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  // Check if all attributes are selected for variation
  const attributeDisabled = useMemo(() => {
    if (!selectedVariationProduct?.attributes) return true;
    return Object.keys(chosenAttribute).length < selectedVariationProduct.attributes.length;
  }, [chosenAttribute, selectedVariationProduct]);

  // Change mode
  const changeMode = useCallback((newMode: SearchMode) => {
    setMode(newMode);
    if (newMode === 'scan') {
      setShowResults(false);
      setSearchInput('');
    }
    inputRef.current?.focus();
  }, []);

  // Close search results
  const searchClose = useCallback(() => {
    setShowResults(false);
    setShowVariationModal(false);
    changeMode('scan');
    inputRef.current?.blur();
  }, [changeMode]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts (F1, F2, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        changeMode('product');
      } else if (e.key === 'F2') {
        e.preventDefault();
        changeMode('scan');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeMode]);

  // Add to cart action
  const addToCartAction = useCallback((product: POSProduct) => {
    onProductAdded(product);
    setShowResults(false);
    setSearchInput('');
    inputRef.current?.focus();
  }, [onProductAdded]);

  // Shared barcode lookup logic used by both form submit and auto-detection
  const lookupBarcode = useCallback((barcode: string) => {
    if (!barcode) return;

    const generalSettings = settings?.wepos_general;
    const field = generalSettings?.barcode_scanner_field === 'custom' ? 'barcode' : (generalSettings?.barcode_scanner_field || 'sku');

    const filterProduct = products.filter((product: any) => {
      if (product.type === 'simple') {
        if (product[field]?.toString() === barcode) return true;
      }
      if (product.type === 'variable') {
        if (product.variations?.length > 0) {
          return product.variations.some((item: any) => item[field]?.toString() === barcode);
        }
      }
      return false;
    });

    if (filterProduct.length > 0) {
      const found = filterProduct[0] as any;
      if (found.type === 'variable') {
        const variations = found.variations || [];
        const matchedVariation = variations.find((item: any) => item[field]?.toString() === barcode);
        if (matchedVariation) {
          const variationProduct = {
            ...matchedVariation,
            parent_id: found.id,
            type: found.type,
            name: found.name,
          };
          onProductAdded(variationProduct);
        }
      } else {
        onProductAdded(found);
      }
    }
  }, [settings, products, onProductAdded]);

  // Auto-detect barcode scanner input via keypress timing
  useBarcodeScanner({
    settings: barcodeSettings,
    enabled: true,
    onBarcode: lookupBarcode,
  });

  // Handle barcode scan (form submit in scan mode)
  const handleProductScan = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'product') return;
    lookupBarcode(searchInput);
    setSearchInput('');
  }, [mode, searchInput, lookupBarcode]);

  // Select variation product (opens modal)
  const selectVariation = useCallback((product: POSProduct) => {
    setSelectedVariationProduct(product);
    setChosenAttribute({});
    setShowVariationModal(true);
  }, []);

  // Find matching variations from chosen attributes
  const findMatchingVariations = useCallback((variations: any[], chosen: Record<string, string>) => {
    return variations.filter((variation: any) => {
      const attributes = variation.attributes || [];
      return Object.entries(chosen).every(([name, value]) => {
        const attr = attributes.find((a: any) => a.name === name);
        return attr && attr.option === value;
      });
    });
  }, []);

  // Add variation product
  const addVariationProduct = useCallback(() => {
    if (!selectedVariationProduct?.variations) return;

    const matched = findMatchingVariations(selectedVariationProduct.variations, chosenAttribute);
    if (matched.length > 0) {
      const variationProduct = {
        ...matched[0],
        parent_id: selectedVariationProduct.id,
        type: selectedVariationProduct.type,
        name: selectedVariationProduct.name,
      };
      onProductAdded(variationProduct);
      setShowVariationModal(false);
      setChosenAttribute({});
      setShowResults(false);
      setSearchInput('');
      inputRef.current?.focus();
    }
  }, [selectedVariationProduct, chosenAttribute, findMatchingVariations, onProductAdded]);

  // Handle keyboard navigation in results
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mode !== 'product' || !showResults || searchableProducts.length === 0) return;

    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < searchableProducts.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev > 0 ? prev - 1 : searchableProducts.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchableProducts.length) {
        const product = searchableProducts[selectedIndex];
        if (product.type === 'variable') {
          selectVariation(product);
        } else {
          addToCartAction(product);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      searchClose();
    }
  }, [mode, showResults, searchableProducts, selectedIndex, selectVariation, addToCartAction, searchClose]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    if (mode === 'product' && e.target.value) {
      setShowResults(true);
    }
  }, [mode]);

  // Focus the input only when user presses a keyboard shortcut (F1/F2), not on mount

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0">
      <form autoComplete="off" onSubmit={handleProductScan} className="relative flex items-center">
        {/* Search/Scan icon */}
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10">
          {mode === 'product' ? (
            <Search className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ScanBarcode className="h-5 w-5 text-primary" />
          )}
        </div>

        {/* Search input */}
        <Input
          ref={inputRef}
          type="text"
          id="product-search"
          name="search"
          placeholder={placeholder}
          className="w-full h-[2.59rem] pl-10 pr-40 bg-muted text-muted-foreground"
          value={searchInput}
          onChange={handleInputChange}
          onFocus={() => {
            if (mode === 'product' && searchInput) setShowResults(true);
          }}
          onKeyDown={handleInputKeyDown}
        />

        {/* Mode switcher (Product / Scan) */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <Button
            type="button"
            variant={mode === 'product' ? 'default' : 'ghost'}
            size="sm"
            className={mode === 'product' ? 'h-7 px-3 text-xs font-medium' : 'h-7 px-3 text-xs font-medium text-muted-foreground'}
            onClick={() => changeMode('product')}
          >
            {__('Product', 'wepos')}
          </Button>
          <Button
            type="button"
            variant={mode === 'scan' ? 'default' : 'ghost'}
            size="sm"
            className={mode === 'scan' ? 'h-7 px-3 text-xs font-medium' : 'h-7 px-3 text-xs font-medium text-muted-foreground'}
            onClick={() => changeMode('scan')}
          >
            {__('Scan', 'wepos')}
          </Button>
        </div>
      </form>

      {/* Search results dropdown */}
      {showResults && mode === 'product' && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {searchableProducts.length > 0 ? (
            <ul className="py-1">
              {searchableProducts.map((product, index) => (
                <li
                  key={product.id}
                  ref={(el) => { resultItemsRef.current[index] = el; }}
                  className={`cursor-pointer px-3 py-2.5 ${
                    index === selectedIndex
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <a
                    href="#"
                    className="flex items-center justify-between text-sm no-underline"
                    onClick={(e) => {
                      e.preventDefault();
                      if (product.type === 'variable') {
                        selectVariation(product);
                      } else {
                        addToCartAction(product);
                      }
                    }}
                  >
                    <span className={index === selectedIndex ? 'font-medium text-primary' : 'text-foreground'}>{product.name}</span>
                    <span className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="font-medium text-foreground">{formatPrice(product.on_sale ? pickSaleDisplayPrice(product) : pickRegularDisplayPrice(product))}</span>
                      {product.sku && <span className="max-w-45 truncate text-xs text-muted-foreground">{product.sku}</span>}
                      <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              {__('No product found', 'wepos')}
            </div>
          )}
          {/* Navigation hints */}
          <div className="sticky bottom-0 flex items-center gap-4 border-t border-border bg-popover px-3 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" /> {__('to navigate', 'wepos')}
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> {__('to select', 'wepos')}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-semibold leading-none">esc</kbd> {__('to dismiss', 'wepos')}
            </span>
          </div>
        </div>
      )}

      {/* Variation selection modal */}
      <Dialog open={showVariationModal} onOpenChange={(open) => !open && setShowVariationModal(false)}>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="border-b border-border py-4 px-8">
          <DialogTitle>{__('Select Variations', 'wepos')}</DialogTitle>
        </DialogHeader>
        <div className="p-5">
          {selectedVariationProduct?.attributes?.filter(attr => attr.variation)?.map((attribute) => (
            <div key={attribute.name} className="mb-4">
              <p className="mb-2 text-sm font-bold text-foreground">{attribute.name}</p>
              <div className="flex flex-wrap gap-2">
                {attribute.options.map((option) => (
                  <label key={option} className="cursor-pointer">
                    <input
                      type="radio"
                      name={attribute.name}
                      value={option}
                      checked={chosenAttribute[attribute.name] === option}
                      onChange={() =>
                        setChosenAttribute(prev => ({ ...prev, [attribute.name]: option }))
                      }
                      className="hidden"
                    />
                    <div
                      className={`rounded border px-3 py-1.5 text-sm ${
                        chosenAttribute[attribute.name] === option
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-foreground hover:border-muted-foreground'
                      }`}
                    >
                      {option}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="border-t border-border py-5 px-8">
          <Button
            disabled={attributeDisabled}
            onClick={addVariationProduct}
          >
            {__('Add Product', 'wepos')}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchBar;
