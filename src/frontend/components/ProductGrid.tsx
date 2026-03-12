import React from 'react';
import { __ } from '@wordpress/i18n';
import { PackageX } from 'lucide-react';
import { Spinner, ScrollArea } from '@wedevs/plugin-ui';
import { POSProduct, ProductViewType, CartItem } from '../types';
import ProductListView from './ProductListView';
import ProductGridView from './ProductGridView';

interface ProductGridProps {
  products: POSProduct[];
  productView: ProductViewType;
  productLoading: boolean;
  onAddToCart: (product: POSProduct) => void;
  onAddToCartItem: (cartItem: CartItem) => void;
  formatPrice: (amount: number | string | undefined | null) => string;
  hasStock: (product: POSProduct) => boolean;
  getProductImage: (product: POSProduct) => string;
  truncateTitle: (text: string | undefined | null, length: number) => string;
  itemsWrapperRef: React.RefObject<HTMLDivElement>;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  productView,
  productLoading,
  onAddToCart,
  onAddToCartItem,
  formatPrice,
  hasStock,
  getProductImage,
  truncateTitle,
  itemsWrapperRef,
}) => {
  if (productLoading) {
    return (
      <div className="col-span-full flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full py-20 text-center">
        <PackageX className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p className="font-medium text-gray-500">
          {__('No Product Found', 'wepos')}
        </p>
      </div>
    );
  }

  const sharedProps = {
    products,
    onAddToCart,
    onAddToCartItem,
    formatPrice,
    hasStock,
    getProductImage,
  };

  return (
    <div className="h-full min-h-0 w-full flex-1 overflow-hidden" ref={itemsWrapperRef}>
      <ScrollArea className="h-full w-full">
          {productView === 'list' ? (
            <div>
              <ProductListView {...sharedProps} />
            </div>
          ) : (
            <div className='p-4'>
              <ProductGridView {...sharedProps} truncateTitle={truncateTitle} />
            </div>
          )}
      </ScrollArea>
    </div>
  );
};

export default ProductGrid;
