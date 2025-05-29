import React, { useState, useCallback, useMemo } from 'react';
import { Button, Popover } from '@wordpress/components';
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
  const [isVisible, setIsVisible] = useState(false);
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
    setIsVisible(false);
    setSelectedAttributes({});
  }, [matchingVariation, selectedAttributes, product, onAddToCart]);

  // Handle opening the popover
  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setPopoverAnchor(event.currentTarget);
    setIsVisible(true);
  }, []);

  // Handle closing the popover
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setSelectedAttributes({});
  }, []);

  return (
    <>
      <div onClick={handleClick} style={{ cursor: 'pointer' }}>
        {children}
      </div>

      {isVisible && (
        <Popover
          position="bottom center"
          onClose={() => setIsVisible(false)}
          className="min-w-96"
        >
          <div className="rounded-lg border bg-white p-4 shadow-lg">
            <div className="mb-4">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                {__('Select Variations', 'wepos')}
              </h3>
              <p className="text-sm text-gray-600">{product.name}</p>
            </div>

            {product.attributes
              ?.filter((attr) => attr.variation)
              .map((attribute) => (
                <div key={attribute.name} className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {attribute.name}:
                  </label>
                  <div className="space-y-2">
                    {attribute.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          handleAttributeChange(attribute.name, option)
                        }
                        className={`rounded-md border px-3 py-2 text-left transition-colors ${
                          selectedAttributes[attribute.name] === option
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
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

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setIsVisible(false)}
                className="flex-1"
              >
                {__('Cancel', 'wepos')}
              </Button>
              <Button
                variant="primary"
                onClick={handleAddVariation}
                disabled={!isAllAttributesSelected}
                className="flex-1"
              >
                {__('Add Product', 'wepos')}
              </Button>
            </div>
          </div>
        </Popover>
      )}
    </>
  );
};

export default ProductVariationSelector;
