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
import { POSProduct, ProductVariation, CartItem } from '../types';

interface ProductVariationSelectorProps {
  product: POSProduct;
  onAddToCart: (cartItem: CartItem) => void;
  children: React.ReactNode;
  anchor?: HTMLElement | null;
}

interface SelectedAttributes {
  [attributeName: string]: string;
}

export const ProductVariationSelector: React.FC<
  ProductVariationSelectorProps
> = ({ product, onAddToCart, children }) => {
  const [selectedAttributes, setSelectedAttributes] =
    useState<SelectedAttributes>({});
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

  // Find matching variation based on selected attributes
  const matchingVariation = useMemo(() => {
    if (!product.variations || product.variations.length === 0) return null;

    return product.variations.find((variation: ProductVariation) => {
      return variation.attributes.every((attr) => {
        return selectedAttributes[attr.name] === attr.option;
      });
    });
  }, [product.variations, selectedAttributes]);

  // Check if all required attributes are selected
  const isAllAttributesSelected = useMemo(() => {
    if (!product.attributes) return false;

    const requiredAttributes = product.attributes.filter(
      (attr) => attr.variation,
    );
    return requiredAttributes.every((attr) => selectedAttributes[attr.name]);
  }, [product.attributes, selectedAttributes]);

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

    // Build variation attributes for cart display
    const variationAttributes = Object.entries(selectedAttributes).map(
      ([name, option]) => ({
        id: 0, // Will be set by the system
        name,
        option,
      }),
    );

    const cartItem: CartItem = {
      id: Date.now(), // Generate a temporary ID
      product_id: product.id,
      variation_id: matchingVariation.id,
      name: product.name,
      sku: matchingVariation.sku || product.sku || '',
      quantity: 1,
      regular_price: parseFloat(matchingVariation.regular_price) || 0,
      sale_price:
        parseFloat(matchingVariation.sale_price) ||
        parseFloat(matchingVariation.regular_price) ||
        0,
      on_sale: matchingVariation.on_sale,
      type: 'variable',
      attribute: variationAttributes,
      editQuantity: false,
      tax_amount: 0, // Will be calculated
      manage_stock: matchingVariation.manage_stock,
      stock_status: matchingVariation.stock_status,
      backorders_allowed: matchingVariation.backorders_allowed,
      stock_quantity: matchingVariation.stock_quantity,
    };

    onAddToCart(cartItem);
    setSelectedAttributes({});
  }, [matchingVariation, selectedAttributes, product, onAddToCart]);


  return (
    <>
      <Popover>
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

            {product.attributes
              ?.filter((attr) => attr.variation)
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
