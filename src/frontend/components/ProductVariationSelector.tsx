import React, { useState, useCallback, useMemo } from 'react';
// import { Button, Popover } from '@wordpress/components';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
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
  // Returns false when the cart rejected the item (stock / sold individually).
  onAddToCart: (cartItem: CartItem) => boolean | void;
  /** Element the popover anchors to, rendered inside the trigger. */
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
  const [internalOpen, setInternalOpen] = useState(false);

  // The grid view mounts this uncontrolled; the list view drives `open` itself.
  const isControlled = open !== undefined;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  // Find matching variation based on selected attributes.
  // Keyed on the slices actually read, so an unrelated re-render that hands down
  // a fresh product object doesn't rescan every variation.
  const matchingVariation = useMemo(
    () => findMatchingVariation(product, selectedAttributes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product.id, product.variations, product.attributes, selectedAttributes],
  );

  // Check if all required attributes are selected
  const isAllAttributesSelected = useMemo(
    () => areAllVariationAttributesSelected(product, selectedAttributes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product.attributes, selectedAttributes],
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

    // Only tear the picker down once the item actually landed in the cart —
    // otherwise the rejection toast fires while the popover closes over the
    // cashier's picks.
    if (onAddToCart(cartItem) === false) return;

    setSelectedAttributes({});
    setOpen(false);
  }, [matchingVariation, selectedAttributes, product, onAddToCart, setOpen]);


  return (
    <>
      <Popover open={isControlled ? open : internalOpen} onOpenChange={setOpen}>
        {/* The trigger renders its own wrapper: base-ui hands it a ref, and
            the elements passed in here (plugin-ui `Card`, `Button`) are plain
            function components that cannot receive one. */}
        <PopoverTrigger render={<div className="h-full [&>*]:h-full" />}>
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

              {/* Held disabled while the combination is unresolvable, so the
                  "not available" panel above is the whole story. */}
              <Button
                variant="default"
                onClick={handleAddVariation}
                disabled={!isAllAttributesSelected || !matchingVariation}
                className="flex-1 w-full bg-primary hover:bg-primary/90"
                >
                  {__('Add Product', 'wepos')}
              </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default ProductVariationSelector;
