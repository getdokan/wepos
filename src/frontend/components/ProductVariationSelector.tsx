import React, { useState, useCallback, useMemo } from 'react';
// import { Button, Popover } from '@wordpress/components';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  PopoverClose,
  SmartSelect,
} from '@wedevs/plugin-ui';
import { __ } from '@wordpress/i18n';
import { POSProduct, CartItem } from '../types';
import {
  areAllVariationAttributesSelected,
  buildVariationCartItem,
  findMatchingVariation,
  getVariationAttributes,
  SelectedAttributes,
} from '../utils/variations';

interface ProductVariationSelectorProps {
  product: POSProduct;
  onAddToCart: (cartItem: CartItem) => void;
  children: React.ReactNode;
  anchor?: HTMLElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ProductVariationSelector: React.FC<
  ProductVariationSelectorProps
> = ({ product, onAddToCart, children, open, onOpenChange }) => {
  const [selectedAttributes, setSelectedAttributes] =
    useState<SelectedAttributes>({});

  // Find matching variation based on selected attributes
  const matchingVariation = useMemo(
    () => findMatchingVariation(product, selectedAttributes),
    [product, selectedAttributes],
  );

  // Check if all required attributes are selected
  const isAllAttributesSelected = useMemo(
    () => areAllVariationAttributesSelected(product, selectedAttributes),
    [product, selectedAttributes],
  );

  // Handle attribute selection
  const handleAttributeChange = useCallback(
    (attributeName: string, value: string) => {
      setSelectedAttributes((prev) => ({
        ...prev,
        [attributeName]: value,
      }));
    },
    [],
  );

  // Handle adding variation to cart
  const handleAddVariation = useCallback(() => {
    if (!matchingVariation) return;

    const cartItem: CartItem = buildVariationCartItem(
      product,
      matchingVariation,
      selectedAttributes,
    );

    onAddToCart(cartItem);
    setSelectedAttributes({});
  }, [matchingVariation, selectedAttributes, product, onAddToCart]);


  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent>
          <div className="rounded-lg bg-popover">
            <div className="mb-4">
              <h3 className="mb-2 text-lg font-semibold text-primary">
                {__('Select Variations', 'wepos')}
              </h3>
            </div>

            {getVariationAttributes(product)
              .map((attribute) => (
                <div key={attribute.name} className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    {attribute.name}:
                  </label>
                  <SmartSelect
                    options={attribute.options.map((option) => ({ value: option, label: option }))}
                    value={selectedAttributes[attribute.name] ?? ''}
                    onValueChange={(value) => handleAttributeChange(attribute.name, value)}
                    placeholder={`Select ${attribute.name}...`}
                    disableSearch
                  />
                </div>
              ))}

            {matchingVariation ? (
              <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 p-3">
                <p className="text-sm text-primary font-medium">
                  {__('Price:', 'wepos')}{' '}
                  <span className="font-bold">
                    $
                    {matchingVariation?.price ||
                      matchingVariation?.regular_price}
                  </span>
                </p>
                {matchingVariation?.stock_status && (
                  <p className="mt-1 text-xs text-primary/80">
                    {matchingVariation?.stock_status === 'instock'
                      ? __('In stock', 'wepos')
                      : __('Out of stock', 'wepos')}
                  </p>
                )}
              </div>
            ) : (
              isAllAttributesSelected && (
                <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">
                    {__('This variation is not available', 'wepos')}
                  </p>
                </div>
              )
            )}

              <PopoverClose className='w-full'>
                <Button
                  variant="default"
                  onClick={handleAddVariation}
                  disabled={!isAllAttributesSelected}
                  className="flex-1 w-full bg-primary hover:bg-primary/90"
                  >
                    {__('Add Product', 'wepos')}
                </Button>
              </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default ProductVariationSelector;
