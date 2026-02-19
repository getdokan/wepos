import React from 'react';
import { __ } from '@wordpress/i18n';
import { Plus, PackageX, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@wedevs/plugin-ui';
import { POSProduct, ProductViewType, CartItem } from '../types';
import ProductVariationSelector from './ProductVariationSelector';

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
  return (
    <div
      className={
        productView === 'grid'
          ? 'grid flex-1 grid-cols-2 gap-4 overflow-auto p-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
          : 'flex-1 overflow-auto p-1'
      }
      ref={itemsWrapperRef}
    >
      {!productLoading ? (
        <>
          {products.length > 0 ? (
            productView === 'list' ? (
              // Table-like compact list view
              <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="sticky top-0 z-10 grid grid-cols-12 gap-2 border-b border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-700 max-[360px]:hidden sm:p-2 sm:text-xs">
                  <div className="col-span-1 flex items-center">
                    {__('Image', 'wepos')}
                  </div>
                  <div className="col-span-5 flex items-center max-[480px]:col-span-6">
                    {__('Product', 'wepos')}
                  </div>
                  <div className="col-span-2 flex items-center max-[768px]:hidden max-[480px]:col-span-1 max-[480px]:flex">
                    {__('SKU', 'wepos')}
                  </div>
                  <div className="col-span-2 flex items-center max-[768px]:col-span-3">
                    {__('Price', 'wepos')}
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    {__('Action', 'wepos')}
                  </div>
                </div>
                <div className="divide-y divide-gray-100 max-[360px]:space-y-2 max-[360px]:divide-y-0 max-[360px]:p-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`grid cursor-pointer grid-cols-12 items-center gap-2 p-3 transition-colors hover:bg-gray-50 max-[360px]:mb-2 max-[360px]:block max-[360px]:rounded-lg max-[360px]:border max-[360px]:border-gray-200 max-[360px]:p-3 sm:gap-1 sm:p-2 sm:text-xs ${!hasStock(product) ? 'cursor-not-allowed opacity-50 hover:bg-transparent' : ''}`}
                    >
                      <div className="max-[360px]:col-span-auto col-span-1 flex items-center max-[360px]:mb-2">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg border border-gray-200 object-cover max-[360px]:mx-auto max-[360px]:h-16 max-[360px]:w-16 sm:h-10 sm:w-10"
                        />
                      </div>
                      <div className="max-[360px]:col-span-auto col-span-5 flex items-center max-[480px]:col-span-6 max-[360px]:mb-2 max-[360px]:block">
                        <div className="font-medium text-gray-800">
                          {product.name}
                        </div>
                      </div>
                      <div className="max-[360px]:col-span-auto col-span-2 flex items-center max-[768px]:hidden max-[480px]:col-span-1 max-[480px]:flex max-[360px]:mb-2 max-[360px]:block">
                        <span className="text-sm text-gray-600 sm:text-xs">
                          {product.sku || '-'}
                        </span>
                      </div>
                      <div className="max-[360px]:col-span-auto col-span-2 flex items-center max-[768px]:col-span-3 max-[360px]:mb-2 max-[360px]:block">
                        <span
                          className="text-sm font-medium sm:text-xs"
                          dangerouslySetInnerHTML={{
                            __html: product.price_html,
                          }}
                        ></span>
                      </div>
                      <div className="max-[360px]:col-span-auto col-span-2 flex items-center justify-center max-[360px]:block">
                        {product.type === 'variable' && hasStock(product) ? (
                          <ProductVariationSelector
                            product={product}
                            onAddToCart={onAddToCartItem}
                          >
                            <button
                              className="bg-wepos-primary hover:bg-wepos-primary-hover focus:ring-wepos-primary/20 flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors focus:ring-2 focus:outline-none sm:h-7 sm:w-7"
                              title={__('Select variations', 'wepos')}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </ProductVariationSelector>
                        ) : hasStock(product) ? (
                          <button
                            onClick={() => onAddToCart(product)}
                            className="bg-wepos-primary hover:bg-wepos-primary-hover focus:ring-wepos-primary/20 flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors focus:ring-2 focus:outline-none sm:h-7 sm:w-7"
                            title={__('Add to cart', 'wepos')}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {__('Out of stock', 'wepos')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Fixed-width grid cards
              products.map((product) => (
                <Card
                  key={product.id}
                  className={`hover:border-primary/50 group cursor-pointer border-gray-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${!hasStock(product) ? 'opacity-50' : ''}`}
                >
                  <div
                    className="flex h-full flex-col"
                    onClick={() =>
                      product.type !== 'variable' &&
                      hasStock(product) &&
                      onAddToCart(product)
                    }
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {hasStock(product) && (
                        <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          {product.type === 'variable' ? (
                            <ProductVariationSelector
                              product={product}
                              onAddToCart={onAddToCartItem}
                            >
                              <Plus className="h-5 w-5" />
                            </ProductVariationSelector>
                          ) : (
                            <Plus className="h-5 w-5" />
                          )}
                        </div>
                      )}
                    </div>
                    <CardContent className="flex flex-1 flex-col p-3 text-center">
                      <div className="mb-1 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-800">
                        {truncateTitle(product.name, 25)}
                      </div>
                      <div
                        className="mt-auto text-sm font-bold text-primary"
                        dangerouslySetInnerHTML={{
                          __html: product.price_html,
                        }}
                      ></div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )
          ) : (
            <div className="col-span-full py-20 text-center">
              <PackageX className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-gray-500 font-medium">{__('No Product Found', 'wepos')}</p>
            </div>
          )}
        </>
      ) : (
        <div className="col-span-full flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
