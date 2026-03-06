import React, { useState, useCallback, useMemo } from 'react';
// import { Button, Popover } from '@wordpress/components';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  PopoverClose,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
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
          <div className="rounded-lg bg-white">
            <div className="mb-4">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                {__('Select Variations', 'wepos')}
              </h3>
            </div>

            {product.attributes
              ?.filter((attr) => attr.variation)
              .map((attribute) => (
                <div key={attribute.name} className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {attribute.name}:
                  </label>
                  <Select
                    value={selectedAttributes[attribute.name] ?? ''}
                    onValueChange={(value) => handleAttributeChange(attribute.name, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`Select ${attribute.name}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {attribute.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

            {matchingVariation ? (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-700">
                  {__('Price:', 'wepos')}{' '}
                  <span className="font-semibold">
                    $
                    {matchingVariation?.price ||
                      matchingVariation?.regular_price}
                  </span>
                </p>
                {matchingVariation?.stock_status && (
                  <p className="mt-1 text-xs text-green-600">
                    {matchingVariation?.stock_status === 'instock'
                      ? __('In stock', 'wepos')
                      : __('Out of stock', 'wepos')}
                  </p>
                )}
              </div>
            ) : (
              isAllAttributesSelected && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">
                    {__('This variation is not available', 'wepos')}
                  </p>
                </div>
              )
            )}

              <PopoverClose className='w-full'>
                <Button
                  variant="success"
                  onClick={handleAddVariation}
                  disabled={!isAllAttributesSelected}
                  className="flex-1 w-full"
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
